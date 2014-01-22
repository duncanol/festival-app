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

CalendarFunctions = {
    formatTime: function(date) {
       return date.toTimeString().substring(0, 5);
    },
    formatDate: function(date) {
        return date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear() + " " + 
        date.getHours() + ":" + (date.getMinutes() < 10 ? "0" : "") + "" + date.getMinutes();
    }
};

if (Meteor.isClient) {

    getUserName = function(userId) {
        var user = Meteor.users.findOne({_id: userId});
        
        if (user != null) {
            return user.username;
        }
        return "anon";
    };
    
    Accounts.ui.config({
        passwordSignupFields: 'USERNAME_AND_OPTIONAL_EMAIL'
    });
    
    var tagByCategory = function(category) {
        var tags = this.tags;
        
        if (tags === undefined) {
            return 'unknown'; 
        }

        for (var i = 0; i < tags.length; i++) {
            if (tags[i].category == category) {
                return tags[i].tag;
            }
        }
        return null;
    };
    
    var transformChat = function(doc) {
        doc.username = getUserName(doc.author);
        doc.formattedDate = CalendarFunctions.formatDate(doc.date);
        doc.tagByCategory = tagByCategory;
        return doc;
    };
    
    Template.chathistory.messages = function() {
        return chathistory.find({}, {limit: 10, sort: {"date": "desc"}, transform: transformChat});
    };
    
    Template.chathistory.events({
        'click .chat-text-submit': function(e) {
            var text = document.getElementById('chat-text').value;
            var tag = e.target.getAttribute('data-tag');
            var category = e.target.getAttribute('data-category');

            if (text.length > 0) {
                chathistory.insert({
                    text: text,
                    author: Meteor.userId(),
                    date: new Date(),
                    tags: [{tag: tag, category: category}]
                });
                e.target.value = "";
            }
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
