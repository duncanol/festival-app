chathistory = new Meteor.Collection("chat")

if (Meteor.isClient) {

    getUserName = function(userId) {
        return Meteor.users.findOne({_id: userId}).username;
    }
    
    Accounts.ui.config({
        passwordSignupFields: 'USERNAME_AND_OPTIONAL_EMAIL'
    });
    
    Template.chathistory.messages = function() {
        var chatItems = chathistory.find({}).fetch();
        
        for (var i = 0; i < chatItems.length; i++) {
            if (chatItems[i].author != null) {
                chatItems[i].username = getUserName(chatItems[i].author);
            } else {
                chatItems[i].username = 'anon';
            }
        }
        
        return chatItems;
    }
    
    Template.chathistory.events({
        'keyup #chat-text': function(e) {
            if (e.which === 13) {
                var text = e.target.value;
                chathistory.insert({
                    text: text,
                    author: Meteor.userId()
                });
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
