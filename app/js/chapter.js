/**
 * Created by wangwy on 15-10-12.
 */
EPUBJS.Chapter = function (spineObject) {
  this.href = spineObject.href;
  this.absolute = spineObject.url;
  this.id = spineObject.id;
  this.spinePos = spineObject.index;
  this.pages = 1;
  this.deferred = new RSVP.defer();
  this.loaded = this.deferred.promise;
};