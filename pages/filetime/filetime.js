var qcloud = require('../../vendor/wafer2-client-sdk/index')
var config = require('../../config')
var util = require('../../utils/util.js')
var config = require('../../config')
var sliderWidth = 96;
Page({

    data: {
        eventtime:{},//这里放的是整个页面数据
        pageEt:{},//这里是根据用户点击确定是happenning还是impend进行赋值渲染
        activeIndex: 1,
        sliderOffset: 0,
        sliderLeft: 0
    },
    onLoad: function () {
        var that = this
        qcloud.request({
            url: `${config.service.host}/weapp/demo/get_event_files` ,
            success(result) {
                that.setData({
                    Hselected: '#EBEBEB',
                    Iselected: '#33FF00',
                    eventtime: result.data,
                    pageEt:result.data.impend
                })
            },
            fail(error) {
                util.showModel('请求失败', error);
                console.log('request fail', error);
            }
        })
        // wx.getSystemInfo({ //设置导航栏平分
        //     success: function (res) {
        //         that.setData({
        //             sliderLeft: (res.windowWidth / that.data.pageEt.length - sliderWidth) / 2,
        //             sliderOffset: res.windowWidth / that.data.tabs.length * that.data.activeIndex
        //         });
        //     }
        // });

    },
    tabClick: function (e) {
        this.setData({
            sliderOffset: e.currentTarget.offsetLeft,
            activeIndex: e.currentTarget.id
        });
    },

    selectTime: function (e) {
        if (e.currentTarget.dataset.index == 0) {//选择即将开始
            this.setData({
                Hselected: '#33FF00',
                Iselected: '#EBEBEB',
                Hcolor: 'black',
                Icolor: 'white',
                activeIndex: 0,
                pageEt: this.data.eventtime.happening
            })
        }
        else if (e.currentTarget.dataset.index == 1) {//选择正在进行
            this.setData({
                Hselected: '#EBEBEB',
                Iselected: '#33FF00',
                Hcolor: 'white',
                Icolor: 'black',
                activeIndex: 0,
                pageEt: this.data.eventtime.impend
            });
        }
    }

})
