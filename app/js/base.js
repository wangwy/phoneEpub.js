/**
 * Created by wangwy on 15-10-16.
 */
var EPUBJS = EPUBJS || {};
EPUBJS.VERSION = "1.00";
RSVP.on('error', function(event) {
  console.error(event, event.detail);
});
(function(root){
  root.initReader = function () {
    var options = arguments[0];
    var book = new EPUBJS.Book(options);
    book.renderTo(document.body);
    return book;
  };
})(window);
