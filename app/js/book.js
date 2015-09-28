/**
 * Created by wangwy on 15-9-24.
 */
var EPUBJS = EPUBJS || {};
EPUBJS.Book = function () {
  this.renderer = new EPUBJS.Renderer()
};

/**
 * 初始化显示区域
 * @param eleId
 */
EPUBJS.Book.prototype.renderTo = function (eleId) {
  this.element = document.getElementById(eleId);
  this.renderer.initialize(this.element);
};

/**
 * 根据路径显示页面
 * @param url
 */
EPUBJS.Book.prototype.display = function(url){
  return this.renderer.load(url);
};

/**
 * 下一页
 */
EPUBJS.Book.prototype.nextPage = function () {
  return this.renderer.nextPage();
};

/**
 * 上一页
 */
EPUBJS.Book.prototype.prevPage = function () {
  return this.renderer.prevPage();
};
