EPUBJS.BookInterface = {
	view: null,
	menu: new EPUBJS.pluginView.PopMenu(),
	textCopied: function() {
		var selectedRange = EPUBJS.DomUtil.getSelection(EPUBJS.BookInterface.view);
		var text;
		try {
			var range = selectedRange.getRangeAt(0);
			text = range.toString();
			// length = text.length;
		} catch (e) {
			text = "";
		}
		EPUBJS.core.postMessageToMobile('textCopy', text);
	},
	
	getText: function(){
		var selectedRange = EPUBJS.DomUtil.getSelection(EPUBJS.BookInterface.view);
		var text;
		try {
			var range = selectedRange.getRangeAt(0);
			text = range.toString();
			// length = text.length;
		} catch (e) {
			text = "";
		}
		EPUBJS.core.postMessageToMobile('selectedText', text);
	},

	createNote: function(comment) {
		var selectedRange = EPUBJS.DomUtil.getSelection(EPUBJS.BookInterface.view);
		var length, text, range;
		try {
			range = selectedRange.getRangeAt(0);
			text = range.toString();
			length = text.length;
		} catch (e) {
			text = "";
			EPUBJS.core.postMessageToMobile("createNote", {
				error: 'no range found in this view'
			});
			return;
		}
		if (length > 0) {
			var data = EPUBJS.BookInterface.menu._applyInlineStyle(text, comment, range.startContainer, range.endContainer, range.startOffset, range.endOffset, range.commonAncestorContainer, true);
			EPUBJS.core.postMessageToMobile("createNote", data);
		}
	},
	repaintNote: function(data){
		var view = EPUBJS.BookInterface.view;
		var d = view.doc;
		if(!data || !(data instanceof Array)){
			return;
		}
		if(data.length == 0)
			return;
		for(var i=0; i< data.length; i++){
			var note = data[i];
			if (note.index != undefined && note.index == view.currentChapter.spinePos) {
                // menu.setDocument(view.doc || view.document);
                var parentEle = EPUBJS.DomUtil.findNode(d.body, note.parent);
                var startContainerEle = EPUBJS.DomUtil.findNode(parentEle, note.startContainer);
                var endContainerEle = EPUBJS.DomUtil.findNode(parentEle, note.endContainer);
                var startOffset = note.startOffset;
                var endOffset = note.endOffset;
                var tag = note.tag;
                var comment = note.comment;
                var text = note.text;
                //添加至任务队列 异步加载 此处页面并未显示 如果直接调用划线将不准确
                setTimeout(function() {
                    EPUBJS.BookInterface.menu._applyInlineStyle(text, comment, startContainerEle, endContainerEle, startOffset, endOffset, parentEle, false);
                }, 0)
            }
		}
	},
	updateNote: function(dataId, comment) {
		// body...
	}
};