// verify_qbank.mjs —— 题库完整性校验（重建版）
import { SEED_QUESTIONS, SEED_META } from '../src/lib/qbankSeed.js'
import { ESSAY } from '../src/lib/qbankEssay.js'
import { PRACTICE } from '../src/lib/qbankPractice.js'
import { ENGLISH } from '../src/lib/qbankEnglish.js'
import { MATH } from '../src/lib/qbankMath.js'

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
check('大题数据可加载', Array.isArray(ESSAY), 'essay=' + ESSAY.length)
check('练习数据可加载', Array.isArray(PRACTICE) && Array.isArray(ENGLISH) && Array.isArray(MATH), 'practice=' + PRACTICE.length + ' en=' + ENGLISH.length + ' math=' + MATH.length)

console.log(fails === 0 ? '\nALL_OK' : `\n${fails} 项失败`)
process.exit(fails ? 1 : 0)