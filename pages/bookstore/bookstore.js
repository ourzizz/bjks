// pages/bookstore/bookstore.js
//index.js 
//本页设计思路
//数据格式 分类数据 统一为{parent_id,son_list} 每个对象都有自身id和子列表
//渲染一级目录的时候 在onLoad函数  nav_list: this.data.parent_son[0].son_list
//需要解决，某个商品是父类子类都应该有的，那么设置它的class_id为父类的，拿到叶子id请求的时候
//后台应该给出从根到叶的所有商品列表
var qcloud = require('../../vendor/wafer2-client-sdk/index')
var config = require('../../config')
var util = require('../../utils/util.js')

function get_sons_by_id (parent_son,class_id) {
    for (var key in parent_son) {
        if (parent_son[key].parent_id == class_id) {
            return parent_son[key].son_list
        }
    }
    return 'NULL'
}

Page({    
    data: {
        parent_son: [],//}}}
        requestResult: '',
        canIUseClipboard: wx.canIUse('setClipboardData'),
        activeIndex: 0,
        userInfo: {},
        logged: false,
        takeSession: false,
        requestResult: '',
        goods_list: [],
        count_cart: 0,
        nav_selected_id:[],
        nav_2:[],
        nav_3:[],
    },

    onLoad:function (){
        let that = this
        qcloud.request({
            url: `${config.service.host}/goods_class/get_parent_son`,
            success(result) {
                that.data.parent_son = result.data
                var son_list = get_sons_by_id(result.data,"100")//100是公务员 下阶段 这里需要自动生成
                that.setData({
                    parent_son:result.data,
                    nav_list: result.data[2].son_list,
                    nav_2: son_list,
                })
                var id = that.find_first_leave("100")
                that.show_goods_list_by_class_id(id)
                that.drawing_selected_item(0,'100')
                that.drawing_selected_item(1,id)
                that.get_sum_cart()
            },
            fail(error) {
                util.showModel('请求失败', error);
                console.log('request fail', error);
            }
        })
    },

    /*
     *根据class_Id获取到本类的商品列表
     *
     * */
    show_goods_list_by_class_id: function (class_id) {
        let that = this
        qcloud.request({
            url: `${config.service.host}/goods_class/get_goods_list_by_class_id/` + class_id,
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


    drawing_selected_item:function (layer,class_id){
        this.data.nav_selected_id[layer] = class_id
        this.setData({
            nav_selected_id:this.data.nav_selected_id
        })
    },

    /*
     *显示下级导航
     * @class_id 用户点击的目录ID
     * @layer 需要渲染的下级目录
     * @son_list class_id的下级子目录列表
     * */
    show_next_nav: function (event) {
        var class_id = event.currentTarget.dataset.class_id
        var layer = event.currentTarget.dataset.layer
        var son_list = get_sons_by_id(this.data.parent_son,class_id)
        var leave_id = this.find_first_leave(class_id)
        var first_son = this.get_first_son(class_id)
        this.show_goods_list_by_class_id(leave_id)//默认显示的是目录中的第一个类别的商品

        if (layer == '2') { //表示点击了顶层导航，只用渲染二级目录,且默认显示第一个子类为选中状态
            this.drawing_selected_item(0,class_id)//顶层选中
            this.drawing_selected_item(1,first_son.class_id)//第一个子类
            this.setData({
                nav_2: son_list,
            })
        } else if (layer == '3') { //表示点击了二级导航
            if(son_list != 'NULL'){//而且还有下集目录需要显示
                if (this.data.activeIndex == class_id) { //表示第二次点击同一按钮，那么就是收起来
                    class_id = 'NULL' //渲染三层目录的条件class_id设为null后,使得wxml的判断语句activeIndex != item.class_id 例如('111' != 'null')值is true 就不渲染
                }
                this.setData({
                    nav_3: son_list,
                    activeIndex: class_id,
                    nav2_selected_id:class_id,
                })
                this.drawing_selected_item(2,leave_id)
            }
            this.drawing_selected_item(1,class_id)
        } else{
            this.drawing_selected_item(2,class_id)
        }

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
                    if(res.data.sum !== null){
                        that.setData({ count_cart: parseInt(res.data.sum) })
                        util.showSuccess('收藏成功')
                    }
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
