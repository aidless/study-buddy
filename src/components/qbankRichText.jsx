// qbankRichText.jsx —— 富文本题干渲染（配图支持）
export function RichText({ q, children }) {
  return <div>{children || q?.stem}</div>
}
export async function loadFigs() { return {} }
export const figsLoaded = false