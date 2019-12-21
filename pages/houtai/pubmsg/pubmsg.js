// pages/writeMsg/writeMsg.js
// 良好的设计应该是透明的，前台要的是图片的url，至于存储如何组织数据结构是什么样并不关心
// 本页面承载1新建发布消息，二从修改入口进入修改信息
// 修改消息不仅要先修改cos中的图片，同时需要对数据库进行必要的增删改
var qcloud = require('../../../vendor/wafer2-client-sdk/index')
var config = require('../../../config')
var util = require('../../../utils/util.js')
var cls = require('../../../utils/myclass.js')
var app = getApp()
Page({
    data: {
        step:1,
        msg_list:[],
        tempFilePaths:[],//本地临时图片目录 上传图片先留存本地路径
        imageNameList: [],//当前信息的图片名称列表 上传成功返回name push
        localImagePaths: [],//当前信息图片的url全称
        pub_lock:'unlock',//发布锁，避免用户多次点击 unlock lock
        userInfo: {},
        logged: false,//}}}
        temp_msg:{},
        pub_lock:"unlock",
        pub_flg:"new",
        activeMsgIdx:-1
    },

    edit_msg:function (event){
        var file_id = event.currentTarget.dataset.file_id
        this.data.activeMsgIdx = event.currentTarget.dataset.idx
        this.init_message(file_id)
        this.setData({
            step:2,
            localImagePaths: [],
            imageNameList: [],
        })
    },

    new_msg:function () {
        this.setData({
            step:2,
            temp_msg:{file_id:'null'},
            localImagePaths: [],
            imageNameList: [],
        })
    },

  delete_msg: function (event) { //用户点击删除//{{{
    var file_id = event.currentTarget.dataset.file_id
    var idx = event.currentTarget.dataset.idx
    var that = this
    wx.showModal({
      title: '提示',
      content: '确定删除吗',
      success(res) {
        if (res.confirm) {
          qcloud.request({
            url: `${config.service.host}/weapp/houtai/pub_msg/delete_message/`, //删除商品
            data: {
              pwd: "tubanfaDeleteGoods",
              file_id: file_id
            },
            method: 'POST',
            header: {
              'content-type': 'application/x-www-form-urlencoded'
            },
            success(result) {
              that.data.msg_list.splice(idx, 1) //数组中删除掉用户点击的类别
              that.setData({
                msg_list: that.data.msg_list,
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
    }) 
  },//}}}

    //如果调用页面的时候给出的是messageId表示需要修改信息，拿messageid取后台初始化
    init_message: function (file_id) {//{{{
        let that = this
        qcloud.request({
            url: `${config.service.host}/houtai/pub_msg/get_file_by_id`,
            data: {file_id:file_id},
            method: 'POST',
            header: { 'content-type':'application/x-www-form-urlencoded' },
            success(result) {
                for(var i=0;i<result.data.images.length;i++){
                    if(result.data.images[i] !== ""){
                        that.data.localImagePaths.push(config.service.cosUrl + result.data.images[i].url) 
                    }
                    that.data.imageNameList.push(result.data.images[i].url)
                }
                that.setData({
                    temp_msg:result.data.content,
                    localImagePaths: that.data.localImagePaths
                })
            },
            fail(error) {
                util.showModel('请求失败', error);
                console.log('request fail', error);
            }
        })
    },//}}}

    onLoad: function (options) {//{{{ 从后台拉取全部社区通知列表
        let that = this
        qcloud.request({
            url: `${config.service.host}/houtai/pub_msg/get_all_messages`,
            success(result) {
                var message = result.data
                that.setData({
                    msg_list:result.data
                })
            },
            fail(error) {
                util.showModel('请求失败', error);
                console.log('request fail', error);
            }
        })

    },//}}}


    //非常规操作，既没有点击发布也没有点击取消，或者是被打断，应该要清理cos中的数据
    //否则会产生很多僵尸图片
    clear_cos:function (){//{{{
        for(let i=0;i<this.data.imageNameList.length;i++){
            this.delete_cos_img(this.data.imageNameList[i])
        }
    },//}}}

    cancle: function () {//{{{
        if(this.data.pub_flg === "new"){//新建信息放弃发布，删除所有已经上传图片,修改的话不能删除
            this.clear_cos()
        }
        this.setData({
            step:1
        })
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
        if(this.data.temp_msg.file_id != "null"){//如果是修改消息，就必须修改数据库
            this.delete_db_img(this.data.temp_msg.file_id , img_name )
        }
        this.image_display(idx)
    },//}}}

    //从cos中删除图片，一次一张
    //分两步删除的原因是：如果是新发布 此时数据库还没有数据
    //如果是修改点击了删除 就要删除数据库的url
    delete_cos_img:function (img_name){//{{{
        var that = this
        qcloud.request({
            url: `${config.service.host}/houtai/pub_msg/delete_cos_img`,
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
    delete_db_img:function (file_id,img_name){//{{{
        qcloud.request({
            url: `${config.service.host}/houtai/pub_msg/delete_db_img`,
            data: {
                file_id:file_id,
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

    check_message:function (){
        return true;
    },

    //用户点击发布提交表单
    submit:function (){//{{{
        if (this.check_message() && this.data.pub_lock === 'unlock') {
            this.setData({pub_lock:'lock'})//避免连续多次点击发布按钮
            if(this.data.temp_msg.file_id === ""){//新发布
                this.publish_message()
            }else{//更新数据
                this.update_message()
            }
        }
        this.setData({pub_lock:'unlock'})//避免连续多次点击发布按钮
    },//}}}

    //保存修改的信息
    update_message:function (){//{{{
        var that = this
        qcloud.request({
            url: `${config.service.host}/houtai/pub_msg/update_message`,
            data: {
                message: JSON.stringify(this.data.temp_msg)
            },
            method: 'POST',
            header: { 'content-type': 'application/x-www-form-urlencoded' },
            success(result) {
                that.setData({
                    step:1
                })
            },
            fail(error) {
            }
        })
    },//}}}

    //发布消息
    publish_message: function () {//{{{
        let that = this
        if(that.data.imageNameList.length !== that.data.tempFilePaths.length){
            //本地路径图片的长度和cos返回的name数量不一致表示上传cos未完成
            util.showBusy('图片上传中')
            this.data.pub_lock = "unlock" //这里没有上传完成需要开锁再次进入
            return ;
        }
        qcloud.request({
            url: `${config.service.host}/houtai/pub_msg/user_publish_message`,
            data: {
                message: JSON.stringify(this.data.temp_msg),
                images: JSON.stringify(this.data.imageNameList)
            },
            method: 'POST',
            header: { 'content-type': 'application/x-www-form-urlencoded' },
            success(result) {
                that.data.temp_msg.file_id = result.data.file_id
                that.data.msg_list.push(that.data.temp_msg)
                that.setData({
                    msg_list:that.data.msg_list,
                    step:1
                })
            },
            fail(error) {
                that.jump()
            }
        })
    },//}}}

    //上传图片，分为两个子操作，upload_Cos,img_to_db
    //新上传到cos cos返回图片名称 再同步到db中
    upload_cos:function (filePath){//{{{
        let that = this
        //上传图片
        wx.uploadFile({
            url: config.service.uploadUrl,
            filePath: filePath, //filePath是本地路径
            name: 'file',
            success: function(res) {
                res = JSON.parse(res.data)
                that.data.imageNameList.push(res.data.name)
                if(that.data.temp_msg.file_id !== "null"){//有id表示需要处理后台数据库
                    that.img_to_db(that.data.temp_msg.file_id , res.data.name )
                }
            },
            fail: function(e) {
                util.showModel('上传图片失败')
            }
        })//end_uploadFile
    },//}}}

    //新上传的图片放到db中
    img_to_db:function (file_id,img_name){//{{{
        qcloud.request({
            url: `${config.service.host}/houtai/pub_msg/img_to_db`,
            data: {
                file_id:file_id,
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

    //get_modify:function (){
        //var modify = {}
        //var temp_msg = this.data.temp_msg
        //var idx = this.data.activeMsgIdx
    //},

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
                        that.upload_cos(filePath[i])
                    }
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
        app.globalData.edit_class_id = this.data.message.class_id
        wx.switchTab({
            url: '../index/index',
        })
    },
    input_date:function (event){
        this.data.temp_msg.pubtime = event.detail.value
    },
    input_org:function (event){
        this.data.temp_msg.puborg = event.detail.value
    },
    input_title:function (event){
        this.data.temp_msg.title = event.detail.value
    }
})
