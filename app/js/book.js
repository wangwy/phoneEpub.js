/**
 * Created by wangwy on 15-9-24.
 */
var EPUBJS = EPUBJS || {};
EPUBJS.Book = function (spine) {
  this.renderer = new EPUBJS.Renderer();
  this.spine = spine ||[
    {
      href: "titlepage.xhtml",
      id: "titlepage",
      index: 0,
      url: "/app/books/f9d2f57d-9b38-47aa-8d56-0b0eb012309f-sd/OEBPS/titlepage.xhtml"
    },
    {
      href: "page.xhtml",
      id: "page",
      index: 1,
      url: "/app/books/f9d2f57d-9b38-47aa-8d56-0b0eb012309f-sd/OEBPS/page.xhtml"
    },
    {
      href: "catalog.html",
      id: "catalog",
      index: 2,
      url: "/app/books/f9d2f57d-9b38-47aa-8d56-0b0eb012309f-sd/OEBPS/catalog.html"
    },
    {
      href: "article_100822.html",
      id: "id100822",
      index: 3,
      url: "/app/books/f9d2f57d-9b38-47aa-8d56-0b0eb012309f-sd/OEBPS/article_100822.html"
    },
    {
      href: "article_100823.html",
      id: "id100823",
      index: 4,
      url: "/app/books/f9d2f57d-9b38-47aa-8d56-0b0eb012309f-sd/OEBPS/article_100823.html"
    },
    {
      href: "article_100824.html",
      id: "id100824",
      index: 5,
      url: "/app/books/f9d2f57d-9b38-47aa-8d56-0b0eb012309f-sd/OEBPS/article_100824.html"
    },
    {
      href: "article_100825.html",
      id: "id100825",
      index: 6,
      url: "/app/books/f9d2f57d-9b38-47aa-8d56-0b0eb012309f-sd/OEBPS/article_100825.html"
    },
    {
      href: "article_100826.html",
      id: "id100826",
      index: 7,
      url: "/app/books/f9d2f57d-9b38-47aa-8d56-0b0eb012309f-sd/OEBPS/article_100826.html"
    }
  ];
  this.spinePos = 0;
};

/**
 * 添加container
 * @param eleId
 */
EPUBJS.Book.prototype.attachTo = function (eleId) {
  this.element = document.getElementById(eleId) || eleId;
  this.container = this.initialize();
  this.element.appendChild(this.container);
};

/**
 * 初始化容器
 * @returns {HTMLElement}
 */
EPUBJS.Book.prototype.initialize = function(){
  var container;

  container = document.createElement("div");
  container.setAttribute("class", "epub-container");
  container.style.fontSize = "0";
  container.style.wordSpacing = "0";
  container.style.lineHeight = "0";
  container.style.verticalAlign = "top";
  container.style.width = "100%";
  container.style.height = "100%";

  return container;
};

/**
 * 初始化显示区域
 * @param eleId
 */
EPUBJS.Book.prototype.renderTo = function (eleId) {
  this.attachTo(eleId);
  this.renderer.initialize(this.container);
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
  var book = this,
      render,
      pos,
      defer = deferred || new RSVP.defer();

  var chapter;
  pos = chap || 0;
  if(pos < 0 || pos >= this.spine.length){
    console.log("不是一个有效的地址");
    pos = 0;
  }

  chapter = new EPUBJS.Chapter(this.spine[pos]);

  render = book.renderer.displayChapter(chapter);

  render.then(function () {
    window.scrollTo(0,0);

    if(end){ //上一章的最后一页
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
 * 下一页
 * @returns {*}
 */
EPUBJS.Book.prototype.nextPage = function () {
  var next = this.renderer.nextPage();
  if(!next){
    return this.nextChapter();
  }
};

/**
 * 上一页
 * @returns {*}
 */
EPUBJS.Book.prototype.prevPage = function () {
  var prev = this.renderer.prevPage();

  if(!prev){
    return this.prevChapter();
  }
};

/**
 * 下一章节
 * @returns {deferred.promise|*}
 */
EPUBJS.Book.prototype.nextChapter = function () {
  if(this.spinePos < this.spine.length - 1){
    return this.displayChapter(this.spinePos + 1);
  }
};

/**
 * 上一章节
 * @returns {deferred.promise|*}
 */
EPUBJS.Book.prototype.prevChapter = function () {
  if(this.spinePos > 0){
    return this.displayChapter(this.spinePos - 1, true);
  }
};

/**
 * 加载下一章
 * @returns {boolean}
 */
EPUBJS.Book.prototype.preloadNextChapter = function () {
  var next;
  var chap = this.spinePos + 1;

  if(chap >= this.spine.length){
    return false;
  }
  next = new EPUBJS.Chapter(this.spine[chap]);
  if(next){
    EPUBJS.core.request(next.absolute);
  }
};


/**
 * 为文档添加监听
 */
EPUBJS.Book.prototype.addEventListeners = function () {
  var startX, endX;

  this.renderer.doc.addEventListener("touchstart", function (event) {
    var touch = event.touches[0];
    startX = touch.clientX;
  });
  this.renderer.doc.addEventListener("touchend", function (event) {
    var touch = event.changedTouches[0];
    endX = touch.clientX;
    if(endX - startX > 0){
      this.prevPage();
    }else if(endX - startX < 0){
      this.nextPage();
    }
  }.bind(this))
};
