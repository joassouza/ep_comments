describe("Comment reply copy", function(){
  //create a new pad with comment before each test run
  beforeEach(function(cb){
    helper.newPad(function() {
      createComment(function() {
        createReply(false, function(){
          ensureReplyTagWasCreatedOnHTML(function(){
            cb();
          })
          // ensure we can delete a comment
        });
      });
    });
    this.timeout(60000);
  });

  it("creates a reply tag inside of the comment", function(done) {
    var inner$ = helper.padInner$;
    var  $firstTextElement = inner$("div").first();
    var hasTagReply = $firstTextElement.find("reply").length === 1;
    expect(hasTagReply).to.be(true);
    done();
  });

  it("creates the replies tags", function(done){
    var inner$ = helper.padInner$;
    var  $firstTextElement = inner$("div").first();
    var replyTags = $firstTextElement.find("reply").children();
    // nodeName returns the tag name uppercased
    var expectedTags = ["AUTHOR", "CHANGEFROM", "CHANGETO", "COMMENTID", "NAME", "REPLYID", "TEXT", "TIMESTAMP"];
    expect(replyTags[0].nodeName).to.be(expectedTags[0]);
    expect(replyTags[1].nodeName).to.be(expectedTags[1]);
    expect(replyTags[2].nodeName).to.be(expectedTags[2]);
    expect(replyTags[3].nodeName).to.be(expectedTags[3]);
    expect(replyTags[4].nodeName).to.be(expectedTags[4]);
    expect(replyTags[5].nodeName).to.be(expectedTags[5]);
    expect(replyTags[6].nodeName).to.be(expectedTags[6]);
    expect(replyTags[7].nodeName).to.be(expectedTags[7]);
    done();
  });

  context("when it has two replies in a same comment", function(){

    beforeEach(function(cb){
      createReply(false, function(){
        ensureReplyTagWasCreatedOnHTML(function(){
          cb();
        });
      });
    });

    it("creates two replies tags side by side", function(done){
      var inner$ = helper.padInner$;
      var $firstTextElement = inner$("div").first();
      var secondReplyTag = $firstTextElement.find("reply").first().siblings().length === 1;
      expect(secondReplyTag).to.be(true);
      done();
    });

  });

  context("when copy and paste a comment with comment reply", function(){
    //create a line
    //paste the first line
    beforeEach(function(cb){
      createNewLine(function(){
        copyAndPasteFirstLine(function(){
          cb();
        });
      });
    });

    it("creates a new comment with a comment reply", function(done){
      var inner$ = helper.padInner$;
      var $secondTextElement = inner$("div").last();
      var hasTagReply = $secondTextElement.find("reply").length === 1;
      expect(hasTagReply).to.be(true);
      done();
    });

    it("has a reply icon",function(done){
      var outer$ = helper.padOuter$;
      helper.waitFor(function(){
        var $commentIcons = outer$("#commentIcons").children();
        return $commentIcons.length === 2;
      }).done(function(){
        setTimeout(function() {
        var $commentReplyIcons = outer$("#commentIcons").children().children(".with-reply");
        expect($commentReplyIcons.length).to.be(2);
        done();
        }, 300);
      });
    });
  });

});

var createNewLine = function(callback){
  var inner$ = helper.padInner$;
  var $firstTextElement = inner$("div").first();

  $firstTextElement.sendkeys("{rightarrow}");
  $firstTextElement.sendkeys("{enter}{enter}");
  helper.waitFor(function(){
    var lines = inner$("div").length;
    return lines === 2;
  }).done(callback);
}

var copyAndPasteFirstLine = function(callback){
  var inner$ = helper.padInner$;
  var $firstTextElement = inner$("div").first();
  var $secondTextElement = inner$("div").last();
  // Hack to avoid problem with updated id, if we try to append the
  // $firstTextElment directly stuff get messy =\
  var $firsTextElementClone = $firstTextElement.clone();
  $secondTextElement.append($firsTextElementClone);

  helper.waitFor(function(){
    var $secondTextElement = inner$("div").last();
    return $secondTextElement.text() == "This content will receive a comment";
  }).done(callback);
}

function createComment(callback) {
  var inner$ = helper.padInner$;
  var outer$ = helper.padOuter$;
  var chrome$ = helper.padChrome$;

  // get the first text element out of the inner iframe
  var $firstTextElement = inner$("div").first();

  // simulate key presses to delete content
  $firstTextElement.sendkeys('{selectall}'); // select all
  $firstTextElement.sendkeys('{del}'); // clear the first line
  $firstTextElement.sendkeys('This content will receive a comment'); // insert text

  // get the comment button and click it
  $firstTextElement.sendkeys('{selectall}'); // needs to select content to add comment to
  var $commentButton = chrome$(".addComment");
  $commentButton.click();

  // fill the comment form and submit it
  var $commentField = outer$("textarea.comment-content");
  $commentField.val("My comment");
  var $hasSuggestion = outer$("#suggestion-checkbox");
  $hasSuggestion.click();
  var $suggestionField = outer$("textarea.comment-suggest-to");
  $suggestionField.val("Change to this suggestion");
  var $submittButton = outer$("input[type=submit]");
  $submittButton.click();

  // wait until comment is created and comment id is set
  helper.waitFor(function() {
    return getCommentId() !== null;
  })
  .done(callback);
}

var createReply = function(withSuggestion, callback){
  var outer$ = helper.padOuter$;
  var commentId = getCommentId();
  var existingReplies = outer$(".sidebar-comment-reply").length;

  // if comment icons are enabled, make sure we display the comment box:
  if (commentIconsEnabled()) {
    // click on the icon
    var $commentIcon = outer$("#commentIcons #icon-"+commentId).first();
    $commentIcon.click();
  }

  // fill reply field
  var $replyField = outer$(".comment-reply-input");
  $replyField.val("My reply");

  // fill suggestion
  if (withSuggestion) {
    // show suggestion field
    var $replySuggestionCheckbox = outer$(".reply-suggestion-checkbox");
    $replySuggestionCheckbox.click();

    // fill suggestion field
    var $suggestionField = outer$("textarea.reply-comment-suggest-to");
    $suggestionField.val("My suggestion");
  }

  // submit reply
  var $submitReplyButton = outer$("form.comment-reply input[type='submit']").first();
  $submitReplyButton.click();

  // wait for the reply to be saved
  helper.waitFor(function() {
    return outer$(".sidebar-comment-reply").length === existingReplies + 1;
  })
  .done(callback);
}

var ensureReplyTagWasCreatedOnHTML = function(cb){
  var inner$ = helper.padInner$;
  var $firstTextElement = inner$("div").first();
  var repliesChildrenOriginal =  $firstTextElement.find("replies").children().length;
  var expectedChildren = repliesChildrenOriginal + 1;
  // we have to wait to create a reply node
  helper.waitFor(function(){
    $firstTextElement = inner$("div").first();
    var repliesChildren =  $firstTextElement.find("replies").children().length;
    return repliesChildren === expectedChildren;
  }).done(cb);
}

var commentIconsEnabled = function() {
  return helper.padOuter$("#commentIcons").length > 0;
}

function getCommentId() {
  var inner$ = helper.padInner$;
  var comment = inner$(".comment").first();
  var cls = comment.attr('class');
  var classCommentId = /(?:^| )(c-[A-Za-z0-9]*)/.exec(cls);
  var commentId = (classCommentId) ? classCommentId[1] : null;

  return commentId;
}

function getTagsNames(tagNames) {
  var tags = _.map(tagNames, function(tagName){
    var tag = /<comment-([A-Za-z]*) .*/.exec(tagName.outerHTML);
    if (tag === null){
      tag = /<(replies)><\/replies>/.exec(tagName.outerHTML);
    }
    return tag[1];
  });
  return tags;
}