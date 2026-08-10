// sentry.js —— 崩溃与错误监控（企业级）
// DSN 通过构建变量 VITE_SENTRY_DSN 注入；未配置（开发环境）时完全静默。
import * as Sentry from '@sentry/capacitor'

const dsn = (import.meta.env && import.meta.env.VITE_SENTRY_DSN) || ''

export function initSentry() {
  if (!dsn) return false
  try {
    Sentry.init({
      dsn,
      // 生产开启、开发降采样
      tracesSampleRate: import.meta.env.PROD ? 0.2 : 0,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 1.0,
      environment: import.meta.env.MODE || 'production',
      release: (import.meta.env.VITE_APP_VERSION) || 'dev'
    })
    return true
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('sentry init failed', e)
    return false
  }
}

export function captureError(err, ctx) {
  if (!dsn) return
  try { Sentry.captureException(err, ctx ? { extra: ctx } : undefined) } catch {}
}

export default Sentry
