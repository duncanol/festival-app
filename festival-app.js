chathistory = new Meteor.Collection("chat")

if (Meteor.isClient) {

    Template.chathistory.messages = function() {
        return chathistory.find({});
    }
    
    Template.chathistory.events({
        'keyup #chat-text': function(e) {
            if (e.which === 13) {
                var text = e.target.value;
                chathistory.insert({text: text});
                e.target.value = "";
            }
        },
        'focusout #chat-text': function(e) {
             document.getElementById('chat-text').value = "";
        }
    });
  
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
