/**
 * Created by wangwy on 15-9-24.
 */
var EPUBJS = EPUBJS || {};
EPUBJS.Book = function (spine) {
  this.renderer = new EPUBJS.Renderer();
  this.spine = spine;
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
EPUBJS.Book.prototype.nextPage = function (durTime) {
  var next = this.renderer.nextPage(durTime);
  if(!next){
    return this.nextChapter();
  }
};

/**
 * 上一页
 * @returns {*}
 */
EPUBJS.Book.prototype.prevPage = function (durTime) {
  var prev = this.renderer.prevPage(durTime);

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
  var time = 500; //翻一页所持续的时间为500ms;
  var startX, endX, durTime;
  this.renderer.doc.addEventListener("touchstart", function (event) {
    event.preventDefault();
    startX = event.touches[0].clientX;
  },false);

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
    if(deltaX < 0){
      durTime = (pageWidth + deltaX) * (time/pageWidth);
      this.nextPage(durTime);
    }else if(deltaX > 0){
      durTime = (pageWidth - deltaX) * (time/pageWidth);
      this.prevPage(durTime);
    }else if(deltaX === 0){
      if(endX > window.innerWidth/2){
       this.nextPage(time);
       }else if(endX < window.innerWidth/2){
       this.prevPage(time);
       }
    }
  }.bind(this));
};
