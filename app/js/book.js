/**
 * Created by wangwy on 15-9-24.
 */
EPUBJS.Book = function (options) {
  this.renderer = new EPUBJS.Renderer();
  this.renderer.on("renderer:locationChanged", this.showBookNum.bind(this));
  this.on("book:chapterDisplayed", this.showBookNum.bind(this));
  this.spine = options.spine;
  this.path = options.path;
  this.spineIndexByURL = this.parseSpine(this.spine);
  this.padding = options.padding;
  this.chaptersNum = options.chaptersNum || {};
  this.headTags = options.headTags || {};
  if (options.fontSize) {
    this.renderer.resetFontSize(options.fontSize);
  }
  if (options.fontFamily) {
    this.renderer.resetFontFamily(options.fontFamily);
  }
  this.spinePos = 0;
  this.q = new EPUBJS.Queue(this);
  //翻页队列
  this.paginationQ = new EPUBJS.Queue(this);
  this.bookPage = document.getElementById("bookPage");
  this.registerReplacements(this.renderer);
};

/**
 * 解析spine
 * @param spine
 * @returns {{}}
 */
EPUBJS.Book.prototype.parseSpine = function (spine) {
  var spineIndexByURL = {};
  spine.forEach(function (item) {
    spineIndexByURL[item.href] = item.index;
  });
  return spineIndexByURL;
};

/**
 * 添加container
 * @param eleId
 */
EPUBJS.Book.prototype.attachTo = function (eleId) {
  this.element = document.getElementById(eleId) || eleId;
  this.element.style.paddingTop = this.padding.top + "px";
  this.element.style.paddingBottom = this.padding.bottom + "px";
  var height = this.elementHeight();
  this.element.style.height = height + "px";
  this.container = this.initialize();
  this.element.appendChild(this.container);
};

/**
 * 计算container的height
 * @returns {number|*|EPUBJS.Renderer.height}
 */
EPUBJS.Book.prototype.elementHeight = function () {
  var height = document.documentElement.clientHeight;
  this.elementStyles = window.getComputedStyle(this.element);
  this.elementPadding = {
    top: parseFloat(this.elementStyles["padding-top"].slice(0, -2)) || 0,
    bottom: parseFloat(this.elementStyles["padding-bottom"].slice(0, -2)) || 0
  };
  return height - this.elementPadding.top - this.elementPadding.bottom;
};

/**
 * 初始化容器
 * @returns {HTMLElement}
 */
EPUBJS.Book.prototype.initialize = function () {
  var container;

  container = document.createElement("div");
  container.setAttribute("class", "epub-container");
  container.style.fontSize = "0";
  container.style.wordSpacing = "0";
  container.style.lineHeight = "0";
  container.style.verticalAlign = "top";
  container.style.width = "100%";
  container.style.height = "100%";
  container.style.overflowY = "hidden";
  return container;
};

/**
 * 初始化显示区域
 * @param eleId
 */
EPUBJS.Book.prototype.renderTo = function (eleId) {
  this.attachTo(eleId);
  this.q.enqueue(this.displayChapter);
  if (!Object.keys(this.chaptersNum).length) {
    this.getAllChapterNum().then(function (chaptersNum) {
      this.chaptersNum = chaptersNum;
      this.showBookNum();
    }.bind(this));
  }
};

/**
 * 展示章节
 * @param chap
 * @param end
 * @param goto
 * @returns {deferred.promise|*}
 */
EPUBJS.Book.prototype.displayChapter = function (chap, end, goto) {
  this.renderer.initialize(this.container, this.padding);
  var render,
      pos,
      defer = new RSVP.defer();

  var chapter;
  pos = chap || 0;
  if (pos < 0 || pos >= this.spine.length) {
    console.log("不是一个有效的地址");
    pos = 0;
  }

  chapter = new EPUBJS.Chapter(this.spine[pos]);

  this.spinePos = pos;
  render = this.renderer.displayChapter(chapter);

  render.then(function () {
    if (!goto) {
      this.trigger("book:chapterDisplayed");
    }
    if (end) { //上一章的最后一页
      this.renderer.lastPage();
    }
    defer.resolve(this.renderer);
    this.preloadNextChapter();

    this.currentChapter = chapter;
    this.addEventListeners();
  }.bind(this));

  return defer.promise;
};

/**
 * 显示页码
 */
EPUBJS.Book.prototype.showBookNum = function () {
  if (Object.keys(this.chaptersNum).length) {
    var num = 0;
    for (var i = 0; i < this.spinePos; i++) {
      num += this.chaptersNum[i];
    }
    num += this.renderer.chapterPos;

    this.bookPage.textContent = num + "/" + this.chaptersNum.allNum;

    var map = this.renderer.pageMap[this.renderer.chapterPos - 1];

    EPUBJS.core.postMessageToMobile("currentBookNum", {currentBookNum: num, spinePos: this.spinePos, startOffset: map.start, endOffset: map.end});
  } else {
    EPUBJS.core.postMessageToMobile("currentBookNum", {currentBookNum: -1});
  }
};

EPUBJS.Book.prototype.gotoHref = function (url) {
  return this._gotoHref(url);
};

/**
 * 根据链接跳转到相应的页面
 * @param url
 */
EPUBJS.Book.prototype._gotoHref = function (url) {
  var split, chapter, section, relativeURL, spinePos;
  var deferred = new RSVP.defer();

  split = url.split("#");
  chapter = split[0];
  section = split[1] || false;

  relativeURL = chapter.replace((this.path.bookPath + this.path.basePath), "");

  spinePos = this.spineIndexByURL[relativeURL];

  if (!chapter) {
    spinePos = this.spinePos;
  }

  if (spinePos != this.spinePos) {
    return this.displayChapter(spinePos).then(function () {
      if (section) {
        this.renderer.section(section);
      }
      deferred.resolve(true);
    }.bind(this));
  } else {
    if (section) {
      this.renderer.section(section);
    } else {
      this.renderer.firstPage();
    }
    deferred.resolve(true);
  }
  return deferred.promise;
};

/**
 * 根据页码跳转到相应页面
 * @param spinePos
 * @param pageNum
 */
EPUBJS.Book.prototype.gotoPage = function (spinePos, pageNum) {
  return this.q.enqueue(function () {
    if (spinePos != this.spinePos && spinePos >= 0 && spinePos < this.spine.length) {
      this.displayChapter(spinePos, false, true).then(function () {
        if (pageNum) {
          this.renderer.page(pageNum);
        }
      }.bind(this))
    } else {
      if (pageNum) {
        this.renderer.page(pageNum);
      } else {
        this.renderer.firstPage();
      }
    }
  }.bind(this));
};

/**
 * 根据章节,xpath,偏移量跳转到相应页面
 * @param spinePos
 * @param parentPosition
 * @param startContainerPosition
 * @param offset
 * @returns {*}
 */
EPUBJS.Book.prototype.gotoNote = function (spinePos, parentPosition, startContainerPosition, offset) {
  return this.q.enqueue(function () {
    if (spinePos >= 0 && spinePos < this.spine.length) {
      this.displayChapter(spinePos, false, true).then(function () {
        var parent = EPUBJS.DomUtil.findNode(this.renderer.doc.body, parentPosition);
        var element = EPUBJS.DomUtil.findNode(parent, startContainerPosition);
        var range = document.createRange();
        if (offset) {
          range.setStart(element, offset);
          range.setEnd(element, element.textContent.length);
        } else {
          range.selectNode(element);
        }
        this.renderer.gotoRange(range);
      }.bind(this));
    }
  }.bind(this))
};

/**
 * 根据章节,章节偏移量跳转到相应页面
 * @param spinePos
 * @param offset
 * @returns {*}
 */
EPUBJS.Book.prototype.gotoOffset = function (spinePos, offset) {
  return this.q.enqueue(function () {
    if (spinePos != this.spinePos && spinePos >= 0 && spinePos < this.spine.length) {
      this.displayChapter(spinePos, false, true).then(function () {
        if (offset) {
          this.renderer.gotoOffset(offset);
        }
      }.bind(this));
    } else {
      if (offset) {
        this.renderer.gotoOffset(offset);
      } else {
        this.renderer.firstPage();
      }
    }
  }.bind(this))
};

/**
 * 查询内容的跳转
 * @param spinePos
 * @param xPath
 * @param offset
 * @param text
 * @returns {*}
 */
EPUBJS.Book.prototype.gotoSearchText = function (spinePos, xPath, offset, text) {
  return this.q.enqueue(function () {
    if (spinePos != this.spinePos && spinePos >= 0 && spinePos < this.spine.length) {
      this.displayChapter(spinePos, false, true).then(function () {
        var ele = this.renderer.getElementByXPath(xPath);
        this.renderer.highlight(ele, offset, text.length);
        var range = document.createRange();
        range.setStart(ele, offset);
        range.setEnd(ele, offset + text.length);
        this.renderer.gotoRange(range);
      }.bind(this));
    } else {
      var ele = this.renderer.getElementByXPath(xPath);
      this.renderer.highlight(ele, offset, text.length);
      var range = document.createRange();
      range.setStart(ele, offset);
      range.setEnd(ele, offset + text.length);
      this.renderer.gotoRange(range);
    }
  }.bind(this))
};

EPUBJS.Book.prototype.searchText = function (text) {
  return this.q.enqueue(this._searchText.bind(this), text);
};

/**
 * 全局搜索text
 * @param text
 * @returns {Promise.promise|*}
 */
EPUBJS.Book.prototype._searchText = function (text) {
  var book = this, textsMap = [], texts = [];
  var url, defer = new RSVP.defer();

  function getSearchText(i) {
    if (i < spine.length) {
      url = book.spine[i].url;
      EPUBJS.core.request(url).then(function (content) {
        texts = book.renderer.searchText(text, content, i);
        textsMap = textsMap.concat(texts);
        if (textsMap.length >= 50) {
          EPUBJS.core.postMessageToMobile("searchText", {searchText: textsMap});
          defer.resolve(textsMap);
        } else {
          getSearchText(i + 1);
        }
      });
    } else {
      EPUBJS.core.postMessageToMobile("searchText", {searchText: textsMap});
      defer.resolve(textsMap);
    }
  }

  getSearchText(0);

  return defer.promise;
};

/**
 * 获取当前位置信息
 */
EPUBJS.Book.prototype.getCurrentPos = function () {

  return this.q.enqueue(function () {
    var pos = this.renderer.getCurrentPos();
    var chapterName = this.renderer.chapterName.textContent;
    var context = pos.startRange.startContainer.textContent.substr(pos.startRange.startOffset, 100);
    EPUBJS.core.postMessageToMobile("currentPos", {spinePos: this.spinePos, chapterOffset: pos.start, chapterName: chapterName, context: context});
  }.bind(this));
};

/**
 * 改变字号
 * @param size
 */
EPUBJS.Book.prototype.resetFontSize = function (size) {
  this.renderer.resetFontSize(size);
  this.reset();
};

/**
 * 改变字体
 * @param family
 */
EPUBJS.Book.prototype.resetFontFamily = function (family) {
  this.renderer.resetFontFamily(family);
  this.reset();
};

/**
 * 刷新页面
 * @returns {!Promise.<RESULT>}
 */
EPUBJS.Book.prototype.reset = function () {
  var spinePos = this.spinePos;
  var offset = this.renderer.currentOffset;
  this.chaptersNum = {};
  return this.displayChapter(spinePos, false, true).then(function () {
    this.renderer.gotoOffset(offset);
    return this.getAllChapterNum();
  }.bind(this)).then(function (chaptersNum) {
    this.chaptersNum = chaptersNum;
    this.showBookNum();
  }.bind(this));
};

/**
 * 下一页
 * @returns {*}
 */
EPUBJS.Book.prototype.nextPage = function (durTime) {
  this.paginationQ.clear();
  return  this.paginationQ.enqueue(function () {
    this.renderer.nextPage(durTime)
        .then(function (result) {
          if (!result) {
            return this.nextChapter();
          }
        }.bind(this));
  }.bind(this));
};

/**
 * 上一页
 * @returns {*}
 */
EPUBJS.Book.prototype.prevPage = function (durTime) {
  this.paginationQ.clear();
  return this.paginationQ.enqueue(function () {
    this.renderer.prevPage(durTime)
        .then(function (result) {
          if (!result) {
            return this.prevChapter();
          }
        }.bind(this));
  }.bind(this));
};

/**
 * 下一章节
 * @returns {deferred.promise|*}
 */
EPUBJS.Book.prototype.nextChapter = function () {
  if (this.spinePos < this.spine.length - 1) {
    return this.displayChapter(this.spinePos + 1);
  } else {
    return this.renderer.lastPage();
  }
};

/**
 * 上一章节
 * @returns {deferred.promise|*}
 */
EPUBJS.Book.prototype.prevChapter = function () {
  if (this.spinePos > 0) {
    return this.displayChapter(this.spinePos - 1, true);
  } else {
    return this.renderer.firstPage();
  }
};

/**
 * 加载下一章
 * @returns {boolean}
 */
EPUBJS.Book.prototype.preloadNextChapter = function () {
  var next;
  var chap = this.spinePos + 1;

  if (chap >= this.spine.length) {
    return false;
  }
  next = new EPUBJS.Chapter(this.spine[chap]);
  if (next) {
    EPUBJS.core.request(next.absolute);
  }
};

/**
 * 为文档添加监听
 */
EPUBJS.Book.prototype.addEventListeners = function () {
  var pageWidth = this.renderer.pageWidth;
  var time = 500; //翻一页所持续的时间为500ms;
  var Threshold = pageWidth / 4; //翻页移动的阈值，没超过这个阈值将停留在当前页面
  var startX, endX, durTime, startTime, endTime;
  this.renderer.doc.addEventListener("touchstart", function (event) {
    // event.preventDefault();
    this.renderer.unHighlight();
    startX = event.touches[0].clientX;
    startTime = new Date();
  }.bind(this), false);

  this.renderer.doc.addEventListener("touchmove", function (event) {
    endTime = new Date();
    if (endTime - startTime < 500) {
      event.preventDefault();
      endX = event.touches[0].clientX;
      var deltaX = endX - startX;
      var pageOffsetX = this.renderer.getLeft() - deltaX;
      this.renderer.setLeft(pageOffsetX);
    }

  }.bind(this), false);

  this.renderer.doc.addEventListener("touchend", function (event) {
    endTime = new Date();
    endX = event.changedTouches[0].clientX;
    var deltaX = endX - startX;
    if ((endTime - startTime < 500) || deltaX != 0) {
      if (deltaX < -Threshold || (endTime - startTime < 100 && deltaX < -window.innerWidth / 100)) {
        durTime = (pageWidth + deltaX) * (time / pageWidth);
        this.nextPage(durTime);
      } else if (deltaX > Threshold || (endTime - startTime < 100 && deltaX > window.innerWidth / 100)) {
        durTime = (pageWidth - deltaX) * (time / pageWidth);
        this.prevPage(durTime);
      } else if (Math.abs(deltaX) > 0 && Math.abs(deltaX) <= Threshold) {
        durTime = Math.abs(deltaX) * (time * 4 / pageWidth);
        this.renderer.currentPage(durTime);
      } else if (deltaX >= -window.innerWidth / 100 && deltaX <= window.innerWidth / 100) {
        if (endX > (window.innerWidth / 3 * 2)) {
          this.nextPage(time);
        } else if (endX < window.innerWidth / 3) {
          this.prevPage(time);
        } else {
          EPUBJS.core.postMessageToMobile("screenClick", {screenX: endX, screenY: event.changedTouches[0].clientY});
        }
      }
    }
  }.bind(this), false);
};

/**
 * head标签里添加标签
 * @param renderer
 */
EPUBJS.Book.prototype.addHeadTags = function (renderer) {
  if (Object.keys(this.headTags).length) {
    renderer.addHeadTags(this.headTags);
  }
};

/**
 * 注册hooks回调函数
 * @param renderer
 */
EPUBJS.Book.prototype.registerReplacements = function (renderer) {
  renderer.registerHook("beforeChapterDisplay", this.addHeadTags.bind(this), true);
  renderer.registerHook("beforeChapterDisplay", EPUBJS.replace.hrefs.bind(this), true);
};

/**
 * 将获取正本书页码的函数添加到队列中
 * @returns {*}
 */
EPUBJS.Book.prototype.getAllChapterNum = function () {
  if (!Object.keys(this.chaptersNum).length) {
    return this.q.enqueue(this._getAllChapterNum);
  } else {
    return EPUBJS.core.postMessageToMobile("chaptersNum", this.chaptersNum);
  }
};

/**
 * 获取正本书的页码
 * @returns {*}
 */
EPUBJS.Book.prototype._getAllChapterNum = function () {
  var book = this, defer = new RSVP.defer();
  var chaptersNum = {}, chapterAllNum = 0;
  var width = this.renderer.pageWidth;
  var height = this.renderer.pageHeight;
  var padding = this.padding, renderer = this.renderer;

  //创建iframe
  function createFrame() {
    var iframe = document.createElement('iframe');
    iframe.scrolling = "no";
    iframe.style.border = "none";
    iframe.seamless = "seamless";
    iframe.style.height = "100%";
    iframe.style.width = "100%";
    iframe.style.visibility = "hidden";
    return iframe;
  }

  //获取每一章节的页码
  function getChapterPageNum(document) {
    if (padding) {
      var body = document.body || document.querySelector("body");
      body.style.paddingLeft = padding.left + "px";
      body.style.paddingRight = padding.right + "px";
    }
    var layout = new EPUBJS.Layout["Reflowable"]();
    if (renderer.fontSize) {
      body.style.fontSize = renderer.fontSize + "px";
    }
    if (renderer.fontFamily) {
      body.style.fontFamily = renderer.fontFamily;
    }
    layout.format(document, width, height);
    var pageNum = layout.calculatePages();
    return pageNum;
  }

  //获取所有章节的页码
  function getChapter(i) {
    var iframe = createFrame();
    book.container.appendChild(iframe);
    iframe.contentWindow.location.replace(book.spine[i].url);
    iframe.onload = function () {
      var num = getChapterPageNum(iframe.contentDocument.documentElement);
      chapterAllNum += num;
      chaptersNum[i] = num;
      book.container.removeChild(iframe);
      i++;
      if (i < book.spine.length) {
        getChapter(i);
      } else {
        chaptersNum["allNum"] = chapterAllNum;
        defer.resolve(chaptersNum);
        EPUBJS.core.postMessageToMobile("chaptersNum", chaptersNum);
      }
    }.bind(this);
  }

  getChapter(0);
  return defer.promise;
};

RSVP.EventTarget.mixin(EPUBJS.Book.prototype);
