/**
 * Created by wangwy on 15-9-24.
 */
EPUBJS.Render = {};
EPUBJS.Render.Iframe = function() {
  this.iframe = null;
  this.document = null;
  this.window = null;
  this.docEl = null;
  this.bodyEl = null;

  this.leftPos = 0;
  this.pageWidth = 0;
};

/**
 * 创建iframe
 * @returns {null|*}
 */
EPUBJS.Render.Iframe.prototype.create = function () {
  this.iframe = document.createElement('iframe');
  this.iframe.scrolling = "no";
  this.iframe.seamless = "seamless";
  this.iframe.style.border = "none";
  this.iframe.height = "100%";
  this.iframe.width = "100%";
  return this.iframe;
};

/**
 * 加载iframe内的页面
 * @param url
 */
EPUBJS.Render.Iframe.prototype.load = function (url) {
  var render = this,deferred = new RSVP.defer();
  this.leftPos = 0;
  this.iframe.onload = function () {
    render.document = render.iframe.contentDocument;
    render.docEl = render.document.documentElement;
    render.headEl = render.document.head;
    render.bodyEl = render.document.body || render.document.querySelector("body");
    render.window = render.iframe.contentWindow;

    if(render.bodyEl){
      render.bodyEl.style.margin = "0";
    }

    deferred.resolve(render.docEl);
  };
  this.iframe.contentWindow.location.replace(url);

  return deferred.promise;
};

/**
 * 设置每页的宽度与高度
 * @param pageWidth
 * @param pageHeight
 */
EPUBJS.Render.Iframe.prototype.setPageDimensions = function (pageWidth, pageHeight) {
  this.pageWidth = pageWidth;
  this.pageHeight = pageHeight;
};

/**
 * 计算iframe的高宽
 */
EPUBJS.Render.Iframe.prototype.resized = function () {
  this.width = this.iframe.getBoundingClientRect().width;
  this.height = this.iframe.getBoundingClientRect().height;
};

/**
 * 返回根节点
 * @returns {null|*}
 */
EPUBJS.Render.Iframe.prototype.getBaseElement = function () {
  return this.bodyEl;
};

/**
 * 返回document
 * @returns {null|*}
 */
EPUBJS.Render.Iframe.prototype.getDocumentElement = function () {
  return this.docEl;
};

/**
 * 根据页码计算出偏移量
 * @param pg
 */
EPUBJS.Render.Iframe.prototype.page = function (pg) {
  this.leftPos = this.pageWidth * (pg - 1);

  this.setLeft(this.leftPos);
};

/**
 * 根据偏移量跳转到相应的显示区域
 * @param leftPos
 */
EPUBJS.Render.Iframe.prototype.setLeft = function (leftPos) {
  if(navigator.userAgent.match(/(iPad|iPhone|iPod|Mobile|Android)/g)){
    this.docEl.style["-webkit-transform"] = 'translate('+(-leftPos)+'px,0)';
  }else{
    this.document.defaultView.scrollTo(leftPos, 0);
  }
};