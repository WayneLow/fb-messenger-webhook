'use strict'

const
    config = require('config'),
    Conversation = require('watson-developer-cloud/conversation/v1');


// Conversation username can be retrieved from the IBM Dashboard
const CONVERSATION_USERNAME = (process.env.CONVERSATION_USERNAME) ? 
  process.env.CONVERSATION_USERNAME :
  config.get('conversation_username');

// Conversation password can be retrieved from the IBM Dashboard
const CONVERSATION_PASSWORD = (process.env.CONVERSATION_PASSWORD) ? 
  process.env.CONVERSATION_PASSWORD :
  config.get('conversation_password');

// Conversation workspace id can be retrieved from the IBM Dashboard
const CONVERSATION_WORKSPACE_ID = (process.env.CONVERSATION_WORKSPACE_ID) ? 
  process.env.CONVERSATION_WORKSPACE_ID :
  config.get('conversation_workspace_id');


// Set up Conversation service wrapper.
var conversation = new Conversation({
  username: CONVERSATION_USERNAME,
  password: CONVERSATION_PASSWORD,
  path: { workspace_id: CONVERSATION_WORKSPACE_ID },
  version_date: '2017-04-20'
});


// If we receive a text message
// Use Watson Conversation to process the intention of user
exports.analyzeChat = function(messageText, historical_context, callback) {
    conversation.message({
      workspace_id: CONVERSATION_WORKSPACE_ID,
      alternate_intents: true,
      input: { 'text': messageText },
      context : historical_context,
    },callback);
}

