var qcloud = require('../../vendor/wafer2-client-sdk/index')
var config = require('../../config')
var util = require('../../utils/util.js')
//is_adm系统判断是否为管理员，是否显示后台入口
Page({
    data: {
        is_adm: {},
        userInfo: {},
        logged: false,
        takeSession: false,
        requestResult: '',
        userFiles: {},
        hidecollect: false,
        hideEleList: true,
        elecbookList: [],
        hiddenEnter: true //这个地方不能错的啊！
    },
    onLoad: function () {
        const session = qcloud.Session.get()
        if (session) { //session存在
            this.setData({
                userInfo: session.userinfo,
                logged: true
            })
            this.setUserFiles()
        }
    },
    setUserFiles: function () {
        var that = this
        this.setData({
            hidecollect: !this.data.hidecollect,
            hideEleList: true
        })
        if (this.data.hidecollect === false) {
            util.showBusy('数据加载中...')
            qcloud.request({
                url: `${config.service.host}/weapp/demo/get_user_files_events/` + that.data.userInfo.openId,
                success(res) {
                    wx.hideToast()
                    that.setData({
                        userFiles: res.data
                    })
                },
                fail(error) {
                    util.showModel('请求失败', error);
                    console.log('request fail', error);
                }
            })
        }
    },
    setUserElecbooks: function () {
        var that = this
        this.setData({
            hidecollect: true,
            hideEleList: !this.data.hideEleList
        })
        if (this.data.hideEleList === false) {
            util.showBusy('数据加载中...')
            qcloud.request({
                url: `${config.service.host}/elec_book/get_all_ebooks/`,
                data: {
                    openId: that.data.userInfo.openId
                },
                method: 'POST',
                header: {
                    'content-type': 'application/x-www-form-urlencoded'
                },
                success(result) {
                    wx.hideToast()
                    that.setData({
                        elecbookList: result.data
                    })
                },
                fail(error) {
                    util.showModel('请求失败', error);
                    console.log('request fail', error);
                }
            })
        }

    },
    bindGetUserInfo: function () {
        if (this.data.logged) return
        util.showBusy('正在登录')
        const session = qcloud.Session.get()
        if (session) {
            qcloud.loginWithCode({
                success: res => {
                    this.setData({
                        userInfo: res,
                        logged: true
                    })
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
                    this.setData({
                        userInfo: res,
                        logged: true
                    })
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
        if (this.data.takeSession) { // 使用 qcloud.request 带登录态登录
            qcloud.request(options)
        } else { // 使用 wx.request 则不带登录态
            wx.request(options)
        }
    },
    deleteFile: function (event) {
        var that = this
        var index = event.currentTarget.dataset.index
        var fileId = this.data.userFiles[index].fileinfo.fileid;
        wx.showModal({
            title: '提示',
            content: '确定在您的收藏中删除本文',
            success(res) {
                if (res.confirm) {
                    qcloud.request({
                        url: `${config.service.host}/weapp/demo/delete_user_file/` + that.data.userInfo.openId + `/` + fileId,
                        fail(error) {
                            util.showModel('请求失败', error);
                        }
                    })
                    that.data.userFiles.splice(index, 1)
                    that.setData({
                        userFiles: that.data.userFiles
                    })
                    util.showSuccess('已经取消收藏')
                } else if (res.cancel) {
                    return
                }
            }
        })
    },

    go_order: function (event) {
        if (this.data.logged) {
            wx.navigateTo({
                url: '../orders/orders?open_id=' + this.data.userInfo.openId + '&idx=' + event.currentTarget.dataset.idx,
            })
        } else {
            util.showModel('未登陆', '请先点击登陆');
        }
    },

    refresh: function () {
        util.showBusy('数据加载中...')
        let that = this
        qcloud.request({
            url: `${config.service.host}/login/is_adm/` + that.data.userInfo.openId,
            success(res) {
                wx.hideToast()
                if (res.data.is_adm === "true") {
                    that.setData({
                        is_adm: res.data,
                        hiddenEnter: false
                    })
                }
            },
            fail() {
                wx.hideToast()
            }
        })
    },

    //go_seller_console:function (){
    //}
})
