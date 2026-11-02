# Bench — 给她 · 考研陪伴 验证基准

> 本目录登记 study-buddy 的**真实验证基准**。所有数字都能从仓库树重取（`npm test` + 题库校验 + 本地验收记录）。
> **关键边界**：本仓库**有意不证明**真实用户留存/增长/付费（真实用户 0，招募未开始）——**不伪造**。

## 基准 1 — 单元测试（4 文件 11 测试，`npm test`，实测 2026-11-01）

| 文件 | 测试数 | 真实断言 |
|---|---|---:|---|
| `test/unit/examTypes.test.js` | 3 | 考试类型常量、科目映射、分值计算 |
| `test/unit/milestones.test.js` | 2 | 里程碑/连续天数计算 |
| `test/unit/planStats.test.js` | 3 | 周计划统计、正确率聚合、趋势 |
| `test/unit/quizEngine.test.js` | 3 | 刷题引擎：抽题、判分、错题记录 |
| `test/migrateLocalToCloud.test.mjs` | （手动 harness） | `buildMigrationPlan` 字段映射 + 过滤（只留自己的 coupleId） |

- **判读**：`Test Files 4 passed, Tests 11 passed`（vitest，Node 24 正常路径）。

## 基准 2 — 题库校验（20 项不变量，`npm test`，ALL_OK，实测 2026-11-01）

| 项 | 真实值 |
|---|---|
| 真题选择题 | **720 道** / **18 年** / 每题 **4 选项** |
| 大题（解答/作文） | **85 道** |
| 分科 | 政治 **100** / 英语一 **122** / 数学一 **126** / 作文 **16** / 解答题 **24** |

## 基准 3 — 11408 课纲与分值权重（真实，`src/lib/curriculum.js`）

- 数据来源：408 统考考纲四科知识点，按高频考点与分值分布给权重。
- 四科分值近似：数据结构 **45** / 组成 **45** / OS **35** / 网络 **25** = **150**。
- `buildPlan(anchor, today)` 按周轮转，从每科课纲取一个主题 → 「今日建议 3 件事」。
- `WEIGHTS` / `weightOf` / `subjectWeight` 提供分科权重；`daysUntil` 算 D-day。

## 基准 4 — 本地验收（`docs/user-validation-status.md`，2026-10-27 Chromium）

- `/?demo=1` 进入体验学员模式；今日建议、3 条示例任务、专注页、进度页能加载。
- 点击一条未完成任务后 `localStorage.dx_tasks` 完成状态 **2 → 3**。
- 进度页显示学习进度、30 天热力图、今日任务计数。
- **390 × 844** 手机视口**无横向溢出**。

## 复现

```bash
npm ci && npm test     # 4 文件 11 测试 + 20 项题库校验 ALL_OK
```

> ⚠️ 路径注意：本工作区 `F:\deepseek` 含反斜杠会破坏 Node ESM 模块解析（`ERR_INVALID_MODULE_SPECIFIER`），
> `npm test` 在此路径下报 `vitest: not found`。复算请把仓库放无反斜杠路径（如 `/tmp/study-buddy`）。
> 这是环境限制，不是代码缺陷——云端 CI（`.github/workflows/pages.yml`，ubuntu 路径）不受影响。

## Fail-closed（真实边界）

- **真实用户验证未开始**：真实用户 0、招募未开始；`?demo=1` 用合成数据，**不能替代真实用户**。
  `docs/user-validation-status.md` 明示「任何『通过 10 人内测』式表述在真实证据达标前一律不得对外使用」。
- **不证明留存/增长/付费/消费级**；不证明陌生人能无提示完成首次任务、48 小时续用、Supabase 多设备稳定、
  PWA 各 iOS/Android 版本行为一致；云端同步未在真实网络与多设备上验证。
