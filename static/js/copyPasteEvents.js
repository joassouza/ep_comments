exports.addTextOnClipboard = function(e, ace, padInner){
  var commentIdOnSelection;
  ace.callWithAce(function(ace) {
    commentIdOnSelection = ace.ace_getCommentIdOnSelection();
  });
  // we check if all the selection is in the same comment, if so, we override the copy behavior
  if (commentIdOnSelection) {
    var range = padInner.contents()[0].getSelection().getRangeAt(0);
    var hiddenDiv = createHiddenDiv(range);
    var html = getHtml(hiddenDiv);
    // when the range selection is fully inside a tag, 'html' will have no HTML tag, so we have to
    // build it. Ex: if we have '<span>ab<b>cdef</b>gh</span>" and user selects 'de', the value of
    //'html' will be 'de', not '<b>de</b>'
    if (selectionHasOnlyText(html, hiddenDiv)) {
      html = buildHtmlToCopy(html, range);
      e.originalEvent.clipboardData.setData('text/copyCommentId', commentIdOnSelection);
    }
    // here we override the default copy behavior
    e.originalEvent.clipboardData.setData('text/html', html);
    e.preventDefault();
  }
};

var createHiddenDiv = function(range){
  var content = range.cloneContents();
  var div = document.createElement("div");
  var hiddenDiv = $(div).html(content);
  return hiddenDiv;
};

var getHtml = function(hiddenDiv){
  return $(hiddenDiv).html();
};

var selectionHasOnlyText = function(html, hiddenDiv){
  var htmlDecoded = htmlDecode(html);
  var text = $(hiddenDiv).text();
  return htmlDecoded === text;
};

var buildHtmlToCopy = function(html, range) {
  // given this html <b><i><u>example</u><i></b>, and user selects part of the text like, "ple"
  // range.commonAncestorContainer is the whole text node "example" and the
  // range.commonAncestorContainer.parentNode is <u>example</u>
  var textNode = range.commonAncestorContainer;
  var innerTag = textNode.parentNode;
  var formattingTags = getTagsInSelection(innerTag);
  var commentTags;
  // this case happens when we got a selection with one or more formatting tag applied to all selection in the same range.
  // For example, <b><i><u>text</u></i></b>
  if(formattingTags.length){
    html =  buildOpenTags(formattingTags) + html + buildCloseTags(formattingTags);
    var parentSpanOfSelection = $(textNode).closest("span");
    // all comment and reply tags, excluding the style tags, which is the last one in the tree
    // <span>
    //  <comment-timestamp></comment-timestamp>
    //  <comment-author></comment-author>
    //  ...
    //  <replies></replies>
    //  <b>
    //    <i>any other formatting tags go inside as well</i>
    //  </b>
    //</span>
    var $commentTags = parentSpanOfSelection.children().last().siblings();
    commentTags = getCommentTagsOuterHtml($commentTags);
  }else{
    // in this case, we have no formatting tags, so the comment and reply tags are in the same level of the text node
    commentTags = getCommentTagsOuterHtml($(textNode).siblings());
  }
  var htmlToCopy = "<span class='comment'>" + commentTags + html + "</span>";
  return htmlToCopy;
};


var buildOpenTags = function(tags){
  var openTags = "";
  tags.forEach(function(tag){
    openTags += "<"+tag+">";
  });
  return openTags;
};

var buildCloseTags = function(tags){
  var closeTags = "";
  var tags = tags.reverse();
  tags.forEach(function(tag){
    closeTags += "</"+tag+">";
  });
  return closeTags;
};

var getTagsInSelection = function(htmlObject){
  var tags = [];
  var tag;
  while($(htmlObject)[0].localName != "span"){
    var html = $(htmlObject).prop('outerHTML');
    var formattingTagRegex = /<(b|i|u|s)>/.exec(html);
    tag = formattingTagRegex ? formattingTagRegex[1] : "";
    tags.push(tag);
    htmlObject = $(htmlObject).parent();
  }
  return tags;
}

var getCommentTagsOuterHtml = function(commentTags){
  var tags = _.reduce(commentTags, function(tag, commentTag){
    return tag + $(commentTag).prop('outerHTML');
  },"");
  return tags;
}

exports.addCommentClasses = function(e){
  var commentId = e.originalEvent.clipboardData.getData('text/copyCommentId');
  var target = e.target;
  if (commentId) {
    // we need to wait the paste process finishes completely, otherwise we will not have the target to add the necessary classes
    setTimeout(function() {
      addCommentClassesOnline(target, commentId);
    }, 0);
  }
};

var addCommentClassesOnline = function (target, commentId) {
  var pastingOnEmptyLine = isEmptyLine(target);
  var targetElement;
  if (pastingOnEmptyLine){
    // that smells bad, I know! when we put a caret to paste the target is a <br> and its parent is a div, then when we paste
    // the div is updated with another id so then it is created a span inside the new div. Even though the div has a new id
    // we keep the reference so we can find by the span created.
    targetElement = $(target).parent().find("span");
  }else{
    targetElement = getTargetOnLineWithContent();
  }
  targetElement.addClass(commentId).addClass('comment');
};


var getTargetOnLineWithContent = function() {
  var padOuter = $('iframe[name="ace_outer"]').contents();
  var padInner = padOuter.find('iframe[name="ace_inner"]').contents();
  var target = padInner.find("span[style='background-color: rgb(255, 250, 205);']");
  return target;
};

// an empty line has only a <br>
var isEmptyLine = function(target) {
  return $(target).is("br");
};

// copied from https://css-tricks.com/snippets/javascript/unescape-html-in-js/
var htmlDecode = function(input) {
  var e = document.createElement('div');
  e.innerHTML = input;
  return e.childNodes.length === 0 ? "" : e.childNodes[0].nodeValue;
};

exports.getCommentIdOnSelection = function() {
  var attributeManager = this.documentAttributeManager;
  var rep = this.rep;
  var selStartAttrib = _.object(attributeManager.getAttributesOnPosition(rep.selStart[0], rep.selStart[1])).comment;
  var selEndAttrib = _.object(attributeManager.getAttributesOnPosition(rep.selEnd[0], rep.selEnd[1] - 1)).comment;
  return selStartAttrib === selEndAttrib ? selStartAttrib : null;
};


