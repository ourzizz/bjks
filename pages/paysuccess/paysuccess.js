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
        order_id:'',
        address:{},
        order_info:{},
        step:0,
        refund_reason: ['不想要了', '地址有误', '缺货', '发货时间过长'],
        reason:''

    },

    onLoad: function (options) {//订单号支付页面给过来
        let that = this
        qcloud.request({
            //url: `${config.service.host}/order/pay_success/` + "1550053898b3mQ6",//debug
            url: `${config.service.host}/order/pay_success/` + options.order_id,
            success(result) {
                util.showSuccess('请求成功完成')
                that.setData({
                    total_fee:result.data.order.total_fee,
                    address:result.data.address,
                    goods_list:result.data.goods_list,
                    order_id:options.order_id
                })
            }
        })
    },

    go_order:function (){
        const session = qcloud.Session.get()
        open_id = session.userinfo.openId
        wx.navigateTo({
            url: '../orders/orders?open_id=' + open_id + '&idx=1',
        })
    },

    go_home:function (){
        wx.switchTab({
            url: '../bookstore/bookstore',
        })
    },
    cancel_refund:function (){
        this.setData({step:0})
    },
    go_refund_page:function (event){
        this.setData({step:1})
        //if(this.data.order_id !== null && this.data.order_id !== "undefine" && this.data.order_id !== ""){
        //wx.navigateTo({
        //url: '../refund/refund?order_id=' + this.data.order_id,
        //})
        //}
    },

    bindPickerChange(e) {
        this.setData({
            index: e.detail.value,
            reason:this.data.refund_reason[e.detail.value]
        })
    },

    confirm_refund: function () {
        const session = qcloud.Session.get()
        if(this.data.reason !== ''){
            qcloud.request({
                url: `${config.service.host}/order/request_refund`,
                data: {
                    order_id: this.data.reason.order_id,
                    open_id: session.userinfo.openId,
                    reason: this.data.reason
                },
                method: 'POST',
                header: {
                    'content-type': 'application/x-www-form-urlencoded'
                },
                success(result) {
                    util.showModel('退款申请', '退款申请已经提交请耐心等待');
                    that.setData({step:0})
                },
                fail(error) {
                    util.showModel('请求失败', error);
                    console.log('request fail', error);
                }
            })
        }else{
            util.showModel('信息不全', '请选择退款原因');
        }
    },

    call_seller:function (){
        let that = this
        qcloud.request({
            url: `${config.service.host}/order/get_seller_telphone/` + that.data.order_id,
            success(result) {
                wx.makePhoneCall({
                    phoneNumber: result.data.telphone //仅为示例，并非真实的电话号码
                })
            },
            fail(error) {
                util.showModel('请求失败', error);
                console.log('request fail', error);
            }
        })
    }

})
