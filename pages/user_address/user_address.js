/* 后台的增删改开发完成，前端用户输入校验立即开发 */
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
    edit_index:-1
  },

  get_address_list:function(open_id){
    let that = this
    qcloud.request({
      url: `${config.service.host}/user_address/get_user_all_address/` + open_id,
      success(result) {
        util.showSuccess('请求成功完成')
        result.data[0].checked = true
        that.setData({
          address_list: result.data
        })
      }
    })
  },

  onLoad:function(option) {//o9pU65LTYEE8tVWQR_yClRc1466k
    this.data.open_id = option.open_id
    this.get_address_list(this.data.open_id)
  },

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
      new_address:this.data.new_address
    })
  },

  input_name:function(e){
    console.log(e.detail.value)
    if(e.detail.value != null){
      this.data.new_address.name = e.detail.value
    }
  },
  
  reg_tel:function(phoneno){
    return true;
  },

  input_telphone:function(e){//input失去焦点才触发，bindinput是每输入一个字符就触发一次
    console.log("intelphone")
    if(this.reg_tel(e.detail.value)){
      this.data.new_address.telphone = e.detail.value
    }
    console.log("输入电话号码错误请重新输入")
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
      new_address: this.data.new_address
    })
  },

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

  submit: function () {
    let that = this
    if (this.data.new_address.address_id != null) {//addressid存在表示这是保存编辑，编辑后modify[{key:1,value:'exmple'}...]后台根据key选择不同的操作将value update到数据库
      var modify = this.get_change()
      var address_str = JSON.stringify(modify)//得到modify数组,转字符串
      if (modify.length !== 0) {//没有改变就没有必要对后台进行请求，节约服务器资源
        var address_id = this.data.address_list[this.data.edit_index].address_id
        this.data.address_list[this.data.edit_index] = this.data.new_address//把修改后的值传给list渲染
        qcloud.request({
          url: `${config.service.host}/weapp/user_address/user_update_address/` + this.data.open_id + '/' + address_id + '/' + address_str,
          success(result) {
            console.log('request successful');
          },
          fail(error) {
            util.showModel('请求失败', error);
            console.log('request fail', error);
          }
        })
      }
      that.setData({//就算是异步也可以放在请求外面执行,放在里面会导致modify为空时不能渲染step1
        step: 1,
        address_list: that.data.address_list
      })
    } else {//id不存在表示新建的
      console.log("pre")
      this.data.address_list.push(this.data.new_address)
      let address_str = JSON.stringify(this.data.new_address)
      qcloud.request({
        url: `${config.service.host}/weapp/user_address/user_add_address/` + this.data.open_id + '/' + address_str,
        success(result) {
          that.get_address_list(that.data.open_id)//避开插入数据库同时需要取出id，在并发情况可能会取错的情况，前台重新请求地址列表
          that.setData({
            step: 1
          })
        },
        fail(error) {
          util.showModel('请求失败', error);
          console.log('request fail', error);
        }
      })
    }
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
    console.log('radio发生change事件，携带value值为：', e.detail.value)
    const idx = e.detail.value
    pages = getCurrentPages();
    currPage = pages[pages.length - 1]; //当前页面
    prevPage = pages[pages.length - 2];//上一个页面//直接调用上一个页面的setData()方法，把数据存到上一个页面中去
    this.db_set_default_address(idx)
    prevPage.setData({
      user_default_address: this.data.address_list[idx]
    })
    wx.navigateBack({
      delta: 1
    })
  },
})
