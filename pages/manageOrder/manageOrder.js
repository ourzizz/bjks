/**
 * @fileOverview 聊天室综合 Demo 示例
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
            return i;
        }
    }
    return -1;
}

Page({

    data: {
        tabs: [['待接单', 0], ['待发货', 0], ['退款列表', 1]],
        activeIndex: 0,
        sliderOffset: 0,
        sliderLeft: 0,
        wait_pick_order_list:[],//待接单列表
        wait_delivery_order_list: [],//待投递订单
        wait_refund_list:[],
        finished_order_list: [],
        userinfo: {},
        logged: false,
        open_id: '',
        openId : '12312123',
        step:0,//接单后进入配单页，step为1，配单后给包裹贴单，点击完成step置0，回到接单页，
        assemble_order:''
    },

    /*
     *店员点击接单，
     *1.本地的wait_delivery_order_list删除该订单，进入到配单页
     *2.通知服务器这个单子谁接了
     *3.服务器给单子上锁，避免重复配单
     *4.服务器广播给所有店员端删掉该订单
     * */
    pick_order(event){
        let that = this
        order_id = event.currentTarget.dataset.order_id
        index = event.currentTarget.dataset.idx
        const session = qcloud.Session.get()
        qcloud.request({
            url: `${config.service.host}/seller/pick_orders` ,
            data: {order_id:event.currentTarget.dataset.order_id,open_id:this.data.userInfo.openId},
            method: 'POST',
            header: { 'content-type':'application/x-www-form-urlencoded' },
            //成功之后，调用小程序微信支付
            success(result) {
                that.data.assemble_order = that.data.wait_pick_order_list[index]
                that.setData({
                    step:1,
                    assemble_order:that.data.assemble_order
                })
                that.remove_order_from_wait_pick(index)
            },
            fail(error) {
                util.showModel('请求失败', error);
                console.log('request fail', error);
            }
        })
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
        this.data.tabs[1][1] = this.data.wait_delivery_order_list.length
        this.setData({
            tabs:this.data.tabs,
            wait_delivery_order_list:this.data.wait_delivery_order_list 
        })
    },

    push_delivery(order){
        this.data.wait_delivery_order_list.push(order)
        this.data.tabs[1][1] = this.data.wait_delivery_order_list.length
        this.setData({
            tabs:this.data.tabs,
            wait_delivery_order_list:this.data.wait_delivery_order_list
        })
    },

    push_refund(order){
        this.data.wait_refund_list.push(order)
        this.data.tabs[2][1] = this.data.wait_refund_list.length
        this.setData({
            tabs:this.data.tabs,
            wait_refund_list:this.data.wait_refund_list
        })
    },


    assemble_finish(){//配单
        this.push_delivery(this.data.assemble_order)
        this.setData({step:0})
    },

    init_list(weburl,callback){
        let that = this
        qcloud.request({
            url: weburl,
            success(result) {
                callback(result)
            },
            fail(error) {
                util.showModel('请求失败', error);
                console.log('request fail', error);
            }
        })
    },

    /**
     * 页面渲染完成后，启动聊天室
     * */
    onReady () {
        let that = this
        wx.setNavigationBarTitle({ title: '商家订单管理' });
        wx.getSystemInfo({
            success: function (res) {
                that.setData({
                    sliderLeft: (res.windowWidth / that.data.tabs.length - sliderWidth) / 2, /*横向条离左边的间距*/
                        sliderOffset: res.windowWidth / that.data.tabs.length * 0 /*横向条离左边的距离偏移量*/
                    });
            }
        });

                this.init_list(`${config.service.host}/seller/get_wait_refund_orders`,result => {
                    this.data.tabs[2][1] = result.data.length
                    this.setData({
                        wait_refund_list:result.data,
                        tabs:this.data.tabs
                    })
                })
                this.init_list(`${config.service.host}/seller/get_wait_pick_orders`,result => {
                    this.data.tabs[0][1] = result.data.length
                    this.setData({
                        wait_pick_order_list:result.data,
                        tabs:this.data.tabs
                    })
                })
                this.init_list(`${config.service.host}/seller/get_delivery_orders`,result => {
                    this.data.tabs[1][1] = result.data.length
                    this.setData({
                        wait_delivery_order_list:result.data,
                        tabs:this.data.tabs
                    })
                })
                if (!this.pageReady) {
                    this.pageReady = true;
                    this.enter();
                }
    },

    /**
     * 后续后台切换回前台的时候，也要重新启动聊天室
     */
    onShow  () {
        if (this.pageReady) {
            this.enter();
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
        //var tunnel = this.tunnel = new qcloud.Tunnel(config.service.orderTunnelUrl);

        // 连接成功后，去掉「正在加入群聊」的系统提示
        tunnel.on('connect', () => console.log('getin'));

        // 客户下单后服务器会通过信道发来的order信息
        tunnel.on('order',order => {
            this.push_order(order.order_info)
        });

        // 有人说话，创建一条消息
        tunnel.on('pick', speak => {
            index = findOrderById(pick.order_id)
            this.remove_order_from_wait_pick(index)
        });

        // 有人说话，创建一条消息
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
        });

        // 信道关闭后，显示退出群聊
        tunnel.on('close', () => {
            console.log('quit') ;
        });

        // 重连提醒
        tunnel.on('reconnecting', () => {
            //this.pushMessage(createSystemMessage('已断线，正在重连...'));
        });

        tunnel.on('reconnect', () => {
            //this.amendMessage(createSystemMessage('重连成功'));
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
            //this.pushMessage(createSystemMessage('您还没有加入群聊，请稍后重试'));
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
                            that.sendMessage('delivery_cancle',order_id)
                            that.remove_order_from_delivery(index)
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
                            that.sendMessage('user_signed',order_id)
                            that.remove_order_from_delivery(index)
                        }
                    })
                } else if (res.cancel) {
                    return 
                }
            }
        })
    }

});
