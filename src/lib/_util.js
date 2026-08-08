// 通用工具 + 本地存储包装 + Supabase 客户端。
import { supabase, USE_SUPABASE } from './supabase.js'

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

export const todayStr = (d) => fmt(d instanceof Date && !isNaN(d) ? d : new Date())

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
  if (h > 0) return `${h}小时${m}分`
  if (m > 0) return `${m}分`
  return `${Math.max(0, Math.round(sec))}秒`
}

export const dayOf = (iso) => fmt(new Date(iso))

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