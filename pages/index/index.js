//index.js
var qcloud = require('../../vendor/wafer2-client-sdk/index')
var config = require('../../config')
var util = require('../../utils/util.js')
let typelist = new Array('gwy', 'zyjs', 'sydw', 'qt');
let filesMap = new Map();
Page({
    data: {
        userInfo: {},
        logged: false,
        takeSession: false,
        requestResult: '',
        typelist: []
    },
    onLoad: function () {
        util.showBusy('请求中...')
        var that = this
        qcloud.request({
            url: `${config.service.host}/weapp/demo/get_homepage_json`,
            login: false,
            success(result) {
                util.showSuccess('请求成功完成')
                that.data.typelist = result.data.type
                that.setData({
                    list: result.data,
                    filelist: result.data.newfiles,
                    typelist: that.data.typelist
                })
            },
            fail(error) {
                util.showModel('请求失败', error);
                console.log('request fail', error);
            }
        })
    },
    judgeIfNewFile: function (webdata) {
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
        //for (var key in webdata.files) {
        //console.log(webdata.files[key].ifnew);
        //}
        return webdata.files
    },
    myChangeColor:function (typelist,typeid) {
        for (var key in typelist) {
            typelist[key].color = 'white'
        }
        typelist[typeid-1].color = 'red'
    },
    changeFileList: function(event){
        //每次点击都触发请求，体验上很慢，而且浪费服务器资源，只要主页不注销，只用请求一次数据就保存在map中，需要重新渲染的时候就不用再请求了，这有点像缓存
        var that = this
        var typeid = event.currentTarget.dataset.typeid 
        this.myChangeColor(that.data.typelist,typeid)
        if(filesMap.has(typeid))
        {
            this.setData({
                filelist: filesMap.get(typeid),
                typelist: that.data.typelist
            })
        }
        else{
            qcloud.request({
                url: `${config.service.host}/weapp/demo/get_file_list/`+typeid ,
                login: false,
                success(result) {
                    filesMap.set(typeid,that.judgeIfNewFile(result.data))
                    that.setData({
                        filelist: filesMap.get(typeid),
                        typelist: that.data.typelist
                    })
                },
                fail(error) {
                    util.showModel('请求失败', error);
                    console.log('request fail', error);
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

    // 上传图片接口
    doUpload: function () {
        var that = this

        // 选择图片
        wx.chooseImage({
            count: 1,
            sizeType: ['compressed'],
            sourceType: ['album', 'camera'],
            success: function (res) {
                util.showBusy('正在上传')
                var filePath = res.tempFilePaths[0]

                // 上传图片
                wx.uploadFile({
                    url: config.service.uploadUrl,
                    filePath: filePath,
                    name: 'file',

                    success: function (res) {
                        util.showSuccess('上传图片成功')
                        console.log(res)
                        res = JSON.parse(res.data)
                        console.log(res)
                        that.setData({
                            imgUrl: res.data.imgUrl
                        })
                    },

                    fail: function (e) {
                        util.showModel('上传图片失败')
                    }
                })

            },
            fail: function (e) {
                console.error(e)
            }
        })
    },

    // 预览图片
    previewImg: function () {
        wx.previewImage({
            current: this.data.imgUrl,
            urls: [this.data.imgUrl]
        })
    },

    // 切换信道的按钮
    switchChange: function (e) {
        var checked = e.detail.value

        if (checked) {
            this.openTunnel()
        } else {
            this.closeTunnel()
        }
    },

    openTunnel: function () {
        util.showBusy('信道连接中...')
        // 创建信道，需要给定后台服务地址
        var tunnel = this.tunnel = new qcloud.Tunnel(config.service.tunnelUrl)

        // 监听信道内置消息，包括 connect/close/reconnecting/reconnect/error
        tunnel.on('connect', () => {
            util.showSuccess('信道已连接')
            console.log('WebSocket 信道已连接')
            this.setData({ tunnelStatus: 'connected' })
        })

        tunnel.on('close', () => {
            util.showSuccess('信道已断开')
            console.log('WebSocket 信道已断开')
            this.setData({ tunnelStatus: 'closed' })
        })

        tunnel.on('reconnecting', () => {
            console.log('WebSocket 信道正在重连...')
            util.showBusy('正在重连')
        })

        tunnel.on('reconnect', () => {
            console.log('WebSocket 信道重连成功')
            util.showSuccess('重连成功')
        })

        tunnel.on('error', error => {
            util.showModel('信道发生错误', error)
            console.error('信道发生错误：', error)
        })

        // 监听自定义消息（服务器进行推送）
        tunnel.on('speak', speak => {
            util.showModel('信道消息', speak)
            console.log('收到说话消息：', speak)
        })

        // 打开信道
        tunnel.open()

        this.setData({ tunnelStatus: 'connecting' })
    },

    /**
     * 点击「发送消息」按钮，测试使用信道发送消息
     */
    sendMessage() {
        if (!this.data.tunnelStatus || !this.data.tunnelStatus === 'connected') return
        // 使用 tunnel.isActive() 来检测当前信道是否处于可用状态
        if (this.tunnel && this.tunnel.isActive()) {
            // 使用信道给服务器推送「speak」消息
            this.tunnel.emit('speak', {
                'word': 'I say something at ' + new Date(),
            });
        }
    },

    /**
     * 点击「关闭信道」按钮，关闭已经打开的信道
     */
    closeTunnel() {
        if (this.tunnel) {
            this.tunnel.close();
        }
        util.showBusy('信道连接中...')
        this.setData({ tunnelStatus: 'closed' })
    }
})
