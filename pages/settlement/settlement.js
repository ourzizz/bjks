// pages/settlement/settlement.js 
var qcloud = require('../../vendor/wafer2-client-sdk/index') 
var config = require('../../config') 
var util = require('../../utils/util.js') 
// o9pU65LTYEE8tVWQR_yClRc1466k 
Page({ 
    data: { 
        user_default_address: {}, 
        goods_list:[],
        order_info:{}, 
        open_id:"",
        res:{} ,
        cost:0
    }, 

    onLoad: function (options) { 
        let that = this
        this.data.open_id = options.open_id
        this.get_user_defualt_address(options.open_id)
        wx.getStorage({
            key: 'settlement',
            success: function (res) {
                that.setData({
                    goods_list:res.data.goods_list,
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
    },

    g_order_info:function (){
        order_info = {}
        order_info.open_id = this.data.open_id
        order_info.address_id = this.data.user_default_address.address_id
        order_info.goods_list = []
        order_info.total_fee = 1
        goods_list = this.data.goods_list
        for(var i=0;i<goods_list.length;i++) {
            order_info.goods_list[i] = {'goods_id':goods_list[i].goods_id,'count':goods_list[i].count}
        }
        return order_info;
    },

    pay: function (out_trade_no, true_money) {    //out_trade_no 后台统一下单接口需要用
        // 请求服务器登录地址，获得会话信息
        wx.request({
            url: 'https://www.alemao.club/bjks/index.php?/order/pay',
            data: {order_info: JSON.stringify(this.g_order_info())},
            method: 'POST',
            header: { 
                'content-type':'application/x-www-form-urlencoded'
            },
            success(res) {
                wx.requestPayment({                //成功之后，调用小程序微信支付
                    'timeStamp': res.data.timeStamp,
                    'nonceStr': res.data.nonceStr,
                    'package': res.data.package,
                    'signType': 'MD5',
                    'paySign': res.data.paySign,
                    success: function (res) {
                        console.log(res)
                        wx.showToast({
                            title: '支付成功',
                            icon: 'success',
                            duration: 3000
                        })
                    }, 
                    fail: function (res) {
                        console.log('付款失败');
                        wx.showModal({
                            title: '提醒',
                            content: '付款失败,如要出题请重新编辑题目',
                            showCancel: false,
                            success:function(){
                                wx.redirectTo({
                                    url: '/pa*******ndex',
                                })
                            }
                        })
                        return
                    },
                })
            },
            fail(err) {
            }
        });
    },
    // pay:function (out_trade_no, true_money){    //out_trade_no 后台统一下单接口需要用
    //     var that = this
    //     wx.hideToast()                   //隐藏toast
    //     wx.request({
    //         method: 'POST',
    //         data: {
    //             openid: '************',    //调用人的openid
    //             out_trade_no: out_trade_no,
    //             body: '答题奖金',  
    //             norl: 'https://www.q**************.php',//后台接口自动修改订单状态
    //             te: true_money     //支付金额
    //         },
    //         url: 'https://b***************gn.php',        //服务器接口（微信统一下单接口）
    //         header: {
    //             'Content-Type': 'application/x-www-form-urlencoded'
    //         },
    //         success: function (res) {
    //             console.log(res.data)
    //             console.log('调起支付')
    //             wx.requestPayment({                //成功之后，调用小程序微信支付
    //                 'timeStamp': res.data.timeStamp,
    //                 'nonceStr': res.data.nonceStr,
    //                 'package': res.data.package,
    //                 'signType': 'MD5',
    //                 'paySign': res.data.paySign,
    //                 success: function (res) {
    //                     console.log(res)
    //                     wx.showToast({
    //                         title: '支付成功',
    //                         icon: 'success',
    //                         duration: 3000
    //                     })
    //                 }, 
    //                 fail: function (res) {
    //                     console.log('付款失败');
    //                     wx.showModal({
    //                         title: '提醒',
    //                         content: '付款失败,如要出题请重新编辑题目',
    //                         showCancel: false,
    //                         success:function(){
    //                             wx.redirectTo({
    //                                 url: '/pa*******ndex',
    //                             })
    //                         }
    //                     })
    //                     return
    //                 },
    //             })
    //         },
    //         fail: function (res) {
    //             console.log(res.data)
    //         }
    //     })
    // }
})
