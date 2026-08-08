Exit code: 0
Wall time: 1.9 seconds
Output:
-- ============================================================
-- 督学 · Supabase 一键初始化（合并 5 个迁移文件，可重复执行）
-- 用法：Supabase 控制台 → SQL Editor → New query → 整段粘贴 → Run
-- 顺序：建表+RLS → 目标总分 → 报考类型 → 单科目标 → 邀请码 RPC
-- ============================================================

-- 小组（一对情侣/督学关系）
create table if not exists public.couples (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  created_at timestamptz default now()
);

-- 用户档案（与 auth.users 一对一）
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role text not null check (role in ('student', 'supervisor')),
  couple_id uuid references public.couples(id) on delete cascade,
  couple_code text,
  created_at timestamptz default now()
);

-- 每日任务
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references public.couples(id) on delete cascade,
  owner_id uuid references auth.users(id) on delete cascade,
  title text not null,
  date text not null,
  time text,
  done boolean default false,
  created_at timestamptz default now()
);

-- 专注时段
create table if not exists public.focus_sessions (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references public.couples(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  duration_sec integer not null,
  task_id uuid references public.tasks(id) on delete set null,
  started_at timestamptz default now()
);

-- 每日打卡
create table if not exists public.checkins (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references public.couples(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  date text not null,
  note text default '',
  at timestamptz default now(),
  unique (couple_id, user_id, date)
);

-- 鼓励 / 悄悄话（kind='chat' 悄悄话；kind='word' 今日一句话，两端可见）
create table if not exists public.encouragements (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references public.couples(id) on delete cascade,
  from_id uuid references auth.users(id) on delete cascade,
  from_name text,
  to_id uuid references auth.users(id) on delete cascade,
  message text not null,
  at timestamptz default now(),
  read boolean default false,
  kind text not null default 'chat'
);

-- 备考倒计时（每小组一行：目标考试日期）
create table if not exists public.countdown (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid unique references public.couples(id) on delete cascade,
  target_date date not null,
  label text not null default '考研初试',
  updated_at timestamptz default now()
);

-- 阶段目标
create table if not exists public.phase_goals (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references public.couples(id) on delete cascade,
  owner_id uuid references auth.users(id) on delete cascade,
  title text not null,
  due_date date,
  done boolean default false,
  created_at timestamptz default now()
);

-- 自测记录（章节练习 / 套卷 / 真题）
create table if not exists public.self_tests (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references public.couples(id) on delete cascade,
  owner_id uuid references auth.users(id) on delete cascade,
  subject text not null,
  kind text not null default '章节练习',
  name text default '',
  total integer not null,
  correct integer not null,
  sec integer,
  at timestamptz default now()
);

-- 开启行级安全
alter table public.couples enable row level security;
alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.focus_sessions enable row level security;
alter table public.checkins enable row level security;
alter table public.encouragements enable row level security;
alter table public.countdown enable row level security;
alter table public.phase_goals enable row level security;
alter table public.self_tests enable row level security;

-- 辅助函数：返回当前登录用户所属的小组 ID
-- ⚠️ 必须放在所有建表之后：SQL 语言函数在 CREATE 时会立即解析函数体，
-- 若 profiles 表尚未创建，会直接报 42P01 relation "public.profiles" does not exist。
-- ⚠️ 必须 security definer：本函数会被 RLS 策略（如 profiles_select）调用，
-- 若以调用者权限执行，函数内查询 profiles 会再次触发策略 → 无限递归 → stack depth exceeded。
create or replace function public.my_couple_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select couple_id from public.profiles where id = auth.uid()
$$;

-- 小组策略（先 drop 再 create，保证可重复执行）
drop policy if exists "couples_select" on public.couples;
drop policy if exists "couples_insert" on public.couples;
create policy "couples_select" on public.couples for select using (id = public.my_couple_id());
create policy "couples_insert" on public.couples for insert with check (true);

-- 档案策略
drop policy if exists "profiles_select" on public.profiles;
drop policy if exists "profiles_insert" on public.profiles;
drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_select" on public.profiles for select using (id = auth.uid() or couple_id = public.my_couple_id());
create policy "profiles_insert" on public.profiles for insert with check (id = auth.uid());
create policy "profiles_update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

-- 任务 / 专注 / 打卡 / 消息：仅同小组成员可见可改
drop policy if exists "tasks_all" on public.tasks;
drop policy if exists "focus_all" on public.focus_sessions;
drop policy if exists "checkins_all" on public.checkins;
drop policy if exists "enc_all" on public.encouragements;
create policy "tasks_all" on public.tasks for all using (couple_id = public.my_couple_id()) with check (couple_id = public.my_couple_id());
create policy "focus_all" on public.focus_sessions for all using (couple_id = public.my_couple_id()) with check (couple_id = public.my_couple_id());
create policy "checkins_all" on public.checkins for all using (couple_id = public.my_couple_id()) with check (couple_id = public.my_couple_id());
create policy "enc_all" on public.encouragements for all using (couple_id = public.my_couple_id()) with check (couple_id = public.my_couple_id());

-- 备考进度（倒计时 / 阶段目标 / 自测）：仅同小组成员可见可改
drop policy if exists "countdown_all" on public.countdown;
drop policy if exists "goals_all" on public.phase_goals;
drop policy if exists "selftests_all" on public.self_tests;
create policy "countdown_all" on public.countdown for all using (couple_id = public.my_couple_id()) with check (couple_id = public.my_couple_id());
create policy "goals_all" on public.phase_goals for all using (couple_id = public.my_couple_id()) with check (couple_id = public.my_couple_id());
create policy "selftests_all" on public.self_tests for all using (couple_id = public.my_couple_id()) with check (couple_id = public.my_couple_id());

-- 今日一句话：encouragements.kind 兼容（老表无 kind 列时补上）
alter table public.encouragements add column if not exists kind text not null default 'chat';

-- ---------- 目标总分 ----------
alter table public.couples add column if not exists target_score integer;
drop policy if exists "couples_update" on public.couples;
create policy "couples_update" on public.couples
  for update using (id = public.my_couple_id())
  with check (id = public.my_couple_id());

-- ---------- 报考类型（专硕/学硕/暂不确定）----------
alter table public.couples add column if not exists degree_type text not null default 'undecided';

-- ---------- 单科目标 jsonb ----------
alter table public.couples add column if not exists subj_target jsonb not null default '{"pol":null,"eng":null,"math":null,"cs408":null}'::jsonb;

-- ---------- 考试类型（考研/专升本/高考/考公考编） ----------
alter table public.couples add column if not exists exam_type text not null default 'kaoyan';

-- ---------- 邀请码查找 RPC（督学加入的关键，SECURITY DEFINER 绕过 RLS）----------
create or replace function public.lookup_couple_by_code(p_code text)
returns table (id uuid, code text)
language sql
security definer
set search_path = public
as $$
  select c.id, c.code
  from public.couples c
  where c.code = upper(p_code)
  limit 1;
$$;
-- supabase-d1-wrong-items.sql —— 错题上云（2026-08-03 迭代 D-1）
-- 在 Supabase SQL Editor 跑这段，建表 + RLS + bucket。
-- 风险点：RLS 跑完后**必须**手测两条路径（你 + 对方读你的 / 对方读别人的）确认通过。

-- 1) 建表
create table if not exists public.wrong_items (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  subject text not null,
  topic text,
  question_text text,
  image_url text,
  source text not null default 'manual',
  redo_count int not null default 0,
  last_redo_at timestamptz,
  mastered boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_wrong_items_couple_owner_created
  on public.wrong_items (couple_id, owner_id, created_at desc);

-- 2) RLS：同小组成员可读，仅 owner 可写
alter table public.wrong_items enable row level security;
drop policy if exists "wrong_read_couple" on public.wrong_items;
drop policy if exists "wrong_write_owner" on public.wrong_items;
drop policy if exists "wrong_update_owner" on public.wrong_items;
drop policy if exists "wrong_delete_owner" on public.wrong_items;

create policy "wrong_read_couple"
  on public.wrong_items for select
  using (couple_id = public.my_couple_id());

create policy "wrong_write_owner"
  on public.wrong_items for insert
  with check (owner_id = auth.uid() and couple_id = public.my_couple_id());

create policy "wrong_update_owner"
  on public.wrong_items for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "wrong_delete_owner"
  on public.wrong_items for delete
  using (owner_id = auth.uid());

-- 3) Storage bucket：错题图片
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'wrong-images',
  'wrong-images',
  false,  -- 不公开（不直链）
  524288,  -- 500KB（com compressImage 后通常 50-150KB，500KB 余量够）
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 4) Storage RLS：每个用户只能上传到自己的 couple_id 路径下
--    路径约定：<couple_id>/<wrong_item_id>.jpg
drop policy if exists "wrong_img_select_couple" on storage.objects;
drop policy if exists "wrong_img_insert_owner" on storage.objects;
drop policy if exists "wrong_img_update_owner" on storage.objects;
drop policy if exists "wrong_img_delete_owner" on storage.objects;

-- 允许"同小组成员"读图（让对方看到她拍的错题）
create policy "wrong_img_select_couple"
  on storage.objects for select
  using (
    bucket_id = 'wrong-images'
    and (storage.foldername(name))[1]::uuid = public.my_couple_id()
  );

-- 只允许 owner 上传
create policy "wrong_img_insert_owner"
  on storage.objects for insert
  with check (
    bucket_id = 'wrong-images'
    and (storage.foldername(name))[1]::uuid = public.my_couple_id()
  );

-- 只允许 owner 改自己
create policy "wrong_img_update_owner"
  on storage.objects for update
  using (
    bucket_id = 'wrong-images'
    and (storage.foldername(name))[1]::uuid = public.my_couple_id()
  );

-- 只允许 owner 删自己
create policy "wrong_img_delete_owner"
  on storage.objects for delete
  using (
    bucket_id = 'wrong-images'
    and (storage.foldername(name))[1]::uuid = public.my_couple_id()
  );

-- 5) updated_at 自动维护
create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_wrong_items_updated on public.wrong_items;
create trigger trg_wrong_items_updated
  before update on public.wrong_items
  for each row execute function public.touch_updated_at();
-- 完成。接下来：学员先注册（生成邀请码）→ 督学凭码注册加入。
alter table public.self_tests add column if not exists topic text;
alter table public.self_tests add column if not exists wrong_reason text;
alter table public.self_tests add column if not exists mode text not null default 'manual';
alter table public.self_tests add column if not exists practice integer not null default 0;
alter table public.self_tests add column if not exists practice_correct integer not null default 0;
