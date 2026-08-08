// wrongItemsHybrid.js —— 错题档案双模（云端优先 / 本地兜底）
import { USE_SUPABASE, LS, uid } from './_util.js'
import { putWrongItemCloud, listWrongItemsCloud, removeWrongItemCloud, setWrongMasteredCloud, redoWrongItemCloud } from './wrongItemsCloud.js'
import { loadProfile } from './auth.js'

const KEY = 'dx_wrong_items'

function localList() {
  return LS.get(KEY, [])
}
function localSave(arr) {
  LS.set(KEY, arr)
}

export async function listWrongItems() {
  if (USE_SUPABASE) {
    try { return await listWrongItemsCloud() } catch { /* fallback local */ }
  }
  return localList()
}
export async function putWrongItem(item) {
  if (USE_SUPABASE) {
    try { return await putWrongItemCloud(item) } catch {}
  }
  const all = localList()
  const id = item.id || uid()
  const exists = all.find((x) => x.id === id)
  const row = { ...item, id }
  if (exists) Object.assign(exists, row)
  else all.push(row)
  localSave(all)
  return row
}
export async function removeWrongItem(id) {
  if (USE_SUPABASE) {
    try { await removeWrongItemCloud(id); return } catch {}
  }
  localSave(localList().filter((x) => x.id !== id))
}
export async function setWrongMastered(id, val) {
  if (USE_SUPABASE) {
    try { await setWrongMasteredCloud(id, val); return } catch {}
  }
  localSave(localList().map((x) => (x.id === id ? { ...x, mastered: val } : x)))
}
export async function redoWrongItem(id) {
  if (USE_SUPABASE) {
    try { await redoWrongItemCloud(id); return } catch {}
  }
  localSave(localList().map((x) => (x.id === id ? { ...x, redoCount: (x.redoCount || 0) + 1, lastRedoAt: new Date().toISOString(), mastered: false } : x)))
}