EPUBJS.pluginView = EPUBJS.pluginView || {};
EPUBJS.pluginView.PopMenu = function() {
	// this.eventEmitter = new EventEmitter();
	this.height = 40;
	var div = this.initial();
	this.getPopMenu = function() {
		return div;
	}
}
EPUBJS.pluginView.PopMenu.prototype = {
	CLEAR: 'clear',
	NOTE: 'note',
	setSelectionRange: function(range_) {
		this.range = range_;
	},
	getSelectionRange: function() {
		return this.range;
	},
	setDocument: function(d) {
		this.document = d;
	},
	setView: function(v) {
		this.view = view;
	},
	/**
	 * 创建界面 绑定按钮事件
	 */
	initial: function() {
		var self_ = this;
		var div = document.createElement('div');
		div.id = 'menu_container';
		div.style.height = this.height + 'px';
		div.style.width = '120px';
		div.style.border = '1px solid red';
		div.style.position = 'absolute';
		div.style.display = 'none';
		var text = '复制';

		for (var i = 0; i < 2; i++) {
			var id = 'menu_';
			switch (i) {
				case 0:
					text = '复制';
					id += 'copy';
					break;
				case 1:
					text = '分享';
					id += 'share';
					break;
			}
			var button = document.createElement('button');
			button.innerText = text;
			button.id = id;
			div.appendChild(button);
		}

		var buttons = div.getElementsByTagName('button');
		for (var i = 0; i < buttons.length; i++) {
			//闭包
			(function(_i) {
				buttons[_i].onclick = buttons[_i].ontouch = function(evt) {
					evt.stopPropagation();
					var selection = self_.range;
					if (selection) {
						var range = selection.getRangeAt(0);
						if (this.id === 'menu_note' && range.toString().length > 0) {
							var comment = self_.getCommentPanel(selection);

						}
					} else {
						if (this.id === 'menu_note_clear') {
							self_.clearInlineStyle(this.groupId);
							EPUBJS.core.postMessageToMobile('deleteNote', this.groupId);
						}
					}
					self_.hide();
				};
			})(i)
		}
		var button = document.createElement('button');
		div.appendChild(button);
		return div;
	},
	/**
	* config: {
	x: menu 显示的x坐标
	y: menu 显示的y坐标
	view: 要append的view对象(可以直接使用 {view:{doc: document}})
	flag: clear(清除),note(笔记) menu存在两种形态 第三个按钮 flag决定第三个按钮是清除还是笔记
	selection: selection 如果按钮为笔记 则必须将selection传递进来
	}
	*/
	show: function(config) {
		var self_ = this;
		var x = config.x;
		var y = config.y;
		// var view = config.view;
		// this.view = view;
		var doc = this.document;
		// this.document = doc;
		this.selection = config.selection;
		var menu_container = doc.getElementById('menu_container');
		if (!menu_container) {
			menu_container = self_.getPopMenu();
			doc.body.appendChild(menu_container);
		}
		var button = menu_container.getElementsByTagName('button')[2];
		if (config.flag == this.CLEAR) {
			button.innerText = '清除';
			button.id = 'menu_note_clear';
			button.groupId = config.groupId;
			var callback = function(evt) {
				evt.stopPropagation();
				// var groupId = config.groupId;
				self_.clearInlineStyle(button.groupId);
				self_.hide();
			}
			button.onclick = button.ontouch = callback;

		} else if (config.flag == this.NOTE) {
			button.innerText = '笔记';
			button.id = 'menu_note';
			(function(s) {
				button.onclick = button.ontouch = function(evt) {
					evt.stopPropagation();
					var comment = self_.getCommentPanel(config.selection);
				}
			})(config.selection);


		}
		var top = y;
		var left = x - 60;
		menu_container.style.top = top + 'px';
		menu_container.style.left = left + 'px';
		menu_container.style.display = 'block';
	},

	/**
	 * 隐藏菜单
	 */
	hide: function() {
		var ele = this.getPopMenu();
		this.range = null;
		ele.style.display = 'none';
	},
	/**
	 * 点击笔记按钮时 弹出输入笔记的框
	 */
	getCommentPanel: function(selection) {
		var self_ = this;
		var range = selection.getRangeAt(0);
		var button, textarea, container;
		if (this.document.getElementById('note_comment_panel')) {
			container = this.document.getElementById('note_comment_panel');
			textarea = container.getElementsByTagName('textarea')[0];
			textarea.value = '';
			button = container.getElementsByTagName('button')[0];
			container.style.display = "block";
		} else {
			container = document.createElement('div');
			container.id = "note_comment_panel";
			var textarea = document.createElement('textarea');
			var button = document.createElement('button');
			var scrollTop = this.document.body.scrollHeight;
			button.innerText = '完成';
			textarea.style.height = '200px';
			textarea.style.width = '200px';
			container.style.position = 'absolute';
			container.style.left = this.document.body.clientWidth / 2 + 'px';
			container.style.top = scrollTop / 2 + 'px';

			container.appendChild(textarea);
			container.appendChild(button);
			self_.document.body.appendChild(container);
		}


		var callback = function(evt) {
			var textContent = range.toString();
			var comment = textarea.value;
			self_._applyInlineStyle(textContent, comment, range.startContainer, range.endContainer, range.startOffset, range.endOffset, range.commonAncestorContainer, true);
			selection.removeAllRanges();
			container.style.display = 'none';
		}
		button.onclick = button.ontouch = callback;
	},
	/**
	 * 清除笔记
	   @param 此条笔记的uuid(dataId)
	 */
	clearInlineStyle: function(groupId) {
		var treeWalker = this.document.createTreeWalker(this.document.body, NodeFilter.SHOW_ELEMENT, {
			acceptNode: function(node) {
				if (node.tagName.toLowerCase().trim() === 'div' && node.groupId == groupId) {
					return NodeFilter.FILTER_ACCEPT;
				} else {
					return NodeFilter.FILTER_SKIP;
				}
			}
		}, false);
		var divs = [];
		while (treeWalker.nextNode()) {
			node = treeWalker.currentNode;
			divs.push(node);
			// node.parentElement.removeChild(node);
		}
		for (var i = 0; i < divs.length; i++) {
			var div = divs[i];
			div.parentElement.removeChild(div);
		}
	},
	hideCommentText: function() {
		if (this.document) {
			var container = this.document.getElementById('comment_text_container');
			if (container) {
				container.style.display = 'none';
			}
		}
	},
	/**
	 * 划线
	   @param text 选中的纯文本
	   @param comment 选中文本的笔记信息 可为null
	   @param startContainer 起始节点 / Range.startContainer
	   @param endContainer 终止节点 / Range.endContainer
	   @param startOffset 起始节点中的偏移量 Range.startOffset
	   @param endOffset 终止节点中的偏移量 Range.endOffset
	   @param parent 起始节点与终止节点的共同直接父元素 Range.commonAncestorContainer
	   @param needStore 当前划线信息是否需要存储 重绘的线不需要 新增的笔记需要存储 true 存储｜false 不存储
	 */
	_applyInlineStyle: function(text, comment, startContainer, endContainer, startOffset, endOffset, parent, needStore) {
		var self_ = this;
		/**
		 * 通过解析所有字的坐标信息 获取矩形区域的信息
		 * 返回 二维数组[][] 
		 */
		function getDivData(coors) {
			var begin_y = coors[0].y;
			var divData = [coors[0]];
			var divDatas = [];
			if (coors.length === 1) {
				divDatas.push(divData);
				return divDatas;
			}
			for (var i = 1; i < coors.length; i++) {
				var coor = coors[i];
				var y = coor.y;
				if (begin_y === y) {
					divData.push(coor);
				} else {
					divDatas.push(divData);
					divData = [coors[i]];
					begin_y = coors[i].y;
				}
				if (i === coors.length - 1) {
					divDatas.push(divData);
				}
			}
			return divDatas;
		}

		/**
		 * 创建矩形区域
		 */
		function resolveDivData(divDatas) {
			var self_ = this;
			if (!divDatas || divDatas.length === 0) {
				return null;
			}
			var divs = [];
			var uuid = EPUBJS.core.uuid();

			//最后一个字的坐标
			var lastDiv = divDatas[divDatas.length - 1];
			var lastText = lastDiv[lastDiv.length - 1];
			var callback = function(evt) {
				var self__ = this;
				//show menu 
				var menu_container = this.ownerDocument.getElementById('menu_container');
				if (!menu_container) {
					var menu = EPUBJS.BookInterface.menu;
					menu.show({
						x: lastText.x,
						y: lastText.y - menu.height,
						flag: 'clear',
						view: {
							doc: self__.ownerDocument
						},
						groupId: self__.groupId
					});
				} else {
					var buttons = menu_container.getElementsByTagName('button');
					buttons[2].groupId = self__.groupId;
					menu_container.style.left = lastText.x - 60 + 'px';
					menu_container.style.top = lastText.y - parseFloat(menu_container.style.height) + 'px';
					menu_container.style.display = 'block';
				}
			}
			for (var i = 0; i < divDatas.length; i++) {
				var div = document.createElement('div');
				div.style.borderBottom = '2px solid rgb(255, 96, 0)';
				div.style.position = 'absolute';
				div.groupId = uuid;

				div.onclick = div.ontouch = callback;
				var data = divDatas[i];
				if (data.length == 1) {
					div.style.height = data[0].height + 'px';
					div.style.width = data[0].width + 'px';
					div.style.top = data[0].y + 'px';
					div.style.left = (EPUBJS.BookInterface.view.chapterPos - 1) * EPUBJS.BookInterface.view.pageWidth + data[0].x + 'px';
					divs.push(div);
				} else {
					var length = data.length;
					var startX = data[0].x;
					var endX = data[length - 1].x;
					div.style.height = data[0].height + 'px';
					//中止矩形x - 起始矩形x + 最后一个矩形的宽度
					div.style.width = endX - startX + data[length - 1].width + 'px';
					div.style.top = data[0].y + 'px';
					div.style.left = (EPUBJS.BookInterface.view.chapterPos - 1) * EPUBJS.BookInterface.view.pageWidth + data[0].x + 'px';
					divs.push(div);
				}
			}

			return divs;
		}

		function showCommentText(div) {
			var left = parseFloat(div.style.left);
			var top = parseFloat(div.style.top);
			var width_div = parseFloat(div.style.width);
			var comment = div.data;
			var container;
			container = div.ownerDocument.getElementById('comment_text_container');
			if (!container) {
				container = document.createElement('div');
				container.style.position = 'absolute';
				container.style.color = 'red';
				container.id = 'comment_text_container';
				container.style.backgroundColor = '#ffffc4';
				container.style.border = "1px solid #c48b40";
				container.style.borderRadius = '3px';
				container.style.padding = '0 20px';
				div.ownerDocument.body.appendChild(container);
			}
			container.innerHTML = '<p style="color:#a04e00; font-size:14px">' + comment + '</p>' +
				'<div style="left:40px;position: absolute; height:14px; width:14px;"></div>';
			var width = container.clientWidth;
			var height = container.clientHeight;
			//小三角
			var div_ = container.getElementsByTagName('div')[0];
			div_.style.left = Math.floor(width / 2) - 7 + 'px';
			//如果可以从上方显示
			if (top > height + 14) {
				//减去小三角的高度
				container.style.top = top - height - 7 + 'px';
				div_.style.background = "url('/app/svg/narrow_down.svg') no-repeat";
			}else{
				//显示在下方
				container.style.top = width_div + 10 + 7 + 'px';
				div_.style.background = "url('/app/svg/narrow_up.svg') no-repeat";
				div_.style.top =  '-14px';
			}

			var p = container.getElementsByTagName('p')[0];
			// var inner_width = p.clientWidth;
			container.style.left = left - width / 2 + width_div / 2 + 'px';
			container.style.display = 'block';
		}

		/**
		 * 创建划线笔记后的小圆点
		 */
		function resolveCommentIcon(data, comment, groupId) {
			if (!comment || comment.trim().length === 0) {
				return null;
			}
			var icon_width = 20;
			var icon_height = 20;
			var icon = document.createElement('div');
			icon.groupId = groupId;
			icon.style.height = icon_height + 'px';
			icon.style.width = icon_width + 'px';
			icon.style.position = 'absolute';
			icon.style.lineHeight = "20px";
			icon.style.backgroundColor = 'rgb(250,122,32)';
			icon.style.borderRadius = '50%';
			icon.style.fontSize = "14px";
			icon.style.color = "white";
			icon.style.lineHeight = '10px';
			icon.data = comment;
			icon.innerText = "...";
			icon.onclick = icon.ontouch = function(evt) {
				evt.stopPropagation();
				showCommentText(this);
			}
			if (data.length == 1) {
				icon.style.top = Math.floor(data[0].y + data[0].height / 2) + 'px';
				icon.style.left = (EPUBJS.BookInterface.view.chapterPos - 1) * EPUBJS.BookInterface.view.pageWidth + data[0].x + data[0].width + 'px';
			} else {
				icon.style.top = Math.floor(data[data.length - 1].y + data[data.length - 1].height / 2) + 'px';
				icon.style.left = (EPUBJS.BookInterface.view.chapterPos - 1) * EPUBJS.BookInterface.view.pageWidth + data[data.length - 1].x + data[data.length - 1].width + 'px';
			}
			return icon;
		}
		//获取所有的textNode
		var textNodes = EPUBJS.DomUtil.getAllTextNode(parent);
		//找到所有选中文字的坐标信息
		var coordinate = EPUBJS.DomUtil.getCoordinate(startContainer, endContainer, startOffset, endOffset, textNodes);
		//解析坐标信息(几行？每行的宽度 和高度？及其显示位置？)
		var divDatas = getDivData(coordinate);
		// 根据解析来的坐标信息创建出div信息
		var divs = resolveDivData(divDatas);
		// 创建小圆点 如果 comment为null or "" icon为null
		var icon = resolveCommentIcon(divDatas[divDatas.length - 1], comment, divs[0].groupId);
		for (var i = 0; i < divs.length; i++) {
			self_.document.body.appendChild(divs[i]);
		}
		if (icon)
			self_.document.body.appendChild(icon);
		// 将数据回传外层
		if (needStore) {
			var position_parent = EPUBJS.DomUtil.getPosition(self_.document.body, parent);
			var position_start = EPUBJS.DomUtil.getPosition(parent, startContainer);
			var position_end = EPUBJS.DomUtil.getPosition(parent, endContainer);
			var uuid = divs[0].groupId;
			var data = {
					dataId: uuid,
					index: self_.view.currentChapter.spinePos,
					'startContainer': position_start,
					'endContainer': position_end,
					'startOffset': startOffset,
					'endOffset': endOffset,
					'parent': position_parent,
					'time': new Date().getTime(),
					'tag': 'comment',
					'text': text,
					'comment': comment,
					'chapterName': self_.view.chapterName.innerText
				}
				//采用事件机制回传
				// self_.eventEmitter.emitEvent('underlineComplete', [data]);
			return data;
		}
	}
}