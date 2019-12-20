// pages/settlement/settlement.js 
// debug:支付不管失败与否，购物车页面都要进行更新,但是没有起作用,openid设置有误所以出错
// bug 用户勾选商品进入结算页面，此时如果回退到其他页面，就可以不勾选任何商品直接跳入结算页面，而且结算金额为0
// debug务必保存结算金额
var qcloud = require('../../vendor/wafer2-client-sdk/index')
var config = require('../../config')
var util = require('../../utils/util.js')
// o9pU65LTYEE8tVWQR_yClRc1466k 
// 待增加功能：用户留言
Page({
  /* user_default_address 用户的默认收货地址
   *  goods_list 商品列表
   *  order_info 前端生成的订单信息包括商品地址等
   *  open_id 用户id
   *  res
   *  pay_lock 如果该页面用户连续点击支付，会造成多次拉起支付
   *  cost 订单金额
   * */
  data: {
    user_default_address: {},
    goods_list: [],
    order_info: {},
    open_id: "",
    res: {},
    pay_lock: false,
    cost: 0,
    user_words: "", //用户给商家留言
  },

  onShow: function() {
    this.get_user_defualt_address(this.data.open_id)
  },
  onLoad: function(options) {
    let that = this
    this.data.open_id = options.open_id
    this.get_user_defualt_address(options.open_id)
    wx.getStorage({
      key: 'settlement',
      success: function(res) {
        that.setData({
          goods_list: res.data.goods_list,
          open_id: res.data.goods_list[0].open_id,
          cost: res.data.cost
        })
      }
    })
  },

  get_user_defualt_address: function(open_id) { //https://www.alemao.club/bjks/index.php?/user_address/get_user_default_address/o9pU65LTYEE8tVWQR_yClRc1466k
    let that = this
    qcloud.request({
      url: `${config.service.host}/weapp/user_address/get_user_default_address/` + open_id,
      success(result) {
        that.setData({
          user_default_address: result.data
        })
      }
    })
  },

  //超过30免送费，低于30收2元
  calc_cost: function() {
    if (this.data.cost < getApp().globalData.feeLine) {
      wx.showModal({
        title: '提示',
        content: '客官您的订单低于30元，我们需要2元的跑路费',
        success(res) {
          if (res.confirm) {
            this.data.cost = this.data.cost + getApp().globalData.runFee
          } else if (res.cancel) {
            return
          }
        }
      })
    }
  },

  //生成订单信息,发后台的json数据
  g_order_info: function() {
    let order_info = {}
    order_info.open_id = this.data.open_id
    order_info.body = "bookstore"
    order_info.address_id = this.data.user_default_address.address_id
    order_info.goods_list = []
    order_info.total_fee = this.data.cost //pay_bug
    order_info.user_words = this.data.user_words
    let goods_list = this.data.goods_list
    for (var i = 0; i < goods_list.length; i++) {
      order_info.goods_list[i] = {
        'goods_id': goods_list[i].goods_id,
        'count': goods_list[i].count
      }
    }
    return order_info;
  },

  modify_father_page_goodslist: function() {
    let pages = getCurrentPages();
    let currPage = pages[pages.length - 1]; //当前页面
    let prevPage = pages[pages.length - 2]; //上一个页面//直接调用上一个页面的setData()方法，把数据存到上一个页面中去
    wx.removeStorage({
      key: 'settlement',
      success(res) {
        console.log(res)
      }
    })
    prevPage.clear_data() //父页面刷新
  },

  refresh_cart_count: function() {
    let count = 0
    let goods_list = this.data.goods_list
    for (var i = 0; i < goods_list.length; i++) {
      count = count + parseInt(goods_list[i].count)
    }
    console.log(count)
    getApp().reduce_cart_sum(count) //刷新购物车上的数标
  },

  /*拉起支付需要的参数实例
   *appId : "wxfa21ea4bdaef03e9" 
   *nonceStr : "qrgtif83m9658zl1nbroe545qbqr5k43"
   *order_id : "1549254920lryMm"
   *package : "prepay_id=wx041235207234486943dc7ca33362991804"
   *paySign : "F0A5C7B4AAE310FA19CDCCDB468D939C"
   *signType : "MD5"
   *timeStamp : "1549254920"
   *说明:支付页面出错返回的就是error信息，拿不到order_id所以跳转到支付失败页面就会得到空订单
   **/
  pay: function(out_trade_no, true_money) {
    let that = this
    if (this.data.user_default_address == null) {
      var error = "客官请先点击顶部添加地址"
      util.showModel('地址不能为空', error);
      return;
    }
    if (this.data.pay_lock === false) {
      this.data.pay_lock = true
      this.refresh_cart_count()
      wx.request({ // 请求服务器登录地址，获得会话信息
        url: `${config.service.host}/order/pay`,
        data: {
          order_info: JSON.stringify(this.g_order_info())
        },
        method: 'POST',
        header: {
          'content-type': 'application/x-www-form-urlencoded'
        },
        //成功之后，调用小程序微信支付
        success(res) {
          order_id = res.data.order_id
          wx.requestPayment({
            'timeStamp': res.data.timeStamp,
            'nonceStr': res.data.nonceStr,
            'package': res.data.package,
            'signType': 'MD5',
            'paySign': res.data.paySign,
            success: function(res) {
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
            fail: function(res) {
              console.log('付款失败');
              that.modify_father_page_goodslist()
              wx.redirectTo({
                url: '../payfail/payfail?order_id=' + order_id,
              })
              return
            },
          })
        },
        fail(err) {}
      });
    }
  },

  //为了能和线下合作，这是让步也是未来不可估量的切入点
  //来吧大家都免费接进来
  pay_offline: function() {
    var that = this
    let content = ""
    let runFee = getApp().globalData.runFee
    let feeLine = getApp().globalData.feeLine
    if (this.data.user_default_address == null) {
      var error = "客官请先点击顶部添加地址"
      util.showModel('地址不能为空', error);
      //wx.navigateTo({ 
      //url: '../user_address/user_address?step=2'
      //})
      return;
    }
    if (this.data.cost < feeLine) {
      content = '客官您的订单未满30元，我们需要' + runFee + '元跑路费'
      this.data.cost = this.data.cost + runFee
    } else {
      content = '本单计价:' + this.data.cost
    }
    wx.showModal({
      title: '确认货到付款',
      content: content,
      success: function(res) {
        console.log(res)
        if (res.confirm) {
          that.refresh_cart_count()
          wx.request({ // 请求服务器登录地址，获得会话信息
            url: `${config.service.host}/order/pay_offline`,
            data: {
              order_info: JSON.stringify(that.g_order_info())
            },
            method: 'POST',
            header: {
              'content-type': 'application/x-www-form-urlencoded'
            },
            success: function(result) {
              console.log('拿到orderid跳转到订单管理页面')
              that.modify_father_page_goodslist()
              wx.redirectTo({
                url: '../orders/orders?idx=1',
              })
            }
          })
        } else {
          console.log('用户取消了货到付款什么也不做')
        }
      }
    })
  },

  formSubmit: function(e) {
    e.detail.value.user_words = e.detail.value.user_words.replace(/\s/g, "");
    this.hideModal()
    this.setData({
      user_words: e.detail.value.user_words
    })
    this.util("close")
  },

  formReset: function() {
    console.log('form发生了reset事件')
  },
  //输入聚焦

  foucus: function(e) {
    var that = this;
    that.setData({
      bottom: e.detail.height
    })
  },



  //失去聚焦
  blur: function(e) {
    var that = this;
    that.setData({
      bottom: 0
    })
  },
  clickme: function() {
    this.showModal();
  },

  //显示对话框
  showModal: function() {
    // 显示遮罩层
    var animation = wx.createAnimation({
      duration: 200,
      timingFunction: "linear",
      delay: 0
    })
    this.animation = animation
    animation.translateY(300).step()
    this.setData({
      animationData: animation.export(),
      showModalStatus: true
    })
    setTimeout(function() {
      animation.translateY(0).step()
      this.setData({
        animationData: animation.export()
      })
    }.bind(this), 200)
  },
  //隐藏对话框
  hideModal: function() {
    // 隐藏遮罩层
    var animation = wx.createAnimation({
      duration: 200,
      timingFunction: "linear",
      delay: 0
    })
    this.animation = animation
    animation.translateY(300).step()
    this.setData({
      animationData: animation.export(),
    })
    setTimeout(function() {
      animation.translateY(0).step()
      this.setData({
        animationData: animation.export(),
        showModalStatus: false
      })
    }.bind(this), 200)
  }
})