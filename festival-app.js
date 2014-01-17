chathistory = new Meteor.Collection("chat")

if (Meteor.isClient) {

    Template.chathistory.messages = function() {
        return chathistory.find({});
    }
  
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
