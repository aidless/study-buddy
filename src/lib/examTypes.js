// examTypes.js —— 考试类型静态配置（模板数据，非逻辑）
// 由 plan.js 的 getExamType/setExamType 读写用户选择（couples.exam_type / 本地 dx_exam_type）。
export const CUSTOM_SUBJECT_OPTIONS = [
  '公共课①', '公共课②', '公共课③',
  '专业课①', '专业课②', '专业课③', '专业课④',
  '数学', '英语', '政治', '专业课', '其他'
]

export const EXAM_TYPES = {
  kaoyan: {
    key: 'kaoyan',
    label: '考研',
    cdLabel: '考研初试',
    totalMax: 500,
    hasPlan: true,
    hasWeighted: true,
    degreeSelect: true,
    subjNote: '默认建议（350 分拆）：专硕偏数一，学硕偏 408。当前估分 = 该科自测的题量加权正确率 × 学科满分。',
    subjects: [
      { key: 'pol',   label: '政治',        max: 100 },
      { key: 'eng',   label: '英语一',      max: 100 },
      { key: 'math',  label: '数学一',      max: 150 },
      { key: 'cs408', label: '408（统考）', max: 150 }
    ],
    defaults: { pol: 65, eng: 60, math: 105, cs408: 120 },
    merge: { cs408: ['数据结构', '计算机组成', '操作系统', '计算机网络'] },
    quickSubs: ['数学一', '英语一', '政治', '数据结构', '计算机组成', '操作系统', '计算机网络'],
    recGoals: [
      { title: '数学一：高数 / 线代 / 概率 过完第一轮', before: 84 },
      { title: '英语一：核心词汇 2 遍 + 长难句', before: 70 },
      { title: '政治：知识点过完第一轮', before: 98 },
      { title: '数据结构：教材 + 习题 第一轮', before: 56 },
      { title: '计算机组成：第一轮', before: 70 },
      { title: '操作系统：第一轮', before: 84 },
      { title: '计算机网络：第一轮', before: 98 },
      { title: '强化阶段：四科题型专项突破', before: 49 },
      { title: '真题阶段：近 10 年真题精做（408 统考 + 数 / 英 / 政）', before: 28 },
      { title: '冲刺阶段：全真模拟 + 查漏补缺', before: 7 }
    ]
  },
  zhuanshengben: {
    key: 'zhuanshengben', label: '专升本', cdLabel: '专升本考试', totalMax: 500,
    hasPlan: false, hasWeighted: false, degreeSelect: false,
    subjNote: '各省考试科目不同：公共课（英语/政治/数学）+ 专业课，按你省实际科目改标签即可。',
    subjects: [
      { key: 'eng',   label: '英语',           max: 100 },
      { key: 'pol',   label: '政治',           max: 100 },
      { key: 'math',  label: '数学（或公共课）', max: 150 },
      { key: 'major', label: '专业课',         max: 150 }
    ],
    defaults: { eng: 70, pol: 65, math: 90, major: 110 },
    merge: {}, quickSubs: ['英语', '政治', '数学', '专业课'],
    recGoals: [
      { title: '公共课：英语词汇 + 语法基础过一遍', before: 84 },
      { title: '专业课：教材 + 章节习题 第一轮', before: 70 },
      { title: '公共课 + 专业课：题型专项强化', before: 42 },
      { title: '真题阶段：近 5 年真题精做', before: 21 },
      { title: '冲刺：全真模拟 + 查漏补缺', before: 7 }
    ]
  },
  gaokao: {
    key: 'gaokao', label: '高考', cdLabel: '高考', totalMax: 750,
    hasPlan: false, hasWeighted: false, degreeSelect: false,
    subjNote: '新高考 3+1+2：语数外必考 + 首选 1 门 + 再选 2 门。标签按实际选科对应。',
    subjects: [
      { key: 'chinese', label: '语文',     max: 150 },
      { key: 'math',    label: '数学',     max: 150 },
      { key: 'foreign', label: '外语',     max: 150 },
      { key: 'primary', label: '首选科目', max: 100 },
      { key: 'sec1',    label: '再选科目①', max: 100 },
      { key: 'sec2',    label: '再选科目②', max: 100 }
    ],
    defaults: { chinese: 115, math: 120, foreign: 125, primary: 80, sec1: 80, sec2: 80 },
    merge: {}, quickSubs: ['语文', '数学', '外语', '物理', '化学', '生物', '历史', '政治', '地理'],
    recGoals: [
      { title: '语数外：基础一轮过完（教材 + 同步练习）', before: 90 },
      { title: '选科科目：知识点一轮', before: 80 },
      { title: '二轮：专题强化 + 错题本', before: 45 },
      { title: '三轮：近 5 年真题套卷精做', before: 20 },
      { title: '冲刺：全真模拟 + 回归基础', before: 7 }
    ]
  },
  gongkao: {
    key: 'gongkao', label: '考公考编', cdLabel: '公务员 / 事业单位考试', totalMax: 500,
    hasPlan: false, hasWeighted: false, degreeSelect: false,
    subjNote: '国考/省考：行测 + 申论；事业单位：职测 + 综应（或公基）。按你要考的选科目标。',
    subjects: [
      { key: 'xingce',   label: '行测', max: 100 },
      { key: 'shenlun',  label: '申论', max: 100 },
      { key: 'zhice',    label: '职测', max: 150 },
      { key: 'zongying', label: '综应', max: 150 },
      { key: 'gongji',   label: '公基', max: 100 }
    ],
    defaults: { xingce: 65, shenlun: 60, zhice: 80, zongying: 80, gongji: 60 },
    merge: {}, quickSubs: ['行测', '申论', '职测', '综应', '公基'],
    recGoals: [
      { title: '行测：五大模块（言语/判断/数量/资料/常识）过一轮', before: 70 },
      { title: '申论：小题题型 + 大作文框架', before: 70 },
      { title: '真题阶段：近 5 年真题套卷', before: 30 },
      { title: '冲刺：全真模考 + 错题复盘', before: 10 }
    ]
  }
}

export const EXAM_ORDER = ['kaoyan', 'zhuanshengben', 'gaokao', 'gongkao']
export const DEFAULT_EXAM = 'kaoyan'