// pages/payfail/payfail.js
// get order_info 拿到订单所有信息，包括支付码
var qcloud = require('../../vendor/wafer2-client-sdk/index') 
var config = require('../../config') 
var util = require('../../utils/util.js') 
Page({

    /**
     * 页面的初始数据
     */
    data: {
        order_info:{},
        address:{},
        goods_list:[]
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        let that = this
        qcloud.request({
            url: `${config.service.host}/order/re_pay/` + options.order_id,
            success(result) {
                util.showSuccess('请求成功完成')
                that.setData({
                    order_info:result.data.order,
                    address:result.data.address,
                    goods_list:result.data.goods_list
                })
            }
        })
    },

    re_pay:function (){
        let order = this.data.order_info
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
