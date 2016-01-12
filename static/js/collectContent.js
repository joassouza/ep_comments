var commentTags = ["comment-text", "comment-name", "comment-author", "comment-timestamp"];
var commentReplyTags = ["author","changefrom","changeto","commentid","name","replyid","text","timestamp"];
var _ = require('ep_etherpad-lite/static/js/underscore');

// div > comment-text > comment-name > comment-author > comment-timestamp
// a comment follows this level where div is the outer tag. CollectContentPre goes
// inner to outer. So when we are in the tag comment-text we already processed all the
// inner tags. So we save the comment in this tag.
var setDataTextAndSaveData = function(commentData, context){
  var classValueEscaped = context.cls;
  commentData.comment.text = unescapeClassName(classValueEscaped);
  saveComment(context, commentData);
};

var setDataName = function(commentData, context){
  var classValueEscaped = context.cls;
  commentData.comment.name = unescapeClassName(classValueEscaped);
};

var setDataAuthor = function(commentData, context){
  var classValueEscaped = context.cls;
  commentData.comment.author = classValueEscaped;
};

var setDataTimestamp = function(commentData, context){
  var classValueEscaped = context.cls;
  commentData.comment.timestamp = classValueEscaped;
};

// comment replies tags

var setAuthor = function(commentData, context){
  var classValue  = context.cls;
  commentData.replyData.author = classValue;
};

var setChangeFrom = function(commentData, context){
  var classValue  = context.cls;
  commentData.replyData.changeFrom = classValue;
};

var setChangeTo = function(commentData, context){
  var classValue  = context.cls;
  commentData.replyData.changeTo = classValue;
};

var setCommentid = function(commentData, context){
  var classValue  = context.cls;
  commentData.replyData.commentId = classValue;
};

var setName = function(commentData, context){
  var classValue  = context.cls;
  commentData.replyData.name = classValue;
};

var setReplyid = function(commentData, context){
  var classValue  = context.cls;
  commentData.replyData.replyId = classValue;
};

var setText = function(commentData, context){
  var classValue  = context.cls;
  commentData.replyData.text = classValue;
};
var setTimestampAndSaveCommentReply = function(commentData, context){
  var classValue  = context.cls;
  commentData.replyData.timestamp = classValue;
  // we clean the data of comment for precaution
  commentData.comment = {};
  saveCommentReply(commentData);
};


var setStrategy = {
  'author'            : setAuthor,
  'changefrom'        : setChangeFrom,
  'changeto'          : setChangeTo,
  'commentid'         : setCommentid,
  'name'              : setName,
  'replyid'           : setReplyid,
  'text'              : setText,
  'timestamp'         : setTimestampAndSaveCommentReply,
  'comment-text'      : setDataTextAndSaveData,
  'comment-name'      : setDataName,
  'comment-author'    : setDataAuthor,
  'comment-timestamp' : setDataTimestamp,
};

var commentData;

var collectContentPre = function(hook, context){
  var comment = /(?:^| )(c-[A-Za-z0-9]*)/.exec(context.cls);
  var tagName = context.tname;

  if(comment && comment[1] && tagName === "span"){ // we need to check if it is a span because the comment reply key matches with the regex c-...
    context.cc.doAttrib(context.state, "comment::" + comment[1]);
    context.state.commentId = {};
    context.state.commentId = comment[1]; // keep the comment id to use afterwards
    commentData = pad.plugins.ep_comments_page.getCommentData();
    commentData.replyData = {};
  }

  if (isCommentTag(tagName) || isCommentReplyTag(tagName)){
    setStrategy[tagName](commentData, context);
  }

};

// Just for precaution we clean the variables used to build a comment
var collectContentPost = function(hook, context){
  var comment = /(?:^| )(c-[A-Za-z0-9]*)/.exec(context.cls);
  if(comment && comment[1]){
    context.state.commentId = {};
  }
};

var isCommentReplyTag = function (tagName) {
  var attribIndex = _.indexOf(commentReplyTags, tagName);
  return attribIndex >= 0;
};

var isCommentTag = function  (tagName) {
  var attribIndex = _.indexOf(commentTags, tagName);
  return attribIndex >= 0;
};

var saveCommentReply = function(data){
  pad.plugins.ep_comments_page.saveCommentReplies(data);
};

var saveComment = function (context, commentData) {
  commentData.comment.commentId = context.state.commentId;
  pad.plugins.ep_comments_page.saveCommentWithoutSelection(commentData);
};

var unescapeClassName = function (classValueEncoded) {
  // We remove the additional space added in the beginning when the class name was encoded
  return decodeURI(classValueEncoded).substr(1);
}

exports.collectContentPre = collectContentPre;
exports.collectContentPost = collectContentPost;
exports.commentTags = commentTags;
exports.commentReplyTags = commentReplyTags;
