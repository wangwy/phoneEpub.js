/**
 * Created by wangwy on 15-9-24.
 */
EPUBJS.Renderer = function () {
  this.hidden = false;
  this.render = new EPUBJS.Render.Iframe();
  this.chapterPos = 1;
};

/**
 * 获取显示区域的宽、高，并将iframe添加到显示区域内
 * @param element
 */
EPUBJS.Renderer.prototype.initialize = function (element) {
  this.container = element;
  this.element = this.render.create();

  this.width = this.container.clientWidth;
  this.height = this.container.clientHeight;

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
    this.contents = contents;
    this.doc = this.render.document;
    this.render.resetWidthAndHeight();
    this.formated = this.layout.format(contents, this.render.width, this.render.height);
    this.render.setPageDimensions(this.formated.pageWidth, this.formated.pageHeight);
    this.pages = this.layout.calculatePages();
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
  var width = this.layout.colWidth + this.layout.gap;
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
EPUBJS.Renderer.prototype.nextPage = function () {
  var next = this.pageOffset(this.chapterPos + 1);
  if(next){
    this.nextPageAnimation();
  }
  return next;
};

/**
 * 上一页
 * @returns {*}
 */
EPUBJS.Renderer.prototype.prevPage = function () {
  var prev = this.pageOffset(this.chapterPos - 1);
  if(prev){
    this.prevPageAnimation();
  }
  return prev;
};

/**
 * 跳转到最后一页
 */
EPUBJS.Renderer.prototype.lastPage = function () {
  this.chapterPos = this.displayedPages;
  var leftOffset = this.render.pageLeft(this.displayedPages);
  window.scrollTo(leftOffset, 0);
};

/**
 * 跳转到某一页
 * @param pg
 * @returns {boolean}
 */
EPUBJS.Renderer.prototype.pageOffset = function (pg) {
  if (pg >= 1 && pg <= this.displayedPages) {
    this.chapterPos = pg;
    this.pageLeftOffset = this.render.pageLeft(pg);
    return true;
  }
  return false;
};

/**
 * 下一页动画
 */
EPUBJS.Renderer.prototype.nextPageAnimation = function () {
  var currentOffset = window.scrollX;
  if (this.pageLeftOffset - currentOffset > 20) {
    currentOffset += 20;
    window.scrollTo(currentOffset, 0);
    this.nextAnimationFrameHandler = requestAnimationFrame(this.nextPageAnimation.bind(this));
  } else if (this.pageLeftOffset - currentOffset <= 20 && this.pageLeftOffset > currentOffset) {
    window.scrollTo(this.pageLeftOffset, 0);
    this.nextAnimationFrameHandler = requestAnimationFrame(this.nextPageAnimation.bind(this));
  } else {
    cancelAnimationFrame(this.nextAnimationFrameHandler);
  }
};

/**
 * 上一页动画
 */
EPUBJS.Renderer.prototype.prevPageAnimation = function () {
  var currentOffset = window.scrollX;
  if (currentOffset - this.pageLeftOffset > 20) {
    currentOffset -= 20;
    window.scrollTo(currentOffset, 0);
    this.prevAnimationFrameHandler = requestAnimationFrame(this.prevPageAnimation.bind(this));
  } else if (currentOffset - this.pageLeftOffset <= 20 && currentOffset > this.pageLeftOffset) {
    window.scrollTo(this.pageLeftOffset, 0);
    this.prevAnimationFrameHandler = requestAnimationFrame(this.prevPageAnimation.bind(this));
  } else {
    cancelAnimationFrame(this.prevAnimationFrameHandler);
  }
};
