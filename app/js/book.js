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
  container.style.position = "absolute";
  return container;
};

/**
 * 初始化显示区域
 * @param eleId
 */
EPUBJS.Book.prototype.renderTo = function (eleId) {
  this.attachTo(eleId);
  return this.displayChapter();
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
  var time = 500; //翻一页所持续的时间为500ms;
  var startX, endX, durTime;
  this.renderer.doc.addEventListener("touchstart", function (event) {
    event.preventDefault();
    startX = event.touches[0].clientX;
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
    var deltaX = endX - startX;
    var pageWidth = this.renderer.pageWidth;
    if (deltaX < 0) {
      durTime = (pageWidth + deltaX) * (time / pageWidth);
      this.nextPage(durTime);
    } else if (deltaX > 0) {
      durTime = (pageWidth - deltaX) * (time / pageWidth);
      this.prevPage(durTime);
    } else if (deltaX === 0) {
      if (endX > (window.innerWidth / 3 * 2)) {
        this.nextPage(time);
      } else if (endX < window.innerWidth / 3) {
        this.prevPage(time);
      } else {
        window.webkit.messageHandlers.app.postMessage({
          msgType: "screenClick",
          info: {screenX: endX, screenY: event.changedTouches[0].clientY}
        })
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