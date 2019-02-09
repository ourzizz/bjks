// pages/paysuccess/paysuccess.js
var qcloud = require('../../vendor/wafer2-client-sdk/index') 
var config = require('../../config') 
var util = require('../../utils/util.js') 
Page({

  /**
   * 页面的初始数据
   */
  data: {
    total_fee:0,
    address:{}
  },

  onLoad: function (options) {//订单号支付页面给过来
    let that = this
      qcloud.request({
          url: `${config.service.host}/order/pay_success/` + options.order_id,
          //url: `${config.service.host}/order/pay_success/` + '1549069451iMHha',
          success(result) {
              util.showSuccess('请求成功完成')
              that.setData({
                  total_fee:result.data.total_fee,
                  address:result.data.address
              })
          }
      })
  },

    go_order:function (){
        this.bindGetUserInfo()
        const session = qcloud.Session.get()
        open_id = session.userinfo.openId
        wx.navigateTo({
            url: '../orders/orders?open_id=' + open_id + '&idx=1',
        })
    },
    go_home:function (){
        console.log('gohome') 
    },
    /**
     * 生命周期函数--监听页面初次渲染完成
     */
  })
