# 着陆页 · 督学

一个独立的静态着陆页，用来把第一次访问的人带进产品。中文、移动优先、无外部依赖；截图和演示视频都来自真实应用。

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
    ├── demo.mp4      # 30 秒真实录屏
    ├── demo.gif      # 10 秒 GIF 预览
    ├── og.png        # 1200×630 社交分享图
    └── icon.svg
```

## 本地预览

```bash
npm ci
npm run build:site        # build + copy landing/ into dist/landing
python3 -m http.server 4173 --directory dist
# 打开 http://127.0.0.1:4173/landing/
```

不要用 `file://` 直接打开：相对 CTA、WebP 和视频都会失效。

## 两个 CTA

- **免注册演示** → `/?demo=1`：访客「体验学员」+ 首次进入自动灌入示例任务、专注、打卡和目标分；不碰 Supabase，也不会覆盖真实本地账号。
- **开始使用** → `/`：本地模式，昵称即可；也可以点「先不取名，直接开始」。

如果 landing 和 App 不同域，用 `?app=https://你的-app-域名` 打开 landing，`landing.js` 会把 CTA 改写到该地址；演示按钮会追加 `?demo=1`。

## 部署

完整清单见 [`../docs/deploy-static.md`](../docs/deploy-static.md)：WorkBuddy / Vercel / Cloudflare Pages、域名、上线验收与回滚。

**注意：** 不要只发布 `landing/`。CTA 是相对路径，必须和 App 一起发布（`dist/` 内含 `landing/`），或单独用 `?app=` 指向 App。

## 重新截图

截图脚本会新建本地演示账号、灌入示例数据，再以 390×844 手机视口截图：

```bash
npm run build:site
python3 -m http.server 4173 --directory dist

CHROME_PATH=/usr/bin/google-chrome \
APP_URL=http://127.0.0.1:4173 \
node scripts/shoot-landing.cjs
```

会更新 `today/focus/plan/progress/mood.webp`。截图是演示数据，不是真实用户。

## 重新录 30 秒视频

```bash
npm run build:site
python3 -m http.server 4173 --directory dist

CHROME_PATH=/usr/bin/google-chrome APP_URL=http://127.0.0.1:4173 \
node scripts/capture-demo.cjs

# 生成的帧在 /tmp/study-buddy-demo-frames（或 FRAMES_DIR）
ffmpeg -y -framerate 4.833 -i /tmp/study-buddy-demo-frames/frame-%05d.png \
  -c:v libx264 -pix_fmt yuv420p -movflags +faststart landing/assets/demo.mp4
ffmpeg -y -t 10 -framerate 4.833 -i /tmp/study-buddy-demo-frames/frame-%05d.png \
  -vf "fps=6,scale=390:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" \
  landing/assets/demo.gif
```

帧率按实际帧数 / 30 秒计算；如果时长变了，先 `ffprobe` 再写进命令。

## 已知未完成（不要写成已上线）

- Android APK：本机没有 Android SDK，未构建、未公开发布；landing 写的是“内测中”。
- 微信小程序：代码在 `miniprogram/`，但没有 AppID/上传流程；landing 没有放假二维码。
- 公开 URL：还没有绑定域名；部署后把 `og:image` 改成绝对 URL。
- 真实用户数/留存：还没有，所以 landing 与发布帖都不写。

## 上线前检查

1. 两个 CTA 都能到达正确页面；`?demo=1` 能看到示例数据。
2. 手机 390px 宽无横向滚动；菜单、手风琴、视频可点。
3. `privacy.html` 与实际的存储方式一致（尤其是否启用 Supabase/统计）。
4. `og.png` 在微信/Twitter/LinkedIn 预览正常；标题和描述没有夸大。
5. 没有把“AI 名师（内测）”写成默认可用；没有编造用户评价、下载量或排名。
6. 页脚保留“内测版 · 不是医疗器械”的边界说明。

## 视觉约定

- 主色 `#2f9e6e`，深绿 `#237a55`，米色底 `#f7f4ec`；标题用 Noto Serif CJK，正文用系统无衬线。
- 所有截图用真实 App 界面；手机框、浮动数字只做展示，不伪造功能。
- 文案原则：先说人话，再说功能；不写“赋能”“颠覆”“革命性”。

## 许可

页面代码与文案随本仓库使用 MIT License（见根目录 `LICENSE`）。截图与录屏中的 App 界面同样属于本仓库。
