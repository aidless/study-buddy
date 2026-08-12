const db = require('../../utils/db')
Page({
  data: { user: null, stats: null, tests: [] },
  onShow() {
    const user = db.getUser()
    if (!user) { wx.reLaunch({ url: '/pages/login/login' }); return }
    this.setData({ user, stats: db.getStats(), tests: db.listSelfTests().slice(0, 20) })
  },
  logout() {
    wx.showModal({ title: '退出登录', content: '本地数据会保留，可重新进入', success: (r) => {
      if (r.confirm) { db.clearUser(); wx.reLaunch({ url: '/pages/login/login' }) }
    }})
  },
  clearData() {
    wx.showModal({ title: '清除本地数据', content: '将删除本机打卡与自测记录（不可恢复）', success: (r) => {
      if (r.confirm) {
        wx.removeStorageSync('dx_checkins'); wx.removeStorageSync('dx_selftests')
        this.onShow()
      }
    }})
  }
})
