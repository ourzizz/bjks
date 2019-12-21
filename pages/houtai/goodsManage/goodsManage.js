//本页设计思路
var qcloud = require('../../../vendor/wafer2-client-sdk/index')
var config = require('../../../config')
var util = require('../../../utils/util.js')
//{{{
function get_sons_by_id(parent_son, class_id) {
  for (var key in parent_son) {
    if (parent_son[key].parent_id == class_id) {
      return parent_son[key].son_list
    }
  }
  return 'NULL'
}

function init_tree_list(parent_son, root_node) {
  var class_list = []
  root_node.show_self = true
  root_node.show_sons = true
  class_list[0] = root_node
  for (var key in parent_son) {
    for (var i = 0; i < class_list.length; i++) {
      if (parent_son[key].parent_id == class_list[i].class_id) {
        for (var son in parent_son[key].son_list) {
          parent_son[key].son_list[son].lft = parseInt(parent_son[key].son_list[son].lft)
          parent_son[key].son_list[son].rgt = parseInt(parent_son[key].son_list[son].rgt)
          parent_son[key].son_list[son].layer = parseInt(parent_son[key].son_list[son].layer)
          if (parent_son[key].son_list[son].layer == parseInt(root_node.layer)+1) {//默认目录显示到第二层
            parent_son[key].son_list[son].show_self = true
            parent_son[key].son_list[son].show_sons = false
          } else {
            parent_son[key].son_list[son].show_self = false
            parent_son[key].son_list[son].show_sons = false
          }
          // parent_son[key].son_list[son].layer = parent_son[key].son_list[son].layer - root_node.layer
          class_list.splice(i + 1, 0, parent_son[key].son_list[son]) //javascript插入元素例子
        }
      }
    }
  }
  return class_list
}

//获得给定id的第一个儿子，不存在返回NULL
function get_first_son(parent_son, pid) {
  for (var key in parent_son) {
    if (parent_son[key].parent_id == pid) { //如果pid有儿子，那么它必然能在parent_id中匹配到
      return parent_son[key].son_list[0] //返回第一个儿子
    }
  }
  return 'NULL' //如果查找失败了
}

//获得第一个叶子节点
function find_first_leave(parent_son, parent_id) {
  var first_son = get_first_son(parent_son, parent_id)
  if (first_son == 'NULL') { //递归边界
    return parent_id
  } else if (first_son.count_sons == '0') {
    return first_son.class_id
  } else {
    return find_first_leave(parent_son, first_son.class_id)
  }
}
//}}}
Page({
  data: {
    class_list: [],//{{{
    parent_son: [],
    requestResult: '',
    canIUseClipboard: wx.canIUse('setClipboardData'),
    userInfo: {},
    logged: false,
    takeSession: false,
    requestResult: '',
    classListActiveIndex: 0,
    goodsListActiveIndex: 0,
    show_edit: false,
    temp_goods: {
        face_img:""
    },
    goods_list: [],
    step:1,
    change_img:false,
    submitLock: 'unlock' //避免用户多次点击提交,每次进入step2必须将其解锁//}}}
  },

  onLoad: function () {//{{{
    var that = this
    qcloud.request({
      url: `${config.service.host}/houtai/class_manager/get_pslist_by_parent_name`,//只在onload函数拉取分类数据只允许查询不允许改增
      data: {
        name: '人事考试图书'
      },
      method: 'POST',
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      success(result) {
        that.data.parent_son = result.data.parent_son
        //var son_list = get_sons_by_id(result.data, default_nav_2)
        var class_list = init_tree_list(result.data.parent_son, result.data.root)
        that.setData({
          parent_son: result.data,
          class_list: class_list,
        })
      },
      fail(error) {
        util.showModel('请求失败', error);
        console.log('request fail', error);
      }
    })
  },//}}}

  show_goods_list_by_class_id: function (class_id) {//{{{
        let that = this
        this.data.goods_list = {}
        qcloud.request({
            url: `${config.service.host}/houtai/goods_manager/get_goods_list_by_class_id/` + class_id, //商品查询
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
    },//}}}

  operate_tree: function (event) {//{{{
    var class_list = this.data.class_list
    var idx = event.currentTarget.dataset.idx
    if (class_list[idx].show_sons == true) {
      this.close_node(class_list[idx])
    } else {
      this.open_node(class_list[idx])
    }
    this.setData({
      class_list: class_list,
      classListActiveIndex: idx,
      show_edit: false
    })
  },//}}}

  open_node: function (node) {//{{{
    var class_list = this.data.class_list
    node.show_sons = true;
    for (var i = 0; i < class_list.length; i++) {
      if ((parseInt(class_list[i].layer) === parseInt(node.layer) + 1) && (parseInt(class_list[i].lft) > parseInt(node.lft)) && (parseInt(class_list[i].rgt) < parseInt(node.rgt))) {
        class_list[i].show_self = true
        if ((class_list[i].rgt - class_list[i].lft > 1) && (class_list[i].show_sons == true)) {
          this.open_node(class_list[i])
        }
      }
    }
  },//}}}

  close_node: function (element) {//{{{
    var class_list = this.data.class_list
    element.show_sons = false //这里应该给idx 设置treelist
    for (var i = 0; i < class_list.length; i++) {
      if ((parseInt(class_list[i].lft) > parseInt(element.lft)) && (parseInt(class_list[i].rgt) < parseInt(element.rgt))) {
        class_list[i].show_self = false
      }
    }
  },//}}}

  set_idx: function (event) {//{{{
    var idx = event.currentTarget.dataset.idx
    var class_list = this.data.class_list
    if(class_list[idx].rgt - class_list[idx].lft === 1){
      this.show_goods_list_by_class_id(class_list[idx].class_id)
    }
    this.setData({
      submitLock: "unlock",
      classListActiveIndex: idx
    })
  },//}}}

  cancle_edit: function () {//{{{
    this.setData({
      show_edit: false,
      submitLock: "unlock"
    })
  },//}}}

  get_change:function (){//选择编辑 才会执行到这个函数
    var modify = {}
    var idx = this.data.goodsListActiveIndex
    var active_goods_node = this.data.goods_list[idx]
    var temp_goods = this.data.temp_goods
    if (active_goods_node.face_img != temp_goods.face_img) {//名字修改
        modify.face_img = temp_goods.face_img
    }
    if (active_goods_node.name != temp_goods.name) {//名字修改
        modify.name= temp_goods.name
    }
    if (active_goods_node.onoff != temp_goods.onoff) {
        modify.onoff= temp_goods.onoff
    }
    if (active_goods_node.class_id != temp_goods.class_id) {//修改分类
        modify.class_id= temp_goods.class_id
    }
    if (active_goods_node.price != temp_goods.price) {//修改分类
        modify.price= temp_goods.price
    }
    if (active_goods_node.danwei != temp_goods.danwei) {//修改分类
        modify.danwei= temp_goods.danwei
    }
    if (active_goods_node.remain != temp_goods.remain) {//修改分类
        modify.remain= temp_goods.remain
    }
    return modify
  },

  new_local_goods: function (new_node) {//本地goodslist insert 新增商品
    var class_list = this.data.class_list
    var idx = this.data.classListActiveIndex
    var father_node = class_list[idx]
    new_node.lft = parseInt(new_node.lft)
    new_node.rgt = parseInt(new_node.rgt)
    new_node.show_self = true
    new_node.show_sons = false
    for (var i = 0; i < class_list.length; i++) {
      if (class_list[i].rgt > parseInt(father_node.lft)) {
        class_list[i].rgt = class_list[i].rgt + 2
      }
      if (class_list[i].lft > parseInt(father_node.lft)) {
        class_list[i].lft = class_list[i].lft + 2
      }
    }
    class_list.splice(idx + 1, 0, new_node) //javascript插入元素例子
  },//}}}

  delete_goods: function (event) { //用户点击删除//{{{
    var idx = event.currentTarget.dataset.goods_idx
    var goods_id = this.data.goods_list[idx].goods_id
    var that = this
    wx.showModal({
      title: '提示',
      content: '确定删除吗',
      success(res) {
        if (res.confirm) {
          qcloud.request({
            url: `${config.service.host}/weapp/houtai/goods_manager/delete_goods/`, //删除商品
            data: {
              pwd: "tubanfaDeleteGoods",
              goods_id: goods_id
            },
            method: 'POST',
            header: {
              'content-type': 'application/x-www-form-urlencoded'
            },
            success(result) {
              that.data.goods_list.splice(idx, 1) //数组中删除掉用户点击的类别
              that.setData({
                goods_list: that.data.goods_list,
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

  submit: function () {//{{{
    //if ((this.data.submitLock === 'unlock') && this.check_data()) { //提交前要进行数据校验,checkdata返回true才能进行后续操作
    if (this.check_data()) { //提交前要进行数据校验,checkdata返回true才能进行后续操作
      this.data.submitlock = "lock" //提交锁,免得老头手机差一直点
      var that = this
      var class_list = that.data.class_list
      //if (this.data.temp_goods.goods_id != null && this.data.temp_goods.goods_id != undefined) { //用户编辑更新地址
      if (this.data.temp_goods.goods_id != '') { //用户编辑更新地址
        //goods_id存在表示这是保存编辑，编辑后modify[{key:1,value:'exmple'}...]后台根据key选择不同的操作将value update到数据库
        var modify = this.get_change()
        if (Object.keys(modify).length !== 0) { //mark对象判空
          var goods_id = this.data.temp_goods.class_id
          qcloud.request({
            url: `${config.service.host}/weapp/houtai/goods_manager/update_goods/`,
            data: {
              open_id: "测试保留",
              goods_id: that.data.temp_goods.goods_id,
              goods_info: JSON.stringify(modify),
            },
            method: 'post',
            header: {
              'content-type': 'application/x-www-form-urlencoded'
            },
            success(result) {
              //将修改后的temp_nodes替换掉goods_list[idx]
              that.show_goods_list_by_class_id(that.data.temp_goods.class_id)
              that.data.temp_goods = {}
              that.setData({ //就算是异步也可以放在请求外面执行,放在里面会导致modify为空时不能渲染step1
                step:1,
              })
            },
            fail(error) {
              util.showmodel('请求失败', error);
              console.log('request fail', error);
            }
          })
        } //end_if(modify.length !== 0)
      } else { //id不存在表示新建的
        delete this.data.temp_goods.class_name
        qcloud.request({
          url: `${config.service.host}/weapp/houtai/goods_manager/new_goods/`,
          data: {
            open_id: this.data.open_id,
            new_goods: JSON.stringify(that.data.temp_goods),
          },
          method: 'post',
          header: {
            'content-type': 'application/x-www-form-urlencoded'
          },
          success(result) {
            that.show_goods_list_by_class_id(that.data.temp_goods.class_id)
            that.setData({ //就算是异步也可以放在请求外面执行,放在里面会导致modify为空时不能渲染step1
              step: 1,
              goods_list: that.data.goods_list,
            })
          },
          fail(error) {
            util.showmodel('请求失败', error);
            console.log('request fail', error);
          }
        })
      } //end_else
    } //end_if(check_data)
  },//}}}

  click_cancle_button:function (){//取消编辑页面
      this.setData({
          temp_goods:{face_img:''},
          change_img:false,
          step:1,
      })
  },

  clicked_change_face_img_button:function (){
      this.setData({
          change_img : true
      })
  },

  input_imgurl:function(e){
      this.data.temp_goods.face_img = e.detail.value
      this.setData({
          temp_goods:this.data.temp_goods
      })
  },
  save_img:function (){
      this.setData({
          change_img:false
      })
  },
  input_class_name(e){
    this.data.temp_goods.class_name = ""
    this.data.temp_goods.class_id = ""
    var class_list = this.data.class_list //这里会被莫名其妙赋值成商品
    for (var i = 0; i < class_list.length; i++) {//默认不能有重名的分类
        if(e.detail.value === class_list[i].class_name){
            this.data.temp_goods.class_name = e.detail.value
            this.data.temp_goods.class_id = class_list[i].class_id
            this.data.classListActiveIndex = i
        }
    }
  },

  check_data: function () {//{{{
      var node = this.data.temp_goods
      var error = ''
      var class_list = this.data.class_list
      var regtel = new RegExp(('^[1-9][0-9]*(.[0-9]{1,2})?$'), 'g')
      //校验输入的类名
      if(this.data.temp_goods.class_name === ''){
            error = '您输入的类不存在，请重新输入'
            util.showModel('类错误',error)
            return false
      }
      if(!regtel.exec(this.data.temp_goods.price)){//
          wx.showModal({
              title: '提示',
              content: '输入价格有误请核对后在提交',
          })
          return false;
      }
      return true
  },//}}}

  input_name:function(e){
      this.data.temp_goods.name = e.detail.value
  },

  input_price:function(e){
    this.data.temp_goods.price = e.detail.value
  },
  input_danwei:function(e){
    this.data.temp_goods.danwei= e.detail.value
  },
  input_remain:function(e){
    this.data.temp_goods.remain = e.detail.value
  },

  onoff: function (event) {//{{{
    if (event.detail.value === true) {
      this.data.temp_goods.onoff = "on"
    } else {
      this.data.temp_goods.onoff = "off"
    }
    console.log(this.data.temp_goods.onoff)
  },//}}}

  clicked_edit_button: function (event) {//{{{
    var idx = event.currentTarget.dataset.goods_idx
    this.data.goodsListActiveIndex = idx
    this.data.temp_goods = JSON.parse(JSON.stringify(this.data.goods_list[idx])) //深拷贝
    this.data.temp_goods.class_name = this.data.class_list[this.data.classListActiveIndex].class_name
    this.setData({
      temp_goods: this.data.temp_goods,
      step:2
    })
  },//}}}

  clicked_new_goods: function (event) {//{{{ //将新增节点的关键属性初始化
    var idx = event.currentTarget.dataset.idx
    this.data.temp_goods.class_name = this.data.class_list[this.data.classListActiveIndex].class_name
    this.data.temp_goods.class_id = this.data.class_list[this.data.classListActiveIndex].class_id
    this.data.temp_goods.goods_id = ''
    this.setData({
        temp_goods:this.data.temp_goods,
      step:2,
    })
  },//}}}


})
