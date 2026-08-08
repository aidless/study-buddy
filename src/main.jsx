import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

const root = createRoot(document.getElementById('root'))
root.render(<React.StrictMode><App /></React.StrictMode>)

// Service Worker 注册（PWA 离线）
if ('serviceWorker' in navigator && (location.protocol === 'https:' || ['127.0.0.1', 'localhost'].includes(location.hostname))) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {})
  })
}