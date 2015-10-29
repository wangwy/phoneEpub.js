/**
 * Created by wangwy on 15-9-24.
 */
EPUBJS.Book = function (options) {
  this.renderer = new EPUBJS.Renderer();
  this.spine = options.spine;
  this.path = options.path;
  this.spineIndexByURL = this.parseSpine(this.spine);
  this.padding = options.padding;
  this.spinePos = 0;
  this.q = new EPUBJS.Queue(this);
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
  return this.q.enqueue(this.displayChapter);
};

/**
 * 展示章节
 * @param chap
 * @param end
 * @param deferred
 * @returns {deferred.promise|*}
 */
EPUBJS.Book.prototype.displayChapter = function (chap, end, deferred) {
  this.renderer.initialize(this.container, this.padding);
  var book = this,
      render,
      pos,
      defer = deferred || new RSVP.defer();

  var chapter;
  pos = chap || 0;
  if (pos < 0 || pos >= this.spine.length) {
    console.log("不是一个有效的地址");
    pos = 0;
  }

  chapter = new EPUBJS.Chapter(this.spine[pos]);

  render = book.renderer.displayChapter(chapter);

  render.then(function () {
    if (end) { //上一章的最后一页
      book.renderer.lastPage();
    }

    book.spinePos = pos;
    defer.resolve(book.renderer);
    book.preloadNextChapter();

    book.currentChapter = chapter;
    book.addEventListeners();
  });

  return defer.promise;
};

/**
 * 根据链接跳转到相应的页面
 * @param url
 */
EPUBJS.Book.prototype.gotoHref = function (url) {
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
    if(spinePos >= 0 && spinePos < this.spine.length){
      this.displayChapter(spinePos).then(function () {
        if(pageNum){
          this.renderer.page(pageNum);
        }
      }.bind(this))
    }
  }.bind(this));
};

/**
 * 下一页
 * @returns {*}
 */
EPUBJS.Book.prototype.nextPage = function (durTime) {
  return this.renderer.nextPage(durTime)
      .then(function (result) {
        if (!result) {
          return this.nextChapter();
        }
      }.bind(this));

};

/**
 * 上一页
 * @returns {*}
 */
EPUBJS.Book.prototype.prevPage = function (durTime) {
  return this.renderer.prevPage(durTime)
      .then(function (result) {
        if (!result) {
          return this.prevChapter();
        }
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
    startX = event.touches[0].clientX;
    startTime = new Date();
  }, false);

  this.renderer.doc.addEventListener("touchmove", function (event) {
    event.preventDefault();
    endX = event.touches[0].clientX;
    var deltaX = endX - startX;
    var pageOffsetX = this.renderer.getLeft() - deltaX;
    this.renderer.setLeft(pageOffsetX);
  }.bind(this), false);

  this.renderer.doc.addEventListener("touchend", function (event) {
    endX = event.changedTouches[0].clientX;
    endTime = new Date();
    var deltaX = endX - startX;
    if (deltaX < -Threshold || (endTime - startTime < 100 && deltaX < 0)) {
      durTime = (pageWidth + deltaX) * (time / pageWidth);
      this.nextPage(durTime);
    } else if (deltaX > Threshold || (endTime - startTime < 100 && deltaX > 0)) {
      durTime = (pageWidth - deltaX) * (time / pageWidth);
      this.prevPage(durTime);
    } else if (Math.abs(deltaX) > 0 && Math.abs(deltaX) <= Threshold) {
      durTime = Math.abs(deltaX) * (time / pageWidth);
      this.renderer.currentPage(durTime);
    } else if (deltaX === 0) {
      if (endX > (window.innerWidth / 3 * 2)) {
        this.nextPage(time);
      } else if (endX < window.innerWidth / 3) {
        this.prevPage(time);
      } else {
        EPUBJS.core.postMessageToMobile("screenClick", {screenX: endX, screenY: event.changedTouches[0].clientY});
      }
    }
  }.bind(this), false);
};

/**
 * 注册hooks回调函数
 * @param renderer
 */
EPUBJS.Book.prototype.registerReplacements = function (renderer) {
  renderer.registerHook("beforeChapterDisplay", EPUBJS.replace.hrefs.bind(this), true);
};

/**
 * 将获取正本书页码的函数添加到队列中
 * @returns {*}
 */
EPUBJS.Book.prototype.getAllChapterNum = function () {
  return this.q.enqueue(this._getAllChapterNum);
};

/**
 * 获取正本书的页码
 * @returns {*}
 */
EPUBJS.Book.prototype._getAllChapterNum = function () {
  var book = this;
  var chaptersNum = {}, chapterAllNum = 0;
  var width = this.renderer.pageWidth;
  var height = this.renderer.pageHeight;

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
    if (this.padding) {
      var body = document.body || document.querySelector("body");
      body.style.paddingLeft = this.padding.left + "px";
      body.style.paddingRight = this.padding.right + "px";
    }
    var layout = new EPUBJS.Layout["Reflowable"]();
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
        EPUBJS.core.postMessageToMobile("chaptersNum", chaptersNum);
      }
    }.bind(this);
  }

  getChapter(0);
};
