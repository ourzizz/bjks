//index.js
var qcloud = require('../../vendor/wafer2-client-sdk/index')
var config = require('../../config')
var util = require('../../utils/util.js')
let filesMap = new Map();//publicFiles
let zhuanjiMap = new Map(); //专技map
let sydwMap = new Map();//事业map
let shehuiMap = new Map();//社会招聘map
Page({
    data: {
        typeid:1,
        zhuanjilist: [],
        xianqulist: [],
        typelist: [], //类型列表缓存数组
        hiddennav: true
    },
    onLoad: function() {
        util.showBusy('请求中...')
        var that = this
        qcloud.request({
            url: `${config.service.host}/weapp/demo/get_homepage_json`,
            login: false,
            success(result) {
                util.showSuccess('请求成功完成')
                that.setData({
                    list: result.data,
                    filelist: result.data.newfiles,
                    typelist: result.data.type
                })
            },
            fail(error) {
                util.showModel('请求失败', error);
                console.log('request fail', error);
            }
        })
    },
    judgeIfNewFile: function(webdata) {
        //判断文件是否是新文件，规则ifnew属性一周内发布的都算是新文件
        for (var key in webdata.files) {
            if (((function(sDate) {
                var sdate = new Date(sDate.replace(/-/g, "/"));
                var time = (new Date()).getTime() - sdate.getTime()
                var days = parseInt(time / (1000 * 60 * 60 * 24));
                return days;
            })(webdata.files[key].pubtime)) <= 7) //判断条件中设置一个匿名函数专门判断日期天数,立即执行函数
            {
                webdata.files[key].ifnew = 1;
            } else {
                webdata.files[key].ifnew = 0;
            }
        }
        return webdata.files
    },

    myChangeColor: function(typelist, typeid) {
        //刷新导航列表字符颜色
        for (var key in typelist) {
            typelist[key].color = 'white'
        }
        typelist[typeid - 1].color = '#00CCFF '
        this.setData({ typelist: typelist})
    },


    setZhuanjiNavList:function(typeid){
        var that = this
        if(this.data.zhuanjilist.length == 0) {
            qcloud.request({
                url: `${config.service.host}/weapp/demo/get_zhuanji_list`,
                success(result) {
                    that.setData({
                        zhuanjilist: result.data.zhuanjilist,
                        typeid: typeid,
                        navlist: result.data.zhuanjilist,                            
                        hiddennav:false
                    })
                },
                fail(error) {
                    util.showModel('请求失败', error);
                    console.log('request fail', error);
                }
            })
        }
        else{
            this.setData({ typeid: typeid,navlist: this.data.zhuanjilist,hiddennav:false})
        }
    },
    setXianquNavList:function(typeid){
        var that = this
        if(that.data.xianqulist.length == 0) {
            qcloud.request({
                url: `${config.service.host}/weapp/demo/get_xianqu_list`,
                success(result) {
                    that.setData({
                        xianqulist: result.data.xianqulist,
                        typeid: typeid,
                        navlist: result.data.xianqulist,
                        hiddennav:false
                    })
                },
                fail(error) {
                    util.showModel('请求失败', error);
                    console.log('request fail', error);
                }
            })
        }
        else{
            this.setData({ typeid: typeid,navlist: this.data.xianqulist,hiddennav:false})
        }
    },

    setPublicFiles:function(typeid) {
        var that = this
        if (filesMap.has(typeid)) {
            this.setData({ filelist: filesMap.get(typeid) })
        } else {
            qcloud.request({
                url: `${config.service.host}/weapp/demo/get_file_list/` + typeid,
                success(result) {
                    filesMap.set(typeid, that.judgeIfNewFile(result.data))
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

    setSydwFiles:function (event) {
        var that = this
        var xianquid = 1 //xianquid默认为1市直单位
        if(event != null) {
            var xianquid = event.currentTarget.dataset.xianquid
        } 
        if (sydwMap.has(xianquid)){
            this.setData({ filelist: sydwMap.get(xianquid) })
        }else{
            qcloud.request({
                url: `${config.service.host}/weapp/demo/get_filesby_ksid_countyid/` + 6 + `/` + xianquid,
                success(result) {
                    sydwMap.set(xianquid, that.judgeIfNewFile(result.data))
                    that.setData({
                        filelist: sydwMap.get(xianquid)
                    })
                },
                fail(error) {
                    util.showModel('请求失败', error);
                    console.log('request fail', error);
                }
            })
        }
    },
    setShFiles:function (event) {
        var that = this
        var xianquid = 1 //xianquid默认为1市直单位
        if(event != null) {
            var xianquid = event.currentTarget.dataset.xianquid
        } 
        if (shehuiMap.has(xianquid)){
            this.setData({ filelist: shehuiMap.get(xianquid) })
        }else{
            qcloud.request({
                url: `${config.service.host}/weapp/demo/get_filesby_ksid_countyid/` + 7 + `/` + xianquid,
                success(result) {
                    shehuiMap.set(xianquid, that.judgeIfNewFile(result.data))
                    that.setData({
                        filelist: shehuiMap.get(xianquid)
                    })
                },
                fail(error) {
                    util.showModel('请求失败', error);
                    console.log('request fail', error);
                }
            })
        }
    },

    setZhuanjiFiles(event) {
        var that = this
        var ksid = 3 //默认显示经济师
        if(event != null) {
            var ksid = event.currentTarget.dataset.ksid
        } 
        if (zhuanjiMap.has(ksid)){
            this.setData({ filelist: zhuanjiMap.get(ksid) })
        }else{
            qcloud.request({
                url: `${config.service.host}/weapp/demo/get_zhuanji_files_by_ksid/` + ksid,
                success(result) {
                    zhuanjiMap.set(ksid, that.judgeIfNewFile(result.data))
                    that.setData({
                        filelist: zhuanjiMap.get(ksid)
                    })
                },
                fail(error) {
                    util.showModel('请求失败', error);
                    console.log('request fail', error);
                }
            })
        }
    },

    changeFileList:function(event) {
        var that = this
        var typeid = event.currentTarget.dataset.typeid
        this.data.typeid = typeid
        this.myChangeColor(that.data.typelist, typeid)
        switch(typeid) {
            case '1':
                this.setData({ hiddennav: true })//设置公共文件时关闭二级导航
                that.setPublicFiles(1);
                break;
            case '2':
                that.setXianquNavList(2);
                that.setSydwFiles();
                break;
            case '3':
                that.setZhuanjiNavList(3);
                that.setZhuanjiFiles();
                break;
            case '4':
                that.setXianquNavList(4);
                that.setShFiles();
                break;
            case '5':
                this.setData({ hiddennav: true })//设置公共文件时关闭二级导航
                that.setPublicFiles(5);
                break;
        }
    }
})
