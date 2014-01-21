chathistory = new Meteor.Collection("chat");

adminUser = function(userId) {
    var adminUser = Meteor.users.findOne({
        username : "admin"
    });
    return (userId && adminUser && userId === adminUser._id);
};

adminUserLoggedIn = function() {
    return adminUser(Meteor.userId());
};

userLoggedIn = function() {
    return Meteor.userId() != null;
};

permittedToInsertChat = function(doc) {
    return userLoggedIn();
};

permittedToUpdateChat = function(doc) {
    return false;
};

permittedToRemoveChat = function(doc) {
    return adminUserLoggedIn();
};

chathistory.allow({
    insert: function (userId, doc) {
        return permittedToInsertChat(doc);
    },
    update: function (userId, doc, fields, modifier) {
        return permittedToUpdateChat(doc);
    },
    remove: function (userId, doc, fields, modifier) {
        return permittedToRemoveChat(doc);
    } 
});

if (Meteor.isClient) {

    getUserName = function(userId) {
        return Meteor.users.findOne({_id: userId}).username;
    };
    
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
    };
    
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
    
    Template.chathistory.permittedToInsertChat = function() {
        return permittedToInsertChat();
    };
    
    Template.chathistory.permittedToRemoveChat = function(id) {
        return permittedToRemoveChat();
    };
    
    Template.chathistory.permittedToUpdateChat = function(id) {
        return permittedToUpdateChat();
    };
    
    Template.chathistory.deletingEntry = function(entryId) {
        return Session.equals('deletingEntryId', entryId);
    };
    
    Template.chathistory.events({
        'click .chat-message': function(e) {
            var id = e.target.getAttribute("data-entry-id");
            Session.set('deletingEntryId', id);
        },
        'click #delete-entry': function(e) {
            var id = e.target.getAttribute("data-entry-id");
            chathistory.remove({_id: id});
        }
    });
  
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
