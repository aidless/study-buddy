// 本地存储封装（小程序版）
function get(k, def) {
  try { const v = wx.getStorageSync(k); return v === '' || v === undefined ? def : v } catch (e) { return def }
}
function set(k, v) { try { wx.setStorageSync(k, v) } catch (e) {} }
module.exports = { get, set }
