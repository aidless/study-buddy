// 抽题与判分（复用 App 逻辑的简化版）
function shuffle(arr) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function draw(bank, count) {
  const choices = bank.list.filter((q) => q.type === 'choice')
  return shuffle(choices).slice(0, count || 10)
}

function grade(q, answer) {
  if (!answer) return false
  return String(answer).trim().toUpperCase() === String(q.answer || '').trim().toUpperCase()
}

module.exports = { shuffle, draw, grade }
