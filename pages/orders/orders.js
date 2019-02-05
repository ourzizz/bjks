// pages/orders/orders.js
var qcloud = require('../../vendor/wafer2-client-sdk/index')
var config = require('../../config')
var util = require('../../utils/util.js')
Page({
  /**
   * 页面的初始数据
   */
  data: {
      nav:['待支付','待收货','待评价','全部订单'],
      wait_pay_order_list:[],
      wait_sign_order_list:[],
      wait_comment_order_list:[],
      finished_order:[]
  },
    /**
     *  
     */
    onLoad: function (options) {
        let that = this
        qcloud.request({
            //url: `${config.service.host}/order/re_pay/` + options.order_id,
            url: `${config.service.host}/order/get_wait_pay_order/` + options.open_id,
            success(result) {
                util.showSuccess('请求成功完成')
                that.setData({
                    wait_pay_order_list:result.data,
                })
            }
        })
    },

})
