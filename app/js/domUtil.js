EPUBJS.DomUtil = {
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
		// while(depth > 0){
		// 	sibling = sibling.firstChild;
		// 	depth--;
		// }
		// // var parent = sibling.parentElement;
		// while(width > 1){
		// 	sibling = sibling.nextSibling;
		// 	width--;
		// }
		return sibling;
	}
};
EPUBJS.DomUtil.applyInlineStyle = function(){


    	var self_ = this;

 //    	function findDepth(anchorNode, focusNode, parent){
	// 		var i = 1;
	// 		var j = 1;
	// 		while(anchorNode.parentElement != parent){
	// 			i++;
	// 			anchorNode = anchorNode.parentElement;
	// 		}
	// 		while(focusNode.parentElement != parent){
	// 			j++;
	// 			focusNode = focusNode.parentElement;
	// 		}
	// 		return [i, j];
	// 	}

	//  function getDepthForElement(child, parent){
	//  	var depth = 0;
	//  	if(!child || !parent){
	//  		throw new Error("child and parent can't be null");
	//  	}
	//  	if(parent == child){
	//  		return 0;
	//  	}
	//  	while(child.parentElement != parent){
	//  		child = child.parentElement;
	//  		depth++;
	//  	}
	//  	return depth;
	//  }
	 
	//  /**
	//   * 
	//   */

	//  function getNextDom(startContainer, endContainer, aDepth, fDepth, endParent){
	//  	if(aDepth === fDepth === 1){
	//  		if(startContainer.nextSibling && startContainer.nextSibling != endContainer){
	//  		    return startContainer.nextSibling;
	//  	    }
	//  	}
	//  	if(aDepth >= fDepth){
	//  		if(startContainer.nextSibling && startContainer.nextSibling != endParent){
	//  		    return startContainer.nextSibling;
	//  	    }else if(startContainer.parentElement){
	//  		    return startContainer.parentElement == endParent ? null : startContainer.parentElement.nextSibling;
	//  	    }
	//  	}	
	//  	return null;
	//  }
	//  function getPreDom(endContainer,startContainer, aDepth, fDepth, startContainerParent){
	//  	if(aDepth === fDepth === 1){
	//  		if(endContainer.previousSibling && endContainer.previousSibling != startContainer){
	//  		    return endContainer.previousSibling;
	//  	    }
	//  	}
	//  	if(aDepth < fDepth){
	//  		if(endContainer.previousSibling && endContainer.previousSibling != startContainerParent){
	//  		    return endContainer.previousSibling;
	//  	    }else if(endContainer.parentElement){
	//  		    return endContainer.parentElement == startContainerParent ? null : endContainer.parentElement.previousSibling;
	//  	    }
	//  	}	
	//  	return null;
	//  }
	//  function replaceStartNode(container, node, startContainerParent_, endContainerParent_, aDepth, parent){
	//  	var startContainer = node;
	//  	var sibling;
	//  	//多层嵌套
	//  	if(aDepth > 2){
	//  		while(aDepth > 0){
	//  		    sibling = node.nextSibling;
	//  		    while(sibling && sibling !== endContainerParent_){
	//  			    sibling = replaceElement3(sibling);
	//  			    if(!sibling){
	//  			    	break;
	//  			    }
	//  			    sibling = sibling.nextSibling;
	//  		    }
	//  		    node = node.parentElement;
	//  		    if(node === parent){
	//  		    	break;
	//  		    }
	//  		    aDepth--;
	//  	    }
	//  	} 
	//  	startContainer.parentElement.replaceChild(container, startContainer);
	//  }

	//  function replaceEndNode(container, node, startContainerParent_, endContainerParent_, fDepth, parent){
	//  	var endContainer = node;
	//  	var sibling;
	//  	//多层嵌套
	//  	if(fDepth > 2){
	//  		while(fDepth > 0){
	//  		    sibling = node.previousSibling;
	//  		    while(sibling && sibling !== startContainerParent_){
	//  			    sibling = replaceElement3(sibling);
	//  			    if(!sibling){
	//  			    	break;
	//  			    }
	//  			    sibling = sibling.previousSibling;
	//  		    }
	//  		    node = node.parentElement;
	//  		    if(node === parent){
	//  		    	break;
	//  		    }
	//  		    fDepth--;
	//  	    }
	//  	} 
	//  	endContainer.parentElement.replaceChild(container, endContainer);
	//  }
	//   function replaceElementHeadAndTail(range,  startContainerParent_, endContainerParent_, offsetType, aDepth, fDepth){
	//  	var parent = range.commonAncestorContainer;
	//  	if(offsetType === 'START'){	 
	//  		var offset = range.startOffset;
	//  		var node = range.startContainer;
	//  		var endContainer = range.endContainer;
	//  		// var depth = getDepthForElement(node, startContainerParent_);
	//  		var container = document.createDocumentFragment();
	//  	    var underlineSpan = document.createElement('span');
	//  	    underlineSpan.style.cssText = 'border-bottom: 2px solid red';	    
	//  	    var text = node.textContent;
	//  	    underlineSpan.innerHTML = text.substring(offset);
	//  	    var textNode = document.createTextNode(text.substring(0, offset));
	//  	    container.appendChild(textNode);
	//  	    container.appendChild(underlineSpan);
	//  	    replaceStartNode(container, node, startContainerParent_, endContainerParent_, aDepth, parent);
	//  	    // var sibling;
	//  	    // while(sibling = getNextDom(node, endContainer, aDepth, fDepth, endContainerParent_)){
	//  	    // 	replaceElement3(sibling);
	//  	    // 	node = sibling;
	//  	    // }
	//  	}else if(offsetType === 'END'){
	//  		var offset = range.endOffset;
	//  		var node = range.endContainer;
	//  		var startContainer = range.startContainer;
	//  		var container = document.createDocumentFragment();
	//  	    var underlineSpan = document.createElement('span');
	//  	    underlineSpan.style.cssText = 'border-bottom: 2px solid red';	    
	//  	    var text = node.textContent;
	//  	    underlineSpan.innerHTML = text.substring(0,offset);
	//  	    var textNode = document.createTextNode(text.substring(offset));
	//  	    container.appendChild(underlineSpan);
	//  	    container.appendChild(textNode);
	//  	    // var sibling;
	//  	    // while(sibling = getPreDom(node, startContainer, aDepth, fDepth, startContainerParent_)){
	//  	    // 	replaceElement3(sibling);
	//  	    // 	sibling = node;
	//  	    // }
	//  	    replaceEndNode(container, node, startContainerParent_, endContainerParent_, fDepth, parent);	 	
	//  	}
	//  }
     
 //     function replaceElement(ele, current, flag){
 //     	if(ele.nodeType === 3){
 //     		var text = ele.textContent;
	//  		var underlineSpan = document.createElement('span');
	//  	    underlineSpan.style.cssText = 'border-bottom: 2px solid red';
	//  	    container.innerHTML = '<span class="note" style="border-bottom: 2px solid red">'+ 
	//  	    text+"</span>";
	//  	    ele.parentElement.replaceChild(underlineSpan, ele);
 //     	}

 //     }

 //     function isQualifiedNode(node){
 //     	if(node.nodeType === 3){
 //     		if(!node.nodeValue.trim()){
 //     			return false;
 //     		}
 //     	}
 //     	return true;
 //     }

 //     function findAllLeaf(range){
 //     	var parent = range.commonAncestorContainer;
 //     	var startNode = range.startContainer;
 //     	var focusNode = range.endContainer;
 //     	// var childs = parent.childNodes;
 //     	var results = [];
 //     	results = findTextNode(parent);
 //     	return results;
 //     }
 //     var arr = [];
 //     function findTextNode(ele){
     	
 //     	if(ele.nodeType === 3 && ele.nodeValue.trim()){
 //     		arr.push(ele);
 //     	}else{
 //     		var nodes = ele.childNodes;
 //     		if(nodes.length === 0){
 //     			return null;
 //     		}
 //     		for(var i=0; i < nodes.length; i++){
 //     		    findTextNode(nodes[i]);
 //     		}
 //     	}
 //     	return arr;
 //     }

    

 //    function isStartNode(node, startContainer, startContainerParent, depth){
 //    	if(depth == 1){
 //    		return node === startContainer;
 //    	}
 //    	return node === startContainerParent;
    	
 //    }

 //     function isEndNode(node, endContainer, endContainerParent, depth){
 //    	if(depth == 1){
 //    		return node === endContainer;
 //    	}
 //    	return node === endContainerParent;
    	
 //    }

 //     function replaceElement2(range, startContainerParent_, endContainerParent_, aDepth, fDepth){
 //     	var parent = range.commonAncestorContainer;
 //        var nodes = parent.childNodes;
 //        var element = false;
 //        var startContainer = range.startContainer, endContainer = range.endContainer;
 //        for(var i=0;i < nodes.length; i++){
 //        	var node = nodes[i];
 //        	if(isStartNode(node, startContainer, startContainerParent_, aDepth)){
 //        		element = true;
 //        		// replaceElement3()
 //        		replaceElementHeadAndTail(range, startContainerParent_, endContainerParent_, 'START', aDepth, fDepth);
 //        	}else if(isEndNode(node, endContainer, endContainerParent_, fDepth)){
 //        		element = false;
 //        		replaceElementHeadAndTail(range, startContainerParent_, endContainerParent_, 'END', aDepth, fDepth);
 //        	}else if(element){
 //        		if(isQualifiedNode(node)){
 //        			replaceElement3(node);
 //        		}   		
 //        	}
 //        }
 //     }

 //     function replaceElement3(ele){
 //     	if(isQualifiedNode(ele)){
 //     		if(ele.nodeType === 3){
 //     		// var parent_ = ele.parentElement;
 //     		var span = document.createElement('span');
 //     		span.style.cssText = "border-bottom: 2px solid red";
 //     		span.innerText = ele.textContent;
 //     		ele.parentElement.replaceChild(span, ele);
 //     		return span;
 //     		// parent_.innerHTML = '<span style="border-bottom: 2px solid red">'+ parent_.innerHTML + '</span>';
 //     	}else{
 //     		ele.innerHTML = '<span style="border-bottom: 2px solid red">'+ ele.innerHTML + '</span>';
 //     		return ele;
 //     	}
 //     	}   	
 //     }

 //     function replaceTextNode(range, textNodes){
 //     	//当前range父元素
	// 		var parent = range.commonAncestorContainer,
	// 		//起始节点元素
 //            startContainer = range.startContainer,
 //             //终止节点元素
 //            endContainer = range.endContainer;
 //            //起始节点偏移量
 //            var startOffset = range.startOffset,
 //                            //终止节点偏移量
 //            endOffset = range.endOffset;
 //     	var isElement = false;
 //     	var result = {};
 //     	for(var i=0; i < textNodes.length; i++){
 //     		var textNode = textNodes[i];
 //     		if(textNode == startContainer){
 //     			isElement = true;
 //     			var startContainer_new = replaceTextNode2(range, textNode, 'START', startOffset);
 //     			result.startContainerText = startContainer.textContent;
 //     			result.startOffset = startOffset;
 //     		}else if(textNode == endContainer){
 //     			isElement = false;
 //     			var endContainer_new = replaceTextNode2(range, textNode, 'END', endOffset);
 //     			result.endContainerText = endContainer.textContent;
 //     			result.endOffset = 0;
 //     		}else if(isElement){
 //     			replaceTextNode2(range, textNode);
 //     		}
     		
 //     	}
 //     	return result;
 //     }

 //     function replaceTextNode2(range, node, flag, offset){
 //     	if(flag === 'START'){
 //     		var container = document.createDocumentFragment();
	//  	    var underlineSpan = document.createElement('span');
	//  	    underlineSpan.style.cssText = 'border-bottom: 2px solid red';	    
	//  	    var text = node.textContent;
	//  	    underlineSpan.innerHTML = text.substring(offset);
	//  	    var textNode = document.createTextNode(text.substring(0,offset));
	//  	    container.appendChild(textNode);
	//  	    container.appendChild(underlineSpan);	   
	//  	    node.parentElement.replaceChild(container, node);
	 	    
	//  	    return underlineSpan.firstChild;
 //        }else if(flag === 'END'){
	//  		var container = document.createDocumentFragment();
	//  	    var underlineSpan = document.createElement('span');
	//  	    underlineSpan.style.cssText = 'border-bottom: 2px solid red';	    
	//  	    var text = node.textContent;
	//  	    underlineSpan.innerHTML = text.substring(0,offset);
	//  	    var textNode = document.createTextNode(text.substring(offset));
	//  	    container.appendChild(underlineSpan);
	//  	    container.appendChild(textNode);
	//  	    node.parentElement.replaceChild(container, node);
	//  	    return underlineSpan.firstChild;
 //        }else{
 //        	var parent = node.parentElement;
 //     	    if(parent.nodeName.toLowerCase() === 'span' && parent.childNodes.length === 1){
 //     		    parent.style.borderBottom = '2px solid red';
 //            }else{
 //     		    var span = document.createElement('span');
 //     		    span.style.borderBottom = '2px solid red';
 //     		    span.innerText = node.textContent;
 //     		    parent.replaceChild(span, node);
     		
 //     	    }	

 //        }
 //     }

	//  function underline(range, aDepth, fDepth){
	//  	console.log('之前的range');
	//  	console.log(range);
	//  	var parent = range.commonAncestorContainer;
	//  	var startContainer = range.startContainer;
	//  	var endContainer = range.endContainer;
	//  	// var htmlContent = range.cloneContents();
	//  	// console.log(htmlContent);
	//  	//直接父元素
	//  	var startContainerParent = startContainer.parentElement;
	//  	var endContainerParent = endContainer.parentElement;
	//  	//嵌套父元素(平级)
	//  	var startContainerParent_ = startContainerParent;
	//  	var endContainerParent_ = endContainerParent;
	//  		// startContainerParent.innerHTML = startContainerParent.innerHTML.substring(0, range.startOffset)+
	//  		// '<span class="note" style="border-bottom: 2px solid red">'+ startContainerParent.innerHTML.substring(offset)+"</span>"
	//  	var aDepth_ = aDepth;
	//  	var fDepth_ = fDepth;
	//  	//startContainerParent_在共同parent中处于第一级位置
	//  	while(aDepth_ > 2){
	//  		startContainerParent_ = startContainerParent.parentElement;
	//  		startContainerParent = startContainerParent_;
	//  		aDepth_--;
	//  	}
 //        //endContainerParent_在共同parent中处于第一级位置
	//  	while(fDepth_ > 2){
	//  		endContainerParent_ = endContainerParent.parentElement;
	//  		endContainerParent = endContainerParent_;
	//  		fDepth_--;
	//  	}
	//  	replaceElement2(range, startContainerParent_, endContainerParent_, aDepth, fDepth);
	// }

	function getAllTextNode(parent){
    	// var parent = range.commonAncestorContainer;

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
    }

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
    	// var length = node.textContent.length;
    	for(var i=startOffset; i<endOffset;i++){
    		var c = _getCoordinate(node, i, i+1, range_);
    			coors.push(c);
    	}
    	return coors;
    		
    }

/**
 * 解析选中元素每个字的坐标
 */
    function getCoordinate(startContainer, endContainer, startOffset, endOffset, nodes){
    	// //起始节点元素
     //    var startContainer = range.startContainer,
     //         //终止节点元素
     //        endContainer = range.endContainer;
     //        //起始节点偏移量
     //    var startOffset = range.startOffset,
     //        //终止节点偏移量
     //        endOffset = range.endOffset;
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

    /**
     * 通过解析所有字的坐标信息 获取矩形区域的信息
     * 返回 二维数组[][] 
     */
    function getDivData(coors){
    	var begin_y = coors[0].y;
    	var divData = [coors[0]];
    	var divDatas = [];
    	if(coors.length === 1){
    		divDatas.push(divData);
    		return divDatas;
    	}
    	for(var i=1; i < coors.length; i++){
    		var coor = coors[i];
    		var y = coor.y;
    		if(begin_y === y){
    			divData.push(coor);
    		}else{
    			divDatas.push(divData);
    			divData = [coors[i]];
    			begin_y = coors[i].y;
    		}
    		if(i===coors.length-1){
    			divDatas.push(divData);
    		}
    	}
    	return divDatas;
    }

    /**
     * 创建矩形区域
     */
    function resolveDivData(divDatas){
    	if(!divDatas || divDatas.length === 0){
    		return null;
    	}
    	var divs = [];
    	var uuid = EPUBJS.core.uuid();
    	for(var i =0; i< divDatas.length;i++){
    		var div = document.createElement('div');
    		div.style.borderBottom = '2px solid red';
    		div.style.position = 'absolute';
    		div.groupId = uuid;
    		div.onclick = function(evt){
		    //show menu 
		    evt.stopPropagation();
		    var d = this.ownerDocument;
		     var menu = new EPUBJS.pluginView.PopMenu({hasContent: true, 'groupId': uuid});
		     var x = evt.pageX;
		     var y = evt.pageY;
		     menu.show({
		     	'x': x,
		     	'y': y,
		     	"view": {document: d}
		     })
            menu.registListeners(function(evt){
    	        alert('i am first');
            },function(evt){
    	        alert('i am seconde');
            }, function(evt){
    	        alert('i am third');
            });
        }
    		var data = divDatas[i];
    		if(data.length == 1){
    			div.style.height = data[0].height + 'px';
    			div.style.width = data[0].width + 'px';
    			div.style.top = data[0].y + 'px';
    			div.style.left = data[0].x + 'px';
    			divs.push(div);
    		}else{
    			var length = data.length;
    			var startX = data[0].x;
    			var endX = data[length-1].x;
    			div.style.height = data[0].height + 'px';
    			//中止矩形x - 起始矩形x + 最后一个矩形的宽度
    			div.style.width = endX - startX + data[length-1].width + 'px';
    			div.style.top = data[0].y + 'px';
    			div.style.left = data[0].x + 'px';
    			divs.push(div);
    		}
    	}
    	return divs;
    }

	// var range = selection.getRangeAt(0);
	// try{
	// 	var span = document.createElement('span');
	// 	span.style.cssText = 'border-bottom: 2px solid red';
	// 	span.onclick = function(evt){
	// 	//show menu 
	// 	    evt.stopPropagation();
	// 	    var d = this.ownerDocument;
	// 	     var menu = new EPUBJS.pluginView.PopMenu({hasContent: true});
	// 	     var x = evt.pageX;
	// 	     var y = evt.pageY;
	// 	     menu.show({
	// 	     	'x': x,
	// 	     	'y': y,
	// 	     	"view": {document: d}
	// 	     })
 //    menu.registListeners(function(evt){
 //    	alert('i am first');
 //    },function(evt){
 //    	alert('i am seconde');
 //    }, function(evt){
 //    	alert('i am third');
 //    });
	// 	}
	// 	span.className = 'note'
	// 	range.surroundContents(span);
	// 	}catch(e){
	// 	    //破坏了dom结构
	// 	    //我们需要手动来改动dom结构
	// 	    // console.log(e);
	// 	    // var doc = range.extractContents();
	// 	    // var childNodes = doc.childNodes;
	// 		// var node;
	// 		// while(node = childNodes.item(0)){
	// 		//           span.appendChild(node);	
	// 		// }
	// 		// range.insertNode(span);
	// 		//以上方法会破坏dom结构 所以不能使用此方法
	// 		//---------------------------
	// 		// console.log(span);
	// 		// replaceElement(parent, anchorNode, endNode, anchorOffset, endOffset, aDepth, fDepth);
	// 		// 方案1-------------------------------------------
	// 		//当前range父元素
	// 		var parent = range.commonAncestorContainer,
	// 		//起始节点元素
 //            start = range.startContainer,
 //             //终止节点元素
 //            end = range.endContainer;
 //            //起始节点偏移量
 //            var startOffset = range.startOffset,
 //            //终止节点偏移量
 //            endOffset = range.endOffset;
 //   //          var obj = findDepth(start, end, parent);
	// 		// // parent = obj.parent;
	// 		// var aDepth = obj[0];
	// 		// var fDepth = obj[1];
 //   //          underline(range, aDepth, fDepth);  

 //            //方案2----------------------------------  
 //            var textNodes = findAllLeaf(range);  
	// 		// var aDepth = obj[0];
 //            var result = replaceTextNode(range, textNodes); 
 //            selection.removeAllRanges();
 //            //存储到storage
 //            var string = JSON.stringify(result);
 //            window.localStorage.result = string;
               //----------------------------------
               //方案3
               var textNodes = getAllTextNode(parent);
               var coordinate = getCoordinate(startContainer, endContainer, startOffset, endOffset, textNodes);
               var divDatas = getDivData(coordinate);
               var divs = resolveDivData(divDatas);
               // this.divs = divs;
               for(var i =0;i < divs.length; i++){
                   self_.document.body.appendChild(divs[i]);
               }
}