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
		EPUBJS.core.postMessageToMobile("textCopy", text);
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
	deleteNote: function(){

	},
	updateNote: function() {
		// body...
	}
};