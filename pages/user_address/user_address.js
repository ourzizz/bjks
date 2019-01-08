var qcloud = require('../../vendor/wafer2-client-sdk/index')
var config = require('../../config')
var util = require('../../utils/util.js')
Page({
  data: {
    region: ['贵州省', '毕节市', '七星关区'],
    step:1,
    address_list:[],
  },
  onLoad:function(option) {//o9pU65LTYEE8tVWQR_yClRc1466k
    open_id = option.open_id
    let that = this
    qcloud.request({
      url: `${config.service.host}/user_address/get_user_all_address/` + open_id,
      success(result) {
        util.showSuccess('请求成功完成')
        that.setData({
          address_list: result.data
        })
      }
    })
  },
  bindRegionChange: function (e) {
    console.log('picker发送选择改变，携带值为', e.detail.value)
    this.setData({
      region: e.detail.value
    })
  },
  next_step:function(){
    this.setData({
      step:2
    })
  },
  pre_step: function () {
    this.setData({
      step: 1
    })
  }

})
