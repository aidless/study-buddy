// qbankRichText.jsx —— 富文本题干渲染（配图支持）
export function RichText({ q, children }) {
  return <div>{children || q?.stem}</div>
}
import { FIGURES } from '../lib/qbankFigures.js'

export function Fig({ id, style }) {
  const svg = FIGURES[id]
  if (!svg) return null
  return <div className="qfig" style={style} dangerouslySetInnerHTML={{ __html: svg }} />
}
export async function loadFigs() { return FIGURES }
export const figsLoaded = true