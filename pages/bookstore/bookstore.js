// pages/bookstore/bookstore.js
//index.js 
//本页设计思路
//数据格式 分类数据 统一为{parent_id,son_list} 每个对象都有自身id和子列表
//渲染一级目录的时候 在onLoad函数  nav_list: this.data.parent_son[0].son_list
//点击触发渲染时，调用get_sons_by_id 
var qcloud = require('../../vendor/wafer2-client-sdk/index')
var config = require('../../config')
var util = require('../../utils/util.js')

Page({    
    data: {
        parent_son: [{//{{{
            "parent_id": "99",
            "son_list": [{
                "class_id": "100",
                "class_name": "公务员",
                "count_sons": "3"
            }, {
                "class_id": "101",
                "class_name": "事业单位",
                "count_sons": "1"
            }, {
                "class_id": "102",
                "class_name": "经济师",
                "count_sons": "32"
            }, {
                "class_id": "103",
                "class_name": "职称计算机",
                "count_sons": "0"
            }, {
                "class_id": "104",
                "class_name": "建筑职称",
                "count_sons": "0"
            }, {
                "class_id": "105",
                "class_name": "一建",
                "count_sons": "12"
            }, {
                "class_id": "106",
                "class_name": "消防工程",
                "count_sons": "0"
            }, {
                "class_id": "107",
                "class_name": "执业药师",
                "count_sons": "0"
            }]
        }, {
            "parent_id": "100",
            "son_list": [{
                "class_id": "108",
                "class_name": "行测",
                "count_sons": "0"
            }, {
                "class_id": "109",
                "class_name": "申论",
                "count_sons": "0"
            }, {
                "class_id": "110",
                "class_name": "面试",
                "count_sons": "0"
            }]
        }, {
            "parent_id": "101",
            "son_list": [{
                "class_id": "113",
                "class_name": "事业单位考试",
                "count_sons": "0"
            }]
        }, {
            "parent_id": "102",
            "son_list": [{
                "class_id": "111",
                "class_name": "中级",
                "count_sons": "15"
            }, {
                "class_id": "112",
                "class_name": "初级",
                "count_sons": "15"
            }]
        }, {
            "parent_id": "111",
            "son_list": [{
                "class_id": "114",
                "class_name": "工商管理专业",
                "count_sons": "0"
            }, {
                "class_id": "115",
                "class_name": "人力资源专业",
                "count_sons": "0"
            }, {
                "class_id": "116",
                "class_name": "金融专业",
                "count_sons": "0"
            }, {
                "class_id": "117",
                "class_name": "财政税收专业",
                "count_sons": "0"
            }, {
                "class_id": "118",
                "class_name": "房地产经济专业",
                "count_sons": "0"
            }, {
                "class_id": "119",
                "class_name": "建筑经济专业",
                "count_sons": "0"
            }, {
                "class_id": "120",
                "class_name": "商业经济专业",
                "count_sons": "0"
            }, {
                "class_id": "121",
                "class_name": "农业经济专业",
                "count_sons": "0"
            }, {
                "class_id": "122",
                "class_name": "保险专业",
                "count_sons": "0"
            }, {
                "class_id": "123",
                "class_name": "邮电经济专业",
                "count_sons": "0"
            }, {
                "class_id": "124",
                "class_name": "旅游经济专业",
                "count_sons": "0"
            }, {
                "class_id": "125",
                "class_name": "运输公路专业",
                "count_sons": "0"
            }, {
                "class_id": "126",
                "class_name": "运输民航专业",
                "count_sons": "0"
            }, {
                "class_id": "127",
                "class_name": "运输水路专业",
                "count_sons": "0"
            }, {
                "class_id": "128",
                "class_name": "运输铁路专业",
                "count_sons": "0"
            }]
        }, {
            "parent_id": "112",
            "son_list": [{
                "class_id": "129",
                "class_name": "工商管理专业",
                "count_sons": "0"
            }, {
                "class_id": "130",
                "class_name": "人力资源专业",
                "count_sons": "0"
            }, {
                "class_id": "131",
                "class_name": "金融专业",
                "count_sons": "0"
            }, {
                "class_id": "132",
                "class_name": "财政税收专业",
                "count_sons": "0"
            }, {
                "class_id": "133",
                "class_name": "房地产经济专业",
                "count_sons": "0"
            }, {
                "class_id": "134",
                "class_name": "建筑经济专业",
                "count_sons": "0"
            }, {
                "class_id": "135",
                "class_name": "商业经济专业",
                "count_sons": "0"
            }, {
                "class_id": "136",
                "class_name": "农业经济专业",
                "count_sons": "0"
            }, {
                "class_id": "137",
                "class_name": "保险专业",
                "count_sons": "0"
            }, {
                "class_id": "138",
                "class_name": "邮电经济专业",
                "count_sons": "0"
            }, {
                "class_id": "139",
                "class_name": "旅游经济专业",
                "count_sons": "0"
            }, {
                "class_id": "140",
                "class_name": "运输公路专业",
                "count_sons": "0"
            }, {
                "class_id": "141",
                "class_name": "运输民航专业",
                "count_sons": "0"
            }, {
                "class_id": "142",
                "class_name": "运输水路专业",
                "count_sons": "0"
            }, {
                "class_id": "143",
                "class_name": "运输铁路专业",
                "count_sons": "0"
            }]
        }, {
            "parent_id": "105",
            "son_list": [{
                "class_id": "149",
                "class_name": "一建建筑工程专业",
                "count_sons": "2"
            }, {
                "class_id": "150",
                "class_name": "一建公路专业",
                "count_sons": "0"
            }, {
                "class_id": "151",
                "class_name": "一建铁路专业",
                "count_sons": "0"
            }, {
                "class_id": "152",
                "class_name": "一建民航机场专业",
                "count_sons": "0"
            }, {
                "class_id": "153",
                "class_name": "一建港口与航道专业",
                "count_sons": "0"
            }, {
                "class_id": "154",
                "class_name": "一建水利水电专业",
                "count_sons": "0"
            }, {
                "class_id": "155",
                "class_name": "一建市政公用专业",
                "count_sons": "0"
            }, {
                "class_id": "156",
                "class_name": "一建通信与广电专业",
                "count_sons": "0"
            }, {
                "class_id": "157",
                "class_name": "一建矿业工程专业",
                "count_sons": "0"
            }, {
                "class_id": "158",
                "class_name": "一建机电工程专业",
                "count_sons": "0"
            }]
        }, {
            "parent_id": "149",
            "son_list": [{
                "class_id": "159",
                "class_name": "建筑专业优惠套餐",
                "count_sons": "0"
            }, {
                "class_id": "160",
                "class_name": "建筑工程专业单本图书",
                "count_sons": "0"
            }]
        }],//}}}
        requestResult: '',
        canIUseClipboard: wx.canIUse('setClipboardData'),
        activeIndex: 0,
        userInfo: {},
        logged: false,
        takeSession: false,
        requestResult: '',
        goods_list: [],
        count_cart: 0,
    },
    onLoad: function () {
        var son_list = this.get_sons_by_id("100")//100是公务员 下阶段 这里需要自动生成
        var id = this.find_first_leave("100")
        this.show_goods_list_by_class_id(id)
        this.setData({
            nav_list: this.data.parent_son[0].son_list,
            nav_2: son_list
        })
        this.get_sum_cart()
    },
    show_goods_list_by_class_id: function (class_id) {
        let that = this
        qcloud.request({
            url: `${config.service.host}/weapp/goods/get_goods_json_by_class_id/` + class_id,
            success(result) {
                that.setData({
                    goods_list: result.data
                })
            },
            fail(error) {
                util.showModel('请求失败', error);
                console.log('request fail', error);
            }
        })
    },

    show_next_nav: function (event) {
        var class_id = event.currentTarget.dataset.class_id
        var layer = event.currentTarget.dataset.layer
        var son_list = this.get_sons_by_id(class_id)
        var id = this.find_first_leave(class_id)
        this.show_goods_list_by_class_id(id)

        if (layer == '2') { //表示点击了顶层导航，只用渲染二级目录
            this.setData({
                nav_2: son_list
            })
        } else if (layer == '3' && son_list != 'NULL') { //表示点击了二级导航而且还有下集目录需要显示
            if (this.data.activeIndex == class_id) { //表示第二次点击同一按钮，那么就是收起来
                class_id = 'NULL' //class_id设为null后,使得wxml的判断语句activeIndex != item.class_id 例如('111' != 'null')值is true 就不渲染
            }
            this.setData({
                nav_3: son_list,
                activeIndex: class_id
            })
        }
    },
    get_sons_by_id: function (class_id) {
        for (var key in this.data.parent_son) {
            if (this.data.parent_son[key].parent_id == class_id) {
                return this.data.parent_son[key].son_list
            }
        }
        return 'NULL'
    },
    get_first_son: function (pid) {//获得给定id的第一个儿子，不存在返回NULL
        for (var key in this.data.parent_son) {
            if (this.data.parent_son[key].parent_id == pid) {//如果pid有儿子，那么它必然能在parent_id中匹配到
                return this.data.parent_son[key].son_list[0]//返回第一个儿子
            }
        }
        return 'NULL' //如果查找失败了
    },
    find_first_leave: function (parent_id) {//递归获得叶子节点
        var first_son = this.get_first_son(parent_id)
        if (first_son == 'NULL') {//递归边界
            return parent_id
        }
        else if (first_son.count_sons == '0') {
            return first_son.class_id
        }
        else {
            return this.find_first_leave(first_son.class_id)
        }
    },
    insert_user_chose_goods_to_database: function (open_id,goods_id) {
        var that = this
        if (!this.data.logged) {//登录态为null，需要授权
            util.showBusy('请授权再加入')
            return
        }
        var url= `${config.service.host}/weapp/shopcart/user_add_goods/` + open_id + `/` + goods_id
        console.log(url)
        qcloud.request({//加入到购物车表,现阶段先将逻辑代码理顺
            url: `${config.service.host}/weapp/shopcart/user_add_goods/` + open_id + `/` + goods_id,
            success(res) {
                if(res.data == true) {
                    that.setData({
                        count_cart: that.data.count_cart + 1
                    })
                    util.showSuccess('收藏成功')
                } else {
                    var error = "亲您的需求已经超过了我们的供给"
                    util.showModel('超过库存',error)
                }
            },
            fail(error) {
                util.showModel('请求失败', error);
                console.log('request fail', error);
            }
        })
        util.showSuccess('添加成功')
    },
    get_sum_cart:function()
    {
        const session = qcloud.Session.get()
        if(session)
        {
            var open_id = session.userinfo.openId
            var that = this
            qcloud.request({//加入到购物车表,现阶段先将逻辑代码理顺
                url: `${config.service.host}/weapp/shopcart/get_cart_sum_count/` + open_id,
                success(res) {
                    that.setData({ count_cart: parseInt(res.data.sum) })
                    util.showSuccess('收藏成功')
                },
                fail(error) {
                    util.showModel('请求失败', error);
                    console.log('request fail', error);
                }
            })
        }
    },
    add_goods_to_cart: function (event) {//第一view改为button 而且一定要加open-type="getUserInfo",bindtap改为bindgetuserinfo小程序只允许用户点击的事件来触发登陆
        var goods_id = event.currentTarget.dataset.goods_id
        const session = qcloud.Session.get()
        if (session) {//session存在直接登陆
            this.setData({ userInfo: session.userinfo,logged:true })
            this.insert_user_chose_goods_to_database(this.data.userInfo.openId,goods_id)
        } else {//session不存在重新授权
            qcloud.login({
                success: res => {
                    this.setData({ userInfo: res, logged: true })
                    util.showSuccess('登录成功')
                    this.insert_user_chose_goods_to_database(goods_id)
                    this.get_sum_cart()
                },
                fail: err => {
                    console.error(err)
                    util.showModel('登录错误', err.message)
                }
            })
        }
    },
    goto_shopcart:function ()
    {//wx.navigateTo/wx.redirectTo
        const session = qcloud.Session.get()
        if (session) {
            wx.navigateTo({ 
                url: '../shopcart/shopcart?open_id=' + session.userinfo.openId
            })
        } else {
            qcloud.login({
                success: res => {
                    this.setData({ userInfo: res, logged: true })
                    util.showSuccess('登录成功')
                    console.log('登录成功后,将open_id给后台，换收藏商品列表');
                },
                fail: err => {
                    console.error(err)
                    util.showModel('登录错误', err.message)
                }
            })
        }
    }
})
