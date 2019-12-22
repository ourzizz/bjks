// pages/orders/orders.js
// 待解决的问题：用户在点击退款确认后，进入到页面需要将wait_signed列表中被删除的对象去掉

var qcloud = require('../../vendor/wafer2-client-sdk/index')
var config = require('../../config')
var util = require('../../utils/util.js')
var sliderWidth = 96;

function findOrderById(list, order_id) {
    for (var i = 0; i < list.length; i++) {
        if (list[i].order.order_id === order_id) {
            return i;
        }
    }
    return -1;
}

Page({
    /**
     * 页面的初始数据
     */
    data: {
        //tabs: [['待支付', 0], ['待签收', 0],['退款', 0],['完结订单', 0]],
        tabs: [['待支付', 0], ['待签收', 0], ['退款', 0], ['完结订单', 0]],
        activeIndex: 0,
        sliderOffset: 0,
        sliderLeft: 0,
        wait_pay_order_list: [],
        wait_sign_order_list: [],//待签收后台给出pay为success,给出送货员的联系电话
        wait_comment_order_list: [],
        finished_order_list: [],
        refund_list: [],
        userinfo: {},
        logged: false,
        open_id: ''
    },

    init_tab(index) {
        let that = this
        wx.getSystemInfo({
            success: function (res) {
                that.setData({
                    /*横向条离左边的间距*/
                    sliderLeft: (res.windowWidth / that.data.tabs.length - sliderWidth) / 2,
                    /*横向条离左边的距离偏移量*/
                    sliderOffset: res.windowWidth / that.data.tabs.length * index
                });
            }
        });
    },
    /**
     *  
     */
    onLoad: function (options) {
        let that = this
        const session = qcloud.Session.get()
        if (session) {//session存在
            this.setData({
                userInfo: session.userinfo,
                open_id: session.userinfo.openId,
                logged: true
            })
        }
        this.init_tab(options.idx)
        this.init_list()
        this.setData({
            activeIndex: options.idx
        });
    },

    delete_order: function (event) {
        let idx = event.currentTarget.dataset.idx
        let that = this
        let order_id = this.data.wait_pay_order_list[idx].order.order_id
        wx.showModal({
            title: '提示',
            content: '确定删除订单',
            success(res) {
                if (res.confirm) {
                    qcloud.request({
                        url: `${config.service.host}/order/delete_order/` + order_id,
                        success(result) {
                            util.showSuccess('成功删除')
                            that.data.wait_pay_order_list.splice(idx, 1)
                            that.setData({
                                wait_pay_order_list: that.data.wait_pay_order_list
                            })
                        }
                    })
                } else if (res.cancel) {
                    return
                }
            }
        })
    },

    re_pay: function (event) {
        let that = this
        let idx = event.currentTarget.dataset.idx
        let order = this.data.wait_pay_order_list[idx].order
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
                that.data.wait_sign_order_list.push(that.data.wait_pay_order_list[idx])
                that.data.wait_pay_order_list.splice(idx, 1)
                that.setData({
                    wait_sign_order_list: that.data.wait_sign_order_list,
                    wait_pay_order_list: that.data.wait_pay_order_list
                })
            },
            fail: function (res) {
                return
            },
        })
    },

    //确认收货
    sign_order: function (event) {
        let idx = event.currentTarget.dataset.idx
        let order_id = this.data.wait_sign_order_list[idx].order.order_id
        let that = this
        wx.showModal({
            title: '提示',
            content: '确定签收订单吗',
            success(res) {
                if (res.confirm) {
                    qcloud.request({
                        url: `${config.service.host}/order/user_sign_order/` + that.data.open_id + '/' + order_id,
                        success(result) {
                            util.showSuccess('签收成功')
                            that.order_from_wait_2_finish(order_id)
                            that.setData({
                                wait_sign_order_list: that.data.wait_sign_order_list
                            })
                        }
                    })
                } else if (res.cancel) {
                    return
                }
            }
        })
    },


    request_model(weburl, callback) {
        let that = this
        qcloud.request({
            url: weburl,
            data: { open_id: that.data.userInfo.openId },
            method: 'POST',
            header: { 'content-type': 'application/x-www-form-urlencoded' },
            success(result) {
                callback(result)
            },
            fail(error) {
                util.showModel('请求失败', error);
                console.log('request fail', error);
            }
        })
    },
    //根据idx
    //idx 0 请求等待支付列表
    //idx 1 请求等待签收列表
    //idx 2 请求已完成订单列表
    init_list: function () {
        this.request_model(`${config.service.host}/order/get_wait_pay_order/`, result => {
            this.data.tabs[0][1] = result.data.length
            this.setData({
                tabs: this.data.tabs,
                wait_pay_order_list: result.data,
            })
        })
        this.request_model(`${config.service.host}/order/get_wait_sign_order_list/`, result => {
            this.data.tabs[1][1] = result.data.length
            this.setData({
                tabs: this.data.tabs,
                wait_sign_order_list: result.data
            })
        })
        this.request_model(`${config.service.host}/order/get_refund_list/`, result => {
            this.data.tabs[2][1] = result.data.length
            this.setData({
                tabs: this.data.tabs,
                refund_list: result.data
            })
        })
        this.request_model(`${config.service.host}/order/get_finished_order_list/`, result => {
            this.data.tabs[3][1] = result.data.length
            this.setData({
                tabs: this.data.tabs,
                finished_order_list: result.data
            })
        })
    },

    tabClick: function (e) {
        this.setData({
            sliderOffset: e.currentTarget.offsetLeft,
            activeIndex: e.currentTarget.id
        });
    },

    /*
     *跳转到支付成功页面，该页面包含有退款联系商家等操作
     * */
    detail: function (event) {
        let idx = event.currentTarget.dataset.idx
        wx.navigateTo({
            url: '../paysuccess/paysuccess?order_id=' + this.data.wait_sign_order_list[idx].order.order_id,
        })
    },

    onShow() {
        if (this.pageReady) {
            this.enter();
            this.init_list();
        }
    },

    //联系商家
    call_seller: function (event) {
        let that = this
        let idx = event.currentTarget.dataset.idx
        let order_id = this.data.finished_order_list[idx].order.order_id
        qcloud.request({
            url: `${config.service.host}/order/get_seller_telphone/` + order_id,
            success(result) {
                wx.makePhoneCall({
                    phoneNumber: result.data.telphone
                })
            },
            fail(error) {
                util.showModel('请求失败', error);
            }
        })
    },

    //买家取消退款
    //以下代码先保留，简化程序，用户一旦进入退款之后就只能等待商家退款
    //如果想要取消，只能重新购买
    //cancle_refund:function (event) {
    //let that = this
    //order_id = event.currentTarget.dataset.order_id
    //index = event.currentTarget.dataset.idx
    //wx.showModal({
    //title: '提示',
    //content: '确认取消退款后商家将继续送货！',
    //success (res) {
    //if (res.confirm) {
    //qcloud.request({
    //url: `${config.service.host}/seller/cancle_refund/` ,
    //data: {order_id:order_id,open_id:that.data.userInfo.openId},
    //method: 'POST',
    //header: { 'content-type':'application/x-www-form-urlencoded' },
    //success(result) {
    //if(result.data === 'SUCCESS'){
    //that.data.wait_refund_list.splice(index,1)
    //that.setData({
    //wait_refund_list
    //})
    //}
    //},
    //fail(error) {
    //util.showModel('请求失败', error);
    //console.log('request fail', error);
    //}
    //})
    //} else if (res.cancel) {
    //return 
    //}
    //}
    //})
    //}

    //将待收货的商品,压入完成订单，从待收货中删除
    order_from_wait_2_finish: function (order_id) {
        let index = findOrderById(this.data.wait_sign_order_list, order_id)
        let tmp = this.data.wait_sign_order_list[index]
        this.data.finished_order_list.push(tmp)
        this.data.wait_sign_order_list.splice(index, 1)
        this.data.tabs[1][1] = this.data.wait_sign_order_list.length
        this.data.tabs[3][1] = this.data.finished_order_list.length
        this.init_tab(3)
        this.setData({
            activeIndex: 3,
            tabs: this.data.tabs,
            wait_sign_order_list: this.data.wait_sign_order_list,
            finished_order_list: this.data.finished_order_list,
        })
    },

    //联系商家
    call_seller: function (event) {
        let order_id = event.currentTarget.dataset.order_id
        let that = this
        qcloud.request({
            url: `${config.service.host}/order/get_seller_telphone/` + order_id,
            success(result) {
                wx.makePhoneCall({
                    phoneNumber: result.data.telphone
                })
            },
            fail(error) {
                util.showModel('请求失败', error);
                console.log('request fail', error);
            }
        })
    },

    //用户关闭订单，不想再看见他
    user_shutdown_order:function (event){
        let order_id = event.currentTarget.dataset.order_id
        let idx = event.currentTarget.dataset.idx
        let that = this
        wx.showModal({ 
            title:'确认删除本订单吗',
            success:function(res){
                if(res.confirm){                
                    qcloud.request({
                        url: `${config.service.host}/order/shutdown_order/` + order_id,
                        success(result) {
                            that.data.finished_order_list.splice(idx,1)
                            that.data.tabs[3][1] = that.data.finished_order_list.length
                            that.setData({
                                finished_order_list:that.data.finished_order_list,
                                tabs: that.data.tabs
                            })
                        },
                        fail(error) {
                            util.showModel('请求失败', error);
                            console.log('request fail', error);
                        }
                    })
                }else{
                    //donothing
                }
            }
        })
    }
})
