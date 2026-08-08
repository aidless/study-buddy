// curriculum.js —— 11408 课纲 + 分值权重 + 开箱即用周计划（2026-08-08 重建）
// 数据来源：408 统考考纲四科知识点，按高频考点与分值分布给权重。

export const CURRICULUM = {
  '数据结构': [
    '线性表', '栈和队列', '树与二叉树', '图', '查找', '排序', '串', '数组与广义表', '哈希表', '并查集'
  ],
  '计算机组成': [
    '计算机系统概述', '数据的表示和运算', '存储系统', '指令系统', '中央处理器', '总线', '输入输出系统', '流水线', 'Cache', '虚拟存储器'
  ],
  '操作系统': [
    '操作系统概述', '进程管理', '内存管理', '文件管理', '输入输出管理', '死锁', '虚拟内存', '进程同步', '处理机调度', '磁盘调度'
  ],
  '计算机网络': [
    '计算机网络体系结构', '物理层', '数据链路层', '网络层', '传输层', '应用层', '局域网', 'IP 地址与子网', '路由协议', 'TCP/UDP'
  ]
}

// 各科真题分值近似（408 统考：数据结构 45 / 组成 45 / OS 35 / 网络 25 = 150）
export const WEIGHTS = {}
const weightRows = {
  '数据结构': { '线性表': 6, '栈和队列': 5, '树与二叉树': 8, '图': 7, '查找': 5, '排序': 7, '串': 2, '数组与广义表': 2, '哈希表': 2, '并查集': 1 },
  '计算机组成': { '计算机系统概述': 3, '数据的表示和运算': 7, '存储系统': 9, '指令系统': 5, '中央处理器': 8, '总线': 2, '输入输出系统': 5, '流水线': 3, 'Cache': 2, '虚拟存储器': 1 },
  '操作系统': { '操作系统概述': 2, '进程管理': 8, '内存管理': 7, '文件管理': 5, '输入输出管理': 4, '死锁': 3, '虚拟内存': 3, '进程同步': 3, '处理机调度': 2, '磁盘调度': 1 },
  '计算机网络': { '计算机网络体系结构': 2, '物理层': 2, '数据链路层': 4, '网络层': 6, '传输层': 5, '应用层': 3, '局域网': 1, 'IP 地址与子网': 1, '路由协议': 1, 'TCP/UDP': 1 }
}
for (const [sub, rows] of Object.entries(weightRows)) {
  for (const [topic, w] of Object.entries(rows)) {
    WEIGHTS[`${sub}|${topic}`] = w
  }
}

export function subjectWeight(subject) {
  const rows = WEIGHTS
  let sum = 0
  for (const k of Object.keys(rows)) {
    if (k.startsWith(subject + '|')) sum += rows[k]
  }
  return sum || 0
}

export function weightOf(subject, topic) {
  return WEIGHTS[`${subject}|${topic}`] || 0
}

// 未设考试日期时按约 140 天估算（诚实边界：备考页会注明）
export function daysUntil(dateStr) {
  if (!dateStr) return null
  const t = new Date(dateStr + 'T00:00:00')
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.round((t - now) / 86400000)
}

/**
 * buildPlan(examDateStr, anchor) —— 开箱即用今日建议
 * 按周轮转：以 anchor 为起点，按当前周数从每科课纲里取一个主题。
 */
export function buildPlan(examDateStr, anchor) {
  const daysLeft = examDateStr ? Math.max(1, daysUntil(examDateStr)) : 140
  if (daysLeft <= 0) return { todayTasks: [], reason: '设一个考试日期，冲刺计划会自动生成' }
  const today = new Date()
  const anchorDate = anchor ? new Date(anchor + 'T00:00:00') : today
  const week = Math.max(0, Math.floor((today - anchorDate) / (7 * 86400000)))
  const todayTasks = []
  const order = ['数据结构', '计算机组成', '操作系统', '计算机网络']
  for (const sub of order) {
    const list = CURRICULUM[sub] || []
    if (!list.length) continue
    const topic = list[(week + order.indexOf(sub)) % list.length]
    todayTasks.push({ subject: sub, topic })
  }
  // 政治/英语/数学每周轮转一天
  const extra = ['政治', '英语一', '数学一']
  if (extra.length) {
    const e = extra[week % extra.length]
    todayTasks.push({ subject: e, topic: e === '政治' ? '马原/毛中特' : e === '英语一' ? '阅读 + 词汇' : '高数/线代/概率' })
  }
  return { todayTasks, reason: '按 11408 课纲自动排的今日建议' }
}

// 错题/薄弱点 → 复习建议用 tipOf(subject, topic)
export const TIPS = {
  '数据结构|树与二叉树': '先画一棵树手推先序/中序/后序，再练线索二叉树——遍历是基础，别跳。',
  '数据结构|图': '图的存储（邻接矩阵/邻接表）和两种遍历要手写一遍，最短路径与拓扑排序放后面。',
  '数据结构|排序': '把快排/归并/堆排序的实现各默写一遍，重点对比稳定性与复杂度。',
  '计算机组成|存储系统': 'Cache 映射与替换算法画图推一遍，命中率计算是必考套路。',
  '计算机组成|数据的表示和运算': '补码加减法、溢出的判断（双符号位/单符号位）务必算熟。',
  '操作系统|进程管理': 'PCB、进程状态转换、调度算法（先来先服务/短作业优先/时间片轮转）画时间线。',
  '操作系统|内存管理': '分页/分段/段页式的地址转换做 3 道计算题，缺页率与页面置换算法绑定练。',
  '计算机网络|网络层': 'IP 分组与路由选择：子网划分 + 路由表聚合是每年必考，多刷真题。',
  '计算机网络|传输层': 'TCP 三次握手/四次挥手的状态图默画一遍，流量控制与拥塞控制区分开。'
}
export function tipOf(subject, topic) {
  const t = TIPS[`${subject}|${topic}`]
  return t ? { how: t } : { how: `重点复习「${subject}·${topic}」相关真题与教材例题。` }
}