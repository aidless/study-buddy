const db = require('../../utils/db')
const { todayStr } = require('../../utils/util')
Page({
  data: { user: null, date: '', checked: false, word: '', wordSaved: false, stats: null, cd: 132 },
  onShow() {
    const user = db.getUser()
    if (!user) { wx.reLaunch({ url: '/pages/login/login' }); return }
    this.refresh()
  },
  refresh() {
    this.setData({
      user: db.getUser(), date: todayStr(), checked: !!db.getCheckin(),
      word: (db.getWord() || {}).she || '', stats: db.getStats()
    })
  },
  doCheck() { db.toggleCheckin(); this.refresh() },
  onWord(e) { this.setData({ word: e.detail.value }) },
  saveWord() {
    db.setWord(this.data.word)
    this.setData({ wordSaved: true })
    setTimeout(() => this.setData({ wordSaved: false }), 1200)
  }
})
