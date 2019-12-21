//本页设计思路
//数据格式 分类数据 统一为{parent_id,son_list} 每个对象都有自身id和子列表
var qcloud = require('../../../vendor/wafer2-client-sdk/index')
var config = require('../../../config')
var util = require('../../../utils/util.js')

function get_sons_by_id(parent_son, class_id) {
  for (var key in parent_son) {
    if (parent_son[key].parent_id == class_id) {
      return parent_son[key].son_list
    }
  }
  return 'NULL'
}

function init_tree_list(parent_son, root_node) {
  var tree_list = []
  root_node.show_self = true
  root_node.show_sons = true
  tree_list[0] = root_node
  for (var key in parent_son) {
    for (var i = 0; i < tree_list.length; i++) {
      if (parent_son[key].parent_id == tree_list[i].class_id) {
        for (var son in parent_son[key].son_list) {
          parent_son[key].son_list[son].lft = parseInt(parent_son[key].son_list[son].lft)
          parent_son[key].son_list[son].rgt = parseInt(parent_son[key].son_list[son].rgt)
          parent_son[key].son_list[son].layer = parseInt(parent_son[key].son_list[son].layer)
          if (parent_son[key].son_list[son].layer == parseInt(root_node.layer) + 1) {//默认目录显示到第二层
              parent_son[key].son_list[son].show_self = true
              parent_son[key].son_list[son].show_sons = false
            }else{
              parent_son[key].son_list[son].show_self = false
              parent_son[key].son_list[son].show_sons = false
            }
          // parent_son[key].son_list[son].layer = parent_son[key].son_list[son].layer - root_node.layer
          tree_list.splice(i + 1, 0, parent_son[key].son_list[son]) //javascript插入元素例子
        }
      }
    }
  }
  return tree_list
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

Page({
  data: {
    tree_list: [],
    parent_son: [],
    requestResult: '',
    canIUseClipboard: wx.canIUse('setClipboardData'),
    userInfo: {},
    logged: false,
    takeSession: false,
    requestResult: '',
    activeIndex: 0,
    show_edit: false,
    temp_node: {},
    submitLock: 'unlock' //避免用户多次点击提交,每次进入step2必须将其解锁
  },

  onLoad: function () {
    var that = this
    qcloud.request({
      url: `${config.service.host}/houtai/class_manager/get_pslist_by_parent_name`,
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
        var tree_list = init_tree_list(result.data.parent_son, result.data.root)
        that.setData({
          parent_son: result.data,
          tree_list: tree_list,
        })
      },
      fail(error) {
        util.showModel('请求失败', error);
        console.log('request fail', error);
      }
    })
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
      show_edit: false
    })
  },

  open_node: function (node) {
    var tree_list = this.data.tree_list
    node.show_sons = true;
    for (var i = 0; i < tree_list.length; i++) {
      if ((parseInt(tree_list[i].layer) === parseInt(node.layer) + 1) && (parseInt(tree_list[i].lft) > parseInt(node.lft)) && (parseInt(tree_list[i].rgt) < parseInt(node.rgt))) {
        tree_list[i].show_self = true
        if ((tree_list[i].rgt - tree_list[i].lft > 1) && (tree_list[i].show_sons == true)) {
          this.open_node(tree_list[i])
        }
      }
    }
  },

  close_node: function (element) {
    var tree_list = this.data.tree_list
    element.show_sons = false //这里应该给idx 设置treelist
    for (var i = 0; i < tree_list.length; i++) {
      if ((parseInt(tree_list[i].lft) > parseInt(element.lft)) && (parseInt(tree_list[i].rgt) < parseInt(element.rgt))) {
        tree_list[i].show_self = false
      }
    }
  },
  set_idx: function (event) {
    var idx = event.currentTarget.dataset.idx
    this.setData({
      submitLock: "unlock",
      activeIndex: idx
    })
  },
  edit_class: function (event) {
    var idx = event.currentTarget.dataset.idx
    this.data.temp_node = JSON.parse(JSON.stringify(this.data.tree_list[this.data.activeIndex]));
    this.setData({
      temp_node: this.data.temp_node,
      show_edit: true
    })
    console.log("edit", this.data.tree_list[idx])
  },
  new_class: function (event) {
    var idx = event.currentTarget.dataset.idx
    this.setData({
        temp_node: {'class_name':''},
      show_edit: true
    })
    console.log("new", this.data.tree_list[idx])
  },
  devare_class: function (event) {
    var idx = event.currentTarget.dataset.idx
    console.log("devare", this.data.tree_list[idx])
  },
  cancle_edit: function () {
    this.setData({
      show_edit: false,
      submitLock: "unlock"
    })
  },
  input_class_name: function (e) {
    this.data.temp_node.class_name = e.detail.value
  },

  onoff: function (event) {
    if (event.detail.value === true) {
      this.data.temp_node.onoff = "on"
    } else {
      this.data.temp_node.onoff = "off"
    }
    console.log(this.data.temp_node.onoff)
  },

  check_data: function () {
      var node = this.data.temp_node
      if(node.class_name === ""){
          console.log("kong")
          return false
      }else{
          return true
      }
  },

  get_change: function () {
    var modify = []
    var idx = this.data.activeIndex
    var active_tree_node = this.data.tree_list[idx]
    var temp_node = this.data.temp_node
    if (active_tree_node.class_name != temp_node.class_name) {
      modify.push({
        'key': 1,
        'value': temp_node.class_name
      })
    }
    if (active_tree_node.onoff != temp_node.onoff) {
      modify.push({
        'key': 2,
        'value': temp_node.onoff
      })
    }
    return modify
  },

  local_tree_delete_class: function () { //本地tree_list删除节点，其后续节点均+2
    var tree_list = this.data.tree_list
    var idx = this.data.activeIndex
    var node = this.data.tree_list[idx]
    for (var i = 0; i < tree_list.length; i++) {
      if (tree_list[i].rgt > parseInt(node.rgt)) {
        tree_list[i].rgt = tree_list[i].rgt - 2
      }
      if (tree_list[i].lft > parseInt(node.rgt)) {
        tree_list[i].lft = tree_list[i].lft - 2
      }
    }
    this.data.tree_list.splice(idx, 1) //数组中删除掉用户点击的类别
  },
  local_tree_new_class: function (new_node) {
    var tree_list = this.data.tree_list
    var idx = this.data.activeIndex
    var father_node = tree_list[idx]
    new_node.lft = parseInt(new_node.lft)
    new_node.rgt = parseInt(new_node.rgt)
    new_node.show_self = true
    new_node.show_sons = false
    for (var i = 0; i < tree_list.length; i++) {
      if (tree_list[i].rgt > parseInt(father_node.lft)) {
        tree_list[i].rgt = tree_list[i].rgt + 2
      }
      if (tree_list[i].lft > parseInt(father_node.lft)) {
        tree_list[i].lft = tree_list[i].lft + 2
      }
    }
    tree_list.splice(idx + 1, 0, new_node) //javascript插入元素例子
  },

  delete_class: function (event) { //用户点击删除
    var idx = this.data.activeIndex
    var class_id = this.data.tree_list[idx].class_id
    var that = this
    wx.showModal({
      title: '提示',
      content: '确定删除吗',
      success(res) {
        if (res.confirm) {
          qcloud.request({
            url: `${config.service.host}/weapp/houtai/class_manager/delete_class/`,
            data: {
              pwd: "tubanfa",
              class_id: class_id
            },
            method: 'POST',
            header: {
              'content-type': 'application/x-www-form-urlencoded'
            },
            success(result) {
              that.local_tree_delete_class()
              that.setData({
                tree_list: that.data.tree_list,
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
    }) //}}}
  },

  submit: function () {
    if ((this.data.submitLock === 'unlock') && this.check_data()) { //提交前要进行数据校验,checkdata返回true才能进行后续操作
      this.data.submitLock = "lock" //提交锁,免得老头手机差一直点
      var that = this
      var tree_list = that.data.tree_list
      var idx = that.data.activeIndex
      if (this.data.temp_node.class_id != null && this.data.temp_node.class_id != undefined) { //用户编辑更新地址
        //class_id存在表示这是保存编辑，编辑后modify[{key:1,value:'exmple'}...]后台根据key选择不同的操作将value update到数据库
        var modify = this.get_change()
        if (modify.length !== 0) { //没有改变就没有必要对后台进行请求，节约服务器资源
          var class_id = this.data.tree_list[this.data.activeIndex].class_id
          this.data.tree_list[this.data.activeIndex] = this.data.temp_node //把修改后的值传给list渲染
          qcloud.request({
            url: `${config.service.host}/weapp/houtai/class_manager/user_update_class/`,
            data: {
              open_id: "测试保留",
              class_info: JSON.stringify(modify),
              class_id: class_id
            },
            method: 'POST',
            header: {
              'content-type': 'application/x-www-form-urlencoded'
            },
            success(result) {
              that.setData({ //就算是异步也可以放在请求外面执行,放在里面会导致modify为空时不能渲染step1
                show_edit: false,
                tree_list: that.data.tree_list,
              })
            },
            fail(error) {
              util.showModel('请求失败', error);
              console.log('request fail', error);
            }
          })
        } //end_if(modify.length !== 0)
      } else { //id不存在表示新建的
        qcloud.request({
          url: `${config.service.host}/weapp/houtai/class_manager/new_class/`,
          data: {
            open_id: this.data.open_id,
            father_id: tree_list[idx].class_id,
            new_class: JSON.stringify(that.data.temp_node)
          },
          method: 'POST',
          header: {
            'content-type': 'application/x-www-form-urlencoded'
          },
          success(result) {
            that.local_tree_new_class(result.data);
            that.setData({ //就算是异步也可以放在请求外面执行,放在里面会导致modify为空时不能渲染step1
              show_edit: false,
              tree_list: that.data.tree_list,
            })
          },
          fail(error) {
            util.showModel('请求失败', error);
            console.log('request fail', error);
          }
        })
      } //end_else

    } //end_if(check_data)
  },
})
