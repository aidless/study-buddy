# 给她 · 考研陪伴（PWA）

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)  [![CI](https://github.com/aidless/study-buddy/actions/workflows/ci.yml/badge.svg)](https://github.com/aidless/study-buddy/actions/workflows/ci.yml/badge.svg)
给好朋友用的考研长线陪伴 + 双向督学小工具。手机浏览器打开、加到主屏，体验等同 App，无需上架应用商店。

**在线体验：** https://aidless.github.io/study-buddy/?demo=1 · **着陆页：** https://aidless.github.io/study-buddy/landing/ · **免注册演示：** 在应用地址后加 `?demo=1`（也兼容 `?guest=student`；自动灌入示例任务、专注与打卡）

## 设计哲学

这不止是一个督学 App，而是 **人文关怀 × 心理学 × 考研分数规划** 的三重组合：

- **人文关怀（尊重人）**：陪跑不监工。她的数字默认不主动推送，想看才点开；互写今日一句话、送鼓励，而非评判与催促。
- **心理学（护情绪）**：降低焦虑是第一优先级。倒计时措辞从"紧迫"转"陪伴"且可收起；开箱即用计划消除"不会自己填"的决策负担；树洞与深呼吸兜底情绪。
- **考研分数规划（给方向）**：目标分、408 四科知识点权重、按课纲轮转的周计划、看趋势的自测，让她始终知道"下一步该啃哪块"。
**决策过滤器**：新功能须至少服务一根支柱，且不得违背另一根——为提升分数规划而加重焦虑的改动，一票否决。
## 功能

- **今日任务 + 开箱即用计划**：打开就有按 11408 课纲自动排好的「今日建议 3 件事」，零规划负担；也可自己加任务、一键打印。
- **专注番茄钟**：25 分钟专注 / 5 分钟休息，自动累计今日专注时长。
- **备考规划（11408 专属）**：D-day 倒计时（可一键收起、措辞从紧迫转陪伴）+ 阶段目标（一键载入 11408 四科四阶段推荐，倒推排期）+ 自测正确率（支持「快速记录」点选对错，按科目看平均正确率与趋势）。
- **进度可视化**：30 天专注热力图 + 近 7 天柱状图 + 连续天数。
- **情绪兜底**：今日一句话（两人互写，情感锚点）、树洞（私密碎碎念）、深呼吸（60 秒引导放松）。
- **双向陪跑（去监控化）**：你（督学）这边从「看她数据」改成「陪她」——互写今日一句话、送一句鼓励、发悄悄话；她的数字默认不主动推送，想看时点开「想看看她的进度」才显示。
## 两种运行模式

| 模式 | 数据存哪 | 双向同步 | 适用 |
| --- | --- | --- | --- |
| 本地模式（默认） | 她自己手机的浏览器 | ❌ | 先体验，今天就能用 |
| 云端同步（Supabase） | Supabase 云端 | ✅ | 你想远程看她进度 |

未配置 Supabase 时自动进入本地模式，所有功能（除了「你能远程看她」）立即可用。
## 一、本地模式（最快上手，今天就能给她）

无需任何配置：
```bash
npm install
npm run dev
```

手机和电脑在同一 Wi-Fi 下，电脑终端会显示 `Network: http://192.168.x.x:5173`，手机浏览器打开这个地址即可。点「添加到主屏幕」就能当 App 用。
> 本地模式数据只存在这一台手机的浏览器里，清缓存会丢。要云端同步看下一步。
## 二、云端同步模式（你能远程督学）
### 1. 建 Supabase 项目
- 打开 https://supabase.com ，新建项目。
- SQL Editor 里粘贴 `supabase-all-in-one.sql` 全部内容并执行（建表 + 权限 + 错题/语音私有桶，可重复执行）。
### 2. 关闭邮箱验证（避免注册后卡在验证）Supabase 控制台 → Authentication → Providers → Email → 关闭「Confirm email」。（个人小工具，省去验证步骤更顺滑。）

### 3. 填入密钥
```bash
cp .env.example .env
```
编辑 `.env`，填入：
```
VITE_SUPABASE_URL=你的项目 URL
VITE_SUPABASE_ANON_KEY=你的 anon public key
```
（项目设置 → API 里复制。）

### 4. 运行 / 部署
```bash
npm install
npm run build      # 产出 dist/
npm run preview    # 本地预览
```
把 `dist/` 部署到任意静态托管即可。仓库已配置 GitHub Pages：`.github/workflows/pages.yml` 在 `master` 推送时构建 `npm run build:site` 并发布到 https://aidless.github.io/study-buddy/ ；也可用 Vercel / Cloudflare Pages，步骤见 [`docs/deploy-static.md`](docs/deploy-static.md)。
### 5. 两人怎么连
1. **她**用手机打开链接 → 注册 → 选「学员（她）」→ 得到 6 位「邀请码」。
2. **你**用手机打开链接 → 注册 → 选「督学（你）」→ 填入她的邀请码。
3. 完成。你这边进入「她的状态」就能实时看到她的进度；两人都能在「悄悄话」里互发消息。
## 技术栈

- 前端：React 18 + Vite，纯手写 CSS（移动端优先），PWA（manifest + service worker，可离线、可加到主屏）。
- 后端（可选）：Supabase（Postgres + Auth + Realtime），已写好 RLS 行级安全，数据仅在同小组两人间可见。
## 目录

```
src/
  App.jsx / main.jsx      # 入口、登录、角色路由、实时刷新
  lib/db.js               # 双模式数据层（本地 + Supabase）
  lib/curriculum.js       # 11408 课纲 + 开箱即用周计划生成
  lib/supabase.js         # Supabase 客户端初始化
  lib/ota.js              # 自建 OTA 更新通道
  lib/qbank*.js           # 各科题库（数学/英语/政治/写作）+ 错题本
  lib/plan*.js            # 规划、目标、统计、推荐
  components/             # 60+ 组件：Tasks / Pomodoro / Progress /
                          # Mood / Chat / Plan / StudentView /
                          # SupervisorView（去监控化 · 陪伴）/
                          # AiTutor / WrongBook / WeeklyReport …
  styles.css              # 纯手写 CSS（移动端优先）
supabase-all-in-one.sql   # 建表 + RLS（含 countdown / phase_goals / self_tests）
miniprogram/              # 原生微信小程序（见其内 README）
```

## 着陆页与演示模式

`landing/` 是一个独立的静态着陆页（无构建、无外部依赖），用于把第一次访问的人带进产品。预览、部署和重新截图的方法见 [`landing/README.md`](landing/README.md)。

应用支持访客演示：URL 加 `?demo=1` 会以「体验学员」身份进入，并在首次访问时灌入一组示例任务、20 天专注、12 天打卡与目标分；演示数据只存在当前浏览器，不会覆盖已登录账号的本地数据。

### 消费级清单与文档

- GitHub Pages 自动部署（master 推送，含测试与 `?demo=1` 验收）：[`.github/workflows/pages.yml`](.github/workflows/pages.yml)
- 真实用户验证状态（当前真实用户 0，未招募）：[`docs/user-validation-status.md`](docs/user-validation-status.md)
- 静态部署（WorkBuddy / Vercel / Cloudflare + 域名 + 验收）：[`docs/deploy-static.md`](docs/deploy-static.md)
- 10 人内测脚本、观察表与修复日志：[`docs/user-testing-kit.md`](docs/user-testing-kit.md)
- 考研社区发布帖草稿：[`docs/launch-post.md`](docs/launch-post.md)
- 简历 bullet 模板（只填真实数字）：[`docs/resume-bullets.md`](docs/resume-bullets.md)
- 其他消费级项目的对标拆解：[`docs/consumer-grade-playbook.md`](docs/consumer-grade-playbook.md)

构建带着陆页的静态包：

```bash
npm ci
npm run build:site      # build + copy landing/ into dist/landing
```

Android APK 与微信小程序仍是内测状态：本机没有 Android SDK/小程序 AppID，未构建、未上传；landing 与 README 都按“内测中”写，不放未经验证的二维码或下载链接。

## 说明与后续可加
- 推送提醒：Web Push 在 iOS Safari 支持有限，当前用「加到主屏 + 打开即看」的方式替代；如需强提醒可后续接微信服务号模板消息。
- 按科目拆分的周计划可后续扩展。
