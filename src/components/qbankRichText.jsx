// qbankRichText.jsx —— 富文本题干渲染（配图支持）
export function RichText({ q, children }) {
  return <div>{children || q?.stem}</div>
}
import { FIGURES } from '../lib/qbankFigures.js'

const LETTERS = ['A', 'B', 'C', 'D']

export function Fig({ id, style }) {
  const fig = FIGURES[id]
  if (!fig) return null
  // 新版：slices 为 A/B/C/D 四等分小图；旧版兼容 combined 单图
  if (fig.slices && fig.slices.length === 4) {
    return (
      <div style={{ marginTop: 8, ...style }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {fig.slices.map((s, i) => (
            <div key={i}>
              <div className="tiny" style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: 4 }}>选项 {LETTERS[i]}</div>
              <div className="qfig" dangerouslySetInnerHTML={{ __html: s }} />
            </div>
          ))}
        </div>
      </div>
    )
  }
  const svg = fig.combined || fig
  return <div className="qfig" style={style} dangerouslySetInnerHTML={{ __html: svg }} />
}
export async function loadFigs() { return FIGURES }
export const figsLoaded = true