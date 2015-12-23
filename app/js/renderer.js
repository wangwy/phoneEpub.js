/**
 * Created by wangwy on 15-9-24.
 */
EPUBJS.Renderer = function () {
  this.hidden = false;
  this.render = new EPUBJS.Render.Iframe();
  this.chapterPos = 1;
  this.fontSize = "";
  this.fontFamily = "";
  this.nightMode = 0;
  EPUBJS.Hooks.mixin(this);
  this.getHooks("beforeFormat","beforeChapterDisplay");
  this.q = new EPUBJS.Queue(this);
  this.chapterName = document.getElementById("chapterName");
};

/**
 * 获取显示区域的宽、高，并将iframe添加到显示区域内
 * @param element
 * @param padding
 */
EPUBJS.Renderer.prototype.initialize = function (element, padding) {
  this.container = element;
  if (this.element) {
    this.container.removeChild(this.element);
  }
  this.element = this.render.create(padding);

  this.container.appendChild(this.element);
  this.render.resized();
};

/**
 * 隐藏或者显示iframe
 * @param bool
 * @returns {CSSStyleDeclaration.visibility|*}
 */
EPUBJS.Renderer.prototype.visible = function (bool) {
  if (typeof (bool) === "undefined") {
    return this.element.style.visibility;
  }

  if (bool === true && !this.hidden) {
    this.element.style.visibility = "visible";
  } else if (bool === false) {
    this.element.style.visibility = "hidden";
  }
};

/**
 * 显示章节
 * @param chapter
 * @returns {deferred.promise|*|*}
 */
EPUBJS.Renderer.prototype.displayChapter = function (chapter) {
  this.currentChapter = chapter;
  this.chapterPos = 1;
  return this.load(chapter.absolute);
};

/**
 * 根据路径加载页面
 * @param url
 * @returns {deferred.promise|*}
 */
EPUBJS.Renderer.prototype.load = function (url) {
  var deferred = new RSVP.defer();
  this.layout = new EPUBJS.Layout["Reflowable"]();
  this.visible(false);
  if (this.currentChapter.spinePos != 0) {
    EPUBJS.core.postMessageToMobile("chapterDisplay", {chapterDisplay: "start"});
  }
  var render = this.render.load(url);
  render.then(function () {
    this.doc = this.render.document;
    this.docEl = this.render.docEl;
    if (this.fontSize) {
      this.doc.body.style.fontSize = this.fontSize + "px";
    }
    if (this.fontFamily) {
      this.doc.body.style.fontFamily = this.fontFamily;
    }
    if (this.nightMode === 1) {
      this.setNightMode(this.nightMode);
    }
    this.formated = this.layout.format(this.docEl, this.render.width, this.render.height);
    this.render.setPageDimensions(this.formated.pageWidth, this.formated.pageHeight);
    //页面宽度
    this.pageWidth = this.formated.pageWidth;
    this.pageHeight = this.formated.pageHeight;
    this.viewDimensions = this.render.getViewDimensions();
    this.triggerHooks("beforeFormat",this.doc, this.viewDimensions.viewWidth, this.viewDimensions.viewHeight);
    this.updatePages();
    if(this.currentOffset){
      this.gotoOffset(this.currentOffset);
    }
    this.triggerHooks("beforeChapterDisplay", this);
    this.visible(true);
    this.chapterName.textContent = this.getChapterNameBypg(1) || "";
    if (this.currentChapter.spinePos != 0) {
      EPUBJS.core.postMessageToMobile("chapterDisplay", {chapterDisplay: "end"});
    }
    deferred.resolve(this);
  }.bind(this));
  return deferred.promise;
};

/**
 * 重新格式化页面
 */
EPUBJS.Renderer.prototype.reformat = function () {
  this.formated = this.layout(this.docEl, this.render.width, this.render.height);
  this.render.setPageDimensions(this.formated.pageWidth, this.formated.pageHeight);
  this.updatePages();
  if (this.currentOffset) {
    this.gotoOffset(this.currentOffset);
  }
};

/**
 * 重置字号
 * @param size
 */
EPUBJS.Renderer.prototype.resetFontSize = function (size) {
  this.fontSize = size;
};

/**
 * 重置字体
 * @param family
 */
EPUBJS.Renderer.prototype.resetFontFamily = function (family) {
  this.fontFamily = family;
};

/**
 * 更新页面
 */
EPUBJS.Renderer.prototype.updatePages = function () {
  this.pageMap = this.mapPage();
  this.displayedPages = this.pageMap.length;
  this.chapterNamePage = this.parseChapterNames(this.currentChapter.chapterNames);
};

/**
 * 格式化标题
 * @param chapterNames
 */
EPUBJS.Renderer.prototype.parseChapterNames = function (chapterNames) {
  var chapterName, path, chapterNamePage = [];
  chapterNames.forEach(function (item, index) {
    chapterName = item.chapterName;
    path = item.path;
    var paths = path.split("#");
    if (paths.length === 1) {
      chapterNamePage.push({chapterName: chapterName, startPg: 1, endPg: null});
    } else {
      var section = paths[1];
      var el = this.doc.getElementById(section);
      if(el){
        var pg = this.render.getPageNumberByElement(el);
        chapterNamePage.push({chapterName: chapterName, startPg: pg, endPg: null});
        if (index != 0) {
          chapterNamePage[index - 1].endPg = pg - 1;
        }
      }
    }
  }, this);
  chapterNamePage[chapterNamePage.length - 1].endPg = this.displayedPages;
  return chapterNamePage;
};

/**
 * 根据页码获取章节名称
 * @param pg
 */
EPUBJS.Renderer.prototype.getChapterNameBypg = function (pg) {
  var chapterNames = [];
  this.chapterNamePage.forEach(function (item) {
    if (pg >= item.startPg && pg <= item.endPg) {
      chapterNames.push(item.chapterName);
    }
  }, this);

  return chapterNames[chapterNames.length - 1];
};

/**
 * 计算每页的起始节点
 * @returns {Array}
 */
EPUBJS.Renderer.prototype.mapPage = function () {
  var renderer = this;
  var map = [];
  var root = this.render.docEl;
  var page = 1;
  var width = this.layout.colWidth;
  var count = 0;
  var limit = width * page;

  var elLimit = 0;
  var prevRange;

  var check = function (node) {
    var elPos;
    var elRange;
    var children = Array.prototype.slice.call(node.childNodes);
    elRange = document.createRange();
    elRange.selectNodeContents(node);
    elPos = elRange.getBoundingClientRect();
    if (!elPos || (elPos.width === 0 && elPos.height === 0)) {
      return;
    }
    if (elPos.left >= elLimit || (elPos.right >= elLimit && elPos.left <= elLimit - width)) {
      children.forEach(function (node) {
        if (checkNode(node)) {
          checkChild(node);
        }
      });
    }
  };

  var checkNode = function (node) {
    if (node.nodeType == Node.TEXT_NODE && node.textContent.trim().length) {
      return true;
    }
    var elRange = document.createRange();
    elRange.selectNodeContents(node);
    var elPos = elRange.getBoundingClientRect();

    if (!elPos || (elPos.width === 0 && elPos.height === 0)) {
      return false
    }

    //判断图片
    if (node.nodeType == Node.ELEMENT_NODE && node.childNodes.length === 0) {
      return true;
    }
  };

  var checkChild = function (node) {
    var lineHeight = parseInt(getComputedStyle(node.parentElement)["line-height"].slice(0, -2));
    var ranges = [];
    var range = document.createRange();
    range.selectNodeContents(node);
    var elPos = range.getBoundingClientRect();
    //过滤掉分栏不生效的节点
    if (elPos.right > elPos.left + width && elPos.height < lineHeight) {
      return;
    }
    if (node.nodeType == Node.ELEMENT_NODE || (elPos.right <= elPos.left + width)) {
      ranges.push(range);
    } else {
      var textRanges = renderer.splitTextNodeIntoWordsRanges(node, limit);
      ranges = ranges.concat(textRanges);
    }
    ranges.forEach(function (range) {
      var pos = range.getBoundingClientRect();

      if (!pos || (pos.width === 0 && pos.height === 0)) {
        return;
      }
      if (pos.left + pos.width <= limit) {
        if (!map[page - 1]) {
          map.push({
            start: 0,
            startRange: range,
            end: null,
            endRange: null
          });
        }
        var num = range.endOffset || 1;
        count = count + num;
      } else {
        if (prevRange) {
          map[map.length - 1].end = count - 1;
          map[map.length - 1].endRange = prevRange;
        }
        map.push({
          start: count,
          startRange: range,
          end: null,
          endRange: null
        });
        var num = range.startContainer.textContent.length || 1;
        count = count + num - range.startOffset;
        page += 1;
        limit = width * page;
        elLimit = limit - width;
      }
      prevRange = range;
    })
  };

  this.sprint(root, check);

  if (prevRange) {
    map[map.length - 1].end = count - 1;
    map[map.length - 1].endRange = prevRange;
  }

  if (!map.length) {
    var range = this.doc.createRange();
    range.selectNodeContents(root);
    map.push({start: 0, startRange: range, end: 0, endRange: range});
  }

  prevRange = null;
  root = null;
  return map;
};

/**
 * 将字符转换成range
 * @param node
 * @param limit
 * @returns {*}
 */
EPUBJS.Renderer.prototype.splitTextNodeIntoWordsRanges = function (node, limit) {
  var ranges = [], limitPos = limit, pageWidth = this.pageWidth;
  var rangeLeft = node.ownerDocument.createRange(), rangeRight = node.ownerDocument.createRange();
  var startIndex, stopIndex, middle;
  var range = this.doc.createRange();
  range.selectNode(node);
  var rightPos = range.getBoundingClientRect().right;

  if(node.textContent == "2009年12月5日～6日，由《中国企业家》杂志社、中国企业家俱乐部联合主办的“2009年（第八届）中国企业领袖年会”在北京中国大饭店举行，主题为“新商业文明的中国路径”。阿里巴巴集团董事局主席兼首席执行官马云作了演讲。该演讲稿从与此年会同时进行的中央经济工作会议和哥本哈根会议带给大家的信号讲起，指出“金融危机也是一种信号，对于这个信号我比较遗憾，人类感受得不够痛”。马云呼吁大家应该从危机中悟出些什么，为这个社会环境做点什么。"){
    debugger;
  }


  function splitWord(index, split) {
    startIndex = index;
    stopIndex = node.textContent.length;
    middle = Math.floor((startIndex + stopIndex) / 2);
    while (startIndex < stopIndex && limitPos < rightPos) {
      rangeLeft.collapse(true);
      rangeLeft.setStart(node, startIndex);
      rangeLeft.setEnd(node, middle);

      rangeRight.collapse(true);
      rangeRight.setStart(node, middle);
      rangeRight.setEnd(node, stopIndex);

      //(rangeLeft.toString().length < 2) 兼容锤子手机
      if ((rangeLeft.getBoundingClientRect().right <= split && rangeRight.getBoundingClientRect().left >= split) || (rangeLeft.toString().length < 2)) {
        ranges.push(rangeLeft.cloneRange(), rangeRight.cloneRange());
        limitPos = limitPos + pageWidth;
        if (limitPos < rightPos) {
          splitWord(middle, limitPos)
        } else {
          break;
        }
      } else if (rangeLeft.getBoundingClientRect().right < split) {
        startIndex = middle;
      } else if (rangeLeft.getBoundingClientRect().right > split) {
        stopIndex = middle;
      }
      middle = Math.floor((startIndex + stopIndex) / 2);
    }
  }

  splitWord(0, limitPos);
  return ranges;
};

/**
 * 取出页面的所有element并循环
 * @param root
 * @param func
 */
EPUBJS.Renderer.prototype.sprint = function (root, func) {
  var treeWalker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, null, false);
  var node;
  while ((node = treeWalker.nextNode())) {
    func(node);
  }
};

/**
 * 下一页
 * @returns {*}
 */
EPUBJS.Renderer.prototype.nextPage = function (durTime) {
  return this.page(this.chapterPos + 1, durTime);
};

/**
 * 上一页
 * @returns {*}
 */
EPUBJS.Renderer.prototype.prevPage = function (durTime) {
  return this.page(this.chapterPos - 1, durTime)
};

/**
 * 跳转到最后一页
 */
EPUBJS.Renderer.prototype.lastPage = function () {
  this.page(this.displayedPages, 0);
};

/**
 * 跳转到第一页
 */
EPUBJS.Renderer.prototype.firstPage = function () {
  this.page(1, 0);
};

/**
 * 停留在当前页
 * @param durTime
 */
EPUBJS.Renderer.prototype.currentPage = function (durTime) {
  this.page(this.chapterPos, durTime);
};

/**
 * 根据fragment找到所在的节点
 * @param fragment
 */
EPUBJS.Renderer.prototype.section = function (fragment) {
  var el = this.doc.getElementById(fragment);
  if (el) {
    this.pageByElement(el);
  }
};

/**
 * 根据range跳到相应的页面
 * @param range
 */
EPUBJS.Renderer.prototype.gotoRange = function (range) {
  var pg = this.render.getPageNumberByRect(range.getBoundingClientRect());
  this.page(pg, 0);
};

/**
 * 根据偏移量跳转到相应的页面
 * @param offset
 */
EPUBJS.Renderer.prototype.gotoOffset = function (offset) {
  var pg = this.getPgByOffset(offset);
  this.page(pg, 0);
};

/**
 * 根据偏移量获取页码
 * @param offset
 * @returns {number}
 */
EPUBJS.Renderer.prototype.getPgByOffset = function (offset) {
  var pg = 1;
  for (var i = 0; i < this.pageMap.length; i++) {
    var map = this.pageMap[i];
    if (offset >= map.start && offset <= map.end) {
      pg = i + 1;
      break;
    }
  }
  return pg;
};

/**
 * 跳转到el所在的页面
 * @param el
 */
EPUBJS.Renderer.prototype.pageByElement = function (el) {
  var pg = this.render.getPageNumberByElement(el);
  this.page(pg, 0);
};

/**
 * 获取页面向左的偏移量
 * @returns {*}
 */
EPUBJS.Renderer.prototype.getLeft = function () {
  return this.pageLeftOffset = this.render.getLeft(this.chapterPos);
};

/**
 * 根据偏移量跳转到相应的位置，移动页面时调用此方法
 * @param leftPos
 * @returns {*}
 */
EPUBJS.Renderer.prototype.setLeft = function (leftPos) {
  return this.render.setLeft(leftPos, 0);
};

/**
 * 根据页码与持续事件跳转到相应的页面
 * @param pg
 * @param durTime
 * @returns {boolean}
 */
EPUBJS.Renderer.prototype.page = function (pg, durTime) {
  var time = durTime || 1;
  var defer = new RSVP.defer();
  var renderer = this;

  function whichTransitionEvent() {
    var transitions = {
      'transition' : 'transitionend',
      'MozTransition' : 'transitionend',
      'WebkitTransition' : 'webkitTransitionEnd'
    };

    for(var t in transitions){
      if(renderer.docEl.style[t] !== undefined){
        return transitions[t];
      }
    }
  }

  var transitionEvent = whichTransitionEvent();

  var translationEnd = function () {
    this.docEl.removeEventListener(transitionEvent, translationEnd, false);
    var result = (pg >= 1 && pg <= this.displayedPages) ? true : false;
    if(!result){
      this.currentOffset = 0;
    }
    defer.resolve(result);
  }.bind(this);
  if (pg >= 1 && pg <= this.displayedPages) {
    this.chapterPos = pg;
    this.render.docEl.addEventListener(transitionEvent, translationEnd, false);
    this.render.page(pg, time);
    this.trigger("renderer:locationChanged", {spinePos: this.currentChapter.spinePos, page: this.chapterPos});
    var chapterName = this.getChapterNameBypg(pg);
    if (chapterName != this.chapterName.textContent) {
      this.chapterName.textContent = chapterName;
    }
    this.currentOffset = this.pageMap[pg - 1].start;
    return defer.promise;
  } else if (pg == (this.displayedPages + 1)) {
    this.render.page(pg, time);
    this.docEl.addEventListener(transitionEvent, translationEnd, false);
    return defer.promise;
  } else if (pg == 0) {
    this.render.page(0, time);
    this.docEl.addEventListener(transitionEvent, translationEnd, false);
    return defer.promise;
  }
};

/**
 * head里添加标签
 * @param headTags
 */
EPUBJS.Renderer.prototype.addHeadTags = function (headTags) {
  headTags.forEach(function (headTag) {
    for (var tag in headTag) {
      this.render.addHeadTag(tag, headTag[tag]);
    }
  }, this);
};

/**
 * 轮训"query",让它执行"func"函数
 * @param query
 * @param func
 * @param progress
 */
EPUBJS.Renderer.prototype.replace = function (query, func, progress) {
  var items = this.docEl.querySelectorAll(query),
      resources = Array.prototype.slice.call(items),
      count = resources.length;
  if (count === 0) {
    return;
  }
  resources.forEach(function (item) {
    var called = false;
    var after = function (result, full) {
      if (called === false) {
        count--;
        if (progress) progress(result, full, count);
        if (count <= 0) return;
        called = true;
      }
    };

    func(item, after);
  }.bind(this));
};

/**
 * 获取当前页面的偏移量
 */
EPUBJS.Renderer.prototype.getCurrentPos = function () {
  return this.pageMap[this.chapterPos - 1];
};

/**
 * 获取element的xPath
 * @param element
 * @returns {string}
 */
EPUBJS.Renderer.prototype.getXPathByElement = function (element) {
  var paths = [];
  var isXhtml = (element.ownerDocument.documentElement.getAttribute("xmlns") === "http://www.w3.org/1999/xhtml");
  var index, nodeName, tagName, pathIndex;
  if (element.nodeType == Node.TEXT_NODE) {
    index = EPUBJS.core.indexOfTextNode(element) + 1;
    paths.push("text()[" + index + "]");
    element = element.parentNode;
  }
  for (; element && element.nodeType == Node.ELEMENT_NODE; element = element.parentNode) {
    index = 0;
    for (var sibling = element.previousSibling; sibling; sibling = sibling.previousSibling) {

      //忽略doc的类型声明
      if (sibling.nodeType == Node.DOCUMENT_TYPE_NODE) {
        continue;
      }
      if (sibling.nodeName == element.nodeName) {
        ++index;
      }
    }
    nodeName = element.nodeName.toLowerCase();
    tagName = (isXhtml ? "xhtml:" + nodeName : nodeName);
    pathIndex = (index ? "[" + (index + 1) + "]" : "");
    paths.splice(0, 0, tagName + pathIndex);
  }
  return paths.length ? "./" + paths.join("/") : null;
};

/**
 * 通过xPath获取element
 * @param xpath
 * @returns {Node}
 */
EPUBJS.Renderer.prototype.getElementByXPath = function (xpath) {
  var startContainer = this.doc.evaluate(xpath, this.doc, EPUBJS.core.nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
  return startContainer;
};

/**
 * 从本页面中查找文本
 * @param doc
 * @param text
 * @param spinePos
 * @param chapterName
 * @returns {Array}
 */
EPUBJS.Renderer.prototype.searchText = function (text, doc, spinePos, chapterName) {
  try {
    var treeWalker = document.createTreeWalker(doc, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        if (node.textContent.trim().length > 0) {
          return NodeFilter.FILTER_ACCEPT;
        } else {
          return NodeFilter.FILTER_REJECT;
        }
      }
    }, false);
    var node, results = [], offset = -1, xPath;
    while (node = treeWalker.nextNode()) {
      offset = node.textContent.indexOf(text);
      if (offset != -1) {
        xPath = this.getXPathByElement(node);
        results.push({nodeText: node.textContent, search: text, spinePos: spinePos, chapterName: chapterName, xPath: xPath, offset: offset});
      }
    }
  } catch (e) {
    EPUBJS.core.postMessageToMobile("searchText",{flag:"0"})
  }
  return results;
};

/**
 * 获取坐标
 * @param node
 * @param offset
 * @param length
 * @returns {Array}
 */
EPUBJS.Renderer.prototype.getHighlightRects = function (node, offset, length) {
  var range = document.createRange(), rect, endRect = {}, map = [];
  for (var i = offset; i < (offset + length); i++) {
    range.setStart(node, i);
    range.setEnd(node, i + 1);
    rect = range.getBoundingClientRect();
    if (i == offset) {
      endRect = rect;
      map.push({start: rect, end: null});
    } else {
      if (rect.top == endRect.top) {
        endRect = rect;
      } else {
        map[map.length - 1].end = endRect;
        endRect = rect;
        map.push({start: rect, end: null});
      }
    }
  }
  if (endRect) {
    map[map.length - 1].end = endRect;
  }
  return map;
};

/**
 * 根据坐标创建div，用于做背景
 * @param width
 * @param height
 * @param left
 * @param top
 */
EPUBJS.Renderer.prototype.createHighlightDiv = function (width, height, left, top) {
  var div = this.doc.createElement("div");
  div.style.position = "absolute";
  div.style.opacity = "0.16";
  div.style.width = width + "px";
  div.style.height = height + "px";
  div.style.left = left + "px";
  div.style.top = top + "px";
  div.style.backgroundColor = "rgb(204,51,0)";
  div.setAttribute("class", "highlight-search");
  return div;
};

/**
 * 高亮文字
 * @param node
 * @param offset
 * @param length
 */
EPUBJS.Renderer.prototype.highlight = function (node, offset, length) {
  var rectMap = this.getHighlightRects(node, offset, length);
  var divFrag = document.createDocumentFragment();
  rectMap.forEach(function (rects) {
    divFrag.appendChild(this.createHighlightDiv(rects.end.right - rects.start.left, rects.start.height, rects.start.left, rects.start.top));
  }, this);
  this.doc.body.appendChild(divFrag);
};

/**
 * 清除背景
 */
EPUBJS.Renderer.prototype.unHighlight = function () {
  var items = Array.prototype.slice.apply(this.doc.body.getElementsByClassName("highlight-search"));
  items.forEach(function (item) {
    this.doc.body.removeChild(item);
  }, this);
};

/**
 * 设置日夜间模式
 * @param isNightMode
 */
EPUBJS.Renderer.prototype.setNightMode = function (isNightMode) {
  this.nightMode = isNightMode;
  var styleTag;
  if (isNightMode === 1) {
    styleTag = this.doc.createElement("style");
    styleTag.id = "nightMode";
    styleTag.innerHTML = "html,img,video{-webkit-filter:invert(1)hue-rotate(180deg);filter:invert(1)hue-rotate(180deg)} img,video{-webkit-backface-visibility:hidden}";
    this.doc.head.appendChild(styleTag);
  } else {
    styleTag = this.doc.getElementById("nightMode");
    this.doc.head.removeChild(styleTag);
  }
};

RSVP.EventTarget.mixin(EPUBJS.Renderer.prototype);
