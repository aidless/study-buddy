# 着陆页 · 督学

一个独立的静态着陆页，用来把第一次访问的人带进产品。中文、移动优先、无外部依赖；截图来自真实应用，不是手绘 mockup。

## 文件

```
landing/
├── index.html       # 主页面
├── styles.css       # 页面样式（与 App 同一套绿色/米色）
├── landing.js       # 导航、滚动揭示、CTA 事件、可选 App URL 覆盖
├── privacy.html     # 数据说明（本地优先 / 云端可选 / 删除方式）
├── README.md
└── assets/
    ├── today.webp / focus.webp / plan.webp / progress.webp / mood.webp
    ├── og.png        # 1200×630 社交分享图
    └── icon.svg
```

## 本地预览

着陆页的 CTA 使用相对路径 `../`，所以要和 App 一起跑：

```bash
npm run build
cp -r landing dist/landing
python3 -m http.server 4173 --directory dist
# 打开 http://127.0.0.1:4173/landing/
```

不要用 `file://` 直接打开：相对 CTA 和 WebP 都会失效。

## 部署

### 方式一：和 App 同域（推荐）

把 `landing/` 放在站点根目录下，访问 `/landing/`。两个 CTA 会分别去：

- `/?guest=student` —— 访客演示（自动灌入示例任务/专注/打卡）
- `/` —— 本地模式，昵称即可开始

如果宿主有 SPA 重写（本仓库的 `vercel.json` 会把未知路径重写到 `index.html`），请确认 `/landing/` 能命中静态文件；命中不了就把 landing 单独部署。

### 方式二：独立域名

在 URL 后加 `?app=https://你的-app-域名`，`landing.js` 会把所有 CTA 改写到该地址；演示按钮会追加 `?guest=student`。也可以直接修改 `index.html` 中的 `data-app-link` href。

## 重新截图

截图脚本会新建一个本地演示账号、灌入示例数据，然后以 390×844 手机视口截图：

```bash
npm run build
cp -r landing dist/landing
python3 -m http.server 4173 --directory dist

CHROME_PATH=/usr/bin/google-chrome \
APP_URL=http://127.0.0.1:4173 \
node scripts/shoot-landing.cjs
```

截图包含“小研”演示账号的数据（20 天专注、12 天打卡、今日 2/3 任务），不是真实用户数据。更换文案或功能后请重跑，避免页面截图与产品不一致。

## 上线前检查

1. 两个 CTA 都能到达正确页面；`?guest=student` 能看到示例数据。
2. 手机 390px 宽无横向滚动；手风琴、移动菜单可点。
3. `privacy.html` 与实际的存储方式一致（尤其是否启用 Supabase、是否加了统计）。
4. `og.png` 在微信/Twitter/LinkedIn 预览正常；标题和描述没有夸大。
5. 没有把“AI 名师（内测）”写成默认可用；没有编造用户评价、下载量或排名。
6. 页脚保留“内测版 · 不是医疗器械”的边界说明。

## 视觉约定

- 主色 `#2f9e6e`，深绿 `#237a55`，米色底 `#f7f4ec`；标题用 Noto Serif CJK，正文用系统无衬线。
- 所有截图用真实 App 界面；手机框、浮动数字只做展示，不伪造功能。
- 文案原则：先说人话，再说功能；不写“赋能”“颠覆”“革命性”。

## 许可

页面代码与文案随本仓库使用 MIT License（见根目录 `LICENSE`）。截图中的 App 界面同样属于本仓库。
