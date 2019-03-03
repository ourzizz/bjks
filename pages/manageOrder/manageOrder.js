/** 
 * @fileOverview 聊天室综合 Demo 示例
 * bug 快递员没有送达也没有点击取消送件，商家就进行了退款=>待发货列表中有退款单，但是退款列表中没有
 * 解决办法 退款的前提是:订单的商家态为CANCEL( 表示订单已取消发送了 )
 * 现阶段，只要程序能满足基本操作，就行
 * 下一步需要添加功能-》必须进行各个角色登陆分配，捡单员、快递员、超级管理员，各自有各自的页面
 * 捡单员和快递员需要的功能是留痕，避免失误商家有据可查
 * 超级管理员需要另外增加订单查询功能，退款功能只能放到超级用户这里
 */
var util = require('../../utils/util.js')
var qcloud = require('../../vendor/wafer2-client-sdk/index')
var config = require('../../config')
var sliderWidth = 96; 
/**
 * 查找orderid所在列表的序列
 */
function findOrderById(list,order_id){
    for(i=0;i<list.length;i++){
        if(list[i].order.order_id === order_id){
            console.log(i)
            return i;
        }
    }
    return -1;
}

Page({
    data: {
        tabs: [['待接单', 0],['配单',0],['待发货', 0], ['退款列表', 0]],
        activeIndex: 0,
        sliderOffset: 0,
        sliderLeft: 0,
        wait_pick_order_list:[],//待接单列表
        assemble_list:[],//处在正在配单中的单子
        wait_delivery_order_list: [],//待投递订单
        wait_refund_list:[],
        finished_order_list: [],
        userInfo: {},
        logged: false,
        role:'',
    },


    //推入pick掉的订单
    push_order(order){
        this.data.wait_pick_order_list.push(order)
        this.data.tabs[0][1] = this.data.wait_pick_order_list.length
        this.setData({
            tabs:this.data.tabs,
            wait_pick_order_list:this.data.wait_pick_order_list
        })
    },
    //删除已经pick掉的订单
    remove_order_from_wait_pick(index){
        this.data.wait_pick_order_list.splice(index,1)
        this.data.tabs[0][1] = this.data.wait_pick_order_list.length
        this.setData({
            tabs:this.data.tabs,
            wait_pick_order_list:this.data.wait_pick_order_list 
        })
    },

    remove_order_from_delivery(index){
        this.data.wait_delivery_order_list.splice(index,1)
        this.data.tabs[2][1] = this.data.wait_delivery_order_list.length
        this.setData({
            tabs:this.data.tabs,
            wait_delivery_order_list:this.data.wait_delivery_order_list 
        })
    },

    push_delivery(order){
        this.data.wait_delivery_order_list.push(order)
        this.data.tabs[2][1] = this.data.wait_delivery_order_list.length
        this.setData({
            tabs:this.data.tabs,
            wait_delivery_order_list:this.data.wait_delivery_order_list
        })
    },

    push_refund(order){
        this.data.wait_refund_list.push(order)
        this.data.tabs[3][1] = this.data.wait_refund_list.length
        this.setData({
            tabs:this.data.tabs,
            wait_refund_list:this.data.wait_refund_list
        })
    },



    request_model(weburl,callback){
        let that = this
        qcloud.request({
            url: weburl,
            data: {open_id:that.data.userInfo.openId},
            method: 'POST',
            header: { 'content-type':'application/x-www-form-urlencoded' },
            success(result) {
                callback(result)
            },
            fail(error) {
                util.showModel('请求失败', error);
                console.log('request fail', error);
            }
        })
    },

    init_list:function (){
        this.request_model(`${config.service.host}/seller/get_wait_pick_orders`,result => {
            this.data.tabs[0][1] = result.data.length
            this.setData({
                wait_pick_order_list:result.data,
                tabs:this.data.tabs
            })
        })
        this.request_model(`${config.service.host}/seller/get_assemble_orders`,result => {
            this.data.tabs[1][1] = result.data.length
            this.setData({
                assemble_list:result.data,
                tabs:this.data.tabs
            })
        })
        this.request_model(`${config.service.host}/seller/get_delivery_orders`,result => {
            this.data.tabs[2][1] = result.data.length
            this.setData({
                wait_delivery_order_list:result.data,
                tabs:this.data.tabs
            })
        })
        this.request_model(`${config.service.host}/seller/get_wait_refund_orders`,result => {
            this.data.tabs[3][1] = result.data.length
            this.setData({
                wait_refund_list:result.data,
                tabs:this.data.tabs
            })
        })
    },


    /**
     * 页面渲染完成后，启动聊天室
     * */
    onLoad (options) {
        let that = this
        wx.setNavigationBarTitle({ title: '商家订单管理' });
        wx.getSystemInfo({
            success: function (res) {
                that.setData({
                    role:options.role,
                    /*横向条离左边的间距*/
                    sliderLeft: (res.windowWidth / that.data.tabs.length - sliderWidth) / 2, 
                    /*横向条离左边的距离偏移量*/
                    sliderOffset: res.windowWidth / that.data.tabs.length * 0 
                })
            }
        });
        qcloud.loginWithCode({
            success: res => {
                this.setData({ userInfo: res, logged: true })
                this.init_list()
                if (!this.pageReady) {
                    this.pageReady = true;
                    this.enter();
                }
            },
            fail: err => {
                console.error(err)
                util.showModel('登录错误', err.message)
            }
        })
    },

    /**
     * 后续后台切换回前台的时候，也要重新启动聊天室
     */
    onShow  () {
        if (this.pageReady) {
            this.enter();
            this.init_list();
        }
    },

    /**
     * 页面卸载时，退出聊天室
     */
    onUnload  () {
        this.quit();
    },

    /**
     * 页面切换到后台运行时，退出聊天室
     */
    onHide () {
        this.quit();
    },

    /**
     * 启动聊天室
     */
    enter  () {
        // 如果登录过，会记录当前用户在 this.me 上
        if (!this.me) {
            qcloud.request({
                url: `${config.service.host}/user`,
                login: true,
                success: (response) => {
                    this.me = response.data.data;
                    this.data.userInfo = response.data.data;
                    this.connect();
                }
            });
        } else {
            this.connect();
        }
    },

    /**
     * 连接到聊天室信道服务
     */
    connect  () {
        //tunnel.on是在tunne.js中进行消息类型与动作函数的注册，
        //猜测调用是由底层接到信道信息，根据消息类型，查询 var eventHandlers = [];该数组中消息 动作对
        //进行函数调用

        // 创建信道
        var tunnel = this.tunnel = new qcloud.Tunnel(config.service.tunnelUrl);

        // 连接成功后，去掉「正在加入群聊」的系统提示
        tunnel.on('connect', () => console.log('getin'));

        // 客户下单后服务器会通过信道发来的order信息
        tunnel.on('order',order => {
            this.push_order(order.order_info)
        });

        // 后端发来已经被接掉的订单号,避免重复配单
        tunnel.on('picked', picked => {
            index = findOrderById(this.data.wait_pick_order_list,picked.order_id)
            if(index !== -1){
                this.data.assemble_list.push(this.data.wait_pick_order_list[index])
                this.data.tabs[1][1] = this.data.tabs[1][1] + 1
                this.remove_order_from_wait_pick(index)
                this.setData({
                    assemble_list:this.data.assemble_list,
                    tabs : this.data.tabs
                })
            }
        });

        // 有客退款
        tunnel.on('refund', refund => {
            refund_order_id = refund.order_id
            if((index = findOrderById(this.data.wait_pick_order_list,refund_order_id)) !== -1){
                order = this.data.wait_pick_order_list[index];
                this.remove_order_from_wait_pick(index)
                this.push_refund(order)
            }else if((index = findOrderById(this.data.wait_delivery_order_list,refund_order_id)) !== -1){
                order = this.data.wait_delivery_order_list[index];
                this.data.wait_delivery_order_list[index].order.refund_status = 'W'
                this.setData({
                    wait_delivery_order_list:this.data.wait_delivery_order_list
                })
                this.push_refund(order)
            }
        })

        // 快递小哥点击用户签收了
        tunnel.on('user_signed', user_signed => {
            //bug定位到本段应该是index没有找对
            order_id = user_signed.order_id
            if((index = findOrderById(this.data.wait_refund_list,order_id)) !== -1){
                this.data.wait_refund_list[index].order.seller_act = 'SIGNED';
                this.setData({
                    wait_refund_list:this.data.wait_refund_list
                });
            }
            delivery_idx = findOrderById(this.data.wait_delivery_order_list,order_id);
            this.remove_order_from_delivery(delivery_idx);
            this.setData({
                wait_delivery_order_list:this.data.wait_delivery_order_list,
            });
        });

        // 快递小哥看到退款，取消了送货
        tunnel.on('cancle_delivery', cancle_delivery => {
            //bug定位到本段应该是index没有找对
            order_id = cancle_delivery.order_id
            if((index = findOrderById(this.data.wait_refund_list,order_id)) !== -1){
                this.data.wait_refund_list[index].order.seller_act = 'CANCLE';
                this.setData({
                    wait_refund_list:this.data.wait_refund_list
                });
            }
            delivery_idx = findOrderById(this.data.wait_delivery_order_list,order_id);
            this.remove_order_from_delivery(delivery_idx);
            this.setData({
                wait_delivery_order_list:this.data.wait_delivery_order_list,
            });
        });

        //卖家捡单完成，广播给所有快递员
        tunnel.on('delivery', delivery => {
            this.push_delivery(delivery.order_info)
            order = delivery.order_info.order.order_id
            if((index = findOrderById(this.data.wait_pick_order_list,order_id)) !== -1){
                this.remove_order_from_wait_pick(index)
            }
        });

        // 信道关闭后，显示退出群聊
        tunnel.on('close', () => {
            console.log('quit') ;
        });

        // 重连提醒
        tunnel.on('reconnecting', () => {
            //this.init_list();
        });

        tunnel.on('reconnect', () => {
            this.init_list();
        });

        // 打开信道
        tunnel.open();
    },

    /**
     * 退出聊天室
     */
    quit  () {
        if (this.tunnel) {
            this.tunnel.close();
        }
    },

    /**
     * 点击「发送」按钮，通过信道推送消息到服务器
     **/
    sendMessage (type,content) {
        // 信道当前不可用
        if (!this.tunnel || !this.tunnel.isActive()) {
            if (this.tunnel.isClosed()) {
                this.enter();
            }
            return;
        }

        setTimeout (() => {
            if (this.tunnel) {
                this.tunnel.emit(type, { order_id: content });
                this.setData({ inputContent: '' });
            }
        });
    },

    tabClick: function (e) {
        this.setData({
            sliderOffset: e.currentTarget.offsetLeft,
            activeIndex: e.currentTarget.id
        });
    },

    //打电话给顾客
    call:function (event){
        wx.makePhoneCall({
            phoneNumber: event.currentTarget.dataset.no //仅为示例，并非真实的电话号码
        })
    },

    /*
     *1.店员点击接单，
     *2.通知服务器这个单子谁接了
     *3.服务器给单子上锁，避免重复配单
     *4.服务器广播给所有店员端删掉该订单
     * */
    pick_order(event){
        let that = this
        order_id = event.currentTarget.dataset.order_id
        index = event.currentTarget.dataset.idx
        qcloud.request({
            url: `${config.service.host}/seller/pick_orders` ,
            data: {order_id:order_id,open_id:this.data.userInfo.openId},
            method: 'POST',
            header: { 'content-type':'application/x-www-form-urlencoded' },
            success(result) {
                //that.remove_order_from_wait_pick(index)
            },
            fail(error) {
                util.showModel('请求失败', error);
                console.log('request fail', error);
            }
        })
    },

    /*
     *配单完成 
     *后台广播DELIVERY
     * */
    assemble_finish(event){
        let that = this
        order_id = event.currentTarget.dataset.order_id
        index = event.currentTarget.dataset.idx
        const session = qcloud.Session.get()
        wx.showModal({
            title: '提示',
            content: '确定商品已经配齐',
            success (res) {
                if (res.confirm) {
                    qcloud.request({
                        url: `${config.service.host}/seller/assemble_finish` ,
                        data: {order_id:event.currentTarget.dataset.order_id,open_id:that.data.userInfo.openId},
                        method: 'POST',
                        header: { 'content-type':'application/x-www-form-urlencoded' },
                        success(result) {
                            //因为配单只能一个人做，所以只用删除自己的配单列表中的商品即可
                            that.data.assemble_list.splice(index,1)
                            that.data.tabs[1][1] = that.data.tabs[1][1] - 1
                            that.setData({
                                assemble_list:that.data.assemble_list,
                                tabs:that.data.tabs
                            })
                        },
                        fail(error) {
                            util.showModel('请求失败', error);
                            console.log('request fail', error);
                        }
                    })
                } else if (res.cancel) {
                    return 
                }
            }
        })
    },

    //快递小哥取消送货
    cancle_delivery:function (event){
        let that = this
        index = event.currentTarget.dataset.idx
        order_id = event.currentTarget.dataset.order_id
        wx.showModal({
            title: '提示',
            content: '该订单正在退款流程,我已知晓',
            success (res) {
                if (res.confirm) {
                    qcloud.request({
                        url: `${config.service.host}/seller/cancle_delivery/` + order_id,
                        success(result) {
                            //console.log(result)
                            ////that.sendMessage('delivery_cancle',order_id)
                            //that.remove_order_from_delivery(index)
                        }
                    })
                } else if (res.cancel) {
                    return 
                }
            }
        })
    },

    /*
     * 用户签收了，就是送达了
     * */
    user_signed:function (event){
        let that = this
        index = event.currentTarget.dataset.idx
        order_id = event.currentTarget.dataset.order_id
        wx.showModal({
            title: '提示',
            content: '确实送到了，不是误操作',
            success (res) {
                if (res.confirm) {
                    qcloud.request({
                        url: `${config.service.host}/seller/user_signed/` + order_id,
                        success(result) {
                            //that.remove_order_from_delivery(index)
                        }
                    })
                } else if (res.cancel) {
                    return 
                }
            }
        })
    },

    /*
     * 商家同意退款
     * */
    agree_refund:function (event){
        let that = this
        order_id = event.currentTarget.dataset.order_id
        index = event.currentTarget.dataset.idx
        wx.showModal({
            title: '提示',
            content: '请确保货物并未送达再退款！',
            success (res) {
                if (res.confirm) {
                    qcloud.request({
                        url: `${config.service.host}/seller/agree_refund/` ,
                        data: {order_id:order_id,open_id:that.data.userInfo.openId},
                        method: 'POST',
                        header: { 'content-type':'application/x-www-form-urlencoded' },
                        success(result) {
                            if(result.data.return_code === "SUCCESS"){
                                that.data.wait_refund_list.splice(index,1);
                                that.data.tabs[3][1] = that.data.tabs[3][1] - 1
                                that.setData({
                                    tabs:that.data.tabs,
                                    wait_refund_list:that.data.wait_refund_list
                                })
                            }
                        },
                        fail(error) {
                            util.showModel('请求失败', error);
                            console.log('request fail', error);
                        }
                    })
                } else if (res.cancel) {
                    return 
                }
            }
        })
    }

});
