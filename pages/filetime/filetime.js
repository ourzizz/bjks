var qcloud = require('../../vendor/wafer2-client-sdk/index')
var config = require('../../config')
var util = require('../../utils/util.js')
var config = require('../../config')

Page({

    data: {
        eventtime:{},
        activeIndex: 1,
        sliderOffset: 0,
        sliderLeft: 0,
        pageEt:{}
    },
    onLoad: function () {
        var that = this
        qcloud.request({
            url: `${config.service.host}/weapp/demo/get_event_files` ,
            success(result) {
                that.setData({
                    eventtime: result.data,
                    pageEt:result.data.impend
                })
                wx.getSystemInfo({ //设置导航栏平分
                    success: function(res) {
                        that.setData({
                            sliderLeft: (res.windowWidth / that.data.tabs.length - sliderWidth) / 2,
                            sliderOffset: res.windowWidth / that.data.tabs.length * that.data.activeIndex
                        });
                    }
                });
            },
            fail(error) {
                util.showModel('请求失败', error);
                console.log('request fail', error);
            }
        })

    },
    tabClick: function (e) {
        this.setData({
            sliderOffset: e.currentTarget.offsetLeft,
            activeIndex: e.currentTarget.id
        });
        console.log(e.currentTarget.id)
    },

    selectTime: function(e)
    {
        if(e.currentTarget.dataset.index == 0)
        {
            this.setData({
                Hselected: '#33FF00',
                Iselected: '#EBEBEB',
                pageEt: this.data.eventtime.happening
            })
        }
        else if(e.currentTarget.dataset.index == 1){
            this.setData({
                Hselected: '#EBEBEB',
                Iselected: '#33FF00',
                pageEt: this.data.eventtime.impend
            });
        }
    }

})
