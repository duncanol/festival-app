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
    return true;
};

permittedToUpdateChat = function(doc) {
    return false;
};

permittedToRemoveChat = function(doc) {
    return adminUserLoggedIn();
};

permittedToSeeFullChats = function(doc) {
    return userLoggedIn();
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

var pad2 = function(number) {
    return (number < 10 ? "0" : "") + number;
};

CalendarFunctions = {
    formatTime: function(date) {
       return date.toTimeString().substring(0, 5);
    },
    
    formatDate: function(date) {
        return pad2(date.getDate()) + "/" + pad2(date.getMonth() + 1) + "/" + date.getFullYear() + " " + pad2(date.getHours()) + ":" + pad2(date.getMinutes());
    }
};

if (Meteor.isClient) {

    var getTagCountsByQuery = function(messageQuery) {
        
        // TODO replace with group aggregation function e.g. 
        //db.records.group( {
        //    key: { a: 1 },
        //    cond: { a: { $lt: 3 } },
        //    reduce: function(cur, result) { result.count += cur.count },
        //   initial: { count: 0 }
        // } )
        
        var messages = chathistory.find(messageQuery).fetch();
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
        
        numericArray.sort(function(tag1, tag2) {
            return tag2.count - tag1.count;
        });
        
        Session.set('topTag', numericArray[0]);
        return numericArray;
    };
    
    var getTagCounts = function() {
        return getTagCountsByQuery({});
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
                
                var newMessage = {
                    text: text,
                    date: new Date(),
                    tags: [{tag: tag, category: category}]
                };
                
                if (userLoggedIn()) {
                    newMessage.authorId = Meteor.userId();
                    newMessage.authorUsername = Meteor.user().username;
                } else {
                    newMessage.authorUsername = "anon";
                }
                
                chathistory.insert(newMessage);
                textfield.value = "";
            }
        }
    });
    
    Template.chatcontrol.permittedToInsertChat = function() {
        return permittedToInsertChat();
    };
    
    Template.chatcontrol.permittedToSeeFullChats = function() {
        return permittedToSeeFullChats();
    };
    
    var transformChat = function(doc) {
        doc.formattedDate = CalendarFunctions.formatDate(doc.date);
        doc.tagByCategory = tagByCategory;
        return doc;
    };

    Template.chathistory.mainTags = [{tag: 'happy'}, {tag: 'sad'}, {tag: 'bored'}];
    
    var createDateMessageQuery = function(date) {
    	var startOfDay = new Date(date.getTime());
    	startOfDay.setHours(0, 0, 0, 0);
    	var endOfDay = new Date(startOfDay.getTime() + (24 * 60 * 60 * 1000));
    	
    	return {
    		'date': {$gte: startOfDay, $lt: endOfDay}
    	};
    };
    
    var createTagQuery = function(tag) {
    	return {"tags.tag": tag};
    };
    
    var merge = function(objects) {
    	var fullObject = {};
    	
    	for (var i = 0; i < objects.length; i++) {
    		for (var field in objects[i]) {
        		fullObject[field] = objects[i][field];
        	}
    	}
    	
    	return fullObject;
    };

    var getMessagesByDateAndTagQuery = function(date, tag) {
    	var dateQuery = createDateMessageQuery(new Date());
    	var tagQuery = createTagQuery(tag);
    	var fullQuery = merge([dateQuery, tagQuery]);
    	return fullQuery;
    };
    
    Template.chathistory.messages = function(tag) {
    	var query = getMessagesByDateAndTagQuery(new Date(), tag);
        return chathistory.find(query, {limit: 10, sort: {"date": "desc"}, transform: transformChat});
    };

    Template.chathistory.messagesCount = function(tag) {
    	var query = getMessagesByDateAndTagQuery(new Date(), tag);
        return chathistory.find(query).count();
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
  
    Template.totalchatstats.tags = function() {
        return getTagCounts();
    };
    
    Template.todaychatstats.tags = function() {
        return getTagCountsByQuery(createDateMessageQuery(new Date()));
    };
    
    Template.topchat.topTag = function() {
        return Session.get('topTag');
    };
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
