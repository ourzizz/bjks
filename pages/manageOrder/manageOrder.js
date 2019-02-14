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
    tabs: [['待接单', 1], ['待发货', 2], ['完结订单', 3],['退款列表', 3]],
    activeIndex: 0,
    sliderOffset: 0,
    sliderLeft: 0,
    wait_pay_order_list: [],
    wait_sign_order_list: [],//待签收后台给出pay为success,给出送货员的联系电话
    wait_comment_order_list: [],
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
    if (session) {//session存在
      this.setData({
        userInfo: session.userinfo,
        open_id: session.userinfo.openId,
        logged: true
      })
    }
    wx.getSystemInfo({
      success: function (res) {
        that.setData({
          sliderLeft: (res.windowWidth / that.data.tabs.length - sliderWidth) / 2, /*横向条离左边的间距*/
          sliderOffset: res.windowWidth / that.data.tabs.length * options.idx /*横向条离左边的距离偏移量*/
        });
      }
    });
    //this.set_page_data('1')
    this.set_page_data(options.idx)
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
              that.data.wait_sign_order_list.splice(idx, 1)
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
