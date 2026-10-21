# study-buddy

考研督学助手：把「今天要学什么」拆成带时长的子任务，勾选完成，看完成率曲线。

一个后端 318 行、单文件、零前端的 MVP。不是产品，是一个想验证「任务拆解能不能真的提高完成率」的小实验。

---

## 它解决什么

备考的人常见困境不是不知道要学，而是**一天下来不知道到底完成了多少**。计划写得宏大（"今天看高数"），执行时无从判断做没做完，于是既没有进度感也没有挫败感，第二天继续同样地写。

这个工具的假设是：**把任务拆到「带预估时长、可勾选」的粒度，完成率就变得可测量了。**

## 闭环

```
首次使用 → 自报过去一周完成率（baseline）
    ↓
贴今日任务文本 → LLM 拆成 3–6 个带预估时长的子任务
    ↓
页面勾选完成 → 当日完成率 / 连续天数实时更新
    ↓
每日一句 LLM 复盘提问（基于当日完成模式生成）
    ↓
/buddy/stats 个人页：before（自报）vs after（实测）+ 每日趋势
```

## 快速启动

```bash
pip install -r requirements.txt

export LLM_API_KEY="你的 key"          # 必填
export LLM_BASE_URL="https://api.deepseek.com/v1"   # 可选，默认 DeepSeek
export LLM_MODEL="deepseek-v4-flash"                # 可选
export BUDDY_DB_PATH="buddy.db"                     # 可选，SQLite 路径

uvicorn app:app --reload --port 8000
```

打开 <http://127.0.0.1:8000/buddy/>。

LLM 兼容 OpenAI 的 `/chat/completions` 协议，换任何兼容服务改 `LLM_BASE_URL` 即可。不配 key 时任务拆解会失败，但勾选与统计仍可用。

## 接口

| 方法 | 路径 | 用途 |
|---|---|---|
| GET | `/buddy/` | 主页面 |
| GET | `/buddy/stats/` | 个人统计页 |
| GET | `/buddy/api/day?user=` | 取当日任务与完成状态 |
| POST | `/buddy/api/plan` | 提交任务文本，返回拆解后的子任务 |
| POST | `/buddy/api/toggle` | 勾选/取消某个子任务 |
| GET | `/buddy/api/reflection-question?user=` | 取当日复盘提问 |
| POST | `/buddy/api/reflection` | 提交复盘回答 |
| GET | `/buddy/api/stats?user=` | 统计 JSON |

## 数据

单个 SQLite 文件（默认 `buddy.db`），无外部依赖。**昵称即身份，无密码** —— 这是内测版的取舍，不是遗漏：10 人以内不需要账号体系，需要的是尽快跑起来看有没有用。

数据库文件已在 `.gitignore` 中忽略，不会误提交个人学习记录。

## 诚实边界

代码 docstring 里写了一段，这里重复一遍，因为这些限制决定了数字该怎么读：

- **`before` 是自报数字**，存在回忆偏差——人倾向于高估或低估过去的表现，且方向不确定
- **`after` 是勾选实测**，存在自评宽松偏差——勾选「完成」的标准是自己定的
- **单人样本不构成因果结论**。它只能回答「这东西对我有没有用」，不能回答「任务拆解能提高完成率」——后者需要对照组。

所以 `/buddy/stats` 页上的 before/after 对比，是这个工具存在的意义所在，但**不能当作研究结论引用**。

## 状态

试运行版（v1，2026-10-19），10 人内测规模。没有移动端、没有通知、没有多设备同步。

## License

MIT
