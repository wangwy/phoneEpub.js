EPUBJS.DomUtil = {
    getSelection: function (view) {
        var window_ = view.element.contentWindow;
        var selection;
        if (window_.getSelection) {
            selection = window_.getSelection();
        } else if (this.doc.selection) {
            selection = this.doc.selection.createRange().text;
        }
        return selection;
    },
	/**
	 * 根据位置信息找到目标节点
	   @param root 父节点
	   @param info 位置信息[1,2,3,4]
	 */
	findNode: function(root, info){
		var sibling = root;
		if(!info || info.length === 0){
			return root;
		}
		for(var i = 0; i < info.length;i++){
			sibling = sibling.firstChild;
			for(var j = 1; j < info[i]; j++){
				sibling = sibling.nextSibling;
			}
		}
		return sibling;
	}, 
	/**
	 * 给定父节点及其子元素,获取其子元素的位置信息
	 */
	getPosition: function(root, child){
		var data = [];
		//1.获取深度
		var depth = EPUBJS.DomUtil.getDepth(root, child);
		while(depth > 0){
			var width = EPUBJS.DomUtil.getWidth(child);
			data.push(width);
			child = child.parentElement;
			depth--;
		}
		//2.反转数组
		//
		data.reverse();
		return data;
	},
	/**
	 * 获取给定元素是其直接父元素的第几个孩子
	 */
	 getWidth : function(ele){
    	var width = 1;
    	if(!ele){
    		throw new Error("child and parent can't be null");
    	}
    	var parent = ele.parentElement;
    	if(!parent){
    		return -1;
    	}
    	var child = parent.firstChild;
    	// var width = 0;
    	while(child && child != ele){
    		child = child.nextSibling;
    		width++;
    	}
    	return width;
    },
    /**
     * 获取子元素在其父元素中的深度
     */
    getDepth: function(parent, child){
	 	var depth = 1;
	 	if(!child || !parent){
	 		throw new Error("child and parent can't be null");
	 	}
	 	if(parent == child){
	 		return 0;
	 	}
	 	while(child.parentElement != parent){
	 		child = child.parentElement;
	 		depth++;
	 	}
	 	return depth;
	 },
	 /**
	  * 获取某元素中的所有子TextNode节点
	  */
	 getAllTextNode: function(parent){
    	var treeWalker = document.createTreeWalker(parent, NodeFilter.SHOW_TEXT,  
    		{ acceptNode: function(node) { 
    		    if(node && node.nodeType === 3 && node.textContent.trim())
    		    return NodeFilter.FILTER_ACCEPT; 
    		    return NodeFilter.FILTER_REJECT;
            } 
    	},false);
    	var nodeList = [];
    	do{
    		var node = treeWalker.currentNode;
    		//currentNode可能为textNode 而nextNode()为false
    		if(node && node.nodeType === 3 && node.textContent.trim())
    		nodeList.push(node);
    	} while(treeWalker.nextNode())
    	return nodeList;
    },
    /**
     * 解析选中元素每个字的坐标
     */
    getCoordinate: function (startContainer, endContainer, startOffset, endOffset, nodes){
    	
    	function _getCoordinate(node, start, end, range){
    	    range.setStart(node, start);
    	    range.setEnd(node, end);
    	    var rect = range.getBoundingClientRect();
    	    return {
    	    	x: rect.left,
    		    y: rect.top,
    		    height: rect.height,
    		    width: rect.width
    	    }
        }

    	function getCoordinateByNode(node, startOffset, endOffset){
    	    var coors = [];
    	    var range_ = this.document.createRange();
    	    for(var i=startOffset; i<endOffset;i++){
    		    var c = _getCoordinate(node, i, i+1, range_);
    		    coors.push(c);
    	    }
    	    return coors;
    		
        }
        var coordinate = [];
        //是否是起始节点与中止节点之间的文本节点
        var validNode = false;
        //起始节点与结束节点是同一节点
        if(startContainer === endContainer){
        	return getCoordinateByNode(startContainer, startOffset, endOffset);
        }else{
        	//不是同一节点
        	for(var i=0; i< nodes.length; i++){
        	var node = nodes[i];
        	if(node === startContainer){
        		validNode = true;
        		var c = getCoordinateByNode(node, startOffset, startContainer.textContent.length);
        		coordinate = coordinate.concat(c);
        	}else if(node === endContainer){
        		validNode = false;
        		var c = getCoordinateByNode(node, 0, endOffset);
        		coordinate = coordinate.concat(c);
        		break;
        	} else if(validNode){
        		var c = getCoordinateByNode(node, 0, node.textContent.length);
        		coordinate = coordinate.concat(c);
        	}
        } 
        }
           
        return coordinate;
    }
};