/**
 * Created by wangwy on 15-12-2.
 */
EPUBJS.Hooks.register("beforeFormat").smartvideos = function (doc, width, height) {
  var trans = doc.querySelectorAll("video"),
      items = Array.prototype.slice.call(trans);
  items.forEach(function (item) {
    item.style.maxWidth = width + "px";
    item.setAttribute("controls", "controls");
    item.style["WebkitColumnBreakBefore"] = "always";
    item.style["breakBefore"] = "always";
  });
};

EPUBJS.Hooks.register("beforeFormat").smartaudios = function (doc, width, height) {
  var trans = doc.querySelectorAll("audio"),
      items = Array.prototype.slice.call(trans);
  items.forEach(function (item) {
    item.style.maxWidth = width + "px";
    item.setAttribute("controls", "controls");
  })
};


