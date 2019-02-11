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
        collect: {'status':false,'src':'/image/collect.png','text':'收藏'}
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
            this.data.userInfo = session.userinfo //保存userinfo到本文件周期内
            qcloud.request({
                url: `${config.service.host}/weapp/demo/get_if_userhasfile/` + that.data.userInfo.openId + `/` + that.data.fileid,
                success(res) {
                    if(res.data["userhasfile"] != false)
                    {
                        that.setData({
                            collect: { 'status':true,'src':'/image/collected.png','text':'已收藏'},
                        })
                    }
                    else{
                        that.setData({
                            collect: { 'status':false,'src':'/image/collect.png','text':'收藏'}
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
                        collect: { 'status':false,'src':'/image/collect.png','text':'收藏'}
                    })
            },
            fail(error) {
                util.showModel('请求失败', error);
                console.log('request fail', error);
            }
        })
    },
    /*这个部分的函数全部用来处理登录收藏文件*/
    addFile2user:function()
    {
        var that = this
        if (!this.data.logged) {
            util.showBusy('请重授权再收藏')
            return
        }
        qcloud.request({
            url: `${config.service.host}/weapp/demo/insert_user_file/` + that.data.userInfo.openId + `/` + that.data.fileid,
            success(res) {
                that.setData({
                    collect: { 'status':true,'src':'/image/collected.png','text':'已收藏'}
                })
                util.showSuccess('收藏成功')
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
        {//显示为已收藏，用户必须是已登录状态,且本页面的userinfo是设置好的
            this.cancleCollect(this.data.userInfo.openId,this.data.fileid)
            util.showSuccess('已经取消收藏')
        }
        else{//，2新登录用户需要注册
            const session = qcloud.Session.get()
            if(session) {//用户session存在
                this.setData({ userInfo: session.userinfo,logged:true })
                this.addFile2user()
            }
            else{
                qcloud.login({
                    success: res => {
                        this.setData({ userInfo: res, logged: true})
                        util.showSuccess('登录成功')
                        this.addFile2user()
                    },
                    fail: err => {
                        console.error(err)
                        util.showModel('登录错误', err.message)
                    }
                })
            }
        }
    },
    /*这个部分的函数全部用来处理登录收藏文件*/

    // 切换是否带有登录态
    switchRequestMode: function (e) {
        this.setData({
            takeSession: e.detail.value
        })
        this.doRequest()
    },
    gohome: function()
    {
        wx.switchTab({
            url: '../index/index'
        })
    }
});
