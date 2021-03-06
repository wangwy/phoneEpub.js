/**
 * Created by wangwy on 15-9-24.
 */
EPUBJS.core = {};

/**
 * 根据各个浏览器添加样式的前缀
 * @param unprefixed
 * @returns {*}
 */
EPUBJS.core.prefixed = function (unprefixed) {
  var vendors = ["Webkit", "Moz", "O", "ms" ],
      upper = unprefixed[0].toUpperCase() + unprefixed.slice(1),
      length = vendors.length;

  if (typeof(document.body.style[unprefixed]) != 'undefined') {
    return unprefixed;
  }

  for (var i = 0; i < length; i++) {
    if (typeof(document.body.style[vendors[i] + upper]) != 'undefined') {
      return vendors[i] + upper;
    }
  }

  return unprefixed;
};

/**
 * 与后台接口
 * @param url
 * @returns {Promise.promise|*}
 */
EPUBJS.core.request = function (url) {
  var deferred = new RSVP.defer();
  var xhr = new XMLHttpRequest();
  xhr.open("GET", url, true);

  xhr.send();
  xhr.overrideMimeType('text/xml');
  xhr.onreadystatechange = handler;
  function handler() {
    if (this.readyState === this.DONE) {
      if (this.status === 200 || this.status === 0) {
        deferred.resolve( new DOMParser().parseFromString(this.responseText, 'text/xml'));
      } else {
        deferred.reject({
          message: this.response,
          stack: new Error().stack
        });
      }
    }
  }

  return deferred.promise;
};

/**
 * 解析url
 * @param url
 * @returns {{protocol: string, host: string, path: string, origin: string, directory: string, base: string, filename: string, extension: string, fragment: string, href: *}}
 */
EPUBJS.core.uri = function (url) {
  var uri = {
        protocol: '',
        host: '',
        path: '',
        origin: '',
        directory: '',
        base: '',
        filename: '',
        extension: '',
        fragment: '',
        href: url
      },
      blob = url.indexOf('blob:'),
      doubleSlash = url.indexOf('://'),
      search = url.indexOf('?'),
      fragment = url.indexOf('#'),
      withoutProtocol,
      dot,
      firstSlash;
  if (blob === 0) {
    uri.protocol = "blob";
    uri.base = url.indexOf(0, fragment);
    return uri;
  }

  if (fragment != -1) {
    uri.fragment = url.slice(fragment + 1);
    url = url.slice(0, fragment);
  }

  if (search != -1) {
    uri.search = url.slice(search + 1);
    url = url.slice(0, search);
  }

  if (doubleSlash != -1) {
    uri.protocol = url.slice(0, doubleSlash);
    withoutProtocol = url.slice(doubleSlash + 3);
    firstSlash = withoutProtocol.indexOf('/');

    if (firstSlash === -1) {
      uri.host = uri.path;
      uri.path = "";
    } else {
      uri.host = withoutProtocol.slice(0, firstSlash);
      uri.path = withoutProtocol.slice(firstSlash);
    }

    uri.origin = uri.protocol + "://" + uri.host;
    uri.directory = EPUBJS.core.folder(uri.path);
    uri.base = uri.origin + uri.directory;
  } else {
    uri.path = url;
    uri.directory = EPUBJS.core.folder(url);
    uri.base = uri.directory;
  }

  uri.filename = url.replace(uri.base, '');
  dot = uri.filename.lastIndexOf('.');

  if (dot != -1) {
    uri.extension = uri.filename.slice(dot + 1)
  }

  return uri;
};

/**
 * 获取文件目录
 * @param url
 * @returns {string}
 */
EPUBJS.core.folder = function (url) {
  var lastSlash = url.lastIndexOf('/');
  var folder = '';
  if (lastSlash != -1) {

    folder = url.slice(0, lastSlash + 1);

  }

  return folder;
};

/**
 * 根据path获取相对路径
 * @param base
 * @param path
 * @returns {*}
 */
EPUBJS.core.resolveUrl = function (base, path) {
  var url,
      segments = [],
      uri = EPUBJS.core.uri(path),
      folders = base.split("/"),
      paths;
  if (uri.host) {
    return path;
  }

  folders.pop();

  paths = path.split("/");
  paths.forEach(function (p) {
    if (p === "..") {
      folders.pop();
    } else {
      segments.push(p);
    }
  });

  url = folders.concat(segments);

  return url.join("/");
};

/**
 * 形成唯一标识
 * @returns {string}
 */
EPUBJS.core.uuid = function () {
  var d = new Date().getTime();
  var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = (d + Math.random() * 16) % 16 | 0;
    d = Math.floor(d / 16);
    return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
  });
  return uuid;
};

/**
 * 向手机端发送消息
 * @param msgType
 * @param info
 */
EPUBJS.core.postMessageToMobile = function (msgType, info) {
  var userAgent = navigator.userAgent || navigator.vendor || window.opera;
  try {
    if (userAgent.match(/iPad/i) || userAgent.match(/iPhone/i) || userAgent.match(/iPod/i)) {
      window.webkit.messageHandlers.app.postMessage({msgType: msgType, info: info});
    } else if (userAgent.match(/Android/i)) {
      window.androidApp.postMessage(JSON.stringify({msgType: msgType, info: info}));
    }
  } catch (e) {
//    console.error(e);
  }
};

/**
 * 根据前缀获取xpath的命名空间
 * @param prefix
 * @returns {*|null}
 */
EPUBJS.core.nsResolver = function (prefix) {
  var ns = {
    'xhtml': 'http://www.w3.org/1999/xhtml',
    'epub': 'http://www.idpf.org/2007/ops'
  };
  return ns[prefix] || null;
};

/**
 * 获取textNode在父元素里的位置
 * @param textNode
 * @returns {number}
 */
EPUBJS.core.indexOfTextNode = function (textNode) {
  var parent = textNode.parentNode;
  var children = parent.childNodes;
  var sib;
  var index = -1;
  for (var i = 0; i < children.length; i++) {
    sib = children[i];
    if (sib.nodeType === Node.TEXT_NODE) {
      index++;
    }
    if (sib == textNode) break;
  }
  return index;
};

/**
 * 获取对象里的值
 * @param object
 * @returns {*}
 */
EPUBJS.core.values = function (object) {
  var index = -1;
  var props, length, result;
  if(!object) return [];
  props = Object.keys(object);
  length = props.length;
  result = Array(length);

  while(++index < length){
    result[index] = object[props[index]];
  }

  return result;
};