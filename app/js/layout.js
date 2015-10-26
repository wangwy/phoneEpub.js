/**
 * Created by wangwy on 15-9-24.
 */
EPUBJS.Layout = {};

EPUBJS.Layout.Reflowable = function () {
  this.documentElement = null;
  this.pageWidth = null;
};

/**
 * 格式化列
 * @param documentElement
 * @param _width
 * @param _height
 * @returns {{pageWidth: (null|*), pageHeight: *}}
 */
EPUBJS.Layout.Reflowable.prototype.format = function (documentElement, _width, _height) {
  var columnAxis = EPUBJS.core.prefixed('columnAxis');
  var columnGap = EPUBJS.core.prefixed('columnGap');
  var columnWidth = EPUBJS.core.prefixed('columnWidth');
  var columnFill = EPUBJS.core.prefixed('columnFill');

  var width = Math.floor(_width);

  this.documentElement = documentElement;
  this.pageWidth = width;

  documentElement.style.width = width + "px";
  documentElement.style.height = _height + "px";

  //添加translate3d样式目的是让它成为一个独立的层
  documentElement.style.webkitTransform = "translate3d(0, 0, 0)";
  documentElement.style[columnAxis] = "horizontal";
  documentElement.style[columnFill] = "auto";
  documentElement.style[columnWidth] = width + "px";
  documentElement.style[columnGap] = 0 + "px";

  this.colWidth = width;

  return {
    pageWidth : this.pageWidth,
    pageHeight: _height
  }
};

/**
 * 计算页码
 * @returns {{displayedPages: number, pageCount}}
 */
EPUBJS.Layout.Reflowable.prototype.calculatePages = function () {
  var totalWidth, displayedPages;
  this.documentElement.style.width = "auto";
  totalWidth = this.documentElement.scrollWidth;
  this.documentElement.style.width = totalWidth + "px";
  displayedPages = Math.ceil(totalWidth / this.pageWidth);

  return totalWidth;
};