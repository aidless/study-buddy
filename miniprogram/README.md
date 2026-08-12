# 考研督学 · 微信小程序

基于现有安卓 App（React + Supabase）的微信小程序版，**原生小程序技术栈，无需构建工具链**，微信开发者工具直接打开即可运行。

## 快速开始

1. 安装并打开「微信开发者工具」（stable 版）
2. 导入项目：选择本 `miniprogram` 目录，AppID 用「测试号」（工具里点“测试号”）或你自己的小程序 AppID
3. 编译即可看到：登录 → 今日打卡 → 真题自测 → 我的统计

> 当前为**本地体验模式**：用户、打卡、自测全部存在本机 storage，无需任何账号和服务器，导入即用。

## 已实现功能

| 页面 | 功能 |
|---|---|
| 登录 | 本地体验模式（昵称 + 学员/督学角色） |
| 今日 | 打卡（连续天数）、今日一句话、学习进度 |
| 自测 | 408 / 政治 / 英语一 / 数学一 随机抽题（5/10/20 道）→ 作答 → 自动判分 → 解析 → 记入统计 |
| 我的 | 连续天数、自测次数、正确率、最近记录、清数据/退出 |

题库与安卓 App 同源（408 真题 720 道 + 政治 100 + 英语 + 数学，由 `scripts/export-miniprogram-data.mjs` 生成，勿手改 `data/` 下文件）。

## 目录结构

```
miniprogram/
├── app.js / app.json / app.wxss     # 全局
├── data/                             # 题库数据（自动生成）
│   ├── questions_408.js / essay / english / math / politics / examTypes.js
├── utils/
│   ├── store.js / db.js / quiz.js / util.js
├── pages/
│   ├── login / today / exam / me
└── cloudfunctions/
    └── proxy/                        # 云端同步代理（可选，见下）
```

## 接入云端同步（可选，需备案域名或云开发）

小程序 `request` 的域名必须 ICP 备案且 HTTPS，Supabase 是国外域名无法直接连。两种方式：

### 方式 A：微信云开发（推荐，免备案域名）
1. 开发者工具点「云开发」开通，创建环境
2. 右键 `cloudfunctions/proxy` → 上传并部署（云端安装依赖）
3. 云函数控制台给 `proxy` 配置环境变量：
   - `SUPABASE_URL`、`SUPABASE_ANON_KEY`（你 Supabase 项目的）
4. 后续把 `utils/db.js` 改成优先走 `wx.cloud.callFunction({ name: 'proxy', data: {...} })`，本地存储作为缓存

### 方式 B：自建已备案域名 API
在备案服务器上部署一个轻量代理（Node/Java 任意），小程序端 request 指向它，它再转发到 Supabase。

## 与安卓 App 的关系

- 数据模型/表结构复用 Supabase（RLS 已审计加固）
- 题库完全同源；AI 名师、督学配对、专注锁等依赖原生/长连接能力的功能建议保留在 App 端
- 小程序定位：轻量使用（打卡、刷题、看统计），重场景（考试模式、AI 答疑）回 App

## 发布前注意

- 类目选择：教育 → 在线教育/教育信息服务（个人主体功能受限，建议企业主体）
- 隐私政策：见 App 仓库 docs/隐私政策.md，需在小程序后台填写并配置用户隐私保护指引
- 图题：小程序端暂以文字提示代替 SVG 图（图题在 App 端查看）
- 包体积：当前数据约 1.3MB，主包 2MB 限制内；后续扩容可拆分包
