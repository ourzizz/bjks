// pages/qxnbd/qxnbd.js
Page({

  /**
   * 页面的初始数据
   */
  data: {

  },

    call(){
        wx.makePhoneCall({
            phoneNumber: "13308570523" 
        })
    }
})
