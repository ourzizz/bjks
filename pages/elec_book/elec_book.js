// pages/elec_book/elec_book.js
var qcloud = require('../../vendor/wafer2-client-sdk/index')
var config = require('../../config')
var util = require('../../utils/util.js')
Page({

  /**
   * 页面的初始数据
   */
  data: {
    shijuan:"",
    userInfo:{},
    timu_list:[]
  },

/**
 * 生命周期函数--监听页面加载
 */
    onLoad: function (options) {
        var that = this
        util.showBusy('数据加载中...')
        qcloud.request({
            url: `${config.service.host}/elec_book/get_timu_list`,
            data: {
                goods_id: options.goods_id,
                openId: options.open_id
            },
            method: 'POST',
            header: {
                'content-type': 'application/x-www-form-urlencoded'
            },
            success(result) {
                wx.hideToast()
                that.setData({
                    shijuan:result.data.shijuan,
                    timu_list: result.data.timu_list,
                })
            },
            fail(error) {
                util.showModel('请求失败', error);
                console.log('request fail', error);
            }
        })
    },
})
