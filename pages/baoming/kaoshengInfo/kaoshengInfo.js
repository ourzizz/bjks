// pages/writeMsg/writeMsg.js
var qcloud = require('../../../vendor/wafer2-client-sdk/index')
var config = require('../../../config')
var util = require('../../../utils/util.js')
var cls = require('../../../utils/myclass.js')
var app = getApp()
Page({
    data: {
        kaosheng_flg:"new",
        kaoshengInfo: {},
        userInfo:{},
        logged:false,
        localImagePaths: [], //小程序wxml页面显示的图片列表,如果是修改那么就是从服务器请求的url，否则为本地选中的图片列表
        imageNameList: [], //upload返回的是url和name，以前开发保留了name用逗号连接存到数据库，这个列表是存储使用的,服务器发来的namelist
        tempFilePaths:[], //待上传列表
        pub_lock:'unlock',//发布锁，避免用户多次点击 unlock lock
        minganStatus:true
    },

    //如果调用页面的时候给出的是messageId表示需要修改信息，拿messageid取后台初始化
    init_kaosheng: function (msg_id) {//{{{
    },//}}}

    onLoad: function (options) {//{{{ 需要向后台请求考生基本信息 和报考信息
        let that = this
        const session = qcloud.Session.get()
        if (session) { //session存在
            this.setData({
                userInfo: session.userinfo,
                logged: true
            })
        }
        qcloud.request({
            url: `${config.service.host}/baoming/kaoshengInfo/get_kaosheng_kaoshi`,
            data: {
                open_id:options.openId,
                ksfileid:options.ksid
            },
            method: 'POST',
            header: { 'content-type':'application/x-www-form-urlencoded' },
            success(result) {
                if(result.data == "null"){
                    that.setData({
                        kaosheng_flg:"new",
                        kaoshengInfo:{}
                    }) 
                }else{
                    that.setData({
                        kaosheng_flg:"edit",
                        kaoshengInfo:result.data
                    }) 
                }
            },
            fail(error) {
                util.showModel('请求失败', error);
                console.log('request fail', error);
            }
        })
    },//}}}

    input_name: function (e) {//{{{
        this.data.kaoshengInfo.name = e.detail.value
    },
    input_telphone: function (e) {//textarea 触发
        this.data.kaoshengInfo.telphone = e.detail.value
    },
    input_sfzid:function(e){
        this.data.kaoshengInfo.sfzid = e.detail.value
    },
    input_school:function(e){
        this.data.kaoshengInfo.school = e.detail.value
    },
    input_education:function(e){
        this.data.kaoshengInfo.education = e.detail.value
    },
    input_degree:function(e){
        this.data.kaoshengInfo.degree = e.detail.value
    },

    check_message: function () {//{{{
        //var regtel = new RegExp('(^1[3|4|5|7|8][0-9]{9}$)', 'g');
        //let kaoshengInfo = this.data.kaoshengInfo
        //if (kaoshengInfo.name == "") {
            //util.showModel("信息不全", "联系人没有填写");
            //return false
        //} else if (kaoshengInfo.telphone == "") {
            //util.showModel("信息不全", "联系方式没有填写");
            //return false
        //} else if (kaoshengInfo.content == "") {
            //util.showModel("信息不全", "发布内容不能为空");
            //return false
        //}
        //if (!regtel.exec(kaoshengInfo.telphone)) { //电话不正确不能通过
            //util.showModel('格式错误', '手机格式错误')
            //return false
        //}
        //this.data.kaoshengInfo.images_name =  this.data.imageNameList.join(",")
        return true
    },//}}}

    //delete_img_by
    //非常规操作，既没有点击发布也没有点击取消，或者是被打断，应该要清理cos中的数据
    //否则会产生很多僵尸图片
    clear_cos:function (){//{{{
        for(let i=0;i<this.data.imageNameList.length;i++){
            this.delete_cos_img(this.data.imageNameList[i])
        }
    },//}}}

    cancle: function () {//{{{
        if(this.data.kaosheng_flg === "new"){//新建信息放弃发布，删除所有已经上传图片,修改的话不能删除
            this.clear_cos()
        }
        this.jump()
    },//}}}


    //在列表中删除图片并setData
    image_display:function (idx){//{{{
        this.data.localImagePaths.splice(idx,1)
        this.data.imageNameList.splice(idx,1)
        this.setData({
            localImagePaths:this.data.localImagePaths
        })
    },//}}}


    //删除图片1删除cos 2如果是editMsg还需要去掉DB中的图片
    delete_img:function (event){//{{{
        var that = this
        var idx = event.currentTarget.dataset.idx
        var img_name = this.data.imageNameList[idx]
        this.delete_cos_img(img_name)
        if(this.data.kaosheng_flg === "edit"){//如果是修改消息，就必须修改数据库
            this.delete_db_img(this.data.kaoshengInfo.msg_id , img_name )
        }
        this.image_display(idx)
    },//}}}

    //从cos中删除图片，一次一张
    delete_cos_img:function (img_name){//{{{
        var that = this
        qcloud.request({
            url: `${config.service.host}/community/delete_cos_img`,
            data: {img_name:img_name},
            method: 'POST',
            header: { 'content-type':'application/x-www-form-urlencoded' },
            success(result) {
            },
            fail(error) {
                util.showModel('请求失败', error);
                console.log('request fail', error);
            }
        })
    },//}}}

    //从数据库中删除图片存储
    delete_db_img:function (msg_id,img_name){//{{{
        var that = this
        qcloud.request({
            url: `${config.service.host}/kaoshengInfo/delete_db_img`,
            data: {
                open_id:that.data.userInfo.openId,
            },
            method: 'POST',
            header: { 'content-type':'application/x-www-form-urlencoded' },
            success(result) {
            },
            fail(error) {
                util.showModel('请求失败', error);
                console.log('request fail', error);
            }
        })
    },//}}}

    //用户点击发布提交表单
    submit:function (){//{{{
        if (this.check_message() && this.data.pub_lock === 'unlock') {
            this.setData({pub_lock:'lock'})//避免连续多次点击发布按钮
            if(this.data.kaosheng_flg === "new"){//新发布
                this.publish_message()
            }else{//更新数据库
                this.update_message()
            }
        }else{
        }
    },//}}}

    //保存修改的信息
    update_message:function (){//{{{
        var that = this
        qcloud.request({
            url: `${config.service.host}/community/update_message`,
            data: {
                kaoshengInfo: JSON.stringify(this.data.kaoshengInfo)
            },
            method: 'POST',
            header: { 'content-type': 'application/x-www-form-urlencoded' },
            success(result) {
                that.jump()
            },
            fail(error) {
                that.jump()
            }
        })
    },//}}}

    //发布消息
    publish_message: function () {//{{{
        let that = this
        let kaoshengInfo = that.data.kaoshengInfo
        kaoshengInfo.open_id = this.data.userInfo.openId
        qcloud.request({
            url: `${config.service.host}/baoming/kaoshengInfo/store_kaosheng`,
            data: {
                kaoshengInfo: JSON.stringify(kaoshengInfo)
            },
            method: 'POST',
            header: { 'content-type': 'application/x-www-form-urlencoded' },
            success(result) {
            },
            fail(error) {
            }
        })
    },//}}}

    delete_local_img_by_filepath:function(filepath){
        for(let i=0;i<this.data.localImagePaths.length;i++){
            if(filepath === this.data.localImagePaths[i]){
                this.data.localImagePaths.splice(i,1)
            }
        }
    },
    //上传图片，分为两个子操作，upload_Cos,img_to_db
    //新上传到cos cos返回图片名称 再同步到db中
    upload_cos:function (filePath,idx){//{{{
        let that = this
        //上传图片
        wx.uploadFile({
            url: config.service.uploadUrl,
            filePath: filePath,
            name: 'file',
            success: function(res) {
                res = JSON.parse(res.data)
                if(res.data === 'mingantu'){
                    that.delete_local_img_by_filepath(filePath)
                    that.setData({
                        localImagePaths:that.data.localImagePaths
                    })
                    util.showModel("图片不规范", "请遵守国家法律法规,重新上传!") 
                }else{
                    that.data.imageNameList.push(res.data.name)
                    if(that.data.kaosheng_flg === "edit"){
                        that.img_to_db(that.data.kaoshengInfo.msg_id , res.data.name )
                    }
                }
            },
            fail: function(e) {
                util.showModel('上传图片失败')
            }
        })//end_uploadFile
    },//}}}

    //新上传的图片放到db中
    img_to_db:function (msg_id,img_name){//{{{
        //请求后台update图片数据
        qcloud.request({
            url: `${config.service.host}/community/db_add_img`,
            data: {
                msg_id:msg_id,
                img_name:img_name
            },
            method: 'POST',
            header: { 'content-type':'application/x-www-form-urlencoded' },
            success(result) {
            },
            fail(error) {
                util.showModel('请求失败', error);
                console.log('request fail', error);
            }
        })
    },//}}}

    //修改信息，用户上传图片
    chooseImage: function (event) {//{{{
        var that = this;
        let remain = 6 - this.data.localImagePaths.length
        if(remain > 0){
            wx.chooseImage({
                count: remain, // 一次最多可以选择2张图片一起上传
                sizeType: ['original', 'compressed'], // 可以指定是原图还是压缩图，默认二者都有
                sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
                success: function (res) {
                    that.data.localImagePaths = that.data.localImagePaths.concat(res.tempFilePaths);
                    that.setData({
                        localImagePaths:that.data.localImagePaths 
                    });
                    //文件路径最新选择的所有图片
                    var filePath = res.tempFilePaths
                    that.data.tempFilePaths = res.tempFilePaths
                    //文件上传中禁止点发布，否则上传不完整
                    that.pub_lock = "lock"
                    util.showBusy('正在上传')
                    for(var i=0;i<filePath.length;i++){
                        that.upload_cos(filePath[i],i)
                    }
                    //wx.hideToast()
                    that.pub_lock = "unlock"
                }
            })
        }
    },//}}}

    previewImage: function (e) {//{{{
        var that = this;
        var dataid = e.currentTarget.dataset.id;
        var localImagePaths = that.data.localImagePaths;
        wx.previewImage({
            current: localImagePaths[dataid],
            urls: this.data.localImagePaths
        });
    },//}}}

    jump:function (){
        app.globalData.edit_class_id = this.data.kaoshengInfo.class_id
        wx.switchTab({
            url: '../index/index',
        })
    }
})
