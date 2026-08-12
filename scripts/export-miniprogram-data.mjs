// export-miniprogram-data.mjs —— 把 App 题库导出为微信小程序 CommonJS 数据文件
import { writeFileSync, mkdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const out = path.join(root, 'miniprogram', 'data')
mkdirSync(out, { recursive: true })

import { pathToFileURL } from 'node:url'
const lib = path.join(root, 'src', 'lib')
const { SEED_QUESTIONS, SEED_META } = await import(pathToFileURL(path.join(lib, 'qbankSeed.js')))
const { ESSAY } = await import(pathToFileURL(path.join(lib, 'qbankEssay.js')))
const { ENGLISH, ENGLISH_WRITING } = await import(pathToFileURL(path.join(lib, 'qbankEnglish.js')))
const { MATH, MATH_PROBLEMS } = await import(pathToFileURL(path.join(lib, 'qbankMath.js')))
const { PRACTICE } = await import(pathToFileURL(path.join(lib, 'qbankPractice.js')))
const { EXAM_TYPES, EXAM_ORDER, DEFAULT_EXAM } = await import(pathToFileURL(path.join(lib, 'examTypes.js')))

function write(name, obj) {
  const file = path.join(out, name)
  writeFileSync(file, '// 由 scripts/export-miniprogram-data.mjs 自动生成，请勿手改\nmodule.exports = ' + JSON.stringify(obj) + '\n')
  console.log(name, Math.round(statSize(file) / 1024) + 'KB')
}
function statSize(f) { try { return statSync(f).size } catch { return 0 } }

write('questions_408.js', { meta: SEED_META, list: SEED_QUESTIONS })
write('questions_essay.js', { list: ESSAY })
write('questions_english.js', { list: ENGLISH, writing: ENGLISH_WRITING })
write('questions_math.js', { list: MATH, problems: MATH_PROBLEMS })
write('questions_politics.js', { list: PRACTICE })
write('examTypes.js', { EXAM_TYPES, EXAM_ORDER, DEFAULT_EXAM })
console.log('导出完成')
