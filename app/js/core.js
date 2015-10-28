/**
 * Created by wangwy on 15-9-24.
 */
EPUBJS.core = {};

/**
 * 根据各个浏览器添加样式的前缀
 * @param unprefixed
 * @returns {*}
 */
EPUBJS.core.prefixed = function(unprefixed) {
  var vendors = ["Webkit", "Moz", "O", "ms" ],
      prefixes = ['-Webkit-', '-moz-', '-o-', '-ms-'],
      upper = unprefixed[0].toUpperCase() + unprefixed.slice(1),
      length = vendors.length;

  if (typeof(document.body.style[unprefixed]) != 'undefined') {
    return unprefixed;
  }

  for ( var i=0; i < length; i++ ) {
    if (typeof(document.body.style[vendors[i] + upper]) != 'undefined') {
      return vendors[i] + upper;
    }
  }

  return unprefixed;
};

EPUBJS.core.request = function (url, type, withCredentials) {
  var supportsURL = window.URL;
  var BLOB_RESPONSE = supportsURL ? "blob" : "arraybuffer";

  var deferred = new RSVP.defer();

  var xhr = new XMLHttpRequest();

  var xhrPrototype = XMLHttpRequest.prototype;

  if (!('overrideMimeType' in xhrPrototype)) {
    Object.defineProperty(xhrPrototype, 'overrideMimeType', {
      value: function xmlHttpRequestOverrideMimeType(mimeType) {
      }
    });
  }
  if (withCredentials) {
    xhr.withCredentials = true;
  }
  xhr.open("GET", url, true);
  xhr.onreadystatechange = handler;

  if (type == 'blob') {
    xhr.responseType = BLOB_RESPONSE;
  }

  if (type == "json") {
    xhr.setRequestHeader("Accept", "application/json");
  }

  if (type == 'xml') {
    xhr.overrideMimeType('text/xml');
  }

  if (type == "binary") {
    xhr.responseType = "arraybuffer";
  }

  xhr.send();

  function handler() {
    if (this.readyState === this.DONE) {
      if (this.status === 200) {
        var r;

        if (type == 'xml') {
          r = new DOMParser().parseFromString(this.responseText, 'text/xml');
        } else if (type == 'json') {
          r = JSON.parse(this.responseText);
        } else if (type == 'blob') {

          if (supportsURL) {
            r = this.responseText;
          } else {
            r = new Blob([this.responseText]);
          }

        } else {
          r = this.responseText;
        }

        deferred.resolve(r);
      } else {
        deferred.reject({
          message: this.responseText,
          stack: new Error().stack
        });
      }
    }
  }

  return deferred.promise;
};

/**
 * 形成唯一标识
 * @returns {string}
 */
EPUBJS.core.uuid = function() {
  var d = new Date().getTime();
  var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = (d + Math.random()*16)%16 | 0;
    d = Math.floor(d/16);
    return (c=='x' ? r : (r&0x7|0x8)).toString(16);
  });
  return uuid;
};