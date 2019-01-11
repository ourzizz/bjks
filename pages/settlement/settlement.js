// pages/settlement/settlement.js 
var qcloud = require('../../vendor/wafer2-client-sdk/index') 
var config = require('../../config') 
var util = require('../../utils/util.js') 
 // o9pU65LTYEE8tVWQR_yClRc1466k 
Page({ 
  data: { 
      user_default_address: {}, 
      order_list:[],
      order_info:{}, 
      open_id:"",
      res:{} ,
  }, 

  onLoad: function (options) { 
    let that = this
    this.data.open_id = options.open_id
    this.get_user_defualt_address(options.open_id)
    wx.getStorage({
      key: 'settlement',
      success: function (res) {
        that.setData({
          order_list:res.data.goods_list,
          open_id:res.data.goods_list[0].open_id,
          cost:res.data.cost
        })
      }
    })
    wx.removeStorage({
      key: 'settlement',
      success(res) {
        console.log(res.data)
      }
    })
    this.get_user_defualt_address()
  }, 
    get_user_defualt_address:function (open_id)
    {//https://www.alemao.club/bjks/index.php?/user_address/get_user_default_address/o9pU65LTYEE8tVWQR_yClRc1466k
        let that = this
      qcloud.request({
          url: `${config.service.host}/weapp/user_address/get_user_default_address/` + open_id,
          success(result) {
              util.showSuccess('请求成功完成')
              console.log(result.data[0])
              that.setData({ user_default_address: result.data[0] })
          }
      })
    }
})