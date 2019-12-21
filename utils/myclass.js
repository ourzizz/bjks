function get_parent_id(parent_son,son_id){
  for (var p_key in parent_son) {
      for(var s_key in parent_son[p_key].son_list) {
          if(son_id === parent_son[p_key].son_list[s_key].class_id)
              return parent_son[p_key].parent_id
      }
  }
  return 'NULL'
}

function get_sons_by_id(parent_son, class_id) {
for (var key in parent_son) {
  if (parent_son[key].parent_id == class_id) {
    return parent_son[key].son_list
  }
}
return 'NULL'
}

//获得给定id的第一个儿子，不存在返回NULL
function get_first_son(parent_son, pid) {
for (var key in parent_son) {
  if (parent_son[key].parent_id == pid) {//如果pid有儿子，那么它必然能在parent_id中匹配到
    return parent_son[key].son_list[0]//返回第一个儿子
  }
}
return 'NULL' //如果查找失败了
}

//获得第一个叶子节点
function find_first_leave(parent_son, parent_id) {
var first_son = get_first_son(parent_son, parent_id)
if (first_son == 'NULL') {//递归边界
  return parent_id
}
else if (first_son.count_sons == '0') {
  return first_son.class_id
}
else {
  return find_first_leave(parent_son, first_son.class_id)
}
}

module.exports = {get_parent_id , get_sons_by_id, get_first_son, find_first_leave }
