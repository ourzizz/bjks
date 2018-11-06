var qcloud = require('../../vendor/wafer2-client-sdk/index')
var config = require('../../config')
var util = require('../../utils/util.js')
var config = require('../../config')

Page({

  data: {
    tabs:['a','b','c'],
    eventtime:{},
    activeIndex: 1,
    sliderOffset: 0,
    sliderLeft: 0,
  },
  onLoad: function () {
      var that = this
      qcloud.request({
          url: `${config.service.host}/weapp/demo/get_event_files` ,
          success(result) {
              that.setData({
                  eventtime: result.data
              })
              wx.getSystemInfo({ //设置导航栏平分
                  success: function(res) {
                      that.setData({
                          sliderLeft: (res.windowWidth / that.data.tabs.length - sliderWidth) / 2,
                          sliderOffset: res.windowWidth / that.data.tabs.length * that.data.activeIndex
                      });
                  }
              });
          },
          fail(error) {
              util.showModel('请求失败', error);
              console.log('request fail', error);
          }
      })

  },
    tabClick: function (e) {
        this.setData({
            sliderOffset: e.currentTarget.offsetLeft,
            activeIndex: e.currentTarget.id
        });
        console.log("intabClic")
    }

})
