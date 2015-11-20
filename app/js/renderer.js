/**
 * Created by wangwy on 15-9-24.
 */
EPUBJS.Renderer = function () {
  this.hidden = false;
  this.render = new EPUBJS.Render.Iframe();
  this.chapterPos = 1;
  this.fontSize = "";
  this.fontFamily = "";
  EPUBJS.Hooks.mixin(this);
  this.getHooks("beforeChapterDisplay");
  this.q = new EPUBJS.Queue(this);
  this.chapterName = document.getElementById("chapterName");
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
  render.then(function () {
    this.doc = this.render.document;
    this.docEl = this.render.docEl;
    if (this.fontSize) {
      this.doc.body.style.fontSize = this.fontSize + "px";
    }
    if (this.fontFamily) {
      this.doc.body.style.fontFamily = this.fontFamily;
    }
    this.formated = this.layout.format(this.docEl, this.render.width, this.render.height);
    this.render.setPageDimensions(this.formated.pageWidth, this.formated.pageHeight);
    //页面宽度
    this.pageWidth = this.formated.pageWidth;
    this.pageHeight = this.formated.pageHeight;
    this.viewDimensions = this.render.getViewDimensions();
    this.triggerHooks("beforeChapterDisplay", this);
    this.updatePages();
    this.currentOffset = this.pageMap[0].start;
    this.visible(true);
    this.chapterName.textContent = this.getChapterNameBypg(1) || "";
    deferred.resolve(this);
  }.bind(this));
  return deferred.promise;
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
      var pg = this.render.getPageNumberByElement(el);
      chapterNamePage.push({chapterName: chapterName, startPg: pg, endPg: null});
      chapterNamePage[index - 1].endPg = pg - 1;
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

    if (node.nodeType == Node.ELEMENT_NODE && node.childNodes.length === 0) {
      return true;
    }
  };

  var checkChild = function (node) {
    var ranges = [];
    var range = document.createRange();
    range.selectNodeContents(node);
    var elPos = range.getBoundingClientRect();
    if (node.nodeType == Node.ELEMENT_NODE || (elPos.right < elPos.left + width)) {
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
      if (pos.left + pos.width < limit) {
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
  var ranges = [];
  var text = node.textContent;
  var doc = node.ownerDocument;
  var rangeLeft, rangeRight;

  var startIndex = 0,
      stopIndex = text.length - 1,
      middle = Math.floor((startIndex + stopIndex) / 2);
  while (startIndex < stopIndex) {
    rangeLeft = doc.createRange();
    rangeLeft.setStart(node, startIndex);
    rangeLeft.setEnd(node, middle);

    rangeRight = doc.createRange();
    rangeRight.setStart(node, middle);
    rangeRight.setEnd(node, stopIndex);

    if (rangeLeft.getBoundingClientRect().right <= limit && rangeRight.getBoundingClientRect().left >= limit) {
      ranges.push(rangeLeft, rangeRight);
      break;
    } else if (rangeLeft.getBoundingClientRect().right < limit) {
      startIndex = middle;
    } else if (rangeLeft.getBoundingClientRect().right > limit) {
      stopIndex = middle;
    }
    middle = Math.floor((startIndex + stopIndex) / 2);
  }

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
    this.trigger("renderer:locationChanged", {spinePos: this.currentChapter.spinePos, page: this.chapterPos});
    var chapterName = this.getChapterNameBypg(pg);
    if (chapterName != this.chapterName.textContent) {
      this.chapterName.textContent = chapterName;
    }
    this.currentOffset = this.pageMap[pg - 1].start;
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

RSVP.EventTarget.mixin(EPUBJS.Renderer.prototype);