Page({
  data: {
    region: ['贵州省', '毕节市', '七星关区'],
    //customItem: '全部'
  },
  bindRegionChange: function (e) {
    console.log('picker发送选择改变，携带值为', e.detail.value)
    this.setData({
      region: e.detail.value
    })
  }
})
