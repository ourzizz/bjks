// pages/orders/orders.js
var qcloud = require('../../vendor/wafer2-client-sdk/index')
var config = require('../../config')
var util = require('../../utils/util.js')
var sliderWidth = 96; 
Page({
  /**
   * 页面的初始数据
   */
  data: {
    tabs: [['待支付', 22], ['待签收', 75], ['所有订单', 85]],
    activeIndex: 1,
    sliderOffset: 0,
    sliderLeft: 0,
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
      wx.getSystemInfo({
        success: function (res) {
          that.setData({
            sliderLeft: (res.windowWidth / that.data.tabs.length - sliderWidth) / 2,
            sliderOffset: res.windowWidth / that.data.tabs.length * that.data.activeIndex
          });
        }
      });
        qcloud.request({
            //url: `${config.service.host}/order/re_pay/` + options.order_id,
            url: `${config.service.host}/order/get_wait_pay_order/` + options.open_id,
            success(result) {
                util.showSuccess('请求成功完成')
                that.setData({
                    //tabs[0][1]:result.data,
                    wait_pay_order_list:result.data,
                })
            }
        })
    },

  tabClick: function (e) {
    this.setData({
      sliderOffset: e.currentTarget.offsetLeft,
      activeIndex: e.currentTarget.id
    });
  },

    re_pay:function (event){
        let idx = event.currentTarget.dataset.idx
        let order = this.data.wait_pay_order_list[idx]
        console.log('test') 
        wx.requestPayment({                
            'timeStamp': order.timeStamp,
            'nonceStr': order.nonceStr,
            'package': order.package,
            'signType': 'MD5',
            'paySign': order.paySign,
            success: function (res) {
                wx.showToast({
                    title: '支付成功',
                    icon: 'success',
                    duration: 3000 
                })
                wx.redirectTo({ 
                    url: '../paysuccess/paysuccess?order_id=' + order_id,
                })
            }, 
            fail: function (res) {
                console.log('付款失败');
                wx.showModal({
                    success:function(){
                        wx.redirectTo({
                            url: '../payfail/payfail?order_id=' + order_id,
                        })
                    }
                })
                return
            },
        })
    }
})
