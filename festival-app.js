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
        return date.getDate() + "/" + (date.getMonth() < 9 ? "0" : "") + (date.getMonth() + 1) + "/" + date.getFullYear() + " " + 
        date.getHours() + ":" + (date.getMinutes() < 10 ? "0" : "") + "" + date.getMinutes();
    }
};

if (Meteor.isClient) {

    var getTagCounts = function() {
        
        // TODO replace with group aggregation function e.g. 
        //db.records.group( {
        //    key: { a: 1 },
        //    cond: { a: { $lt: 3 } },
        //    reduce: function(cur, result) { result.count += cur.count },
        //   initial: { count: 0 }
        // } )
        
        var messages = chathistory.find({}).fetch();
        var tagCounts = {};
        
        for (var i = 0; i < messages.length; i++) {
            var messageTags = messages[i].tags;
            for (var j = 0; j < messageTags.length; j++) {
                var tag = messageTags[j].tag;
                if (tagCounts[tag] == undefined) {
                    tagCounts[tag] = {tag: tag, count: 1};
                } else {
                    tagCounts[tag] = {tag: tag, count: tagCounts[tag].count + 1};
                }
            }
        }
        
        var numericArray = new Array();
        for (var items in tagCounts){
            numericArray.push(tagCounts[items]);
        }
        return numericArray;
    };
    
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
    
    Template.chatcontrol.events({
        'click .chat-text-submit': function(e) {
            var textfield = document.getElementById('chat-text');
            var text = textfield.value;
            var tag = e.target.getAttribute('data-tag');
            var category = e.target.getAttribute('data-category');

            if (text.length > 0) {
                chathistory.insert({
                    text: text,
                    authorId: Meteor.userId(),
                    authorUsername: Meteor.user().username,
                    date: new Date(),
                    tags: [{tag: tag, category: category}]
                });
                textfield.value = "";
            }
        }
    });
    
    Template.chatcontrol.permittedToInsertChat = function() {
        return permittedToInsertChat();
    };
    
    
    var transformChat = function(doc) {
        doc.formattedDate = CalendarFunctions.formatDate(doc.date);
        doc.tagByCategory = tagByCategory;
        return doc;
    };

    Template.chathistory.mainTags = [{tag: 'happy'}, {tag: 'sad'}, {tag: 'bored'}];
    
    Template.chathistory.messages = function(tag) {
        return chathistory.find({"tags.tag": tag}, {limit: 10, sort: {"date": "desc"}, transform: transformChat});
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
  
    Template.chatstats.tags = function() {
        return getTagCounts();
    };
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
