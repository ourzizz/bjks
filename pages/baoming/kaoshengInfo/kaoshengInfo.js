// pages/writeMsg/writeMsg.js
var qcloud = require('../../../vendor/wafer2-client-sdk/index')
var config = require('../../../config')
var util = require('../../../utils/util.js')
var cls = require('../../../utils/myclass.js')
var cosPath = "http://bjks-1252192276.cos.ap-chengdu.myqcloud.com"
var app = getApp()
Page({
    data: {
        kaosheng_flg:"new",
        kaoshengInfo: {
            photoUrl:"null"
        },
        userInfo:{},
        logged:false,
        localImagePath:'', //小程序wxml页面显示的图片列表,如果是修改那么就是从服务器请求的url，否则为本地选中的图片列表
        imageName:'', //upload返回的是url和name，以前开发保留了name用逗号连接存到数据库，这个列表是存储使用的,服务器发来的namelist
        tempFilePath:'', //待上传列表
        pub_lock:'unlock',//发布锁，避免用户多次点击 unlock lock
        minganStatus:true
    },

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
                    that.data.imageName = result.data.photoUrl.replace(cosPath,'')
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
        var nameRegx = new RegExp('^[\u4E00-\u9FA5]{2,4}$','g');
        var sfzRegx = new RegExp('[1-9][0-9]{5}([1][9][0-9]{2}|[2][0][0|1][0-9])([0][1-9]|[1][0|1|2])([0][1-9]|[1|2][0-9]|[3][0|1])[0-9]{3}([0-9]|[X])$','g');
        var telphoneRegx = new RegExp('(^1[3|4|5|7|8][0-9]{9}$)', 'g');
        let kaoshengInfo = this.data.kaoshengInfo
        //this.data.kaoshengInfo.photoUrl =  this.data.imageNameList.join(",")
        if (!nameRegx.exec(kaoshengInfo.name)) {
            util.showModel("输入有误", "名字只能是中文");
            return false
        } else if (!telphoneRegx.exec(kaoshengInfo.telphone)) {
            util.showModel("信息格式错误", "电话填写错误");
            return false
        } else if (!sfzRegx.exec(kaoshengInfo.sfzid)) {
            util.showModel("信息不全", "身份证填写错误");
            return false
        } else if(kaoshengInfo.photoUrl == "null"){
            util.showModel("信息不全", "请上传一寸照");
            return false
        }
        return true 
    },//}}}


    cancle: function () {//{{{
        if(this.data.kaosheng_flg === "new"){//新建信息放弃发布，删除所有已经上传图片,修改的话不能删除
            this.clear_cos()
        }
        this.jump()//返回上级页面
    },//}}}

    //在列表中删除图片并setData
    image_display:function (idx){//{{{
        this.data.localImagePaths.splice(idx,1)
        this.data.imageNameList.splice(idx,1)
        this.setData({
            localImagePaths:this.data.localImagePaths
        })
    },//}}}


    //用户点击发布提交表单
    submit:function (){//{{{
        if (this.check_message() && this.data.pub_lock === 'unlock') {
            this.setData({pub_lock:'lock'})//避免连续多次点击发布按钮
            if(this.data.kaosheng_flg === "new"){//新发布
                this.new_kaosheng()
            }else{//更新数据库
                this.update_kaosheng()
            }
        }else{
        }
    },//}}}

    //保存修改的信息
    update_kaosheng:function (){//{{{
        var that = this
        qcloud.request({
            url: `${config.service.host}/baoming/kaoshengInfo/update_kaosheng`,
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

    //新建考生信息
    new_kaosheng: function () {//{{{
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


    //新上传的图片放到db中
    img_to_db:function (open_id,imgUrl){//{{{
        //请求后台update图片数据
        qcloud.request({
            url: `${config.service.host}/baoming/kaoshengInfo/update_db_img`,
            data: {
                open_id:open_id,
                imgUrl:imgUrl
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

    //修改信息，用户上传图片,本文件中只允许上传一张照片
    chooseImage: function (event) {//{{{
        var that = this;
        wx.chooseImage({
            count: 1, // 一次最多可以选择2张图片一起上传
            sizeType: ['compressed'], // 可以指定是原图还是压缩图，默认二者都有
            sourceType: ['album'], // 可以指定来源是相册还是相机，默认二者都有
            success: function (res) {
                that.data.localImagePath = res.tempFilePaths[0];
                that.setData({
                    localImagePath:that.data.localImagePath
                });
                //文件上传中禁止点发布，否则上传不完整
                that.pub_lock = "lock"
                util.showBusy('正在上传')
                that.upload_cos(that.data.localImagePath)
                that.pub_lock = "unlock"
            }
        })
    },//}}}

    //新上传到cos cos返回图片名称 再同步到db中
    upload_cos:function (filePath){//{{{
        let that = this
        wx.uploadFile({
            url: config.service.uploadUrl,
            filePath: filePath,
            name: 'file',
            success: function(res) {
                res = JSON.parse(res.data)
                that.delete_cos_img(that.data.imageName)//删除上一张图片
                that.data.imageName = res.data.name
                if(that.data.kaosheng_flg === "edit"){//如果是编辑态，需要更新db，前面已经删掉了原图片
                    that.img_to_db(that.data.kaoshengInfo.open_id , res.data.imgUrl)
                }
                that.data.kaoshengInfo.photoUrl = res.data.imgUrl
                that.setData({
                    kaoshengInfo:that.data.kaoshengInfo
                })
                wx.hideToast()
            },
            fail: function(e) {
                util.showModel('上传图片失败')
            }
        })//end_uploadFile
    },//}}}
    //从cos中删除图片，一次一张
    delete_cos_img:function (img_name){//{{{
        var that = this
        qcloud.request({
            url: `${config.service.host}/baoming/kaoshengInfo/delete_cos_img`,
            data: {img_name:img_name},
            method: 'POST',
            header: { 'content-type':'application/x-www-form-urlencoded' },
            success(result) {
                console.log(result)
            },
            fail(error) {
                util.showModel('请求失败', error);
                console.log('request fail', error);
            }
        })
    },//}}}

    previewImage: function () {//{{{
        var localImagePaths = [];
        localImagePaths[0] = this.data.kaoshengInfo.photoUrl;
        wx.previewImage({
            current: 0,
            urls: localImagePaths
        });
    },//}}}

    jump:function (){
    },
})
