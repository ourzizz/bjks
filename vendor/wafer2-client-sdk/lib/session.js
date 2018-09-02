var constants = require('./constants');
var SESSION_KEY = 'weapp_session_' + constants.WX_SESSION_MAGIC_ID;

var Session = {
    get: function () {
        return wx.getStorageSync(SESSION_KEY) || null;//同步方式将SESSION_KEY的值取出并返回
    },

    set: function (session) {
        wx.setStorageSync(SESSION_KEY, session);//同步方式将SESSION_KEY的值保存为session
    },

    clear: function () {
        wx.removeStorageSync(SESSION_KEY);
    },
};

module.exports = Session;
