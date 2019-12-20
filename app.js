//app.js
var qcloud = require('./vendor/wafer2-client-sdk/index')
var config = require('./config')

App({
    onLaunch: function () {
        qcloud.setLoginUrl(config.service.loginUrl)
    },
    globalData: {
        info_class:[],
        count_cart: 0,//购物车数量
        edit_class_id:"",
        feeLine: 30,//商家起送金额
        runFee: 2    //跑腿费用
      },
      raise_cart_sum: function(count) {
        getApp().globalData.count_cart = parseInt(getApp().globalData.count_cart) + parseInt(count)
        wx.setTabBarBadge({ //这个方法的意思是，为小程序某一项的tabbar右上角添加文本
          index: 2, //代表哪个tabbar（从0开始）
          text: (getApp().globalData.count_cart).toString() //显示的内容
        })
      },
    
      reduce_cart_sum: function (count) {
        getApp().globalData.count_cart = parseInt(getApp().globalData.count_cart) - parseInt(count)
        wx.setTabBarBadge({ 
          index: 2, 
          text: (getApp().globalData.count_cart).toString()
        })
      },
    
        set_cart_sum:function (count){
            getApp().globalData.count_cart = count
            wx.setTabBarBadge({//这个方法的意思是，为小程序某一项的tabbar右上角添加文本
                index: 2,   //代表哪个tabbar（从0开始）
                text: (getApp().globalData.count_cart).toString() //显示的内容
            })
        }
})