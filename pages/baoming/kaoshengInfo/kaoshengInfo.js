/**
 * 考生信息填写点击保存后姓名和身份证就变成不可修改字段
 */
var qcloud = require('../../../vendor/wafer2-client-sdk/index')
var config = require('../../../config')
var util = require('../../../utils/util.js')
var cls = require('../../../utils/myclass.js')
var cosPath = "http://bjks-1252192276.cos.ap-chengdu.myqcloud.com"
var app = getApp()
Page({
    data: {
        filltable: [
            { key: 'name', onoff:'on', lable: '姓名', value: '',placeholder:'不可修改字段' },
            { key: 'sfzid', onoff:'on', lable: '身份证号', value: '', placeholder:'不可修改字段'},
            { key: 'birthday', onoff:'on', lable: '出生日期', value: '',placeholder:'出生日期' },
            { key: 'degree', onoff:'on', lable: '学位', value: '',placeholder:'学位'},
            { key: 'education', onoff:'on', lable: '学历', value: '',placeholder:'学历'},
            { key: 'school', onoff:'on', lable: '毕业学校', value: '',placeholder:'毕业学校' },
            { key: 'graduationDate', onoff:'on', lable: '毕业日期', value: '',placeholder:'毕业时间' },
            { key: 'sex', onoff:'on', lable: '性别', value: '',placeholder:'男或女'},
            { key: 'telphone', onoff:'on', lable: '电话', value: '', placeholder:'联系电话'},
            { key: 'major', onoff:'on', lable: '所学专业', value: '',placeholder:'须与毕业证一致' },
            { key: 'danwei', onoff:'on', lable: '工作单位', value: '',placeholder:'工作单位' },
            { key: 'jobtime', onoff:'on', lable: '工作时间', value: '',placeholder:'参加工作时间' },
            { key: 'placeOfBirth', onoff:'on', lable: '户籍地', value: '',placeholder:'出生地' },
            { key: 'nationality', onoff:'on', lable: '民族', value: '',placeholder:'民族' },
            { key: 'certificate', onoff:'on', lable: '资格证书', value: '',placeholder:'资格证书' },
            { key: 'resume', onoff:'on', lable: '简历', value: '',placeholder:'从高中开始填写' }
        ],
        ksid: '',
        options:{},
        config:{}, //填报页面的配置属性
        step:0,
        activeIndex: -1,
        kaosheng_flg:"new",
        kaoshengInfo: {
            photoUrl:"null"
        },
        kaoshengInfoCopy:{},//考生副本用于对比原始数据找出修改部分
        userInfo:{},
        logged:false,
        localImagePath:'', //小程序wxml页面显示的图片列表,如果是修改那么就是从服务器请求的url，否则为本地选中的图片列表
        imageName:'', //upload返回的是url和name，以前开发保留了name用逗号连接存到数据库，这个列表是存储使用的,服务器发来的namelist
        tempFilePath:'', //待上传列表
        tree_list:[],//职位表树形结构列表
        layer:[], //存储层级代码长度
        baomingInfo:{},//给后台增改(一旦报名不能删除) 包括报考职位代码 确认状态 审核情况 未通过原因
        baomingInfoCopy:{},//副本 涉及到改的都需要副本对比
        zhiweiPath:[],//view考生只管查看已经勾选的报考地区-单位-职位信息
        operas:[
            {step:0,name:"信息填写",onoff:true},//step1一直开放
            {step:1,name:"上传照片",onoff:false},//默认关闭 已经填过信息或者保存成功的考生开启上传
            {step:2,name:"选择职位",onoff:false},
            {step:3,name:"信息确认",onoff:false},
            {step:4,name:"查看信息",onoff:false},
        ]
    },

    init_kaoshengInfo:function(openId,ksid){
        let that = this
        util.showBusy("下载数据中")
        qcloud.request({
            url: `${config.service.host}/baoming/kaoshengInfo/get_kaoshengInfo`,
            data: {
                open_id:openId,
                ksid:ksid,
            },
            method: 'POST',
            header: { 'content-type':'application/x-www-form-urlencoded' },
            success(result) {
                wx.hideToast()
                if(result.data.kaoshengInfo == null){//考生没有填写过任何信息
                    that.setData({
                        kaosheng_flg:"new",
                        kaoshengInfo:{photoUrl:'null',ksid:ksid,sfzid:'522401198508292031',name:'测试',telphone:'13308570523'},
                        // kaoshengInfo:{photoUrl:'null',ksid:ksid},
                    }) 
                }else{//有考生信息
                    that.data.imageName = result.data.kaoshengInfo.photoUrl.replace(cosPath,'')
                    that.data.operas[1].onoff = true
                    if(result.data.kaoshengInfo.photoUrl != 'null'){//考生已经上传图片 开放选择职位步骤
                        that.data.operas[2].onoff = true
                    }
                    that.setData({
                        kaosheng_flg:"edit",
                        kaoshengInfo:result.data.kaoshengInfo,
                    }) 
                }
                that.init_fillTable(that.data.kaoshengInfo)
                that.data.kaoshengInfoCopy = JSON.parse(JSON.stringify(result.data.kaoshengInfo));
                that.setData({
                    operas:that.data.operas
                }) 
            },
            fail(error) {
                util.showModel('请求失败', error);
                console.log('request fail', error);
            }
        })
    },

    init_baomingInfo:function(openId,ksid){
        let that = this
        util.showBusy("下载数据中")
        qcloud.request({
            url: `${config.service.host}/baoming/kaoshengInfo/get_baomingInfo`,
            data: {
                open_id:openId,
                ksid:ksid,
            },
            method: 'POST',
            header: { 'content-type':'application/x-www-form-urlencoded' },
            success(result) {
                wx.hideToast()
                if (result.data.baomingInfo === null) {//无报名信息=>考生以往报过其他考试 本考试未报名,报名未确认
                    result.data.baomingInfo = {open_id:openId,ksid:ksid,code:"",bmconfirm:0}
                }else{
                    that.getPath(result.data.baomingInfo.code)
                    that.data.operas[1].onoff = true //有报名信息证明 填写 照片 职位都完成了 需要打开全部环节
                    that.data.operas[2].onoff = true 
                    that.data.operas[3].onoff = true
                    that.data.operas[4].onoff = true
                }
                that.data.baomingInfoCopy = JSON.parse(JSON.stringify(result.data.baomingInfo));
                that.setData({
                    zhiweiPath:that.data.zhiweiPath,
                    baomingInfo:result.data.baomingInfo,
                    operas:that.data.operas
                }) 
            },
            fail(error) {
                util.showModel('请求失败', error);
                console.log('request fail', error);
            }
        })
    },

    init_zhiwei:function(ksid){
        let that = this
        util.showBusy("下载数据中")
        qcloud.request({
            url: `${config.service.host}/baoming/kaoshengInfo/get_zhiwei`,
            data: {
                ksid:ksid,
            },
            method: 'POST',
            header: { 'content-type':'application/x-www-form-urlencoded' },
            success(result) {
                that.data.tree_list = result.data.zhiwei
                that.init_tree_list(that.data.tree_list)
                that.setData({
                    tree_list:that.data.tree_list,
                    zhiweiPath:that.data.zhiweiPath
                })
            },
            fail(error) {
                util.showModel('请求失败', error);
                console.log('request fail', error);
            }
        })
    },

    init_fillTable:function(kaoshengInfo){
        const map = new Map(Object.entries(kaoshengInfo))
        var ft = this.data.filltable
        for(var i=0;i<ft.length;i++){
            ft[i].value = map.get(ft[i].key)
        }
        this.setData({
            filltable:ft
        })
    },

    init_opears:function(){},

    onLoad: function (options) {//{{{ 需要向后台请求考生基本信息 和报考信息
        let that = this
        this.data.ksid = options.ksid
        const session = qcloud.Session.get()
        if (session) { //session存在
            this.setData({
                userInfo: session.userinfo,
                logged: true,
                options:options
            })
        }
        this.init_kaoshengInfo(options.openId,options.ksid) //onLoad里面init考生顺带顺带表单初始化 没有办法避免耦合
        this.init_zhiwei(options.ksid)
        this.init_baomingInfo(options.openId,options.ksid) //异步执行很烦人
        // this.init_page(options.openId,options.ksid,options.configId)
    },//}}}

    init_tree_list:function(tree_list){
        var layer = this.data.layer
        this.data.tree_list.forEach(element => {
            //遍历一遍tree 计算每个节点layer 生成layer数组确定数组索引为层级 元素为长度 
            var idx = -1
            for(var i=0;i<layer.length;i++){
                if(layer[i] === element.code.length){
                    idx = i
                }
            }
            if(idx === -1){
                element.layer = layer.length
                layer.push(element.code.length)
            }else{
                element.layer = idx 
            }

            if(element.layer === 0){
                element.show_self = true
            }else{
                element.show_self = false
            }
            element.show_sons = false
        });
    },

    operate_tree: function (event) {
        var tree_list = this.data.tree_list
        var idx = event.currentTarget.dataset.idx
        if (tree_list[idx].show_sons == true) {
            this.close_node(tree_list[idx])
        } else {
            this.open_node(tree_list[idx])
        }
        this.setData({
            tree_list: tree_list,
            activeIndex: idx,
        })
    },

    open_node: function (node) {//打开一个节点，所有同级的下级全部折叠
        var tree_list = this.data.tree_list
        var parentCode = node.code
        node.show_sons = true;
        tree_list.forEach(element => {
            if (element.pptr === parentCode) {
                element.show_self = true
                if(element.cptr != 0 && element.show_sons ==true){
                    this.open_node(element)
                }
            }
        });
    },

    close_node: function (node) {
        var tree_list = this.data.tree_list
        node.show_sons = false //这里应该给idx 设置treelist
        var parentCode = node.code
        tree_list.forEach(element => {
            if (element.code.indexOf(parentCode)!==-1 && element.layer>node.layer) {
                element.show_self = false
            }
        });
    },


    set_idx: function (event) {
        var idx = event.currentTarget.dataset.idx
        this.setData({
            activeIndex: idx
        })
    },

    radioChange: function (e) {
        var path = []
        var idx = this.data.activeIndex
        var code = e.detail.value
        this.getPath(code)
        this.data.tree_list.forEach(element => {
            if(element.code !== code){
                element.checked = false
            }else{
                element.checked = true
            }
            this.init_tree_list()
        });
        this.data.baomingInfo.code = code
        this.setData({
            tree_list:this.data.tree_list,
            zhiweiPath:this.data.zhiweiPath,
        })
    },

    getPath:function(code){ //"1240202201"
        var layer = this.data.layer 
        var tempCode = ""
        this.data.zhiweiPath = []
        for(var i=0;i<layer.length;i++){
            tempCode = code.substr(0,layer[i])
            this.data.tree_list.forEach(element => {
                if (element.code === tempCode) {
                    this.data.zhiweiPath.push(element.description)
                }
            });
        }
    },

    baoming_confirm: function () {
        let that = this
        wx.showModal({
            title: '请确认',
            content: '确认后所有信息将被锁定不可修改',
            success(res) {
                if (res.confirm) {
                    qcloud.request({
                        url: `${config.service.host}/baoming/kaoshengInfo/bmconfirm`,
                        data: {
                            baomingInfo: JSON.stringify(that.data.baomingInfo)
                        },
                        method: 'POST',
                        header: { 'content-type': 'application/x-www-form-urlencoded' },
                        success(result) {//更新后 更新所有副本
                            that.data.baomingInfo.bmconfirm = '1'
                            that.setData({
                                baomingInfo: that.data.baomingInfo
                            })
                        },
                        fail(error) {
                            that.jump()
                        }
                    })
                } else if (res.cancel) {
                    return
                }
            }
        }) //}}}
    },

    input_change: function (e) {
        var kaoshengInfo = this.data.kaoshengInfo
        switch (e.currentTarget.dataset.key) {
            case 'graduationDate':
                kaoshengInfo.graduationDate = e.detail.value;
                break;
            case 'birthday':
                kaoshengInfo.birthday = e.detail.value;
                break;
            case 'sfzid':
                kaoshengInfo.sfzid = e.detail.value;
                break;
            case 'name':
                kaoshengInfo.name = e.detail.value
                break;
            case 'degree':
                kaoshengInfo.degree = e.detail.value
                break;
            case 'education':
                kaoshengInfo.education = e.detail.value
                break;
            case 'school':
                kaoshengInfo.school = e.detail.value
                break;
            case 'sex':
                kaoshengInfo.sex = e.detail.value
                break;
            case 'telphone':
                kaoshengInfo.telphone = e.detail.value
                break;
            case 'major':
                kaoshengInfo.major = e.detail.value
                break;
            case 'danwei':
                kaoshengInfo.danwei = e.detail.value
                break;
            case 'jobtime':
                kaoshengInfo.jobtime = e.detail.value
                break;
            case 'placeOfBirth':
                kaoshengInfo.placeOfBirth = e.detail.value
                break;
            case 'nationality':
                kaoshengInfo.nationality = e.detail.value
                break;
            case 'certificate':
                kaoshengInfo.certificate = e.detail.value
                break;
            case 'resume':
                kaoshengInfo.resume = e.detail.value
                break;
        }
    },

    check_message: function () {//{{{
        var nameRegx = new RegExp('^[\u4E00-\u9FA5]{2,4}$','g');
        var sfzRegx = new RegExp('[1-9][0-9]{5}([1][9][0-9]{2}|[2][0][0|1][0-9])([0][1-9]|[1][0|1|2])([0][1-9]|[1|2][0-9]|[3][0|1])[0-9]{3}([0-9]|[X])$','g');
        var telphoneRegx = new RegExp('(^1[3|4|5|7|8][0-9]{9}$)', 'g');
        let kaoshengInfo = this.data.kaoshengInfo
        //this.data.kaoshengInfo.photoUrl =  this.data.imageNameList.join(",")
        if (!nameRegx.exec(kaoshengInfo.name)) {
            util.showModel("输入有误", "名字只能是中文不能含有空格");
            return false
        } else if (!telphoneRegx.exec(kaoshengInfo.telphone)) {
            util.showModel("信息格式错误", "电话填写错误");
            return false
        } else if (!sfzRegx.exec(kaoshengInfo.sfzid)) {
            util.showModel("信息不全", "身份证填写错误");
            return false
        } 
        return true 
    },//}}}

    //用户点击提交
    submit:function (){//{{{
        if (this.check_message()) {
            if(this.data.kaosheng_flg === "new"){//新增考生信息
                this.new_kaosheng()
            }else{//更新数据库
                this.update_kaosheng()
            }
        }else{
        }
    },//}}}

    submit_zhiwei:function(){
        let that = this
        if(this.data.baomingInfo.code !== this.data.baomingInfoCopy.code){//报考职位有变化
            let bmtemp = {}
            bmtemp.open_id = that.data.baomingInfo.open_id
            bmtemp.ksid = that.data.baomingInfo.ksid
            bmtemp.code = that.data.baomingInfo.code
            qcloud.request({
                url: `${config.service.host}/baoming/kaoshengInfo/baoming`,
                data: {
                    baomingInfo: JSON.stringify(bmtemp)
                },
                method: 'POST',
                header: { 'content-type': 'application/x-www-form-urlencoded' },
                success(result) {//更新后 更新所有副本
                    that.init_baomingInfo(that.data.options.openId,that.data.options.ksid)
                    wx.hideToast()
                },
                fail(error) {
                    that.jump()
                }
            })
        }
    },

    get_modify:function(){
        var ksCopy = this.data.kaoshengInfo
        var ksOrigin = this.data.kaoshengInfoCopy
        var keys = Object.getOwnPropertyNames(this.data.kaoshengInfo);
        var Modify = {}
        for (var i = 0, max = keys.length; i < max; i++) {
            var propName = keys[i];
            if (ksCopy[propName] !== ksOrigin[propName]) {
                Modify[propName] = ksCopy[propName]
            }
        }
        return Modify;
    },

    //保存修改的信息
    update_kaosheng:function (Modify){//{{{
        var that = this
        var Modify = this.get_modify()
        if(Modify === 'NULL'){
            return
        }
        util.showBusy("正在更新数据")
        qcloud.request({
            url: `${config.service.host}/baoming/kaoshengInfo/update_kaosheng`,
            data: {
                open_id: that.data.options.openId,
                ksid:that.data.options.ksid,
                kaoshengInfo: JSON.stringify(Modify),
            },
            method: 'POST',
            header: { 'content-type': 'application/x-www-form-urlencoded' },
            success(result) {//更新后 更新所有副本
                that.init_kaoshengInfo(that.data.options.openId,that.data.options.ksid)
                wx.hideToast()
            },
            fail(error) {
                that.jump()
            }
        })
    },//}}}

    //新建考生信息
    new_kaosheng: function () {//{{{
        let that = this
        wx.showModal({
            title: '请确认' + that.data.kaoshengInfo.name + that.data.kaoshengInfo.sfzid  ,
            content: '提交后姓名身份证信息将被锁定不可修改',
            success(res) {
                if (res.confirm) {
                    let kaoshengInfo = that.data.kaoshengInfo
                    kaoshengInfo.open_id = that.data.userInfo.openId
                    util.showBusy('保存数据中')
                    qcloud.request({
                        url: `${config.service.host}/baoming/kaoshengInfo/store_kaosheng`,
                        data: {
                            kaoshengInfo: JSON.stringify(kaoshengInfo),
                        },
                        method: 'POST',
                        header: { 'content-type': 'application/x-www-form-urlencoded' },
                        success(result) {
                            wx.hideToast()
                            // that.data.operas[]
                            that.init_kaoshengInfo(that.data.options.openId, that.data.options.ksid)
                        },
                        fail(error) {
                        }
                    })
                } else if (res.cancel) {
                    return
                }
            }
        }) //}}}
        
    },//}}}


    //新上传的图片放到db中
    img_to_db:function (open_id,ksid,imgUrl){//{{{
        //请求后台update图片数据
        qcloud.request({
            url: `${config.service.host}/baoming/kaoshengInfo/update_db_img`,
            data: {
                open_id:open_id,
                ksid:ksid,
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
                util.showBusy('正在上传')
                that.upload_cos(that.data.localImagePath)
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
                that.img_to_db(that.data.kaoshengInfo.open_id ,that.data.kaoshengInfo.ksid,res.data.imgUrl)//因为第一步必须填报信息，上传cos的同时直接进数据库避免僵尸图片产生
                that.data.kaoshengInfo.photoUrl = res.data.imgUrl
                that.data.operas[2].onoff = true
                that.setData({
                    kaoshengInfo:that.data.kaoshengInfo,
                    operas:that.data.operas
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

    set_step:function(event){
        var step = event.currentTarget.dataset.step
        this.setData({
            step:step
        })
    }
})