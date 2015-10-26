/**
 * Created by wangwy on 15-10-26.
 */
EPUBJS.Hooks.register("beforeChapterDisplay").smartimages = function (renderer) {
  console.log(renderer.docEl);
};
