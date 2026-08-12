const db = require('../../utils/db')
Page({
  data: { name: '', role: 'student', err: '' },
  onLoad() {
    if (db.getUser()) wx.switchTab({ url: '/pages/today/today' })
  },
  setRole(e) { this.setData({ role: e.currentTarget.dataset.role, err: '' }) },
  onName(e) { this.setData({ name: e.detail.value, err: '' }) },
  enter() {
    const name = this.data.name.trim()
    if (!name) { this.setData({ err: '先起个名字' }); return }
    db.setUser({ id: 'u_' + Date.now(), name, role: this.data.role, coupleCode: 'LOCAL1' })
    wx.switchTab({ url: '/pages/today/today' })
  }
})
