/**
 * Created by wangwy on 15-9-24.
 */
EPUBJS.Renderer = function () {
  this.hidden = false;
  this.render = new EPUBJS.Render.Iframe();
  this.chapterPos = 1;

  EPUBJS.Hooks.mixin(this);
  this.getHooks("beforeChapterDisplay");
};

/**
 * 获取显示区域的宽、高，并将iframe添加到显示区域内
 * @param element
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
  var render = this.render.load(url);
  render.then(function (contents) {
    this.doc = this.render.document;
    this.docEl = this.render.docEl;
    this.formated = this.layout.format(contents, this.render.width, this.render.height);
    this.render.setPageDimensions(this.formated.pageWidth, this.formated.pageHeight);
    //页面宽度
    this.pageWidth = this.formated.pageWidth;
    this.pageHeight = this.formated.pageHeight;
//      this.pages = this.layout.calculatePages();
    this.triggerHooks("beforeChapterDisplay", this);
    this.render.setWidthAndHeight(this.pages, this.formated.pageHeight);
    this.updatePages();
    this.visible(true);
    deferred.resolve(this);
  }.bind(this));
  return deferred.promise;
};

/**
 * 更新页面
 */
EPUBJS.Renderer.prototype.updatePages = function () {
  this.pageMap = this.mapPage();
  this.displayedPages = this.pageMap.length;
};

/**
 * 计算每页的起始节点
 * @returns {Array}
 */
EPUBJS.Renderer.prototype.mapPage = function () {
  var renderer = this;
  var map = [];
  var root = this.render.getBaseElement();
  var page = 1;
  var width = this.layout.colWidth;
  var offset = 0;
  var count = 0;
  var limit = width * page;

  var elLimit = 0;
  var prevRange;

  var check = function (node) {
    var elPos;
    var elRange;
    var children = Array.prototype.slice.call(node.childNodes);
    if (node.nodeType == Node.ELEMENT_NODE) {
      elRange = document.createRange();
      elRange.selectNodeContents(node);
      elPos = elRange.getBoundingClientRect();
      if (!elPos || (elPos.width === 0 && elPos.height === 0)) {
        return;
      }

      if (elPos.left >= elLimit) {
        children.forEach(function (node) {
          if (node.nodeType == Node.TEXT_NODE &&
              node.textContent.trim().length) {
            checkText(node);
            count += node.textContent.trim().length;
          }
        })
      }
    }
  };

  var checkText = function (node) {
    var ranges = renderer.splitTextNodeIntoWordsRanges(node);
    ranges.forEach(function (range) {
      var pos = range.getBoundingClientRect();

      if (!pos || (pos.width === 0 && pos.height === 0)) {
        return;
      }
      if (pos.left + pos.width < limit) {
        if (!map[page - 1]) {
          range.collapse(true);
          map.push({start: range, startCount: count, end: null, endCount: null});
        }
      } else {
        if (prevRange) {
          prevRange.collapse(true);
          map[map.length - 1].end = prevRange;
          map[map.length - 1].endCount = count - 1;
        }
        range.collapse(true);
        map.push({
          start: range,
          startCount: count,
          end: null,
          endCount: null
        });

        page += 1;
        limit = (width * page) - offset;
        elLimit = limit - width;
      }
      prevRange = range;
    })
  };

  this.sprint(root, check);

  if (prevRange) {
    prevRange.collapse(true);
    map[map.length - 1].end = prevRange;
    map[map.length - 1].endCount = count;
  }

  if (!map.length) {
    var range = this.doc.createRange();
    range.selectNodeContents(root);
    range.collapse(true);
    map.push({start: range, startCount: 0, end: range, endCount: root.textContent.trim().length - 1});
  }
  prevRange = null;
  root = null;
  return map;
};

/**
 * 将字符转换成range
 * @param node
 * @returns {*}
 */
EPUBJS.Renderer.prototype.splitTextNodeIntoWordsRanges = function (node) {
  var ranges = [];
  var text = node.textContent.trim();
  var range;

  var pos = this.indexOfBreakableChar(text);

  if (pos === -1) {
    range = this.doc.createRange();
    range.selectNodeContents(node);
    return [range];
  }

  range = this.doc.createRange();
  range.setStart(node, 0);
  range.setEnd(node, pos);
  ranges.push(range);

  range = this.doc.createRange();
  range.setStart(node, pos + 1);

  while (pos != -1) {
    pos = this.indexOfBreakableChar(text, pos + 1);
    if (pos > 0) {
      if (range) {
        range.setEnd(node, pos);
        ranges.push(range);
      }

      range = this.doc.createRange();
      range.setStart(node, pos + 1);
    }
  }

  if (range) {
    range.setEnd(node, text.length);
    ranges.push(range);
  }

  return ranges;
};

/**
 * 文本换行位置
 * @param text
 * @param startPosition
 * @returns {*}
 */
EPUBJS.Renderer.prototype.indexOfBreakableChar = function (text, startPosition) {
  var whiteCharacters = "\x2D\x20\t\r\n\b\f";

  if (!startPosition) {
    startPosition = 0;
  }

  for (var i = startPosition; i < text.length; i++) {
    if (whiteCharacters.indexOf(text.charAt(i)) != -1) {
      return i;
    }
  }

  return -1;
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
  if(el){
    this.pageByElement(el);
  }
};

/**
 * 跳转到el所在的页面
 * @param el
 */
EPUBJS.Renderer.prototype.pageByElement = function (el) {
  var pg = this.render.getPageNumberByElement(el);
  this.page(pg,0);
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
  var time = durTime || 0;
  var defer = new RSVP.defer();
  var translationEnd = function () {
    this.docEl.removeEventListener('transitionend', translationEnd, false);
    var result = (pg >= 1 && pg <= this.displayedPages) ? true : false;
    defer.resolve(result);
  }.bind(this);
  if (pg >= 1 && pg <= this.displayedPages) {
    this.chapterPos = pg;
    this.render.docEl.addEventListener('transitionend', translationEnd, false);
    this.render.page(pg, time);
    return defer.promise;
  } else if (pg == (this.displayedPages + 1)) {
    this.render.page(pg, time);
    this.docEl.addEventListener('transitionend', translationEnd, false);
    return defer.promise;
  } else if (pg == 0) {
    this.render.page(0, time);
    this.docEl.addEventListener('transitionend', translationEnd, false);
    return defer.promise;
  }
};

/**
 * 轮训"query",让它执行"func"函数
 * @param query
 * @param func
 * @param finished
 * @param progress
 */
EPUBJS.Renderer.prototype.replace = function (query, func, progress) {
  var items = this.docEl.querySelectorAll(query),
      resources = Array.prototype.slice.call(items),
      count = resources.length;
  if(count === 0){
    return;
  }
  resources.forEach(function (item) {
    var called = false;
    var after = function (result, full) {
      if(called === false){
        count--;
        if(progress) progress(result, full, count);
        if(count <= 0) return;
        called = true;
      }
    };

    func(item, after);
  }.bind(this));
};

