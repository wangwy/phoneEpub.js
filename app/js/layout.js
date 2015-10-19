/**
 * Created by wangwy on 15-9-24.
 */
EPUBJS.Layout = {};

EPUBJS.Layout.Reflowable = function () {
  this.documentElement = null;
  this.spreadWidth = null;
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

  var section = Math.floor(width / 8);

  var gap = section;
  this.documentElement = documentElement;
  this.spreadWidth = (width + gap);

  documentElement.style.width = width + "px";
  documentElement.style.height = _height + "px";

  documentElement.style[columnAxis] = "horizontal";
  documentElement.style[columnFill] = "auto";
  documentElement.style[columnWidth] = width + "px";
  documentElement.style[columnGap] = gap + "px";

  this.colWidth = width;
  this.gap = gap;

  return {
    pageWidth : this.spreadWidth,
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
  displayedPages = Math.ceil(totalWidth / this.spreadWidth);

  return totalWidth;
};