// pages/shopIart/shopcart.js
var qcloud = require('../../vendor/wafer2-client-sdk/index')
var config = require('../../config')
var util = require('../../utils/util.js')
let origin_map = new Map()
Page({
  data: {
      goods_list: [],
      temp_goods_list: [],
      settlement:{},
      userInfo: {},
      hidden_opera: true,
      hidden_goodsinfo: false,
      cost: 0,
      opera_option: '编辑'
  },
  onLoad: function (options) {
      var that = this
      const session = qcloud.Session.get()
      this.setData({ userInfo: session.userinfo })
      qcloud.request({
          url: `${config.service.host}/weapp/shopcart/get_user_has_goods/` + options.open_id,
          success(result) {
              util.showSuccess('请求成功完成')
              var c = {}
              c = JSON.parse(JSON.stringify(result.data))
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
  add_count_direct_2_db: function (event) { //https://alemao.club/bjks/index.php?/shopcart/reduce_count/o9pU65LTYEE8tVWQR_yClRc1466k/1  测试接口
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
  reduce_count_direct_2_db: function (event) { //https://alemao.club/bjks/index.php?/shopcart/reduce_count/o9pU65LTYEE8tVWQR_yClRc1466k/1  测试接口
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
  is_change:function() { },
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
  save_modify: function () {/* 找出原始表何temp表中被修改的数量,open_id + goods_id + count json发php存mysql */
    var diff_count = []
    var j = 0
    var diff ={}
    for (var i in this.data.goods_list) { /* js深拷贝做起来很麻烦，用一个map把所有goodsid何count的原始值保存，每次保存的时候将goodslist和originmap对比，把不同的地方放入diff_count数组，后续传给服务器一次性保存，这样避免开网络较差时用户体验不佳的情况 */
      if (origin_map.get(this.data.goods_list[i].goods_id) != this.data.goods_list[i].count) {
          diff = {'open_id':this.data.goods_list[i].open_id,'goods_id':this.data.goods_list[i].goods_id,'count':this.data.goods_list[i].count}
          this.update_goods_count_db(diff)
          j++
      }//endif
    }//endfor
    console.log('diff',diff_count)
  },
  update_goods_count_db:function(diff) {//
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
  checkboxChange: function (e) {//计算共计花费
    console.log(e.detail.value)
    this.data.cost = 0
      this.data.settlement.goods_list = []
    for (var i in e.detail.value) {
      var a = e.detail.value[i] //a is wxml中value为goods_id
      this.data.cost = this.data.cost + (parseInt(this.data.goods_list[a].count) * this.data.goods_list[a].price);
      this.data.settlement.goods_list[i] = {"goods_id":this.data.goods_list[a].goods_id,"count":this.data.goods_list[a].count}
      //this.data.settlement.goods_list[i] = this.data.goods_list[a].goods_id
    }
      console.log(this.data.cost)
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

    submit_order: function () {
        if(this.data.settlement.goods_list != null && this.data.settlement.goods_list.length != 0) {//如果提交为空
            this.data.settlement.cost = this.data.cost
            wx.navigateTo({ 
                url: '/pages/settlement/settlement?order_info=' + JSON.stringify(this.data.settlement)
            })
        }
        else{
            var error = "订单不能为空"
            util.showModel('订单不能为空', error);
        }
    },
    select_goods_item: function () { },
    sum_cost: function () { },
})
