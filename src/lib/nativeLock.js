// nativeLock.js —— 原生屏幕固定（仅 Capacitor Android 生效）
// 网页/浏览器里静默返回 false，专注锁退回"软锁"。
import { Capacitor, registerPlugin } from '@capacitor/core'

let ScreenLock = null

export function isNativeApp() {
  try { return Capacitor.isNativePlatform() } catch { return false }
}

export function hasNativeLockSupport() {
  return isNativeApp()
}

export async function enableNativeLock() {
  if (!isNativeApp()) return false
  try {
    if (!ScreenLock) ScreenLock = registerPlugin('ScreenLock')
    await ScreenLock.enable()
    return true
  } catch (e) {
    return false
  }
}

export async function disableNativeLock() {
  if (!isNativeApp()) return false
  try {
    if (!ScreenLock) ScreenLock = registerPlugin('ScreenLock')
    await ScreenLock.disable()
    return true
  } catch (e) {
    return false
  }
}
