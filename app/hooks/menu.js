EPUBJS.pluginView = EPUBJS.pluginView || {};
EPUBJS.pluginView.PopMenu = function() {
  // this.eventEmitter = new EventEmitter();
  this.height = 40;
  //当前操作的group
  this.currentGroupID = null;
  this.popMenu = GLPopMenu.instance;
  this.popMenu.setMenuItems([{
    'text': '编辑',
    'callback': this.editANote.bind(this)
  },
    {
      'text': '删除',
      'callback': this.deleteANote.bind(this)
    }]);
}

EPUBJS.pluginView.PopMenu.prototype = {
  CLEAR: 'clear',
  NOTE: 'note',
  setSelectionRange: function(range_) {
    this.range = range_;
  },
  getSelectionRange: function() {
    return this.range;
  },
  setDocument: function(d) {
    this.document = d;
  },
  setView: function(v) {
    this.view = view;
  },

  //删除一条笔记
  deleteANote: function() {
    this.clearInlineStyle(this.currentGroupID);
    EPUBJS.core.postMessageToMobile('deleteNote', this.currentGroupID);
  },

  //编辑一条笔记
  editANote: function() {
    EPUBJS.core.postMessageToMobile('editNote', EPUBJS.BookInterface.menu.currentGroupID);
  },

  //更新页面上的笔记
  updateNote: function(groupId, comment) {
    var treeWalker = this.document.createTreeWalker(this.document.body, NodeFilter.SHOW_ELEMENT, {
      acceptNode: function(node) {
        if (node.tagName.toLowerCase().trim() === 'div' && node.groupId == groupId) {
          return NodeFilter.FILTER_ACCEPT;
        } else {
          return NodeFilter.FILTER_SKIP;
        }
      }
    }, false);
    while (treeWalker.nextNode()) {
      node = treeWalker.currentNode;
      node.data = comment;
    }
  },
  /**
   * 清除笔记
     @param 此条笔记的uuid(dataId)
   */
  clearInlineStyle: function(groupId) {
    var treeWalker = this.document.createTreeWalker(this.document.body, NodeFilter.SHOW_ELEMENT, {
      acceptNode: function(node) {
        if (node.tagName.toLowerCase().trim() === 'div' && node.groupId == groupId) {
          return NodeFilter.FILTER_ACCEPT;
        } else {
          return NodeFilter.FILTER_SKIP;
        }
      }
    }, false);
    var divs = [];
    while (treeWalker.nextNode()) {
      node = treeWalker.currentNode;
      divs.push(node);
    // node.parentElement.removeChild(node);
    }
    for (var i = 0; i < divs.length; i++) {
      var div = divs[i];
      div.parentElement.removeChild(div);
    }
  },
  hideCommentText: function() {
    if (this.document) {
      var container = this.document.getElementById('comment_text_container');
      if (container) {
        container.style.display = 'none';
      }
    }
  },
  /**
   * 划线
     @param text 选中的纯文本
     @param comment 选中文本的笔记信息 可为null
     @param startContainer 起始节点 / Range.startContainer
     @param endContainer 终止节点 / Range.endContainer
     @param startOffset 起始节点中的偏移量 Range.startOffset
     @param endOffset 终止节点中的偏移量 Range.endOffset
     @param parent 起始节点与终止节点的共同直接父元素 Range.commonAncestorContainer
     @param needStore 当前划线信息是否需要存储 重绘的线不需要 新增的笔记需要存储 true 存储｜false 不存储
   */
  _applyInlineStyle: function(text, comment, startContainer, endContainer, startOffset, endOffset, parent, needStore, dataId) {
    var self_ = this;
    /**
     * 通过解析所有字的坐标信息 获取矩形区域的信息
     * 返回 二维数组[][]
     */
    function getDivData(coors) {
      var begin_y = coors[0].y;
      var divData = [coors[0]];
      var divDatas = [];
      if (coors.length === 1) {
        divDatas.push(divData);
        return divDatas;
      }
      for (var i = 1; i < coors.length; i++) {
        var coor = coors[i];
        var y = coor.y;
        if (begin_y === y) {
          divData.push(coor);
        } else {
          divDatas.push(divData);
          divData = [coors[i]];
          begin_y = coors[i].y;
        }
        if (i === coors.length - 1) {
          divDatas.push(divData);
        }
      }
      return divDatas;
    }


    /**
     * 创建矩形区域
     */
    function resolveDivData(divDatas) {
      var self_ = this;
      if (!divDatas || divDatas.length === 0) {
        return null;
      }
      var divs = [];
      var uuid = dataId ? dataId : EPUBJS.core.uuid();

      //笔记区域点击后的回调
      var callback = function(evt) {
        evt.preventDefault();
        evt.stopPropagation();

        EPUBJS.BookInterface.menu.currentGroupID = evt.target.groupId;
        //show menu
        var rect = evt.target.getBoundingClientRect();
        var offsetY = EPUBJS.BookInterface.view.render.padding.top;
        var position = new GLPoint(rect.left + rect.width / 2, rect.top + offsetY);
        EPUBJS.BookInterface.menu.popMenu.ifNeedsDisplay(position);
      }

      for (var i = 0; i < divDatas.length; i++) {
        var div = EPUBJS.pluginView.createLineElement(uuid, divDatas[i]);
        div.addEventListener('touchend', callback, false);
        divs.push(div);
      }

      return divs;
    }

    /**
     * 创建划线笔记后的小圆点
     */
    function resolveCommentIcon(data, comment, groupId) {
      if (!comment || comment.trim().length === 0) {
        return null;
      }
      var self_ = this;
      var icon = EPUBJS.pluginView.createNoteIconButton(groupId, comment);
      icon.addEventListener('touchend', function(evt) {
        evt.preventDefault();
        evt.stopPropagation();
        EPUBJS.BookInterface.menu.currentGroupID = groupId;
        var rect = icon.getBoundingClientRect();
        var offsetY = EPUBJS.BookInterface.view.render.padding.top;
        var position = new GLPoint(rect.left + 7, rect.top + 7 + offsetY);
        GLBubbleView.sharedInstance.ifNeedsDisplay(comment, position, EPUBJS.BookInterface.menu.editANote, null);

      }, false);

      if (data.length == 1) {
        icon.style.top = Math.floor(data[0].y + data[0].height / 2) - 6 + 'px';
        icon.style.left = (EPUBJS.BookInterface.view.chapterPos - 1) * EPUBJS.BookInterface.view.pageWidth + data[0].x + data[0].width + 'px';
      } else {
        icon.style.top = Math.floor(data[data.length - 1].y + data[data.length - 1].height / 2) - 6 + 'px';
        icon.style.left = (EPUBJS.BookInterface.view.chapterPos - 1) * EPUBJS.BookInterface.view.pageWidth + data[data.length - 1].x + data[data.length - 1].width + 'px';
      }
      return icon;
    }

    //获取所有的textNode
    var textNodes = EPUBJS.DomUtil.getAllTextNode(parent);
    //找到所有选中文字的坐标信息
    var coordinate = EPUBJS.DomUtil.getCoordinate(startContainer, endContainer, startOffset, endOffset, textNodes);
    //解析坐标信息(几行？每行的宽度 和高度？及其显示位置？)
    var divDatas = getDivData(coordinate);
    // 根据解析来的坐标信息创建出div信息
    var divs = resolveDivData(divDatas);
    // 创建小圆点 如果 comment为null or "" icon为null
    var icon = resolveCommentIcon.call(self_, divDatas[divDatas.length - 1], comment, divs[0].groupId);
    for (var i = 0; i < divs.length; i++) {
      self_.document.body.appendChild(divs[i]);
    }
    if (icon)
      self_.document.body.appendChild(icon);
    // 将数据回传外层
    if (needStore) {
      var position_parent = EPUBJS.DomUtil.getPosition(self_.document.body, parent);
      var position_start = EPUBJS.DomUtil.getPosition(parent, startContainer);
      var position_end = EPUBJS.DomUtil.getPosition(parent, endContainer);
      var uuid = divs[0].groupId;
      /**
       * 返回data含义
        '{"dataId":"9bc1b40b-eafa-44f1-8e11-86e2751b757f",'此条笔记的id
      '"index":2,' 此条笔记所在的html对应页面的index
      '"startContainer":[6,9],' 此条笔记对应的开始节点 从 body元素找起 第一层的第六个元素，第二层的第9个元素
      '"endContainer":[8,1],' 此条笔记对应的开始节点 从 body元素找起 第一层的第六个元素，第二层的第9个元素
      '"startOffset":81,"endOffset":144,' 在起始节点中的文字偏移量
      '"parent":[2],' 起始节点与中止节点公共父元素（直接父元素）位置信息
      '"time":1445755306203,'+ note创建时间
      '"tag":"comment",'+ 此条笔记属于评论（还有 underline 与 copy 对应不同的操作）
          //选中的纯文本信息
      '"text":"篇4种，课文全部经过调整，部分课文完全重写，一些小知识也相应更新，同时采纳读者建议，增设生词表，方便读者查阅。《中文在手》系列丛书主要面向来华旅游、学习、工作的外国人和希望学习汉语、了解中国的外国朋友。整套丛书注重实用性、趣味性，兼顾科学性，突出时代感。所展示的日常交际用语和实用情景对话，基本可以满足外国人在中国的日常交际需要。该丛书既可以作为汉语实用交际手册，又可以作为专题式短期汉语教材使用。",'+
          //评论内容(tag为comment时才有)
      '"comment":"ddddddd"}';
       */
      var data = {
        dataId: uuid,
        index: self_.view.currentChapter.spinePos,
        'startContainer': position_start,
        'endContainer': position_end,
        'startOffset': startOffset,
        'endOffset': endOffset,
        'parent': position_parent,
        'time': new Date().getTime(),
        'tag': 'comment',
        'text': text,
        'comment': comment,
        'chapterName': self_.view.chapterName.innerText
      }
      return data;
    }
  }
}
