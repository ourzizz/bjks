var qcloud = require('../../vendor/wafer2-client-sdk/index')
var config = require('../../config')
var util = require('../../utils/util.js')
var sliderWidth = 96; // 需要设置slider的宽度，用于计算中间位置

Page({
    data: {
        fileid: '',
        tabs: [],
        activeIndex: 0,
        sliderOffset: 0,
        sliderLeft: 0,
        htmlSnip: '',
        userInfo: {},
        logged: false,
        takeSession: false,
        requestResult: '',
        collect: {'status':false,'src':'/image/collect.png','text':'收藏本文'}
    },
    onShareAppMessage: function() {
        console.log("inshare")
        return {
            title: '毕节考试',
            path: 'pages/webview/webview?fileid=' + this.data.fileid
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
    renderCollect:function(){
        const session = qcloud.Session.get()
        var that = this
        if(session){
            this.data.userInfo = session.userinfo
            qcloud.request({
                url: `${config.service.host}/weapp/demo/get_if_userhasfile/` + session.userinfo.openId + `/` + this.data.fileid,
                success(res) {
                    if(res.data["userhasfile"] != false)
                    {
                        that.setData({
                            collect: { 'status':true,'src':'/image/collected.png','text':'已收藏'},
                        })
                    }
                    else{
                        that.setData({
                            collect: { 'status':false,'src':'/image/collect.png','text':'收藏本文'}
                        })
                    }
                },
                fail(error) {
                    util.showModel('请求失败', error);
                    console.log('request fail', error);
                }
            })

        }
    },
    onLoad: function(options) {
        var that = this;
        this.data.fileid = options.fileid 
        this.renderCollect()
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
    },
    scrollToTop() {
        wx.pageScrollTo({
            scrollTop: 0,
            duration: 100
        })
        console.log(this.data.userInfo)
    },
    cancleCollect:function(openId,fileId)
    {//取消收藏
        var that = this
        qcloud.request({
            url: `${config.service.host}/weapp/demo/delete_user_file/` + openId + `/` + fileId,
            success(res) {
                    that.setData({
                        collect: { 'status':false,'src':'/image/collect.png','text':'收藏本文'}
                    })
            },
            fail(error) {
                util.showModel('请求失败', error);
                console.log('request fail', error);
            }
        })
    },
    collectFile:function ()
    {
        var that = this
        if(this.data.collect['status'] == true)
        {
            //const session = qcloud.Session.get()
            this.cancleCollect(this.data.userInfo.openId,this.data.fileid)
        }
        //if (session) {
        //qcloud.loginWithCode({
        //success: res => {
        //this.setData({ userInfo: res, logged: true })
        //util.showSuccess('登录成功')
        //console.log(this.data.userInfo)
        //},
        //fail: err => {
        //console.error(err)
        //util.showModel('登录错误', err.message)
        //}
        //})
        //} else {
        //qcloud.login({
        //success: res => {
        //this.setData({ userInfo: res, logged: true })
        //util.showSuccess('登录成功')
        //},
        //fail: err => {
        //console.error(err)
        //util.showModel('登录错误', err.message)
        //}
        //})
        //}
    },

    // 切换是否带有登录态
    switchRequestMode: function (e) {
        this.setData({
            takeSession: e.detail.value
        })
        this.doRequest()
    },
    gohome: function()
    {
        const session = qcloud.Session.get()
        console.log(session)
        wx.switchTab({
            url: '../index/index'
        })
    }
});
