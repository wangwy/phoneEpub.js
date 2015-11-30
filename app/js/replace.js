/**
 * Created by wangwy on 15-10-27.
 */
EPUBJS.replace = {};

/**
 * 替换页面内的所有的hrefs
 * @param callback
 * @param renderer
 */
EPUBJS.replace.hrefs = function (renderer) {
  var book = this;
  var replacements = function (link, done) {
    var href = link.getAttribute("href"),
        isRelative = href.search("://"),
        directory,
        relative;
    if (isRelative != -1) {
      link.setAttribute("target", "_blank");
    } else {
      var uri = EPUBJS.core.uri(renderer.render.window.location.href);
      directory = uri.directory;
      if (directory) {
        relative = EPUBJS.core.resolveUrl(directory, href);
      } else {
        relative = href;
      }
      link.addEventListener("touchend", function (event) {
        event.stopPropagation();
        book.gotoHref(relative);
        return false;
      }, false);
    }

    done();
  };

  renderer.replace("a[href]", replacements);
};
