/**
 * Created by wangwy on 15-10-26.
 */
EPUBJS.Hooks.register("beforeChapterDisplay").smartimages = function (renderer) {
  var images = renderer.docEl.querySelectorAll("img"),
      items = Array.prototype.slice.call(images),
      iheight, iwidth;
  items.forEach(function (item) {
    var itemRect = item.getBoundingClientRect(),
        rectHeight = itemRect.height,
        top = itemRect.top,
        oHeight = item.getAttribute('data-height'),
        height = oHeight || rectHeight,
        newHeight,
        fontSize = Number(getComputedStyle(item, "").fontSize.match(/(\d*(\.\d*)?)px/)[1]),
        fontAdjust = fontSize ? fontSize / 2 : 0;
    //屏幕高度
    iheight = renderer.viewDimensions.viewHeight;
    iwidth = renderer.viewDimensions.viewWidth;
    if (top < 0) top = 0;
    if (height + top >= iheight) {
      if (top < iheight / 2) {
        newHeight = iheight - top - fontAdjust;
        item.style.maxHeight = newHeight + "px";

        item.style.maxWidth = iwidth + "px";
      } else {
        if (height > iheight) {
          item.style.maxHeight = iheight + "px";
          item.style.maxWidth = iwidth + "px";
          itemRect = item.getBoundingClientRect();
          height = itemRect.height;
        }
        item.style["WebkitColumnBreakBefore"] = "always";
        item.style["breakBefore"] = "column";
      }
    } else {
      item.style.removeProperty("max-height");
      item.style.removeProperty("margin-top");
    }
  });
};
