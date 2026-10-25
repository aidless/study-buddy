# 静态部署清单（D1–2）

本机没有 Vercel / Cloudflare CLI，也没有它们的登录态；下面的命令和步骤是给有账号的人执行的，不代表已经上线。

## 1. 打出一个可直接发布的包

```bash
npm ci
npm run build:site        # build + copy landing/ into dist/landing
cd dist && zip -qr ../study-buddy-static.zip .
```

`study-buddy-static.zip` 里同时有 App 和 `/landing/`。**不要只发 `landing/`**，否则 CTA 的 `../?demo=1` 会 404。

## 2. WorkBuddy（本机已装 5.6.2）

1. 打开 WorkBuddy，进入「应用生成 / 代码开发」。
2. 导入 `study-buddy-static.zip`（或直接指向 `dist/` 目录）。
3. 选择**静态站点 / 纯前端**，不要开通云数据库、文件存储或登录（这个项目已经用 Supabase，重复接会多一套数据）。
4. 发布，拿到公网链接；在「设置 → 数据管理 → 我发布的应用」里管理。
5. 打开 `<链接>/landing/`，确认 CTA 跳到 `<链接>/?demo=1`。

如果 WorkBuddy 只允许发布它自己生成的工程，走下面的 Vercel / Cloudflare；不要为了适配它重写项目。

## 3. Vercel

```bash
npm i -g vercel
vercel login
vercel --prod
```

仓库根目录的 `vercel.json` 已设置 `buildCommand = npm run build:site`、`outputDirectory = dist`。部署后确认：

- `/` 是 App
- `/landing/` 是着陆页
- `/?demo=1` 进入带示例数据的访客模式

如果 `/landing/` 被 SPA 重写吃掉，把 `landing/` 单独部署成一个项目，或在 Vercel 控制台给 `/landing/(.*)` 加静态路由。

## 4. Cloudflare Pages

```bash
npm i -g wrangler
wrangler login
npm run build:site
wrangler pages deploy dist --project-name study-buddy
```

Cloudflare Pages 会直接按文件路径服务 `/landing/`；SPA 的根路径不需要额外重写（应用只有根路由）。

## 5. 绑定域名

1. 在宿主控制台添加自定义域名（Vercel: Settings → Domains；Cloudflare: Pages → Custom domains）。
2. 按提示在 DNS 加 CNAME（或 A 记录）。
3. 等 HTTPS 证书签发；不要用裸 IP，PWA 与 Supabase 都要求 HTTPS。
4. 上线后把 `landing/index.html` 的 `og:image` 改成绝对 URL（社交平台不保证解析相对路径）。

## 6. 上线验收（逐条打勾）

- [ ] `/?demo=1` 首次进入有 3 个任务、专注热力图、12 天打卡
- [ ] 新账号第一次进入出现 3 步引导，完成后目标分写入
- [ ] 手机上「添加到主屏幕」可用；离线打开不白屏
- [ ] `/landing/` 两个 CTA 分别到 `?demo=1` 和 `/`
- [ ] `/landing/privacy.html` 与实际存储方式一致
- [ ] 分享卡片（微信/Twitter/LinkedIn）标题、描述、图正常
- [ ] 没有把 AI 名师写成默认可用；没有编造用户数
- [ ] Supabase 只使用 anon key；service key 不在前端

## 7. 回滚

静态站回滚就是重新部署上一版 `dist/`。保留每次发布的 zip 或 Git tag；不要原地覆盖唯一产物。
