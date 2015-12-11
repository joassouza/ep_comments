var commentTags = ["comment-text"];
var _ = require('ep_etherpad-lite/static/js/underscore');

var collectContentPre = function(hook, context){
  //TODO BETTER NAMING
  var comment = /(?:^| )(c-[A-Za-z0-9]*)/.exec(context.cls);
  var tagName = context.tname;
  var acumulator;
  var data;

  if(comment && comment[1]){
    context.cc.doAttrib(context.state, "comment::" + comment[1]);
    acumulator = context.state.commentData = {};
    acumulator.commentId = comment[1]
  }

  if (isCommentTag(tagName)){
    var classValue = context.cls;
    data = pad.plugins.ep_comments_page.getCommentData();
    data.comment.text = unescapeClassName(classValue);
    saveComment(context, data);
  }

};

var isCommentTag = function  (tagName) {
  var attribIndex = _.indexOf(commentTags, tagName);
  return attribIndex >= 0;
}


var saveComment = function (context, data) {
  data.comment.commentId = context.state.commentData.commentId;
  pad.plugins.ep_comments_page.saveCommentWithNoSelection(data);
}

var unescapeClassName = function (classValueEncoded) {
  // We remove the additional space added in the beginning when the class name was encoded
  return decodeURI(classValueEncoded).substr(1);
}

exports.collectContentPre = collectContentPre;
