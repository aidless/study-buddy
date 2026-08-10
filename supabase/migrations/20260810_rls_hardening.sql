-- RLS 加固（2026-08-10 安全审计）
-- 1) profiles_update：禁止用户把自己的 couple_id 改到别的小组（逃逸/越权）
drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update" on public.profiles
  for update
  using (id = auth.uid())
  with check (id = auth.uid() and couple_id = public.my_couple_id());

-- 2) 建议：couples_insert 保留（注册需要），生产量级上来后可在业务层限频
-- 3) 提醒：AI 名师 Edge Function 已开启 verify_jwt（anon key 鉴权），防外部烧额度
