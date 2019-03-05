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
        express_info:{},
        reason:''

    },

    //获取订单的物流信息，物流公司，订单号，让客户复制到剪切板去官方查询
    get_express_info:function(){
        //订单号支付页面给过来
        let that = this
        qcloud.request({
            url: `${config.service.host}/order/get_express_info/` + that.data.order_id,
            success(result) {
                that.setData({
                    express_info:result.data
                })
            }
        })
    },

    onLoad: function (options) {//订单号支付页面给过来
        let that = this
        qcloud.request({
            url: `${config.service.host}/order/pay_success/` + options.order_id,
            success(result) {
                util.showSuccess('请求成功完成')
                that.setData({
                    total_fee:result.data.order.total_fee,
                    address:result.data.address,
                    goods_list:result.data.goods_list,
                    order_id:options.order_id
                })
                that.get_express_info()
            }
        })
    },

    go_order:function (idx){
        if(idx !== 2){
            idx = 1
        }
        console.log(idx) 
        const session = qcloud.Session.get()
        open_id = session.userinfo.openId
        wx.navigateTo({
            url: '../orders/orders?open_id=' + open_id + '&idx=' + idx,
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
        let that = this
        const session = qcloud.Session.get()
        let order_id = this.data.order_id
        if(this.data.reason !== ''){
            qcloud.request({
                url: `${config.service.host}/order/request_refund`,
                data: {
                    order_id: this.data.order_id,
                    open_id: session.userinfo.openId,
                    reason: this.data.reason
                },
                method: 'POST',
                header: {
                    'content-type': 'application/x-www-form-urlencoded'
                },
                success(result) {
                    if(result.data === true){
                        util.showModel('退款申请', '退款申请已经提交请耐心等待');
                        pages = getCurrentPages();
                        prevPage = pages[pages.length - 2];//直接调用上一个页面的setData()方法，把数据存到上一个页面中去
                        prevPage.remove_order_from_wait_sign(that.data.order_id)
                        //util.sleep(3000);
                        that.go_order(2);
                    }
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

    //联系商家
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
    },

    copy_express_id:function (e){
        console.log(e)
        wx.setClipboardData({
            data: e.currentTarget.dataset.text,
            success: function (res) {
                wx.getClipboardData({
                    success: function (res) {
                        wx.showToast({
                            title: '复制成功'
                        })
                    }
                })
            }
        })
    },

})
