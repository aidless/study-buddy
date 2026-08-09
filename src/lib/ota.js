// ota.js —— Capgo 热更新（仅 Android APK 生效；网页版静默跳过）
// 打开 App 时标记当前包可用 + 后台检查新版本，应用后无需重装 APK。
import { Capacitor } from '@capacitor/core'
import { CapacitorUpdater } from '@capgo/capacitor-updater'

let done = false

export async function setupOta() {
  if (done) return
  done = true
  if (!Capacitor.isNativePlatform()) return
  try {
    // 先标记当前版本已正常启动，避免被 Capgo 当作失败回滚
    await CapacitorUpdater.notifyAppReady()
  } catch {}
  try {
    // 检查并应用新版本（有更新时静默下载，下次启动生效）
    await CapacitorUpdater.autoUpdate()
  } catch {}
}
