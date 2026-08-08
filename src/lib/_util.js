// 閫氱敤宸ュ叿 + 鏈湴瀛樺偍鍖呰 + Supabase 瀹㈡埛绔€?// 琚?auth / tasks / plan / stats 鍚勬ā鍧楀叡浜紱db.js 浠呭仛鍐嶅鍑洪棬闈€?import { supabase, USE_SUPABASE } from './supabase.js'

export { supabase, USE_SUPABASE }

export const uid = () =>
  (crypto.randomUUID ? crypto.randomUUID() : 'id-' + Math.random().toString(36).slice(2) + Date.now())

export function genCode() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}

function fmt(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
// 浼?Date 灏辨牸寮忓寲閭ｄ竴澶╋紝涓嶄紶鎵嶆槸浠婂ぉ銆?// 銆愯俯鍧戣褰曘€戣繖閲屽師鏈啓姝?fmt(new Date())銆侀潤榛樺悶鎺夊叆鍙傦紝瀵艰嚧 stats.js 閲?// 鎸夊ぉ鍥炴函鐨?todayStr(cur) 姘歌繙鎷垮埌"浠婂ぉ"锛氳繛缁ぉ鏁扮殑 while 寰幆鍥犳姘镐笉閫€鍑猴紝
// 鍙褰撳ぉ鎵撹繃鍗★紝鐐瑰紑"杩涘害"灏变細鎶?WebView 涓荤嚎绋?100% 鍗犳弧銆佹暣涓〉闈㈠亣姝汇€?// 鍙傛暟蹇呴』鏄惧紡鍒ょ被鍨嬧€斺€斾紶瀛楃涓茶繘鏉ュ畞鍙綋"浠婂ぉ"锛屼篃涓嶈兘璁?fmt 閲岀殑 getFullYear 宕╂帀銆?export const todayStr = (d) => fmt(d instanceof Date && !isNaN(d) ? d : new Date())

export function daysUntil(dateStr) {
  if (!dateStr) return null
  const t = new Date(dateStr + 'T00:00:00')
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.round((t - now) / 86400000)
}

export function fmtDur(sec) {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  if (h > 0) return `${h}灏忔椂${m}鍒哷
  if (m > 0) return `${m}鍒哷
  return `${Math.max(0, Math.round(sec))}绉抈
}

// 渚?computeStats 浣跨敤锛堟寜 ISO 鍙栨棩鏈熼儴鍒嗭級
export const dayOf = (iso) => fmt(new Date(iso))

/* ---------------- 鏈湴瀛樺偍锛坙ocal 妯″紡锛?---------------- */
export const LS = {
  get(k, def) {
    try {
      const v = localStorage.getItem(k)
      return v ? JSON.parse(v) : def
    } catch {
      return def
    }
  },
  set(k, v) {
    localStorage.setItem(k, JSON.stringify(v))
  }
}