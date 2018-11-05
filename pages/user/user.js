//index.js
var qcloud = require('../../vendor/wafer2-client-sdk/index')
var config = require('../../config')
var util = require('../../utils/util.js')

Page({
    data: {
        userInfo: {},
        logged: false,
        takeSession: false,
        requestResult: '',
        userFiles: {},
        hidecollect: true 
    },
    onLoad:function()
    {
        this.bindGetUserInfo()
    },
    setUserFiles:function (){
        var that = this
        if(this.data.hidecollect == true)
        {
            this.setData({hidecollect: false})
        }
        else{
            this.setData({hidecollect: true})
        }
        qcloud.request({
            url: `${config.service.host}/weapp/demo/get_user_files/` + that.data.userInfo.openId,
            success(res) {
                    that.setData({ userFiles: res.data})
            },
            fail(error) {
                util.showModel('请求失败', error);
                console.log('request fail', error);
            }
        })
    },
    bindGetUserInfo: function () {
        if (this.data.logged) return

        util.showBusy('正在登录')

        const session = qcloud.Session.get()

        if (session) {
            qcloud.loginWithCode({
                success: res => {
                    this.setData({ userInfo: res, logged: true })
                    util.showSuccess('登录成功')
                },
                fail: err => {
                    console.error(err)
                    util.showModel('登录错误', err.message)
                }
            })
        } else {
            qcloud.login({
                success: res => {
                    this.setData({ userInfo: res, logged: true })
                    util.showSuccess('登录成功')
                },
                fail: err => {
                    console.error(err)
                    util.showModel('登录错误', err.message)
                }
            })
        }
    },

    // 切换是否带有登录态
    switchRequestMode: function (e) {
        this.setData({
            takeSession: e.detail.value
        })
        this.doRequest()
    },

    doRequest: function () {
        util.showBusy('请求中...')
        var that = this
        var options = {
            url: config.service.requestUrl,
            login: true,
            success(result) {
                util.showSuccess('请求成功完成')
                console.log('request success', result)
                that.setData({
                    requestResult: JSON.stringify(result.data)
                })
            },
            fail(error) {
                util.showModel('请求失败', error);
                console.log('request fail', error);
            }
        }
        if (this.data.takeSession) {  // 使用 qcloud.request 带登录态登录
            qcloud.request(options)
        } else {    // 使用 wx.request 则不带登录态
            wx.request(options)
        }
    },
    deleteFile: function (event)
    {
        var that = this
        var fileId = event.currentTarget.dataset.fileid 
        console.log(fileId)
        qcloud.request({
            url: `${config.service.host}/weapp/demo/delete_user_file/` + that.data.userInfo.openId + `/` + fileId,
            fail(error) {
                util.showModel('请求失败', error);
                console.log('request fail', error);
            }
        })
        this.setData({userFiles: {}})
        this.setUserFiles()
        util.showSuccess('已经取消收藏')
        this.setData({hidecollect: false})
    }
})
