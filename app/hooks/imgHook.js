EPUBJS.Hooks.register("beforeChapterDisplay").img = function(view, continuous){
    var d = view.doc || view.document;
    var containerWidth = view._width;
    var b = d.body;
    var self_ = this;
    
    var menu = new EPUBJS.pluginView.PopMenu();
    var ee = menu.eventEmitter;
    // menu.registListeners(function(evt){
    // 	alert('i am first');
    // },function(evt){
    // 	alert('i am seconde');
    // }, function(evt){
    // 	alert('i am third');
    // });
    var selectedTextCallback = function(e){
    	var selectedRange = EPUBJS.core.getSelection.apply(view);
    	console.log(selectedRange);
    	var length;
    	try{
    		var range  = selectedRange.getRangeAt(0);
    		var text = range.toString();
    		length = text.length;
    	}catch(e){
    		console.log(e);
    		return;
    	}
    	if(length === 0){
    		menu.hide();
    		return;
    	}
    	// menu.setSelectionRange(selectedRange);
    	// console.log(selectedRange);
    	menu.show({
    		'view':view,
    		'selection': selectedRange,
    		x: e.pageX,
    		y: e.pageY,
            flag: menu.NOTE
    	});
    };
    /**
     * 返回data含义
      '{"dataId":"9bc1b40b-eafa-44f1-8e11-86e2751b757f",'此条笔记的id
    '"index":2,' 此条笔记所在的html对应页面的index
    '"startContainer":[6,9],' 此条笔记对应的开始节点 从 body元素找起 第一层的第六个元素，第二层的第9个元素
    '"endContainer":[8,1],' 此条笔记对应的开始节点 从 body元素找起 第一层的第六个元素，第二层的第9个元素
    '"startOffset":81,"endOffset":144,' 在起始节点中的文字偏移量
    '"parent":[2],' 起始节点与中止节点公共父元素（直接父元素）位置信息
    '"time":1445755306203,'+ note创建时间
    '"tag":"comment",'+ 此条笔记属于评论（还有 underline 与 copy 对应不同的操作）
        //选中的纯文本信息
    '"text":"篇4种，课文全部经过调整，部分课文完全重写，一些小知识也相应更新，同时采纳读者建议，增设生词表，方便读者查阅。《中文在手》系列丛书主要面向来华旅游、学习、工作的外国人和希望学习汉语、了解中国的外国朋友。整套丛书注重实用性、趣味性，兼顾科学性，突出时代感。所展示的日常交际用语和实用情景对话，基本可以满足外国人在中国的日常交际需要。该丛书既可以作为汉语实用交际手册，又可以作为专题式短期汉语教材使用。",'+
        //评论内容(tag为comment时才有)
    '"comment":"ddddddd"}';
     */
    menu.eventEmitter.addListener('underlineComplete', function(data){
    	alert(data.dataId)
    });
    b.onclick  = selectedTextCallback;
    var data_str = window.localStorage.getItem('note') || '{"dataId":"9bc1b40b-eafa-44f1-8e11-86e2751b757f","index":2,'+
    '"startContainer":[6,9],'+
    '"endContainer":[8,1],'+
    '"startOffset":81,"endOffset":144,'+
    '"parent":[2],'+
    '"time":1445755306203,'+
     '"tag":"comment",'+
     '"text":"篇4种，课文全部经过调整，部分课文完全重写，一些小知识也相应",'+
     '"comment":"ddddddd"}';
    if(data_str){
    	try{
    		var data = JSON.parse(data_str);
    		if(data.index!=undefined && data.index == view.currentChapter.spinePos){
    			menu.setDocument(view.doc || view.document);
    			var parentEle = EPUBJS.DomUtil.findNode(d.body, data.parent);
    	        var startContainerEle = EPUBJS.DomUtil.findNode(parentEle, data.startContainer);
    	        var endContainerEle = EPUBJS.DomUtil.findNode(parentEle, data.endContainer);
    	        var startOffset = data.startOffset;
    	        var endOffset = data.endOffset;
    	        var tag = data.tag;
    	        var comment = data.comment;
    	        var text = data.text;
    	        setTimeout(function(){
    	        	 menu.applyInlineStyle(text, comment, startContainerEle, endContainerEle, startOffset, endOffset, parentEle, false);
    	        },0)
     	       
    		}   
        }catch(e){
    	    console.log(e);
        } 
    }
}


EPUBJS.Hooks.register("selected").a = function(view, continuous){
    var d = view.document;
    var b = d.body;
    var canSelected = false;
    alert('what');
}