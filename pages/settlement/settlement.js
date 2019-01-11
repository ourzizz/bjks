// pages/settlement/settlement.js 
var qcloud = require('../../vendor/wafer2-client-sdk/index') 
var config = require('../../config') 
var util = require('../../utils/util.js') 
 // o9pU65LTYEE8tVWQR_yClRc1466k 
Page({ 
  data: { 
      user_default_address: "毕节市", 
      order_info:{}, 
      res:{} 
  }, 
 
  onLoad: function (options) { 
      url = `${config.service.host}/weapp/Goods/get_goods_list_info/`  
      parm = JSON.parse(options.order_info) 
      let that = this 
      console.log(url) 
      qcloud.request({ 
          url: `${config.service.host}/weapp/Goods/get_goods_list_info/` + options.order_info, 
        //   data: parm, 
          header: { 'content-type': 'application/json'}, 
            success(result) { 
                that.setData({ 
                    goods_list:result.data 
                }) 
            } 
        }) 
  }, 
 
    get_goods_detail_info:function (goods_id){//狗日的腾讯截断json字符串，暂时只能再次请求后台数据 
        var data = {} 
        var that =  this 
    }, 
})