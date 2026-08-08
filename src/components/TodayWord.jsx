import { useState, useEffect } from 'react'
import { getWords, setWord, todayStr } from '../lib/db'
import Icon from './Icon'

export default function TodayWord() {
  const [w, setW] = useState({ she: '', he: '' })
  const [text, setText] = useState('')
  const [saved, setSaved] = useState(false)

  const reload = async () => {
    const ww = await getWords(todayStr())
    setW(ww)
  }
  useEffect(() => { reload() }, [])

  const save = async () => {
    await setWord(todayStr(), 'she', text.trim())
    setText('')
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
    reload()
  }

  return (
    <div className="card">
      <h2><span className="dot" /> 今日一句话</h2>
      <div className="tiny" style={{ marginBottom: 8 }}>
        {w.he ? `他今天写了：` : `他还没写——你先写一句，他晚点会看到`}
      </div>
      {w.he && <div className="word-echo">{w.he.replace(/^[^:]*:/, '')}</div>}
      <textarea className="input area" placeholder="写一句今天的心情或想对他说的话（不催、不评，就陪着）" value={text} onChange={(e) => setText(e.target.value)} maxLength={60} />
      <div className="row between" style={{ marginTop: 8 }}>
        <span className="tiny">{text.length}/60</span>
        <button className="btn ghost" style={{ padding: '7px 14px', fontSize: 13 }} onClick={save}>{saved ? '已写好啦' : '写下来'}</button>
      </div>
    </div>
  )
}