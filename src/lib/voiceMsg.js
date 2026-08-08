// voiceMsg.js —— 语音任务检测（大声说话）
export function voiceSample(analyser, minDurMs = 800, threshold = 0.5) {
  return new Promise((resolve) => {
    const data = new Uint8Array(analyser.frequencyBinCount)
    let loudStart = null
    let loudMs = 0
    let stopTimer = null
    const tick = () => {
      analyser.getByteFrequencyData(data)
      const avg = data.reduce((a, b) => a + b, 0) / data.length / 255
      if (avg >= threshold) {
        if (loudStart == null) loudStart = performance.now()
        loudMs = performance.now() - loudStart
        if (loudMs >= minDurMs) {
          cleanup()
          resolve(true)
          return
        }
        if (stopTimer) { clearTimeout(stopTimer); stopTimer = null }
      } else if (loudStart != null) {
        if (!stopTimer) {
          stopTimer = setTimeout(() => { cleanup(); resolve(false) }, 400)
        }
      }
      raf = requestAnimationFrame(tick)
    }
    const cleanup = () => {
      if (raf) cancelAnimationFrame(raf)
      if (stopTimer) clearTimeout(stopTimer)
    }
    let raf = requestAnimationFrame(tick)
  })
}