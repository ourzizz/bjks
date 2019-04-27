var qcloud = require('../../vendor/wafer2-client-sdk/index')
var config = require('../../config')
var util = require('../../utils/util.js')
var sliderWidth = 96; // 需要设置slider的宽度，用于计算中间位置
//规范化数据库命名下划线，变量驼峰命名
function find_comment_by_id(comments, cid) {
    for (var i = 0, lenI = comments.length; i < lenI; ++i) {
        if (comments[i].root.comment_id === cid) {
            return comments[i].root
        }
        if (comments[i].sons.length !== 0) {
            let sons = comments[i].sons
            for (var j = 0, lenJ = sons.length; j < lenJ; ++j) {
                if (sons[j].comment_id === cid) {
                    return sons[j]
                }
            }
        }
    }
}
//后台来的原始数据生成格式化的评论
//root父评论 sons子评论
//后台就一个，复杂计算放后台访问量大了要蹦
function formart_comments(comments_list) {
    let comments = [];
    let floor = {};
    let floorId = '';
    for (var i = 0, lenJ = comments_list.length; i < lenJ; ++i) {
        if (comments_list[i].floor != floorId) { //发生换层
            if (!util.isEmptyObject(floor)) {
                comments.push(floor);
            }
            floorId = comments_list[i].floor
            floor = {};
            floor.root = comments_list[i];
            floor.sons = [];
        } else {
            comments_list[i].talkTo = ''
            if (comments_list[i].father_id !== floor.root.comment_id) { //不是回复楼主的
                for (var j = 0, lenJ = comments_list.length; j < lenJ; ++j) {
                    if (comments_list[j].comment_id === comments_list[i].father_id) {
                        comments_list[i].talkTo = comments_list[j].name
                        break
                    }
                }
            }
            floor.sons.push(comments_list[i]);
        }
    }
    if (!util.isEmptyObject(floor)) {
        comments.push(floor);
    }
    return comments
}

Page({
    data: {
        fileId: '',
        tabs: [],
        activeIndex: 0,
        sliderOffset: 0,
        sliderLeft: 0,
        htmlSnip: '',
        userInfo: {},
        logged: false,
        takeSession: false,
        requestResult: '',
        collect: {
            'status': false,
            'src': '/image/collect.png',
            'text': '收藏'
        },
        images_url:[],
      comments: [],
      select_comment: { 'action': '' },
      replyWords: '',
      userApprovedCommentId: [],//用户点赞的数组
      pubLock: 'unLock',//发布锁，避免多次点击发送多次
      placeholder: 'original'

    },
    onShareAppMessage: function() {
        console.log("inshare")
        return {
            title: '毕节考试',
            path: 'pages/webview/webview?fileId=' + this.data.fileId
        }
    },
    initTabs: function(webJson) { //从json中的数据进行填充
        let item = {}
        if (webJson.eventtime != false) {//有时间节点数据
            this.data.tabs.push(['时间节点', webJson.eventtime])
        }
        for (var key in webJson.notify) {
            if(webJson.notify[key].content_type === 'img'){
                let image_url = webJson.notify[key].content.split(',') 
                this.data.tabs.push([webJson.notify[key].typename,image_url,webJson.notify[key].content_type])
            }else{
                this.data.tabs.push([webJson.notify[key].typename,webJson.notify[key].content,webJson.notify[key].content_type])
            }
        }
    },
    renderCollect: function() {
        const session = qcloud.Session.get()
        var that = this
        if (session) {
            this.data.userInfo = session.userinfo //保存userinfo到本文件周期内
            qcloud.request({
                url: `${config.service.host}/weapp/demo/get_if_userhasfile/` + that.data.userInfo.openId + `/` + that.data.fileId,
                success(res) {
                    if (res.data["userhasfile"] != false) {
                        that.setData({
                            collect: {
                                'status': true,
                                'src': '/image/collected.png',
                                'text': '已收藏'
                            },
                        })
                    } else {
                        that.setData({
                            collect: {
                                'status': false,
                                'src': '/image/collect.png',
                                'text': '收藏'
                            }
                        })
                    }
                },
                fail(error) {
                    util.showModel('请求失败', error);
                    console.log('request fail', error);
                }
            })

        }
    },
    onLoad: function(options) {
        var that = this;
        let fileId = options.fileid
        this.data.fileId = fileId
        this.renderCollect()
        this.get_comments(fileId)
        const session = qcloud.Session.get()
        if (session) { //有session就能拿到open_id,在bindGetUserInfo中调用会有不明原因的阻塞
            if (this.data.userApprovedCommentId.length === 0) { //点赞列表为空，就需要初始化
                this.setData({
                    userInfo: session.userinfo
                })
                this.init_approve()
            }
        }

        util.showBusy('请求中...')
        qcloud.request({
            url: `${config.service.host}/weapp/demo/get_filepage_json/` + this.data.fileId,
            success(result) {
                util.showSuccess('请求成功完成')
                that.initTabs(result.data)
                //上一步获取数据并初始化navmap后需要渲染nav
                wx.getSystemInfo({ //设置导航栏平分
                    success: function(res) {
                        that.setData({
                            tabs: that.data.tabs,
                            sliderLeft: (res.windowWidth / that.data.tabs.length - sliderWidth) / 2,
                            sliderOffset: res.windowWidth / that.data.tabs.length * that.data.activeIndex
                        });
                    }
                });
                //上一步获取数据并初始化navmap后需要渲染nav

                that.data.htmlSnip = result.data.article[0].article
                that.setData({
                    htmlSnip: that.data.htmlSnip
                })
            },
            fail(error) {
                util.showModel('请求失败', error);
                console.log('request fail', error);
            }
        })
    },
    tabClick: function(e) {
        var that = this
        if (e.currentTarget.id == this.data.activeIndex) {
            this.setData({
                activeIndex: -1,
            });

        } else {
            this.setData({
                sliderOffset: e.currentTarget.offsetLeft,
                activeIndex: e.currentTarget.id,
            });
        }
    },
    hideNotify: function() {
        this.setData({
            activeIndex: -1,
        });
    },

    scrollToTop() {
        wx.pageScrollTo({
            scrollTop: 0,
            duration: 100
        })
        console.log(this.data.userInfo)
    },

    ScrollToBottom: function () {
        wx.createSelectorQuery().select('#bottom').boundingClientRect(function (rect) {
            // 使页面滚动到底部
            wx.pageScrollTo({
                scrollTop: rect.bottom
            })
        }).exec()
    },

    cancleCollect: function(openId, fileId) { //取消收藏
        var that = this
        qcloud.request({
            url: `${config.service.host}/weapp/demo/delete_user_file/` + openId + `/` + fileId,
            success(res) {
                that.setData({
                    collect: {
                        'status': false,
                        'src': '/image/collect.png',
                        'text': '收藏'
                    }
                })
            },
            fail(error) {
                util.showModel('请求失败', error);
                console.log('request fail', error);
            }
        })
    },
    /*这个部分的函数全部用来处理登录收藏文件*/
    addFile2user: function() {
        var that = this
        if (!this.data.logged) {
            util.showBusy('请重授权再收藏')
            return
        }
        qcloud.request({
            url: `${config.service.host}/weapp/demo/insert_user_file/` + that.data.userInfo.openId + `/` + that.data.fileId,
            success(res) {
                that.setData({
                    collect: {
                        'status': true,
                        'src': '/image/collected.png',
                        'text': '已收藏'
                    }
                })
                util.showSuccess('收藏成功')
            },
            fail(error) {
                util.showModel('请求失败', error);
                console.log('request fail', error);
            }
        })
    },
    collectFile: function() {
        var that = this
        if (this.data.collect['status'] == true) { //显示为已收藏，用户必须是已登录状态,且本页面的userinfo是设置好的
            this.cancleCollect(this.data.userInfo.openId, this.data.fileId)
            util.showSuccess('已经取消收藏')
        } else { //，2新登录用户需要注册
            const session = qcloud.Session.get()
            if (session) { //用户session存在
                this.setData({
                    userInfo: session.userinfo,
                    logged: true
                })
                this.addFile2user()
            } else {
                qcloud.login({
                    success: res => {
                        this.setData({
                            userInfo: res,
                            logged: true
                        })
                        util.showSuccess('登录成功')
                        this.addFile2user()
                    },
                    fail: err => {
                        console.error(err)
                        util.showModel('登录错误', err.message)
                    }
                })
            }
        }
    },
    /*这个部分的函数全部用来处理登录收藏文件*/

    // 切换是否带有登录态
    switchRequestMode: function(e) {
        this.setData({
            takeSession: e.detail.value
        })
        this.doRequest()
    },
    gohome: function() {
        wx.switchTab({
            url: '../index/index'
        })
    },

  //用户点赞
  //wxml传来的是comment_id
  approve: function (event) {
    let cid = event.currentTarget.dataset.comment_id
    comment = find_comment_by_id(this.data.comments, cid)
    index = this.data.userApprovedCommentId.indexOf(cid)
    let approveStatus = ''
    if (index == -1) {//没有点过赞,或者是没有找到该评论
      ++comment.approve
      approveStatus = 'approve'
      this.data.userApprovedCommentId.push(cid)
    } else {
      --comment.approve
      approveStatus = 'cancle'
      this.data.userApprovedCommentId.splice(index, 1)
    }
    wx.request({ // 请求服务器登录地址，获得会话信息
      url: `${config.service.host}/comments/opera_approve`,
      data: { 'open_id': this.data.userInfo.openId, 'comment_id': cid, 'approveStatus': approveStatus, 'file_id': this.data.fileId },
      method: 'POST',
      header: { 'content-type': 'application/x-www-form-urlencoded' },
      success: function (result) {
      }
    })
    this.setData({
      comments: this.data.comments
    })
  },

  //用户回复，调起回复框
  //wxml传来的是完整的一条comment
  reply: function (event) {
    this.data.select_comment = event.currentTarget.dataset.comment
    this.data.select_comment.action = 'reply'
    this.setData({
      select_comment: this.data.select_comment
    })
    this.data.pubLock = 'unLock'
    this.util('open')
  },

  //用户点击修改，修改只能是修改自己的评论，另外能显示出修改按钮的前提是已经登录了
  //所以不能走bindGetUserInfo流程直接拉起输入框
  modify_comment: function (event) {
    this.data.select_comment = event.currentTarget.dataset.comment
    this.data.select_comment.action = 'modify'
    this.data.pubLock = 'unLock'
    this.setData({
      select_comment: this.data.select_comment
    })
    this.util('open')
  },

  new_comment: function (event) {
    this.data.pubLock = 'unLock'
    this.clear_select_comment()
    this.powerDrawer(event)
  },

  //参数说明cbname是login成功后需要调用的函数名,event包含了点击了哪个评论进行回复
  callback: function (cbName, event) {
    if (cbName == 'new_comment') {
      this.new_comment(event)
    } else if (cbName == 'reply') {
      this.reply(event)
    } else if (cbName == 'approve') {
      this.approve(event)
    }
  },
  //小程序恶心的异步执行，没办法先行封装获取openId,只能在bindGetUserInfo里面多次回调
  bindGetUserInfo: function (event) {
    cbName = event.currentTarget.dataset.callback
    if (this.data.logged) {
      this.callback(cbName, event)
      return
    }
    const session = qcloud.Session.get()
    if (session) {
      qcloud.loginWithCode({
        success: res => {
          this.setData({ userInfo: res, logged: true })
          this.callback(cbName, event)
        },
        fail: err => {
          console.error(err)
          util.showModel('登录错误', err.message)
        }
      })
    } else {
      qcloud.login({
        success: res => {
          this.setData({ userInfo: res, logged: true })
          if (this.data.userApprovedCommentId.length === 0) {//点赞列表为空，就需要初始化
            this.init_approve()
          }
          this.callback(cbName, event)
        },
        fail: err => {
          console.error(err)
          util.showModel('登录错误', err.message)
        }
      })
    }
  },



  //需要初始化用户点赞列表，一个文件用户可能以前点过赞了
  init_approve: function () {
    let that = this
    wx.request({ // 请求服务器登录地址，获得会话信息
      url: `${config.service.host}/comments/get_user_approved_list/`,
      data: { 'openId': this.data.userInfo.openId, 'fileId': this.data.fileId },
      method: 'POST',
      header: { 'content-type': 'application/x-www-form-urlencoded' },
      success: function (result) {
        for (var i = 0, lenJ = result.data.length; i < lenJ; ++i) {
          that.data.userApprovedCommentId.push(result.data[i].comment_id)
        }
      },
      fail(error) {
        util.showModel('请求失败', error);
        console.log('request fail', error);
      }
    })
  },

  //获取社区公示文件
  get_file: function (fileId) {
    var that = this;
    util.showBusy('请求中...')
    qcloud.request({
      url: `${config.service.host}/weapp/community_files/get_file_content/` + fileId,
      success(result) {
        util.showSuccess('请求成功完成')
        images_url = result.data.images_url
        if (images_url != "") {//split坑真是天坑,''空字串会被解析成数组元素
          that.data.imageNameList = images_url.split(',')
        }
        for (var i = 0; i < that.data.imageNameList.length; i++) {
          if (that.data.imageNameList[i] !== "") {
            that.data.images_url.push(that.data.imageNameList[i])
          }
        }
        that.setData({
          title: result.data.title,
          htmlSnip: result.data.body,
          images_url: that.data.images_url
        })
      },
      fail(error) {
        util.showModel('请求失败', error);
        console.log('request fail', error);
      }
    })
  },

  //向后台请求文件内容
  get_comments: function (fileId) {
    var that = this;
    util.showBusy('请求中...')
    qcloud.request({
      url: `${config.service.host}/comments/get_comments_by_fileId/` + fileId,
      success(result) {
        let comments = formart_comments(result.data)
        that.setData({
          comments: comments
        })
      },
      fail(error) {
        util.showModel('请求失败', error);
        console.log('request fail', error);
      }
    })

  },


  previewImage: function (event) {
    var that = this;
    let tab_idx = event.currentTarget.dataset.tab_idx;
    let img_idx = event.currentTarget.dataset.img_idx;
    let images_url = this.data.tabs[tab_idx][1]
    wx.previewImage({
      current:images_url[img_idx],
      urls: images_url
    });
  },

  gohome: function () {
    wx.switchTab({
      url: '../index/index'
    })
  },

  imageLoad: function (e) {
    var $width = e.detail.width,    //获取图片真实宽度
      $height = e.detail.height,
      ratio = $width / $height;    //图片的真实宽高比例
    var viewWidth = 718,           //设置图片显示宽度，左右留有16rpx边距
      viewHeight = 718 / ratio;    //计算的高度值
    var image = this.data.images_url;
    //将图片的datadata-index作为image对象的key,然后存储图片的宽高值
    image[e.target.dataset.index] = {
      width: viewWidth,
      height: viewHeight
    }
    this.setData({
      images_url: image
    })
  },

  /*弹出输入框
   * */
  powerDrawer: function (e) {
    var currentStatu = e.currentTarget.dataset.statu;
    this.util(currentStatu)
  },

  util: function (currentStatu) {
    /* 动画部分 */
    // 第1步：创建动画实例   
    var animation = wx.createAnimation({
      duration: 200, //动画时长  
      timingFunction: "linear", //线性  
      delay: 0 //0则不延迟  
    });

    // 第2步：这个动画实例赋给当前的动画实例  
    this.animation = animation;

    // 第3步：执行第一组动画  
    animation.opacity(0).rotateX(-100).step();

    // 第4步：导出动画对象赋给数据对象储存  
    this.setData({
      animationData: animation.export()
    })

    // 第5步：设置定时器到指定时候后，执行第二组动画  
    setTimeout(function () {
      // 执行第二组动画  
      animation.opacity(1).rotateX(0).step();
      // 给数据对象储存的第一组动画，更替为执行完第二组动画的动画对象  
      this.setData({
        animationData: animation
      })

      //关闭  
      if (currentStatu == "close") {
        this.setData({
          showModalStatus: false
        });
      }
    }.bind(this), 200)

    // 显示  
    if (currentStatu == "open") {
      this.setData({
        showModalStatus: true
      });
    }
  },

  //本函数把用户的回复准备成json格式
  //select_comment是本文件全局变量,在本函数中直接使用
  prepare_comment_json: function (content) {
    let comment = {}
    if (this.data.select_comment.action === '') {//新增评论
      comment.floor = this.data.comments.length + 1
      comment.father_id = 0 //father_id为0表示为层主
    } else {
      comment.floor = this.data.select_comment.floor
      comment.father_id = this.data.select_comment.comment_id
    }
    comment.file_id = this.data.fileId
    comment.open_id = this.data.userInfo.openId
    comment.name = this.data.userInfo.nickName
    comment.avatarUrl = this.data.userInfo.avatarUrl
    comment.content = content
    comment.approve = 0
    comment.pubtime = util.formatTime(new Date())
    return comment
  },
  //发表评论后需要刷新评论列表
  fresh_comment_list: function (comment) {
    if (comment.father_id === 0) {//newComment 直接加一楼
      let newComment = {}
      newComment.root = comment
      newComment.sons = []
      this.data.comments.push(newComment)
    } else { //reply在子评论中插入
      for (var i = 0, lenI = this.data.comments.length; i < lenI; ++i) {
        if (this.data.comments[i].root.floor === comment.floor) {//找到所在楼层
          this.data.comments[i].sons.push(comment)
        }
      }
    }
    this.setData({
      comments: this.data.comments
    })
  },

  insert_comment: function (comment) {
    let that = this
    wx.request({ // 请求服务器登录地址，获得会话信息
      url: `${config.service.host}/comments/storege_comment`,
      data: { comment: JSON.stringify(comment) },
      method: 'POST',
      header: { 'content-type': 'application/x-www-form-urlencoded' },
      success: function (result) {
        comment.comment_id = result.data.comment_id
        that.fresh_comment_list(comment)
        console.log('后台存储评论')
      }
    })
  },

  update_comment: function (replyWords) {
    let that = this
    let comment = find_comment_by_id(this.data.comments, this.data.select_comment.comment_id)
    comment.content = replyWords
    wx.request({ // 请求服务器登录地址，获得会话信息
      url: `${config.service.host}/comments/update_comment`,
      data: { 'comment_id': comment.comment_id, 'content': comment.content },
      method: 'POST',
      header: { 'content-type': 'application/x-www-form-urlencoded' },
      success: function (result) {
        that.setData({
          comments: that.data.comments
        })
      }
    })
  },

  formSubmit: function (e) {
    //要预防用户输入空
    let that = this
    if (this.data.pubLock === 'Lock') return
    this.data.pubLock = 'Lock'
    e.detail.value.replyWords = e.detail.value.replyWords.replace(/\s/g, "");
    if (e.detail.value.replyWords.match(/^$/g) === null) {//没有匹配到空输入
      replyWords = e.detail.value.replyWords
      if (this.data.select_comment.action == 'reply' || this.data.select_comment.action == '') {
        //reply 或者 new
        let comment = this.prepare_comment_json(replyWords)//DB中没有who字段prepare就不能准备此字段
        this.insert_comment(comment)//新增insert到DB
        comment.talkTo = this.data.select_comment.name
      } else if (this.data.select_comment.action == 'modify') {
        this.update_comment(replyWords)//跟新DB
      }
      this.clear_select_comment() //提交完成清空
    }
    this.util("close")
  },

  formReset: function () {
    console.log('form发生了reset事件')
  },
  /*弹出输入框end * */
  clear_select_comment: function () {
    this.data.select_comment = {}
    this.data.select_comment.action = ''
    this.setData({
      select_comment: this.data.select_comment
    })
  }
});
