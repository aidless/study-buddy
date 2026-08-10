// push.js —— 推送设备注册（阶段四：厂商通道/FCM 就绪后自动生效）
// 无 google-services.json / 厂商通道配置时静默跳过，不影响主流程
import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'
import { supabase, USE_SUPABASE, loadProfile } from './db'

let done = false

export async function setupPush() {
  if (done) return
  done = true
  if (!Capacitor.isNativePlatform() || !USE_SUPABASE || !supabase) return
  try {
    let perm = await PushNotifications.checkPermissions()
    if (perm.receive !== 'granted') {
      perm = await PushNotifications.requestPermissions()
      if (perm.receive !== 'granted') return
    }
    await PushNotifications.register()
    PushNotifications.addListener('registration', async (token) => {
      try {
        const me = await loadProfile()
        if (!me) return
        await supabase.from('devices').upsert(
          { user_id: me.id, couple_id: me.coupleId, token: token.value, platform: 'android', updated_at: new Date().toISOString() },
          { onConflict: 'token' }
        )
      } catch {}
    })
    PushNotifications.addListener('registrationError', () => {})
  } catch {
    // 未配置 FCM/厂商通道：静默
  }
}
