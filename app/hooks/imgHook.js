EPUBJS.Hooks.register("beforeChapterDisplay").img = function(view) {
    var d = view.doc || view.document;
    var containerWidth = view._width;
    var b = d.body;
    var self_ = this;

    var menu = new EPUBJS.pluginView.PopMenu();
    EPUBJS.BookInterface.view = view;
    EPUBJS.BookInterface.menu.setDocument(view.doc);
    EPUBJS.BookInterface.menu.view = view;
    EPUBJS.BookInterface.menu.pageHeight = view.pageHeight;
}


EPUBJS.Hooks.register("selected").a = function(view, continuous) {
    var d = view.document;
    var b = d.body;
    var canSelected = false;
    alert('what');
}