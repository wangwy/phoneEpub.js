/**
 * Created by wangwy on 15-12-2.
 */
EPUBJS.Hooks.register("beforeChapterDisplay").smartvideos = function (renderer) {
  var trans = renderer.doc.querySelectorAll("video"),
      items = Array.prototype.slice.call(trans),
      playing = false;
  items.forEach(function (item) {
    var iwidth = renderer.viewDimensions.viewWidth;
    item.style.maxWidth = iwidth + "px";
    item.setAttribute("controls", "controls");
    item.style["WebkitColumnBreakBefore"] = "always";
    item.style["breakBefore"] = "column";
    item.style["WebkitBackfaceVisibility"] = "hidden";
    item.style["backfaceVisibility"] = "hidden";
  });
};

EPUBJS.Hooks.register("beforeChapterDisplay").smartaudios = function (renderer) {
  var trans = renderer.doc.querySelectorAll("audio"),
      items = Array.prototype.slice.call(trans);
  items.forEach(function (item) {
    var iwidth = renderer.viewDimensions.viewWidth;
    item.style.maxWidth = iwidth + "px";
    item.setAttribute("controls", "controls");
    item.style["WebkitBackfaceVisibility"] = "hidden";
    item.style["backfaceVisibility"] = "hidden";
  })
};
