describe("Comment copy", function(){
  //create a new pad with comment before each test run
  beforeEach(function(cb){
    helper.newPad(function() {
      createComment(function() {
        // ensure we can delete a comment
        cb();
      });
    });
    this.timeout(60000);
  });

  it("Ensures a comment has the comment and an empty replies tags as a children nodes", function(done) {
    var inner$ = helper.padInner$;
    var $firstTextElement = inner$("div").first();
    var tagNames = getTagsNames($firstTextElement.children().children());
    var expectTags = ["timestamp", "author", "name", "text", "replies"];
    expect(tagNames[0]).to.be(expectTags[0]);
    expect(tagNames[1]).to.be(expectTags[1]);
    expect(tagNames[2]).to.be(expectTags[2]);
    expect(tagNames[3]).to.be(expectTags[3]);
    expect(tagNames[4]).to.be(expectTags[4]);
    done();
  });

  // to simulate a copy and paste operation we append an existent comment
  it("Has two comments with two icons when copying and pasting an existent commentary", function(done){
    var inner$ = helper.padInner$;
    var outer$ = helper.padOuter$;
    var commentId = getCommentId();
    var $firstTextElement = inner$("div").first();

    $firstTextElement.sendkeys("{rightarrow}");
    $firstTextElement.sendkeys("{enter}{enter}");
    helper.waitFor(function(){
      var lines = inner$("div").length;
      return lines === 2;
    }).done(function(){
      var $secondTextElement = inner$("div").last();
      $secondTextElement.append($firstTextElement);
      helper.waitFor(function(){
        // wait to create the new comment
        var $commentIcons = outer$("#commentIcons").children().length;
        return $commentIcons === 2;
      }).done(function(){
        // search for icons with the same commentId
        var $iconsWithThisCommentId = outer$("#commentIcons").children().children(".icon-"+commentId).length;
        // just to ensure we have the same text
        // expect($secondTextElement.text()).to.be("This content will receive a comment\n\n");
        expect($iconsWithThisCommentId).to.be(2);
      }).done(done);
    });
  });

});

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