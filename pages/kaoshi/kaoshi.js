Page({
  data: {
    msg: 'sssssssssssssssssssssssssssssssssssssssssssssssss',
    html: '<style>body{background-color:#d0e4fe;}h1{color:orange;text-align:center;}p{font-family:"Times New Roman";font-size:20px;}</style></head><body><h1>CSS 实例!</h1><p>这是一个段落。</p></body>',
    nodes: [{
      name: 'div',
      attrs: { 
        class: 'div_class',
        style: 'line-height: 60px; color: red;'
      },
      children: [{
        type: 'text',
        text: 'Hello&nbsp;World!'
      }]
    }]
  },
  tap() {
    console.log('tap')
  },
  show: function (event) {
    if (event.currentTarget.dataset.ifshow == 'none') {
      this.setData({
        ifshow: 'inline'
      })
    }
    else {
      this.setData({
        ifshow: 'none'
      })
    }
    console.log("call")
  }
})