// pages/shopIart/shopcart.js
//1、如果用户反复点击增加、减少和删除等操作按钮，会增大服务器负荷，用户感觉不流畅
//解决办法:增加操作视图，当用户点击编辑，该视图会自动覆盖掉商品的信息栏,等用户编辑完毕，再一次性提交服务器保存。
//2、页面之间传递json，数据太长会被微信截断，如果进入新页面重新请求数据，操作麻烦不流畅
//解决办法:路在购物车页面分两部进行提交，第一步选择商品 确定后 第二部地址管理确认支付
//1-04遗留bug 选定商品后，再次编辑商品的数量，cost没有被修改
var qcloud = require('../../vendor/wafer2-client-sdk/index')
var config = require('../../config')
var util = require('../../utils/util.js')
let origin_map = new Map() //存放原始数据的goods_id count,方便后面对比那些地方被用户修改
Page({
  data: {
      goods_list: [],
      temp_goods_list: [],
      settlement:{},//结算单
      userInfo: {},
      hidden_opera: true,
      hidden_goodsinfo: false,
      cost: 0,
      opera_option: '编辑',
      step: 1,
  },
  onLoad: function (options) {
      var that = this
      const session = qcloud.Session.get()
      this.setData({ userInfo: session.userinfo })
      qcloud.request({
          url: `${config.service.host}/weapp/shopcart/get_user_has_goods/` + options.open_id,
          success(result) {
              util.showSuccess('请求成功完成')
              var c = JSON.parse(JSON.stringify(result.data))
              that.data.temp_goods_list = c
              for (var i in result.data) {
                  origin_map.set(result.data[i].goods_id, result.data[i].count)
              }
              that.setData({
                  goods_list: result.data
                  // temp_goods_list: result.data
              })
          }
      })
  },
  add_count_direct_2_db: function (event) { //https://alemao.club/bjks/index.php?/shopcart/reduce_count/o9pU65LTYEE8tVWQR_yClRc1466k/1  测试接口 直接写入数据库
    var that = this
    var idx = event.currentTarget.dataset.idx
    qcloud.request({
      url: `${config.service.host}/weapp/shopcart/add_count/` + that.data.userInfo.openId + `/` + event.currentTarget.dataset.goods_id,
      success(res) {
        util.showSuccess('请求成功完成')
        console.log(res.data['count'])
        that.data.goods_list[idx].count = res.data['count']
        that.setData({
          goods_list: that.data.goods_list
        })
      },
      fail(error) {
        util.showModel('请求失败', error);
        console.log('request fail', error);
      }
    })
  },
  reduce_count_direct_2_db: function (event) { //https://alemao.club/bjks/index.php?/shopcart/reduce_count/o9pU65LTYEE8tVWQR_yClRc1466k/1  测试接口  直接写入数据库
    var that = this
    var idx = event.currentTarget.dataset.idx
    qcloud.request({
      url: `${config.service.host}/weapp/shopcart/reduce_count/` + that.data.userInfo.openId + `/` + event.currentTarget.dataset.goods_id,
      success(res) {
        util.showSuccess('请求成功完成')
        console.log(res.data['count'])
        that.data.goods_list[idx].count = res.data['count']
        that.setData({
          goods_list: that.data.goods_list
        })
      },
      fail(error) {
        util.showModel('请求失败', error);
        console.log('request fail', error);
      }
    })
  },
  add_count: function (event) {
    var idx = event.currentTarget.dataset.idx
    if (parseInt(this.data.goods_list[idx].count) < parseInt(this.data.goods_list[idx].remain)) {
      this.data.goods_list[idx].count = parseInt(this.data.goods_list[idx].count) + 1
      this.setData({
        goods_list: this.data.goods_list//没有覆盖
      })
    }
  },

  reduce_count: function (event) {
    var idx = event.currentTarget.dataset.idx
    if (this.data.goods_list[idx].count != '1') {
      this.data.goods_list[idx].count = parseInt(this.data.goods_list[idx].count) - 1
      this.setData({
        goods_list: this.data.goods_list
      })
    } else {
      util.show('不能超过最大库存')
    }
  },

  save_modify: function () {// 找出存储原始数据的MAP和temp表中数据对比，得出被修改的数量 逐条调用 update_goods_count_db 写入数据库
    var j = 0
    var diff = {}
    for (var i = 0, lenI = this.data.goods_list.length; i < lenI; ++i) { /* js深拷贝做起来很麻烦，用一个map把所有goodsid和count的原始值保存，每次保存的时候将goodslist和originmap对比，把不同的地方放入diff_count数组，后续传给服务器一次性保存，这样避免开网络较差时用户体验不佳的情况 */
      if (origin_map.get(this.data.goods_list[i].goods_id) != this.data.goods_list[i].count) {
        diff = { 'open_id': this.data.goods_list[i].open_id, 'goods_id': this.data.goods_list[i].goods_id, 'count': this.data.goods_list[i].count }
        this.update_goods_count_db(diff) //耦合性需要拆,/* 在这里写入数据库 */
        j++
      }//endif
    }//endfor
  },
  update_goods_count_db:function(diff) {//传递一条openid goods_id count 给后台 保存
      var that = this
      qcloud.request({
          url: `${config.service.host}/weapp/shopcart/update_count/` + diff.open_id + `/` + diff.goods_id + `/` + diff.count,
          success(res) {
              util.showSuccess('请求成功完成')
              that.setData({
                  goods_list: that.data.goods_list
              })
          },
          fail(error) {
              util.showModel('请求失败', error);
              console.log('request fail', error);
          }
      })
  },

  switch_info_opera: function (event) {/* 编辑和保存开关函数 */
    if (this.data.hidden_opera == true) {/* 点击了编辑 */
      this.setData({
        hidden_opera: false,
        hidden_goodsinfo: true,
        opera_option: "保存"
      })
    } else {/* 点击了保存 */
      this.save_modify()
      this.setData({
        hidden_opera: true,
        hidden_goodsinfo: false,
        opera_option: "编辑"
      })
    }
  },

  checkboxChange : function (e) {//计算共计花费
    this.data.cost = 0
    this.data.settlement.goods_list = [] //结算商品列表清空  这里break 看下length
    items = this.data.temp_goods_list
    values = e.detail.value
    for (var i = 0, lenI = items.length; i < lenI; ++i) {
      items[i].checked = false;
      for (var j = 0, lenJ = values.length; j < lenJ; ++j) {
        if (items[i].goods_id === values[j]) {//bug1
          items[i].checked = true;
          this.data.cost = this.data.cost + (parseInt(items[i].count) * items[i].price);
          this.data.settlement.goods_list.push(items[i]) //添加数组元素 数组.push(元素)
          break;
        } //end_if
      } //end_for
    } //end_for
    this.setData({
      cost: this.data.cost
    })
  },

  delete_goods_item: function (event) {//这里要做的操作有1删除掉前端goods_list/change_map中的相关元素，然后提交后台删除/重新渲染wxml页面{{{
    var idx = event.currentTarget.dataset.idx
    var goods_id = this.data.goods_list[idx].goods_id
    var that = this//下面删除后台数据
     wx.showModal({
            title: '提示',
            content: '确定删除吗',
            success (res) {
                if (res.confirm) {
                    that.data.goods_list.splice(idx, 1)
                    qcloud.request({
                        url: `${config.service.host}/weapp/shopcart/delete_user_goods/` + that.data.userInfo.openId + `/` + goods_id,
                        success(res) {
                            util.showSuccess('请求完成')
                            that.setData({
                                goods_list: that.data.goods_list
                            })
                        },
                        fail(error) {
                            util.showModel('请求失败', error);
                            console.log('request fail', error);
                        }
                    })
                    util.showSuccess('已经删除')
             } else if (res.cancel) {
                 return
             }
         }
     })//}}}
    },

  next_step: function () {//进入到结算步骤
    if (this.data.settlement.goods_list != null && this.data.settlement.goods_list.length != 0) {//提交订单不为空
      this.data.settlement.cost = this.data.cost
      this.setData({ 
        step: this.data.step + 1 ,
        goods_list: this.data.settlement.goods_list
      })
    }
    else {//如果提交空订单
      var error = "订单不能为空"
      util.showModel('订单不能为空', error);
    }
  },

  pre_step: function () {
    this.setData({
      goods_list:this.data.temp_goods_list,
      step: this.data.step - 1
    })
  }
})
