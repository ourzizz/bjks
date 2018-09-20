var qcloud = require('../../vendor/wafer2-client-sdk/index')
var config = require('../../config')
var util = require('../../utils/util.js')
Page({
  data: {},
  addIfNew2File: function (webdata) {
    //增加ifnew属性一周内发布的都算是新文件
    for (var key in webdata.files) {
      if(((function (sDate) {
        var sdate = new Date(sDate.replace(/-/g, "/"));
        var time = (new Date()).getTime() - sdate.getTime()
        var days = parseInt(time / (1000 * 60 * 60 * 24));
        return days;
      })(webdata.files[key].pubtime))<=7)//判断条件中设置一个匿名函数专门判断日期天数,立即执行函数
      {
        webdata.files[key].ifnew = 1;
      }
      else{
        webdata.files[key].ifnew = 0;
      }
    }
    for (var key in webdata.files) {
      console.log(webdata.files[key].ifnew);
    }
  },
  onLoad: function (options) {
    util.showBusy('请求中...')
    var that = this
    console.log(`${config.service.host}/weapp/demo/get_file_msg/` + options.kstypeid)
    qcloud.request({
      url: `${config.service.host}/weapp/demo/get_file_msg/` + options.kstypeid,
      login: false,
      success(result) {
        util.showSuccess('请求成功完成')
        that.data = result.data;
        that.addIfNew2File(that.data);
        that.setData({
          list: that.data
        })
      },
      fail(error) {
        util.showModel('请求失败', error);
        console.log('request fail', error);
      }
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
  }
})
