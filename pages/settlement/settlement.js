// pages/settlement/settlement.js 
// debug:支付不管失败与否，购物车页面都要进行更新,但是没有起作用,openid设置有误所以出错
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
        order_info.total_fee = 0.1
        goods_list = this.data.goods_list
        for(var i=0;i<goods_list.length;i++) {
            order_info.goods_list[i] = {'goods_id':goods_list[i].goods_id,'count':goods_list[i].count}
        }
        return order_info;
    },

    modify_father_page_goodslist: function () {
        pages = getCurrentPages();
        currPage = pages[pages.length - 1]; //当前页面
        prevPage = pages[pages.length - 2];//上一个页面//直接调用上一个页面的setData()方法，把数据存到上一个页面中去
        prevPage.onLoad()//父页面刷新
    },

    /*拉起支付需要的参数实例
     *appId : "wxfa21ea4bdaef03e9" 
     *nonceStr : "qrgtif83m9658zl1nbroe545qbqr5k43"
     *order_id : "1549254920lryMm"
     *package : "prepay_id=wx041235207234486943dc7ca33362991804"
     *paySign : "F0A5C7B4AAE310FA19CDCCDB468D939C"
     *signType : "MD5"
     *timeStamp : "1549254920"
     *
     *
     * */
    pay: function (out_trade_no, true_money) {    
        let that = this
        wx.request({
            // 请求服务器登录地址，获得会话信息
            url: 'https://www.alemao.club/bjks/index.php?/order/pay',
            data: {order_info: JSON.stringify(this.g_order_info())},
            method: 'POST',
            header: { 'content-type':'application/x-www-form-urlencoded' },
            //成功之后，调用小程序微信支付
            success(res) {
                order_id = res.data.order_id
                wx.requestPayment({                
                    'timeStamp': res.data.timeStamp,
                    'nonceStr': res.data.nonceStr,
                    'package': res.data.package,
                    'signType': 'MD5',
                    'paySign': res.data.paySign,
                    success: function (res) {
                        wx.showToast({
                            title: '支付成功',
                            icon: 'success',
                            duration: 3000 
                        })
                        that.modify_father_page_goodslist()
                        wx.redirectTo({ 
                            url: '../paysuccess/paysuccess?order_id=' + order_id,
                        })
                    }, 
                    fail: function (res) {
                        console.log('付款失败');
                        that.modify_father_page_goodslist()
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
            },
            fail(err) {
            }
        });
    },
})
