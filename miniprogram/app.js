// 考研督学小程序
App({
  globalData: {
    user: null
  },
  onLaunch() {
    const user = wx.getStorageSync('dx_user') || null
    this.globalData.user = user
  }
})
