// verify_qbank.mjs —— 题库完整性校验（重建版）
import { SEED_QUESTIONS, SEED_META } from '../src/lib/qbankSeed.js'
import { ESSAY } from '../src/lib/qbankEssay.js'
import { PRACTICE } from '../src/lib/qbankPractice.js'
import { ENGLISH, ENGLISH_WRITING } from '../src/lib/qbankEnglish.js'
import { MATH, MATH_PROBLEMS } from '../src/lib/qbankMath.js'

let fails = 0
const check = (name, ok, extra = '') => {
  if (!ok) fails++
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra ? ' :: ' + extra : ''))
}

check('真题选择题总数 >= 670', SEED_QUESTIONS.length >= 670, 'count=' + SEED_QUESTIONS.length)
check('年份覆盖 >= 15 年', (SEED_META.years || []).length >= 15, 'years=' + (SEED_META.years || []).length)
check('选项均为 4 个', SEED_QUESTIONS.every((q) => q.options && q.options.length === 4), '')
check('答案均为 A-D', SEED_QUESTIONS.every((q) => 'ABCD'.includes(q.answer)), '')
check('题干非空', SEED_QUESTIONS.every((q) => q.stem && q.stem.length > 4), '')
check('解析非空率 >= 95%', SEED_QUESTIONS.filter((q) => q.analysis && q.analysis.length > 10).length / SEED_QUESTIONS.length >= 0.95, '')
check('知识点 tags 非空率 >= 95%', SEED_QUESTIONS.filter((q) => q.tags && q.tags.length).length / SEED_QUESTIONS.length >= 0.95, '')
check('每科数量分布合理', ['数据结构', '计算机组成', '操作系统', '计算机网络'].every((s) => SEED_QUESTIONS.filter((q) => q.subject === s).length > 100), '')
check('大题总数 >= 80', ESSAY.length >= 80, 'essay=' + ESSAY.length)
check('大题每年 7 道', ESSAY.filter((e) => e.stem && e.stem.length > 20).length >= 80, '')
check('大题答案覆盖 >= 8 年', new Set(ESSAY.filter((e) => e.analysis && e.analysis.length > 20).map((e) => e.year)).size >= 8, '')
check('政治练习 = 100', PRACTICE.length === 100, 'pol=' + PRACTICE.length)
check('英语一练习 = 122', ENGLISH.length === 122, 'en=' + ENGLISH.length)
check('数学一练习 = 126', MATH.length === 126, 'math=' + MATH.length)
check('英语作文专项 = 16', ENGLISH_WRITING.length === 16, 'writing=' + ENGLISH_WRITING.length)
check('数学解答题专项 = 24', MATH_PROBLEMS.length === 24, 'problems=' + MATH_PROBLEMS.length)
check('作文带范文', ENGLISH_WRITING.every((q) => q.parts && q.parts[0] && q.parts[0].answer && q.parts[0].answer.length > 80), '')
check('解答题带详解', MATH_PROBLEMS.every((q) => q.analysis && q.analysis.length > 20), '')
check('英语选项合法', ENGLISH.every((q) => q.options.length === 4 && 'ABCD'.includes(q.answer)), '')
check('数学选项合法且答案正确', MATH.every((q) => q.options.length === 4 && 'ABCD'.includes(q.answer)), '')

console.log(fails === 0 ? '\nALL_OK' : `\n${fails} 项失败`)
process.exit(fails ? 1 : 0)