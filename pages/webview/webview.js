var qcloud = require('../../vendor/wafer2-client-sdk/index')
var config = require('../../config')
var util = require('../../utils/util.js')
var sliderWidth = 96; // 需要设置slider的宽度，用于计算中间位置

Page({
  data: {
    tabs: [],
    activeIndex: -1,
    sliderOffset: 0,
    sliderLeft: 0,
    htmlSnip: '',
  },
  onShareAppMessage: function() {
    console.log("inshare")
    return {
      title: '转发按钮',
      path: 'pages/webview/webview'
    }
  },
  initTabs: function(webJson) { //从json中的数据进行填充
    if (webJson.eventtime != false) {
      this.data.tabs.push(['时间节点', webJson.eventtime])
    }
    for (var key in webJson.notify) {
      this.data.tabs.push([webJson.notify[key].typename, webJson.notify[key].content])
    }
  },
  onLoad: function(options) {
    var that = this;
    util.showBusy('请求中...')
    qcloud.request({
      url: `${config.service.host}/weapp/demo/get_filepage_json/` + options.fileid,
      success(result) {
        util.showSuccess('请求成功完成')
        that.initTabs(result.data)

        //上一步获取数据并初始化navmap后需要渲染nav
        wx.getSystemInfo({ //设置导航栏平分
          success: function(res) {
            that.setData({
              tabs: that.data.tabs,
              //tabs: that.data.navMap,
              sliderLeft: (res.windowWidth / that.data.tabs.length - sliderWidth) / 2,
              sliderOffset: res.windowWidth / that.data.tabs.length * that.data.activeIndex
            });
          }
        });
        //上一步获取数据并初始化navmap后需要渲染nav

        that.data.htmlSnip = result.data.article[0].article
        that.setData({
          htmlSnip: that.data.htmlSnip
        })
      },
      fail(error) {
        util.showModel('请求失败', error);
        console.log('request fail', error);
      }
    })
  },
  tabClick: function(e) {
    var that = this
    if (e.currentTarget.id == this.data.activeIndex) {
      this.setData({
        activeIndex: -1,
      });

    } else {
      this.setData({
        sliderOffset: e.currentTarget.offsetLeft,
        activeIndex: e.currentTarget.id,
      });
    }
  },
  hideNotify: function() {
    this.setData({
      activeIndex: -1,
    });
  }
});