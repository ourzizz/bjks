// pages/orders/orders.js

var qcloud = require('../../vendor/wafer2-client-sdk/index')
var config = require('../../config')
var util = require('../../utils/util.js')
var sliderWidth = 96;
Page({
  /**
   * 页面的初始数据
   */
  data: {
    tabs: [['待接单', 144], ['待发货', 2], ['完结订单', 3],['退款列表', 3]],
    activeIndex: 0,
    sliderOffset: 0,
    sliderLeft: 0,
    wait_pick_order_list:[],//待接单列表
    wait_delivery_order_list: [],//待投递订单
    finished_order_list: [],
    userinfo: {},
    logged: false,
    open_id: ''
  },

  /**
   *  
   */
  onLoad: function (options) {
    let that = this
    const session = qcloud.Session.get()
        qcloud.request({
            url: `${config.service.host}/seller/get_wait_pick_orders` ,
            success(result) {
                that.data.tabs[0][1] = result.data.length
                that.setData({
                    wait_pick_order_list:result.data,
                    tabs:that.data.tabs
                })
            },
            fail(error) {
                util.showModel('请求失败', error);
                console.log('request fail', error);
            }
        })
    wx.getSystemInfo({
      success: function (res) {
        that.setData({
          sliderLeft: (res.windowWidth / that.data.tabs.length - sliderWidth) / 2, /*横向条离左边的间距*/
          sliderOffset: res.windowWidth / that.data.tabs.length * options.idx /*横向条离左边的距离偏移量*/
        });
      }
    });
    this.set_page_data(options.idx)
  },

  request_order_list: function (url) {//异步执行不能返回值，promise解决
    let that = this
    return new Promise(function (resolve, reject) {
      qcloud.request({
        url: url,
        success(result) {
          let list = result.data
          for (let i = 0; i < list.length; i++) {
            list[i].order.date = Date("Y-m-d", (list[i].order.timeStamp))
          }
          resolve(list)
        }
      })
    })
  },

  //根据idx
  //idx 0 请求等待支付列表
  //idx 1 请求带签收列表
  //idx 0 请求已完成订单列表
  set_page_data: function (idx) {
    let url = ''
    let list = []
    let that = this
    switch (idx) {
      case '0':
        url = `${config.service.host}/order/get_wait_pay_order/` + that.data.open_id
        that.request_order_list(url).then(function (list) { that.setData({ wait_pay_order_list: list, }) })
        break;
      case '1':
        url = `${config.service.host}/order/get_wait_sign_order_list/` + that.data.open_id
        that.request_order_list(url).then(function (list) { that.setData({ wait_sign_order_list: list, }) })
        break;
      case '2':
        url = `${config.service.host}/order/get_finished_order_list/` + that.data.open_id
        that.request_order_list(url).then(function (list) { that.setData({ finished_order_list: list, }) })
        break;
    }
    this.setData({
      //sliderOffset: e.currentTarget.offsetLeft,
      activeIndex: idx
    });
  },

  tabClick: function (e) {
    this.set_page_data(e.currentTarget.id)
    this.setData({
      sliderOffset: e.currentTarget.offsetLeft,
      activeIndex: e.currentTarget.id
    });
  },
  detail: function (event) {
    let idx = event.currentTarget.dataset.idx
    wx.navigateTo({
      url: '../paysuccess/paysuccess?order_id=' + this.data.wait_sign_order_list[idx].order.order_id,
    })
  }
})
