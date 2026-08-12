const R = 'F:/Roaming/haolo_desktop/thread-groups/default/app/outputs/study-buddy/miniprogram/'
const q408 = require(R + 'data/questions_408.js')
const qPol = require(R + 'data/questions_politics.js')
const qEn = require(R + 'data/questions_english.js')
const qMath = require(R + 'data/questions_math.js')
const quiz = require(R + 'utils/quiz.js')
const et = require(R + 'data/examTypes.js')
console.log('quiz exports:', Object.keys(quiz))
const sums = [['408', q408], ['政治', qPol], ['英语', qEn], ['数学', qMath]]
let all = true
for (const [name, bank] of sums) {
  const qs = quiz.draw(bank, 5)
  const ok1 = quiz.grade(qs[0], qs[0].answer)
  const ok2 = quiz.grade(qs[0], qs[0].answer === 'A' ? 'B' : 'A')
  const pass = qs.length === 5 && ok1 === true && ok2 === false
  all = all && pass
  console.log(name, '抽5题:', qs.length, '判分:', ok1, ok2, pass ? 'OK' : 'FAIL')
}
console.log('examTypes:', et.DEFAULT_EXAM, 'subjects:', et.EXAM_TYPES.kaoyan.subjects.length)
console.log(all ? 'ALL OK' : 'HAS FAIL')
