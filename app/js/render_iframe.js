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
EPUBJS.Render.Iframe.prototype.create = function (padding) {
  this.padding = padding;
  this.iframe = document.createElement('iframe');
  this.iframe.scrolling = "no";
  this.iframe.seamless = "seamless";
  this.iframe.style.border = "none";
  this.iframe.style.height = "100%";
  this.iframe.style.width = "100%";
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
      render.bodyEl.style.paddingLeft = render.padding.left + "px";
      render.bodyEl.style.paddingRight = render.padding.right + "px";
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
 * 获取显示区域的高度与宽度
 */
EPUBJS.Render.Iframe.prototype.getViewDimensions = function () {
  return {
    viewHeight: this.pageHeight,
    viewWidth: this.pageWidth - this.padding.left - this.padding.right
  };
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
 * 根据页码获取向左的偏移量
 * @param pg
 * @param time
 */
EPUBJS.Render.Iframe.prototype.page = function (pg, time) {
  this.leftPos = this.pageWidth * (pg - 1);
  return this.setLeft(this.leftPos, time);
};

/**
 * 根据页码计算出偏移量
 * @param pg
 */
EPUBJS.Render.Iframe.prototype.getLeft = function (pg) {
   this.leftPos = this.pageWidth * (pg - 1);
   return this.leftPos;
};

/**
 * 设置页面向左的偏移量与持续时间
 * @param lefPos
 * @param time
 */
EPUBJS.Render.Iframe.prototype.setLeft = function (lefPos, time) {
  this.docEl.style.webkitTransition = '-webkit-transform ' + time +'ms cubic-bezier(0.33, 0.66, 0.66, 1)';
  this.docEl.style.webkitTransform = 'translate3d('+(-lefPos)+'px, 0, 0)';
};

/**
 * 设置iframe的宽与高
 * @param width
 * @param height
 */
EPUBJS.Render.Iframe.prototype.setWidthAndHeight = function (width, height) {
  this.iframe.style.width = width + "px";
  this.iframe.style.height = height + "px";
};

/**
 * 计算节点在第几页
 * @param el
 * @returns {number}
 */
EPUBJS.Render.Iframe.prototype.getPageNumberByElement = function (el) {
  var left, pg;
  left = this.leftPos + el.getBoundingClientRect().left;
  pg = Math.floor(left/this.pageWidth) + 1;
  return pg;
};