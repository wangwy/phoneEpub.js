/**
 * Created by wangwy on 15-9-24.
 */
EPUBJS.core = {};
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