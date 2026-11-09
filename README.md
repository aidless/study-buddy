# 给她 · 考研陪伴（PWA）

STATUS: WORK-IN-PROGRESS — not A yet

正在备考的人可以在手机浏览器里记下今天的任务、用番茄钟，并写一句话、树洞或做一分钟呼吸；数据默认只在本机，Supabase 同步和 AI 名师都要另外配置。
本仓库不提供完成率提升的测量、用户研究、对照组、下载量或 PyPI 包，也没有 FastAPI，没有「任务拆开就能提高完成率」的实验。
不需要 API key 的检查是 `npm ci && npm test`，本地界面是 `npm run dev`。演示页 https://aidless.github.io/study-buddy/?demo=1 在 2026-11-09 能进入「体验学员」（合成数据）；CI 不打开这个网址。

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)  [![CI](https://github.com/aidless/study-buddy/actions/workflows/ci.yml/badge.svg)](https://github.com/aidless/study-buddy/actions/workflows/ci.yml/badge.svg)

着陆页：https://aidless.github.io/study-buddy/landing/ 。`?guest=student` 与 `?demo=1` 走同一条演示入口。

## 距 A 还差

1. 没有完成率实验。真实用户记录仍是 0（[`docs/user-validation-status.md`](docs/user-validation-status.md)）。自报完成不能写成提升。
2. AI 名师的「学习规划」没有离线评测。Supabase 项目在 2026-11-09 对 `ai-tutor` 与 `updates` 的响应是 “Project paused”，这两条线上路径当前不可用。
3. 版本号 0.2.1 与 tag `v0.2.1` 在仓库里。最近一次 Release 工作流（2026-10-22，run 39718382231）在 Android SDK 安装阶段失败（`sdkmanager` 找不到 `tools`）。2026-08-10 有一次成功的 Release run（31400639594），安装包不在本树。旧笔记里的 APK v1.26.0 / versionCode 90 也不是当前 `android/app/build.gradle`（versionName 0.2.1，versionCode 4）。
4. GitHub About 仍写「PWA + Android App + Supabase + 自建 OTA + 微信小程序」。这些目录都在树里。公开能打开的是 GitHub Pages 上的 PWA。Android 与小程序没有上架。About 文案本 PR 改不了。

## FAILURE_MODES

- LLM split quality：AI 名师在配置了中继、且该中继在线时，可以用「学习规划」按错题和自测记录给出一周安排。仓库没有评测这些拆分是否更小、是否被完成，也没有不带模型密钥就能复现规划质量的夹具。未配置或中继暂停时，名师不可用，任务、番茄钟、情绪页和本地记自测仍可用。
- Self-report baseline bias：任务是否完成、专注分钟，以及自测里的「快速记录」，都由同一个人写下。没有独立观察的基线。
- No control group：没有把使用本工具和纸笔计划或不用工具做对照。以后自报完成变多，也不能从这份仓库推出原因。

## 两条路径

### 离线 / 记录（不需要 LLM key）

题库、判分、计划和「本地记录 → 云端载荷」映射都在仓库里，单测不连网、不读密钥。

```bash
npm ci
npm test          # Vitest test/unit + scripts/verify_qbank.mjs
npm run dev       # 本地模式。同一 Wi-Fi 下用终端里的 Network 地址用手机打开
```

CI 使用 Node 20。选择题对错由随仓库的题库在本地判分。`?demo=1` 灌入的任务、专注和打卡是合成数据，不是用户。

### LLM（可选，不是主路径）

`src/lib/aiTutor.js` 把问题发到 `VITE_AI_TUTOR_URL`，否则发到 `/functions/v1/ai-tutor`。没有这个地址、或地址背后的项目暂停时，调用会失败。CI 不调用它。`node scripts/ai-tutor-relay.mjs` 也不在 `npm test` 里。

## 版本

应用版本 **0.2.1** 写在三处：`package.json`、`capacitor.config.json` 的 `CapacitorUpdater.version`、`android/app/build.gradle` 的 `versionName`（`versionCode` 4）。tag `v0.2.1` 存在。这不是应用商店版本，本树没有 APK。微信小程序 `miniprogram/package.json` 是 0.1.0，未上传。`public/sw.js` 的 `study-buddy-v3` 只是缓存名。没有 PyPI 包。`scripts/*.py` 是题库生成脚本，不是服务。

## CI 实际覆盖

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) 在 push / pull request 上执行 `npm ci`、`npm test`、`npm run build`，并用 gitleaks 扫全部历史。不需要 LLM key 或 Supabase。

`npm test` 包含：

- Vitest：`test/unit/**/*.test.js`（含题库抽题判分，以及 `migratePlan.test.js` 对 `buildMigrationPlan` 当前返回值的锁定：按 coupleId 过滤、驼峰字段；不按 owner 过滤）
- `node scripts/verify_qbank.mjs`

`test/migrateLocalToCloud.test.mjs` 不在 `npm test` 里。旧断言要的是蛇形字段和「只搬本人」，函数实际按 coupleId 过滤并返回驼峰字段。该文件现在直接退出 2。用普通 `node` 导入 `src/lib/supabase.js` 仍会在 `import.meta.env` 上报错；现行单测走 Vitest。

不包含：`test/vm_sync_e2e.mjs`（要本地预览、浏览器和云端账号）、`test/emu_cdp_deep.mjs`（要 adb 与已安装的 APK）、`test/user_perspective_e2e.mjs`（2026-08-08 的残片在 `puppeteer.launch` 处截断，现改为直接退出 2）。这三支都不进 CI。前两支的输出目录默认是仓库下的 `.local/`（可用 `SHOTS_DIR` 改），浏览器路径用 `BROWSER_PATH`。

[`.github/workflows/pages.yml`](.github/workflows/pages.yml) 同样先 `npm test`，再 `npm run build:site` 发布到 GitHub Pages。它不在浏览器里打开 `?demo=1`。master 上一次 CI 与 Pages 成功是 2026-10-27；以本次 PR 的 Actions 为准，不把那次绿灯写成永久状态。

[`.github/workflows/release.yml`](.github/workflows/release.yml) 只在 tag `v*` 上跑，目标是签名 APK 和 OTA。它不是测试门禁。最近一次失败原因见上面「距 A 还差」。

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

- GitHub Pages（master 推送：`npm test` + `npm run build:site`，不在浏览器里点 `?demo=1`）：[`.github/workflows/pages.yml`](.github/workflows/pages.yml)
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

Android 工程和微信小程序源码在树里，没有随仓库发布的安装包，也没有已上传的小程序。landing 与本 README 不放二维码或下载人数。

## 说明与后续可加
- 推送提醒：Web Push 在 iOS Safari 支持有限，当前用「加到主屏 + 打开即看」的方式替代；如需强提醒可后续接微信服务号模板消息。
- 按科目拆分的周计划可后续扩展。
