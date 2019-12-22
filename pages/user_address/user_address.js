/* 后台的增删改开发完成，前端用户输入校验立即开发 
 * 天坑，才上线第一天就被bug打下来,编辑发送的地址不能保存，也不报错，因为他妈url没有做转换,包含有特殊字符。必须用POST
 * */
var qcloud = require('../../vendor/wafer2-client-sdk/index')
var config = require('../../config')
var util = require('../../utils/util.js')
Page({
    data: {
        region: ['贵州省', '毕节市', '七星关区'],
        step:1,
        address_list:[],
        new_address:{},
        open_id:'',
        edit_index:-1,
        submitLock:'unlock' //避免用户多次点击提交,每次进入step2必须将其解锁
    },

    get_address_list:function(open_id){
        let that = this
        qcloud.request({
            url: `${config.service.host}/user_address/get_user_all_address/` + open_id,
            success(result) {
                util.showSuccess('请求成功完成')
                // result.data[0].checked = true
                that.setData({
                    address_list: result.data
                })
            }
        })
    },

    onLoad:function(option) {//o9pU65LTYEE8tVWQR_yClRc1466k
        this.data.open_id = option.open_id
        const session = qcloud.Session.get()
        if (session) {//session存在直接登陆
            this.setData({
                open_id: session.userinfo.openId,
            })
        }
        this.get_address_list(this.data.open_id)
    },

    //选择省市县变化绑定
    bindRegionChange: function (e) {
        console.log('picker发送选择改变，携带值为', e.detail.value)
        this.data.new_address.province = e.detail.value[0]
        this.data.new_address.city = e.detail.value[1]
        this.data.new_address.county = e.detail.value[2]
        this.setData({
            region: e.detail.value,
        })
    },

    edit_address: function (event) {//用户点击编辑
        this.data.edit_index = event.currentTarget.dataset.idx
        this.data.new_address = JSON.parse(JSON.stringify(this.data.address_list[this.data.edit_index]));
        this.setData({
            step:2,
            submitLock:'unlock',
            new_address:this.data.new_address
        })
    },

    input_name:function(e){
        this.data.new_address.name = e.detail.value
    },

    input_telphone:function(e){//textarea 触发
        this.data.new_address.telphone = e.detail.value
    },

    input_detail:function(e){
        this.data.new_address.detail = e.detail.value
    },

    delete_address: function (event) {//用户点击删除
        let idx = event.currentTarget.dataset.idx
        let address_id = this.data.address_list[idx].address_id
        let that = this
        wx.showModal({
            title: '提示',
            content: '确定删除吗',
            success(res) {
                if (res.confirm) {
                    qcloud.request({
                        url: `${config.service.host}/weapp/user_address/user_delete_address/` + that.data.open_id + '/' + address_id,
                        success(result) {
                            that.data.address_list.splice(idx,1)//数组中删除掉用户点击的地址
                            that.setData({
                                address_list: that.data.address_list,
                                step: 1
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
        })//}}}
    },

    create_address: function () {//点击新增，进入步骤2，不携带任何参数
        this.data.new_address = {} //这里的意思需要新分配内存
        this.data.new_address.province = "贵州省"//给默认值贵州毕节七星关
        this.data.new_address.city = "毕节市"
        this.data.new_address.county = "七星关区"
        this.setData({
            step: 2,
            submitLock : 'unlock',
            new_address: this.data.new_address
        })
    },

    //用户edit地址，在这里获得改地址编辑后改变的内容
    get_change: function () {
        var modify = []
        let idx = this.data.edit_index
        let adlist = this.data.address_list
        let newadd = this.data.new_address
        if (adlist[idx].name != newadd.name) {
            modify.push({ 'key': 1, 'value': newadd.name })
        }
        if (adlist[idx].telphone != newadd.telphone) {
            modify.push({ 'key': 2, 'value': newadd.telphone })
        }
        if (adlist[idx].province != newadd.province || adlist[idx].city != newadd.city || adlist[idx].county != newadd.county) {
            modify.push({ 'key': 3, 'value': this.data.region })
        }
        if (adlist[idx].detail != newadd.detail) {
            modify.push({ 'key': 4, 'value': newadd.detail })
        }
        return modify
    },

    //检查用户输入信息
    check_data: function () {
        let newad = this.data.new_address
        var error = ''
        var regtel = new RegExp('(^1[3|4|5|7|8][0-9]{9}$)', 'g');
        if (newad.name == undefined || newad.name.length == 0) {
            error = '收货人未填'
            util.showModel('收货人未填',error)
            return false
        }
        if (newad.detail == undefined || newad.detail.length == 0) {
            error = '详细地址未填'
            util.showModel('详细地址未填',error)
            return false
        }
        if (!regtel.exec(newad.telphone)) { //电话不正确不能通过
            error = '手机格式错误'
            util.showModel('手机格式错误',error)
            return false
        } 
        return true
    },

    submit: function () {
        if ((this.data.submitLock==='unlock') && this.check_data()) {//提交前要进行数据校验,checkdata返回true才能进行后续操作
            this.data.submitLock = "lock"//提交锁,免得老头手机差一直点
            let that = this
            if (this.data.new_address.address_id != null && this.data.new_address.address_id != undefined) {//用户编辑更新地址
            //addressid存在表示这是保存编辑，编辑后modify[{key:1,value:'exmple'}...]后台根据key选择不同的操作将value update到数据库
                var modify = this.get_change()
                if (modify.length !== 0) {//没有改变就没有必要对后台进行请求，节约服务器资源
                    let address_id = this.data.address_list[this.data.edit_index].address_id
                    this.data.address_list[this.data.edit_index] = this.data.new_address//把修改后的值传给list渲染
                    qcloud.request({
                        url: `${config.service.host}/weapp/user_address/user_update_address/`,
                        data: {
                            open_id:this.data.open_id,
                            address_info:JSON.stringify(modify),
                            address_id:address_id
                        },
                        method: 'POST',
                        header: { 'content-type':'application/x-www-form-urlencoded' },
                        success(result) {return null},
                        fail(error) {
                            util.showModel('请求失败', error);
                            console.log('request fail', error);
                        }
                    })
                }//end_if(modify.length !== 0)
                that.setData({//就算是异步也可以放在请求外面执行,放在里面会导致modify为空时不能渲染step1
                    step: 1,
                    address_list: that.data.address_list
                })
            } else {//id不存在表示新建的
                console.log("保存新建地址")
                this.data.address_list.push(this.data.new_address)
                qcloud.request({
                    url: `${config.service.host}/weapp/user_address/user_add_address/`,
                    data: {
                        open_id:this.data.open_id,
                        address:JSON.stringify(this.data.new_address)
                    },
                    method: 'POST',
                    header: { 'content-type':'application/x-www-form-urlencoded' },
                    success(result) {
                        that.get_address_list(that.data.open_id)//提交后返回第一步，需要重新请求地址列表
                        that.setData({
                            step: 1
                        })
                    },
                    fail(error) {
                        util.showModel('请求失败', error);
                        console.log('request fail', error);
                    }
                })
            }//end_else
        }//end_if(check_data)
    },

    db_set_default_address: function (idx) {
        var open_id = this.data.open_id
        var address_id = this.data.address_list[idx].address_id
        qcloud.request({
            url: `${config.service.host}/weapp/user_address/set_default_address/` + open_id + '/' + address_id,
            success(result) {console.log('set_default_success');},
            fail(error) {
                util.showModel('请求失败', error);
                console.log('request fail', error);
            }
        })
    },

    select_default_address_back_to_prepage(e) {//返回用户选择的地址给父页面
        const idx = e.detail.value
        let pages = getCurrentPages();
        let currPage = pages[pages.length - 1]; //当前页面
        let prevPage = pages[pages.length - 2];//上一个页面//直接调用上一个页面的setData()方法，把数据存到上一个页面中去
        this.db_set_default_address(idx)
        prevPage.setData({//修改父页面
            user_default_address: this.data.address_list[idx]
        })
        wx.navigateBack({
            delta: 1
        })
    },

    //取消编辑
    cancle: function () {
        this.data.new_address = {}
        this.setData({
            step: 1
        })
    },

})

//log detail不能通过 textarea不能触发
