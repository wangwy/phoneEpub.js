//笔记汽泡触发
EPUBJS.pluginView.createNoteIconButton = function(groupId, comment) {
  var icon = document.createElement('div');
  icon.groupId = groupId;
  icon.style.height = '20px';
  icon.style.width = '33px';
  icon.style.position = 'absolute';
  icon.data = comment;
  icon.innerHTML = "<img align='middle' width='12' height='12' src='/app/hooks/biji.png' />";
  return icon;
}

//创建下划线
EPUBJS.pluginView.createLineElement = function(groupId, data) {
  var div = document.createElement('div');
  div.style.borderBottom = '2px solid rgb(255, 96, 0)';
  div.style.position = 'absolute';
  div.groupId = groupId;
  if (data.length == 1) {
    div.style.height = data[0].height + 'px';
    div.style.width = data[0].width + 'px';
    div.style.top = data[0].y + 'px';
    div.style.left = (EPUBJS.BookInterface.view.chapterPos - 1) * EPUBJS.BookInterface.view.pageWidth + data[0].x + 'px';
  } else {
    var length = data.length;
    var startX = data[0].x;
    var endX = data[length - 1].x;
    div.style.height = data[0].height + 'px';
    //中止矩形x - 起始矩形x + 最后一个矩形的宽度
    div.style.width = endX - startX + data[length - 1].width + 'px';
    div.style.top = data[0].y + 'px';
    div.style.left = (EPUBJS.BookInterface.view.chapterPos - 1) * EPUBJS.BookInterface.view.pageWidth + data[0].x + 'px';
  }
  return div;
}
