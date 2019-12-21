var role_map =new Map([
          ["super",[0,1,2,3]],
          ["shopboos",[1,2]],
          ["msgPuber",[3]],
]);
Page({
  data: {
    page_list:[
      {name:"订单管理",id:"manageOrder"},
      {name:"分类管理",id:"classManage"},
      {name:"商品管理",id:"goodsManage"},
      {name:"信息发布",id:"pubmsg"},
    ],
      show_role:[
          {role:"super",pages:[0,1,2,3]},
          {role:"shopboos",pages:[1,2]},
          {role:"msgPuber",pages:[3]},
      ],
      show_nav_list:{},
  },

    onLoad: function (options){
        console.log(options);
        this.data.show_nav_list = role_map.get(options.role)
        this.setData({
            show_nav_list:this.data.show_nav_list
        })
    },
})
