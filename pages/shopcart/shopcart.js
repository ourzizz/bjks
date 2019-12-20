/* pages/shopIart/shopcart.js
 *1、如果用户反复点击增加、减少和删除等操作按钮，会增大服务器负荷，用户感觉不流畅
 *解决办法:增加操作视图，当用户点击编辑，该视图会自动覆盖掉商品的信息栏,等用户编辑完毕，再一次性提交服务器保存。
 *2、页面之间传递json，数据太长会被微信截断，如果进入新页面重新请求数据，操作麻烦不流畅
 *解决办法:在购物车页面分两步进行提交，第一步选择商品 确定后 第二步地址管理确认支付
 *处理订单方式不周全，如果用户是从商品页面直接进入到结算页面，以上方法就不行，故必须要有一个单独的结算页面
 *小程序有10m空间缓存，我们可以在本页面进行settlement的缓存，在计算页拿出来，删除缓存
 */
var qcloud = require('../../vendor/wafer2-client-sdk/index')
var config = require('../../config')
var util = require('../../utils/util.js')
var app = getApp()
let origin_map = new Map() //存放原始数据的goods_id count,方便后面对比那些地方被用户修改
Page({
    data: {
        goods_list: [],
        order_list: [],
        settlement: {
            goods_list:[]
        },//结算单
        userInfo: {},
        hidden_opera: true,
        hidden_goodsinfo: false,
        opera_option: '编辑',
        cost: 0,
        step: 1,
        user_default_address: {},
        selectedAllStatus: false,
    },

    //初始化购物车的数量,设置全局参数
    get_cart_sum: function () {
        const session = qcloud.Session.get()
        if (session) {
            var open_id = session.userinfo.openId
            var that = this
            qcloud.request({//加入到购物车表,现阶段先将逻辑代码理顺
                url: `${config.service.host}/weapp/shopcart/get_cart_sum_count/` + open_id,
                success(res) {
                    if (res.data.sum !== null) {
                        app.set_cart_sum(res.data.sum)
                    }
                },
                fail(error) {
                    util.showModel('请求失败', error);
                    console.log('request fail', error);
                }
            })
        } else {
            app.globalData.count_cart = 0
        }
    },

    //第一次打开调用
    onLoad: function (options) {
        var that = this
        this.get_cart_sum()
        const session = qcloud.Session.get()
        this.setData({ userInfo: session.userinfo })
        qcloud.request({
            url: `${config.service.host}/weapp/shopcart/get_user_has_goods/` + session.userinfo.openId,
            success(result) {
                for (var i in result.data) {
                    origin_map.set(result.data[i].goods_id, result.data[i].count)
                }
                //如果结算单不为空,此种情况在于从结算页面返回到购物车页面，购物车页面并未销毁
                //如果是从分类页面添加商品再回购物车页面，调用onshow再调用onLoad
                //这里的if，用户从支付页面返回从新勾选商品保持check状态设置的
                if (that.data.settlement.goods_list !== undefined) {
                    that.init_checked_goods(result.data, that.data.settlement.goods_list)
                    that.setData({
                        goods_list: result.data,
                    })
                } else {
                    that.setData({
                        goods_list: result.data,
                        cost: 0
                    })
                }
            }
        })
    },

    //每次打开页面都调用
    onShow: function () {
        let count = getApp().globalData.count_cart
        getApp().set_cart_sum(count)
        this.onLoad() //为了每次都能刷新页面数据所以在show里面调用load
    },

    clear_data:function () {
        this.data.settlement = {}
    },
        
    init_checked_goods: function (goods_list, settlement) {
        for (var i = 0; i < goods_list.length; i++) {
            for (var j = 0; j < settlement.length; j++)
                if (settlement[j].goods_id === goods_list[i].goods_id) {
                    goods_list[i].checked = true
                }
        }
    },

    find_goods_by_id:function (goods_id){//查找结算单中goods_id的数组序号，找不到返回-1
        var goods_list = this.data.settlement.goods_list
        for (var i = 0; i < goods_list.length; i++){
            if (goods_list[i].goods_id === goods_id) {
                return i
            }
        }
        return -1;
    },

    add_count: function (event) {
        //由于orderlist 和goodslist的元素内存地址一样所以再给goodslist做操作的同时也影响到了order
        var idx = event.currentTarget.dataset.idx;
        var settlement_idx = this.find_goods_by_id(this.data.goods_list[idx].goods_id)
        if (parseInt(this.data.goods_list[idx].count) < parseInt(this.data.goods_list[idx].remain)) {
            //不能超过库存
            this.data.goods_list[idx].count = parseInt(this.data.goods_list[idx].count) + 1;
            if(settlement_idx != -1){
                this.data.settlement.goods_list[settlement_idx].count = parseInt(this.data.settlement.goods_list[settlement_idx].count) + 1;
                this.calc_total_cost()
            }
            this.setData({
                goods_list: this.data.goods_list//没有覆盖
            })
            getApp().raise_cart_sum(1)
        }
    },

    reduce_count: function (event) {
        var idx = event.currentTarget.dataset.idx
        var settlement_idx = this.find_goods_by_id(this.data.goods_list[idx].goods_id)
        if (parseInt(this.data.goods_list[idx].count) > 1) {
            this.data.goods_list[idx].count = parseInt(this.data.goods_list[idx].count) - 1
            if(settlement_idx != -1){
                this.data.settlement.goods_list[settlement_idx].count = parseInt(this.data.settlement.goods_list[settlement_idx].count) - 1;
                this.calc_total_cost()
            }
            this.setData({
                goods_list: this.data.goods_list
            })
            getApp().reduce_cart_sum(1)
        } else {
            var error = "不能超过库存"
            console.log(error)
        }
    },

    //保存用户在购物车页面所做的增删该操作
    // 找出存储原始数据的MAP和temp表中数据对比，得出被修改的数量 逐条调用 update_goods_count_db 写入数据库
    save_modify: function () {
        var j = 0
        var diff = {}
        for (var i = 0, lenI = this.data.goods_list.length; i < lenI; ++i) { /* js深拷贝做起来很麻烦，用一个map把所有goodsid和count的原始值保存，每次保存的时候将goodslist和originmap对比，把不同的地方放入diff_count数组，后续传给服务器一次性保存，这样避免开网络较差时用户体验不佳的情况 */
            if (origin_map.get(this.data.goods_list[i].goods_id) != this.data.goods_list[i].count) {
                diff = { 'open_id': this.data.goods_list[i].open_id, 'goods_id': this.data.goods_list[i].goods_id, 'count': this.data.goods_list[i].count }
                this.update_goods_count_db(diff) //耦合性需要拆,/* 在这里写入数据库 */
                j++
            }//endif
        }//endfor
        this.setData({ //保存事件就该把设置按钮和关闭编辑操作的活儿做了
            hidden_opera: true,
            hidden_goodsinfo: false,
            opera_option: "编辑"
        })
    },

    //将购物车中的商品数量被用户改动的地方发给后台保存
    update_goods_count_db: function (diff) {//传递一条openid goods_id count 给后台 保存
        var that = this
        qcloud.request({
            url: `${config.service.host}/weapp/shopcart/update_count/` + diff.open_id + `/` + diff.goods_id + `/` + diff.count,
            success(res) {
                that.setData({
                    goods_list: that.data.goods_list
                })
            },
            fail(error) {
                util.showModel('请求失败', error);
                console.log('request fail', error);
            }
        })
    },

    /* 编辑和保存开关转换函数 */
    switch_info_opera: function (event) {
        if (this.data.hidden_opera == true) {// 点击了编辑 
            this.setData({
                hidden_opera: false,
                hidden_goodsinfo: true,
                opera_option: "保存"
            })
        } else {/* 点击了保存 */
            this.save_modify()
        }
    },

    calc_total_cost: function () {
        var order_list = this.data.settlement.goods_list
        if (order_list !== undefined && order_list != null) {
            this.data.cost = 0 //求和前先清0
            for (var i = 0, lenI = order_list.length; i < lenI; ++i) {
                //js进行数值计算的时候会出现精度丢失的情况，这里先乘100再除100消除误差
                this.data.cost = this.data.cost + (parseInt(order_list[i].count) * (order_list[i].price) * 100);
            }
            this.setData({
                cost: this.data.cost / 100
            })
        }
    },

    //全选
    select_all: function () {
        let selectedAllStatus = this.data.selectedAllStatus
        let goods_list = this.data.goods_list
        this.data.settlement.goods_list = [] //置空
        if (selectedAllStatus === false) {//selectedAllStatus为false表示没有全选，而用户点了全选
            for (var i = 0; i < goods_list.length; i++) {
                goods_list[i].checked = true;
                var deepCopyGoods = JSON.parse(JSON.stringify(goods_list[i]));
                this.data.settlement.goods_list.push(deepCopyGoods);//添加数组元素 数组.push(元素)
            }
        } else {//已经全选了，用户点了全选表示全不选
            for (var i = 0; i < goods_list.length; i++) {
                this.data.goods_list[i].checked = false
            }
        }
        this.calc_total_cost()
        this.setData({
            selectedAllStatus: !selectedAllStatus,
            goods_list: this.data.goods_list
        })
    },

    //刷新cheackbox状态
    //wxml页面发来的value是goods_id
    //本函数checked_goods_list包含的是goods_id
    checkboxChange: function (e) {//计算共计花费
        this.data.cost = 0
        this.data.settlement.goods_list = [] //清空结算商品列表  这里break 看下length
        var goods_list = this.data.goods_list
        var checked_goods_list = e.detail.value
        for (var i = 0, lenI = goods_list.length; i < lenI; ++i) {
            goods_list[i].checked = false;
            for (var j = 0, lenJ = checked_goods_list.length; j < lenJ; ++j) {
                if (goods_list[i].goods_id === checked_goods_list[j]) {//bug1
                    var deepCopyGoods = JSON.parse(JSON.stringify(goods_list[i]))
                    goods_list[i].checked = true;
                    this.data.settlement.goods_list.push(deepCopyGoods) //添加数组元素 数组.push(元素)
                    break;
                } //end_if
            } //end_for
        } //end_for
        this.calc_total_cost()
    },

    delete_goods_item: function (event) {//1获取openid+goods_id发后台删除,后台删除后，返回新的goods_list json
        var idx = event.currentTarget.dataset.idx
        var order_list = this.data.settlement.goods_list
        var goods_id = this.data.goods_list[idx].goods_id
        var count = this.data.goods_list[idx].count
        var that = this//下面删除后台数据
        wx.showModal({
            title: '提示',
            content: '确定删除吗',
            success(res) {
                if (res.confirm) {
                    if (order_list !== undefined && order_list != null) {
                        order_list.forEach(function (item, index, arr) {//数组删除元素模板
                            if (item.goods_id == goods_id) {
                                arr.splice(index, 1);
                            }
                        });//end_callback
                    }//endif
                    console.log(count)
                    getApp().reduce_cart_sum(count)//刷新购物车上的数标
                    that.calc_total_cost()
                    that.data.goods_list.splice(idx, 1)
                    qcloud.request({
                        url: `${config.service.host}/weapp/shopcart/delete_user_goods/` + that.data.userInfo.openId + `/` + goods_id,
                        success(res) {
                            that.setData({
                                goods_list: that.data.goods_list
                            })
                        },
                        fail(error) {
                            util.showModel('请求失败', error);
                            console.log('request fail', error);
                        }
                    })
                    util.showSuccess('已经删除')
                } else if (res.cancel) {
                    return
                }
            }
        })//}}}
    },

    //进入到结算步骤,
    //user may be not click the save button,directly goto settlement page
    next_step: function () {
        this.save_modify()
        this.calc_total_cost()
        this.data.settlement.cost = this.data.cost
        if (this.data.settlement.goods_list != null && this.data.settlement.goods_list.length != 0) {//提交订单不为空
            wx.setStorage({
                key: "settlement",
                data: this.data.settlement
            })
            wx.navigateTo({
                url: '../settlement/settlement?open_id=' + this.data.userInfo.openId
            })
        }
        else {//如果提交空订单
            var error = "订单不能为空"
            util.showModel('订单不能为空', error);
        }
    },

    pre_step: function () {
        this.setData({
            goods_list: this.data.goods_list,
            step: this.data.step - 1
        })
    },
    gohome: function () {
        wx.switchTab({
            url: '../bookstore/bookstore'
        })
    },

})

