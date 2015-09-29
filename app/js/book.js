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
  this.attachTo(eleId);
  this.renderer.initialize(this.container);
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
//  this.container.scrollLeft += 100;
  return this.renderer.nextPage();
};

/**
 * 上一页
 */
EPUBJS.Book.prototype.prevPage = function () {
  return this.renderer.prevPage();
};

/**
 * 添加container
 * @param eleId
 */
EPUBJS.Book.prototype.attachTo = function (eleId) {
  this.element = document.getElementById(eleId);
  this.container = this.initialize();
  this.element.appendChild(this.container);
  this.stageSize();
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
  container.style.overflow = "hidden";

  return container;
};

/**
 * 计算显示区域宽度
 * @returns {{width: number, height: number}|*}
 */
EPUBJS.Book.prototype.stageSize = function () {
  var bounds,width,height;
  bounds = this.container.getBoundingClientRect();
  width = bounds.width;
  height = bounds.height;
  this.containerStyles = window.getComputedStyle(this.container);
  this.containerPadding = {
    left: parseFloat(this.containerStyles["padding-left"]) || 0,
    right: parseFloat(this.containerStyles["padding-right"]) || 0,
    top: parseFloat(this.containerStyles["padding-top"]) || 0,
    bottom: parseFloat(this.containerStyles["padding-bottom"]) || 0
  };
  this.stage = {
    width: width -
        this.containerPadding.left -
        this.containerPadding.right,
    height: height -
        this.containerPadding.top -
        this.containerPadding.bottom
  };

  return this.stage;
};