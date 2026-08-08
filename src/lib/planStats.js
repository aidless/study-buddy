// planStats.js 鈥斺€?澶囪€冪粺璁＄函鍑芥暟锛堟棤澶栭儴渚濊禆锛屽彲鍗曟祴锛?// 2026-08-02 浠?plan.js 鎶藉嚭锛歸rongBookStats锛堥敊棰樿仛鍚堬級+ radarData锛堥浄杈炬暟鎹級
import { EXAM_TYPES, DEFAULT_EXAM } from './examTypes.js'

/* ---------------- 閿欓鏈細鎸夌鐩?鐭ヨ瘑鐐硅仛鍚堥敊棰樼粺璁?---------------- */
// 杩斿洖 [{ subject, topic, wrongQ, totalQ, acc, wrongByReason }]锛屽彧鑱氬悎鏈?topic 鐨勮褰曘€?// wrongReason 鍒嗙被锛?know'锛堢煡璇嗙偣涓嶄細锛? 'careless'锛堢矖蹇冿級/ 'time'锛堟椂闂翠笉澶燂級
export function wrongBookStats(tests) {
  const map = {}
  for (const t of tests) {
    if (!t.topic) continue
    const key = `${t.subject}::${t.topic}`
    if (!map[key]) map[key] = { subject: t.subject, topic: t.topic, totalQ: 0, wrongQ: 0, wrongByReason: {} }
    // 璇氬疄杈圭晫锛氬彧缁熻鐪熼閮ㄥ垎锛堢粌涔犻鐨勯敊棰樹笉杩涜杽寮卞垎鏋愶級
    const realTotal = Math.max(0, (t.total || 0) - (t.practice || 0))
    const mixedWrong = (t.total || 0) - (t.correct || 0)
    const practiceWrong = Math.max(0, (t.practice || 0) - (t.practiceCorrect || 0))
    const realWrong = Math.max(0, mixedWrong - practiceWrong)
    map[key].totalQ += realTotal
    map[key].wrongQ += realWrong
    if (t.wrongReason && realWrong > 0) {
      map[key].wrongByReason[t.wrongReason] = (map[key].wrongByReason[t.wrongReason] || 0) + realWrong
    }
  }
  return Object.values(map)
    .filter((e) => e.totalQ > 0) // 鍙繚鐣欐湁鐪熼淇″彿鐨勭煡璇嗙偣锛堢函缁冧範鐨勭煡璇嗙偣涓嶈繘钖勫急鍒嗘瀽锛?    .map((e) => ({ ...e, acc: 1 - e.wrongQ / e.totalQ }))
    .sort((a, b) => b.wrongQ - a.wrongQ)
}

/* ---------------- 鐭ヨ瘑闆疯揪鏁版嵁锛氬悇绉戞纭巼 ---------------- */
// 杩斿洖 [{ key, label, acc (0-1|null), weight }]锛涙寜鑰冭瘯绫诲瀷绉戠洰妯℃澘瀵归綈銆?export function radarData(tests, examType) {
  const type = EXAM_TYPES[examType] || EXAM_TYPES[DEFAULT_EXAM]
  const bySubject = {}
  for (const t of tests) {
    if (!bySubject[t.subject]) bySubject[t.subject] = []
    bySubject[t.subject].push(t)
  }
  return (type.subjects || []).map((s) => {
    // 408 缁熻€冿細鎶婂洓闂ㄥ瓙绉戠洰锛堟暟鎹粨鏋?璁＄粍/OS/璁＄綉锛夊悎骞跺埌 cs408 杞达紱鍏跺畠绉戠洿鎺ョ敤 label
    const names = (type.merge && type.merge[s.key]) || [s.label]
    const list = names.flatMap((nm) => bySubject[nm] || [])
    // 璇氬疄杈圭晫锛氬彧缁熻鐪熼閮ㄥ垎锛屾ā鎷熺粌涔犱笉璁″叆闆疯揪锛堢粌涔犳垚缁╀笉鍙嶆槧鐪熷疄姘村钩锛?    const totQ = list.reduce((a, b) => a + Math.max(0, (b.total || 0) - (b.practice || 0)), 0)
    const corQ = list.reduce((a, b) => a + Math.max(0, (b.correct || 0) - (b.practiceCorrect || 0)), 0)
    const n = list.filter((b) => Math.max(0, (b.total || 0) - (b.practice || 0)) > 0).length
    return { key: s.key, label: s.label, acc: totQ > 0 ? corQ / totQ : null, weight: s.weight || 1, n }
  })
}

/* ---------------- 瀛︿範鍛ㄦ姤锛氭湰鍛?vs 涓婂懆瀵规瘮锛?026-08-02 A-2锛?---------------- */
// 鍛ㄨ捣濮?= 鍛ㄤ竴 0 鐐广€傚姣旂淮搴︼細涓撴敞绉掓暟 / 鐣寗鏁?/ 鑷祴姝ｇ‘鐜?/ 鎵撳崱澶╂暟銆?// 绾嚱鏁帮紙鏃?DOM/瀛樺偍渚濊禆锛夛紝杈撳叆鍚勬暟鎹暟缁勶紝杩斿洖瀵规瘮瀵硅薄锛涘叏閮ㄦ鍚戞帾杈炵敱 UI 灞傛帶鍒躲€?export function weeklyCompare({ focus = [], selftests = [], checkins = [] }) {
  const now = new Date()
  const day = (now.getDay() + 6) % 7 // 鍛ㄤ竴 = 0
  const monday = new Date(now)
  monday.setDate(now.getDate() - day)
  monday.setHours(0, 0, 0, 0)
  const lastMon = new Date(monday)
  lastMon.setDate(monday.getDate() - 7)

  const inRange = (iso, from, to) => {
    if (!iso) return false
    const t = new Date(iso)
    // 闂尯闂翠笂鐣岋細鍚屾璋冪敤鏃?鐜板湪"鍙兘绮剧‘鍒板悓涓€姣锛宼 < to 浼氳鎺掗櫎杈圭晫
    return !isNaN(t) && t >= from && t <= to
  }
  const sumFocus = (from, to) =>
    focus.filter((f) => inRange(f.startedAt || f.started_at, from, to))
      .reduce((a, b) => a + (b.durationSec || b.duration_sec || 0), 0)
  const countPomo = (from, to) =>
    focus.filter((f) => inRange(f.startedAt || f.started_at, from, to)).length
  const accOf = (from, to) => {
    const ts = selftests.filter((t) => inRange(t.at, from, to))
    // 璇氬疄杈圭晫锛氬懆鎶ユ纭巼鍙粺璁＄湡棰橀儴鍒?    const tot = ts.reduce((a, b) => a + Math.max(0, (b.total || 0) - (b.practice || 0)), 0)
    const cor = ts.reduce((a, b) => a + Math.max(0, (b.correct || 0) - (b.practiceCorrect || 0)), 0)
    return tot ? cor / tot : null
  }
  const checkinCount = (from, to) =>
    checkins.filter((c) => {
      const d = (c.date || '').slice(0, 10)
      if (!d) return false
      const t = new Date(d + 'T00:00:00')
      return !isNaN(t) && t >= from && t <= to
    }).length

  return {
    focusThis: sumFocus(monday, now),
    focusLast: sumFocus(lastMon, monday),
    pomoThis: countPomo(monday, now),
    pomoLast: countPomo(lastMon, monday),
    accThis: accOf(monday, now),
    accLast: accOf(lastMon, monday),
    checkinThis: checkinCount(monday, now),
    checkinLast: checkinCount(lastMon, monday)
  }
}

/* ---------------- 缁熻鏍稿績锛氳繛缁ぉ鏁?鐑姏鍥?鍛ㄦ煴鍥撅紙2026-08-02 浠?stats.js 鎶界函鍑芥暟锛?---------------- */
const fmtDate = (d) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}
const dayOf = (iso) => fmtDate(new Date(iso))
const todayStr = (d) => fmtDate(d instanceof Date && !isNaN(d) ? d : new Date())

// 杩炵画澶╂暟纭笂闄愶細鏇惧洜鏃ユ湡鎹㈢畻閿欒瀵艰嚧鏃犻檺鍥炴函鍗℃ WebView锛坱odayStr 鍚炲叆鍙傜殑鏁欒锛夛紝10 骞磋冻澶熶换浣曠湡瀹炰娇鐢ㄣ€?// revives锛堝娲诲崱鏃ユ湡鏁扮粍锛屽垱鏂扳憽锛夛細鏂崱閭ｅぉ鑻ユ湁澶嶆椿鍗″垯瑙嗕负杩炵画锛堜粬鏁戜簡鎴戯級
export function computeStatsCore({ tasks = [], focus = [], checkins = [], revives = [] }) {
  const focusByDay = {}
  for (const f of focus) {
    const d = dayOf(f.startedAt || f.started_at || new Date().toISOString())
    focusByDay[d] = (focusByDay[d] || 0) + (f.durationSec || f.duration_sec || 0)
  }