//index.js
var qcloud = require('../../vendor/wafer2-client-sdk/index')
var config = require('../../config')
var util = require('../../utils/util.js')
let filesMap = new Map();
Page({
  data: {
    userInfo: {},
    logged: false,
    takeSession: false,
    requestResult: '',
    typelist: [], //类型列表缓存数组
    zhuanjilist: [],
    xianqulist: [],
    shownav: true
  },
  onLoad: function() {
    util.showBusy('请求中...')
    var that = this
    qcloud.request({
      url: `${config.service.host}/weapp/demo/get_homepage_json`,
      login: false,
      success(result) {
        util.showSuccess('请求成功完成')
        that.setData({
          list: result.data,
          filelist: result.data.newfiles,
          typelist: result.data.type
        })
      },
      fail(error) {
        util.showModel('请求失败', error);
        console.log('request fail', error);
      }
    })
  },
  judgeIfNewFile: function(webdata) {
    //判断文件是否是新文件，规则ifnew属性一周内发布的都算是新文件
    for (var key in webdata.files) {
      if (((function(sDate) {
          var sdate = new Date(sDate.replace(/-/g, "/"));
          var time = (new Date()).getTime() - sdate.getTime()
          var days = parseInt(time / (1000 * 60 * 60 * 24));
          return days;
        })(webdata.files[key].pubtime)) <= 7) //判断条件中设置一个匿名函数专门判断日期天数,立即执行函数
      {
        webdata.files[key].ifnew = 1;
      } else {
        webdata.files[key].ifnew = 0;
      }
    }
    return webdata.files
  },

  myChangeColor: function(typelist, typeid) {
    //刷新导航列表字符颜色
    for (var key in typelist) {
      typelist[key].color = 'white'
    }
    typelist[typeid - 1].color = '#00CCFF '
  },

  getZhuanjiKsList: function() {
    var that = this
    qcloud.request({
      url: `${config.service.host}/weapp/demo/get_zhuanji_list/`,
      success(result) {
        that.setData({
          zhuanjilist: result.data.zhuanjilist
        })
      },
      fail(error) {
        util.showModel('请求失败', error);
        console.log('request fail', error);
      }
    })
  },

  setZhuanjiFileByKsid(event) {
    var that = this
    var ksid = event.currentTarget.dataset.ksid
    qcloud.request({
      url: `${config.service.host}/weapp/demo/get_zhuanji_files_by_ksid/` + ksid,
      success(result) {
        that.setData({
          filelist: result.data.filelist,
          //shownav: true
        })
      },
      fail(error) {
        util.showModel('请求失败', error);
        console.log('request fail', error);
      }
    })
  },

  changeFileList: function(event) {
      //每次点击都触发请求，体验上很慢，而且浪费服务器资源，只要主页不注销，只用请求一次数据就保存在map中，需要重新渲染的时候就不用再请求了，这有点像缓存
      var that = this
      var typeid = event.currentTarget.dataset.typeid
      this.myChangeColor(that.data.typelist, typeid)
      if (typeid == 3) { //typeid为3表示用户点击了专技考试的导航图标，接着要渲染专技考试列表
          this.getZhuanjiKsList()
          this.setData({ typelist: that.data.typelist, shownav: false })
      } 
      else {
          this.setData({ shownav: true })
          if (filesMap.has(typeid)) {
              this.setData({ filelist: filesMap.get(typeid), typelist: that.data.typelist })
          } else {
              qcloud.request({
                  url: `${config.service.host}/weapp/demo/get_file_list/` + typeid,
                  login: false,
                  success(result) {
                      filesMap.set(typeid, that.judgeIfNewFile(result.data))
                      that.setData({
                          filelist: filesMap.get(typeid),
                          typelist: that.data.typelist
                      })
                  },
                  fail(error) {
                      util.showModel('请求失败', error);
                      console.log('request fail', error);
                  }
              })
          }
      }
  }
})
