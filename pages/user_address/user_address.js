var qcloud = require('../../vendor/wafer2-client-sdk/index')
var config = require('../../config')
var util = require('../../utils/util.js')
Page({
  data: {
    region: ['贵州省', '毕节市', '七星关区'],
    step:1,
    address_list:[],
    new_address:{},
    open_id:''
  },

  onLoad:function(option) {//o9pU65LTYEE8tVWQR_yClRc1466k
    this.data.open_id = option.open_id
    let that = this
    qcloud.request({
      url: `${config.service.host}/user_address/get_user_all_address/` + this.data.open_id,
      success(result) {
        util.showSuccess('请求成功完成')
        that.setData({
          address_list: result.data
        })
      }
    })
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
    let idx = event.currentTarget.dataset.idx
    this.data.new_address = JSON.parse(JSON.stringify(this.data.address_list[idx]));
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
    if(e.detail.value != null){
      this.data.new_address.detail = e.detail.value
    }
  },

  delete_address: function (event) {//用户点击删除
    let idx = event.currentTarget.dataset.idx
    this.data.new_address = JSON.parse(JSON.stringify(this.data.address_list[idx]));
    this.setData({
      step:2,
      new_address:this.data.new_address
    })
  },

  create_address:function(){//点击新增，进入步骤2，不携带任何参数
    this.data.new_address = {} //这里的意思需要新分配内存
    this.setData({
      step:2,
      new_address:this.data.new_address
    })
  },

  insert_address:function(){
    console.log('insert new address into databases')
  },

  submit: function () {
    let that = this
    if(this.data.new_address.address_id != null) {//addressid存在表示这是保存编辑，编辑后modify[{key:1,value:'exmple'}...]后台根据key选择不同的操作将value update到数据库
      // var modify = this.get_change()//得到modify数组
      // this.update_address(modify)
      console.log('submit');
      that.setData({
        step: 1,
        address_list: that.data.address_list
      })
    } else {//id不存在表示新建的
      console.log("pre")
      this.data.address_list.push(this.data.new_address)
      let address = JSON.stringify(this.data.new_address)
      qcloud.request({
        url: `${config.service.host}/weapp/user_address/user_add_address/` + this.data.open_id + '/' + address,
        success(result) {
          that.setData({
            step: 1,
            address_list: that.data.address_list
          })
        },
        fail(error) {
          util.showModel('请求失败', error);
          console.log('request fail', error);
        }
      })
    }
  },


  select_default_address_back_to_prepage(e) {//返回用户选择的地址给父页面
    console.log('radio发生change事件，携带value值为：', e.detail.value)
    const idx = e.detail.value
    pages = getCurrentPages();
    currPage = pages[pages.length - 1]; //当前页面
    prevPage = pages[pages.length - 2];//上一个页面//直接调用上一个页面的setData()方法，把数据存到上一个页面中去
    prevPage.setData({
      user_default_address: this.data.address_list[idx]
    })
    wx.navigateBack({
      delta: 1
    })
  },

})
