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
        hiddennav: true,
        activeIndex:0
    },
    onLoad: function() {
        util.showBusy('请求中...')
        var that = this
        var mydate = (new Date()).getDate();
        qcloud.request({
            url: `${config.service.host}/weapp/demo/get_homepage_json`,
            login: false,
            success(result) {
                util.showSuccess('请求成功完成')
                result.data.events = that.cutTimeString(result.data.events)
                that.setData({
                    list: result.data,
                    filelist: result.data.newfiles,
                    typelist: result.data.type,
                    ksdate: mydate
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
    cutTimeString:function(eventtime) {
        for (var key in eventtime) {
            eventtime[key].endtime = eventtime[key].endtime.substring(0,10)
        }
        return eventtime
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
                    result.data.zhuanjilist.unshift({'ksid':0,'ksname':'最新消息','kstypeid':3})  
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
                    result.data.xianqulist.unshift({'id':0,'countyname':'最新消息'})  
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
        var xianquid = 0
        if(event == null) {//没有选就默认给最新列表
            if (sydwMap.has(xianquid)){
                this.setData({ filelist: sydwMap.get(xianquid) })
            }else{
                qcloud.request({
                    url: `${config.service.host}/weapp/demo/get_new_event_files/` + 2,
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
        }else{
            xianquid = event.currentTarget.dataset.xianquid
            this.setData({activeIndex: event.currentTarget.dataset.idx}) //对标选中
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
        }
    },
    setShFiles:function (event) {
        var that = this
        var xianquid = 0
        if(event == null) {//没有选就默认给最新列表
            if (shehuiMap.has(xianquid)){
                this.setData({ filelist: shehuiMap.get(xianquid) })
            }else{
                qcloud.request({
                    url: `${config.service.host}/weapp/demo/get_new_event_files/` + 4,
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
        }else{
            xianquid = event.currentTarget.dataset.xianquid
            this.setData({activeIndex: event.currentTarget.dataset.idx}) //对标选中
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
        }
    },

    setZhuanjiFiles(event) {
        var that = this
        var ksid = 0
        if(event == null) {//没有选就默认给最新列表
            if (zhuanjiMap.has(ksid)){
                this.setData({ filelist: zhuanjiMap.get(ksid) })
            }else{
                qcloud.request({
                    url: `${config.service.host}/weapp/demo/get_new_event_files/` + 3,
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
        }else{
            ksid = event.currentTarget.dataset.ksid
            this.setData({activeIndex: event.currentTarget.dataset.idx}) //对标选中
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
                this.setData({activeIndex: 0}) //对标选中
                break;
            case '3':
                that.setZhuanjiNavList(3);
                that.setZhuanjiFiles();
                this.setData({activeIndex: 0}) //对标选中
                break;
            case '4':
                that.setXianquNavList(4);
                that.setShFiles();
                this.setData({activeIndex: 0}) //对标选中
                break;
            case '5':
                this.setData({ hiddennav: true })//设置公共文件时关闭二级导航
                that.setPublicFiles(5);
                break;
        }
    }
})
