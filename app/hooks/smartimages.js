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
        rectWidth = itemRect.width,
        top = itemRect.top,
        newHeight,
        fontSize = Number(getComputedStyle(item, "").fontSize.match(/(\d*(\.\d*)?)px/)[1]),
        fontAdjust = fontSize ? fontSize / 2 : 0;
    //屏幕高度
    iheight = renderer.viewDimensions.viewHeight;
    iwidth = renderer.viewDimensions.viewWidth;
    if (top < 0) top = 0;
    if (rectHeight + top >= iheight || rectWidth >= iwidth) {
      if (top < iheight / 2) {
        newHeight = iheight - top - fontAdjust;
        item.style.maxHeight = newHeight + "px";

        item.style.maxWidth = iwidth + "px";
      } else {
        if (rectHeight > iheight || rectWidth >= iwidth) {
          item.style.maxHeight = iheight + "px";
          item.style.maxWidth = iwidth + "px";
        }
        item.style["WebkitColumnBreakBefore"] = "always";
        item.style["breakBefore"] = "column";
      }
    }
    item.style["WebkitBackfaceVisibility"] = "hidden";
    item.style["backfaceVisibility"] = "hidden";
  });
};
