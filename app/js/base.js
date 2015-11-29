/**
 * Created by wangwy on 15-10-16.
 */
var EPUBJS = EPUBJS || {};
EPUBJS.VERSION = "1.00";
RSVP.on('error', function (event) {
  console.error(event, event.detail);
});
(function (root) {
  var book;
  root.initReader = function () {
    var options = arguments[0];
    book = new EPUBJS.Book(options);
    book.renderTo(document.body);
    return book;
  };

  root.gotoHref = function (url) {
    return book.gotoHref(url);
  };

  root.gotoPage = function (spinePos, pageNum) {
    return book.gotoPage(spinePos, pageNum)
  };

  root.gotoNote = function (spinePos, parentPosition, startContainerPosition, offset) {
    return book.gotoNote(spinePos, parentPosition, startContainerPosition, offset);
  };

  root.gotoOffset = function (spinePos, offset) {
    return book.gotoOffset(spinePos, offset);
  };

  root.gotoSearchText = function (spinePos, xPath, offset, text) {
    return book.gotoSearchText(spinePos, xPath, offset, text);
  };

  root.getCurrentPos = function () {
    return book.getCurrentPos();
  };

  root.resetFontSize = function (size) {
    return book.resetFontSize(size);
  };

  root.resetFontFamily = function (family) {
    return book.resetFontFamily(family);
  };

  root.searchText = function (text) {
    return book.searchText(text);
  };
})(window);
