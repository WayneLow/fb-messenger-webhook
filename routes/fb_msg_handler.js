'use strict'

const
  config = require('config'),
  redis_chat = require('../models/redis_client'),
  watson_chat = require('../models/watson_conversation'),
  FB_SEND_MSG = require('./fb_send_msg');


// URL where the app is running (include protocol). Used to point to scripts and 
// assets located at this address. 
const SERVER_URL = (process.env.SERVER_URL) ?
  (process.env.SERVER_URL) :
  config.get('serverURL');


var hist_flag = "";

/*
 * Received Message Parser
 *
 */
exports.receivedMessage = function (senderID, recipientID, timeOfMessage, message) {
  var isEcho = message.is_echo;
  var messageId = message.mid;
  var appId = message.app_id;
  var metadata = message.metadata;

  // You may get a text or attachment but not both
  var messageText = message.text;
  var messageAttachments = message.attachments;
  var quickReply = message.quick_reply;

  if (isEcho) {
    // Just logging message echoes to console
    console.log("Received echo for message %s and app %d with metadata %s", 
      messageId, appId, metadata);
    return;
  }
  else if (quickReply) {
    var quickReplyPayload = quickReply.payload;
    console.log("Quick reply for message %s with payload %s",
      messageId, quickReplyPayload);

    quickReplyMessage_Handler(senderID, quickReplyPayload);
    return;
  }

  if (messageText) {
    textMessage_Handler(senderID, messageText);
  }
  else if (messageAttachments) {
    attachmentMessage_Handler(senderID, messageAttachments);
  }
}


/*
 * Received Postback Message Parser & Handler
 *
 */
exports.receivedPostback = function (senderID, recipeintID, timeOfPostback, payload) {
    var text = "";
    if (payload == "GET_STARTED_PAYLOAD"){
      text = "Welcome to Pavilion, my name is Julie. I'm a virtual concierge assistance. Please tap on my asist function so I can help you.";
      FB_SEND_MSG.sendQuickReply(senderID,text,welcomeGenerator());
    }
    else {
      FB_SEND_MSG.sendTextMessage(senderID, "Message from receivedPostBack");
    }
}


function quickReplyMessage_Handler(senderID, payload) {
    switch(payload) {
        case 'B_BROADBAND':
          FB_SEND_MSG.sendQuickReply(senderID,"Please select a plan",list_broadband);
          break;
        case 'B_POSTPAID':
          FB_SEND_MSG.sendQuickReply(senderID,"Please select a plan",list_postpaid);
          break;
        case 'B_CONFIRM':
          FB_SEND_MSG.sendTextMessage(senderID, "Thank you for signing up with us.");
          break;
        default:
            textMessage_Handler(senderID, payload);
            break;
    }
}


function textMessage_Handler(senderID, messageText) {
    redis_chat.GET("chat:"+senderID, function(err, object) {
        if (err) {
            console.error(err);
            return;
        }

        if (hist_flag == "NETWORK_COVERAGE_NEW_LOCATION"){
          hist_flag = "";
          var context = JSON.parse(object)
          var address = messageText;
          //Call api to check network coverage
          FB_SEND_MSG.sendTextMessage(
            senderID, 
            "It is under the coverage of " + context.PRODUCT_ENQ[context.PRODUCT_ENQ.length - 1]);

          call_for_action(senderID, context['PRODUCT_ENQ'][context.PRODUCT_ENQ.length - 1]);
          return;
        }

        console.log("This is object retrieve from redis");
        console.log(JSON.parse(object));

        if(object == null){
            object = JSON.stringify({
                "PRODUCT_A": "",
                "PRODUCT_B": "",
                "PRODUCT_A_CATE": "",
                "PRODUCT_B_CATE": "",
                "PRODUCT_ENQ": [],
                "PRODUCT_ENQ_CATE": [],
                "PRODUCT_CFA": "",
                "RECOMM_PRODUCT_CATE": "",
                "USAGE": ""
            });
        }

        // Send to Watson Conversation to Analyze the Speech intent
        // Callback the processResponse get the intent or replied messages
        watson_chat.analyzeChat(
            messageText, 
            JSON.parse(object),  
            function (err, response) {
                processResponse(err, response, senderID);
            }
        );
    });
}


function attachmentMessage_Handler(senderID, messageAttachments) {
    FB_SEND_MSG.sendTextMessage(senderID, "Received Attachements");
}


// Process the conversation response.
function processResponse(err, response, senderID) {
  if (err) {
    console.error(err); // something went wrong
    return;
  }
  
  // If an intent was detected, log it out to the console.
  if (response.intents.length > 0) {
    console.log('Detected intent: #' + response.intents[0].intent);
  }

  //var chat_intent = response.intents[0].intent;
  var chat_context = response.context;
  console.log("This is response from watson");
  console.log(response);



  // Display the output from dialog, if any.
  if (response.output.text.length != 0) {
    console.log("Mesage from WATSON: " + response.output.text[0]);
    switch(response.output.text[0]) {
      case 'W_PRODUCT_ENQUIRY':
        var product = chat_context['PRODUCT_ENQ'][chat_context.PRODUCT_ENQ.length - 1];
        FB_SEND_MSG.sendTextMessage(senderID, product_catalogue[product]['description']);

        delete chat_context['product'];
        break;
      case 'W_PRODUCT_OUT_OF_BOUND':
        FB_SEND_MSG.sendQuickReply(
          senderID,
          "The product you key-in is not available. Which category are you looking at?",product_category);
        delete chat_context['product'];
        break;
      case 'W_PRODUCT_COMPARE':
        var productA = chat_context['PRODUCT_A'];
        var productB = chat_context['PRODUCT_B'];
        var temp = "Comparing " + productA + " with " + productB + "\n\n" +
          "E.g. With MaxisOne Home 30Mbps, you will get free wireless DECT phone and unlimited voice calls to all mobile and landlines. \
          \n\nWith MaxisOne Home Lite 30Mbps, we don't provide wireless DECT phone and voice call is at 9 cents per minute to all landlines and mobile networks."
        FB_SEND_MSG.sendTextMessage(senderID, temp);

        chat_context['PRODUCT_A'] = "";
        chat_context['PRODUCT_B'] = "";
        break;
      case 'W_BROADBAND_RECOMM_ENGINE':
        var usage = chat_context['USAGE'];
        if (usage == "HIGH") {
          FB_SEND_MSG.sendTextMessage(
            senderID, 
            "To suit your needs, the minimal required speed is 30Mbps");
        }
        else if (usage == "LOW") {
          FB_SEND_MSG.sendTextMessage(
            senderID, 
            "Your usage is consider low, you can freely  \
            select the plans according to your budget");
        }

        chat_context['RECOMM_PRODUCT_CATE']="";
        chat_context['USAGE']="";
        call_for_action(senderID, chat_context['PRODUCT_ENQ'][chat_context.PRODUCT_ENQ.length - 1]);
        break;
      case 'W_NETWORK_COVERAGE':
        var verify_address = "Are you refering to your current billing address? \
          \nNo3, Jalan Gembira, Taman Malaysia, 56100 Kuala Lumpur"
        FB_SEND_MSG.sendTextMessage(senderID, verify_address);
        break;
      case 'W_NETWORK_COVERAGE_OLD_LOCATION':
        var no_covered = "I'm sorry to inform you that currently your location do not have coverage of " +
        chat_context['PRODUCT_ENQ'][chat_context.PRODUCT_ENQ.length - 1];
        FB_SEND_MSG.sendTextMessage(senderID, no_covered);
        break;
      case 'W_NETWORK_COVERAGE_NEW_LOCATION':
        hist_flag = 'NETWORK_COVERAGE_NEW_LOCATION';
        var question = "Please insert the addresss intended."
        FB_SEND_MSG.sendTextMessage(senderID, question);
        break;
      case 'W_NETWORK_CONSISTENCY':
        var assure = "Maxis assures the consistency of the speed because our infrastructure support redundant fibre connectivity\
        \n\nIt means if one fibre connection broke, there are extra backup fibre connections to ensure you are conneced 24/7.";
        FB_SEND_MSG.sendTextMessage(senderID, assure);

        call_for_action(senderID, chat_context['PRODUCT_ENQ'][chat_context.PRODUCT_ENQ.length - 1]);
        break;
      case 'W_VERIFY_SIM_DELIVERY':
        var message = "Thank you for considering our " + chat_context['PRODUCT_CFA'] +
        ". \ \n\nDo you want me to send the SIM card over to your billing address?";
        FB_SEND_MSG.sendTextMessage(senderID, message);
        break;
      case 'W_CLOSE_SALES':
        var product = chat_context['PRODUCT_CFA'];
        var button = [
          {
            "content_type": "text",
            "title": "Confirm",
            "payload": "B_CONFIRM"
          }
        ]

        FB_SEND_MSG.sendQuickReply(
          senderID,
          "Please press the CONFIRM button for final confirmation if you agree to sign up for "+ product,
          button);

        chat_context["PRODUCT_CFA"]="";
        break;
      case 'W_BROADBAND_INSTALL_DATE':
        // Get date and time from context and check for availability
        var message = "Sorry, the date is currently fully book. \
        \n\nI will pass the conversation to our live agent";
        FB_SEND_MSG.sendTextMessage(senderID, message);

        break;
      default:
        if (response.output.text.length == 2){
          FB_SEND_MSG.sendTextMessage(senderID, response.output.text[0] + '\n\n' + response.output.text[1]);
        }
        else {
          FB_SEND_MSG.sendTextMessage(senderID, response.output.text[0]);
        }
    }
  }

  // Update redis on the chat context for future references
  redis_chat.SET("chat:"+senderID, JSON.stringify(chat_context));
}

function call_for_action(senderID, product) {
    redis_chat.GET("chat:"+senderID, function(err, object) {
        if (err) {
            console.error(err);
            return;
        }

        // Send to Watson Conversation to Analyze the Speech intent
        // Callback the processResponse get the intent or replied messages
        watson_chat.analyzeChat(
            "call for action " + product, 
            JSON.parse(object),  
            function (err, response) {
                processResponse(err, response, senderID);
            }
        );
    });
}

var product_category = [
  {
    "content_type": "text",
    "title": "Broadband",
    "payload": "B_BROADBAND"
  },
  {
    "content_type": "text",
    "title": "Postpaid",
    "payload": "B_POSTPAID"
  }
];

var list_postpaid = [
  {
    "content_type": "text",
    "title": "MaxisOne Plan 98",
    "payload": "MaxisOne Plan 98"
  },
  {
    "content_type": "text",
    "title": "MaxisOne Plan 128",
    "payload": "MaxisOne Plan 128"
  },
  {
    "content_type": "text",
    "title": "MaxisOne Plan 158",
    "payload": "MaxisOne Plan 158"
  },
  {
    "content_type": "text",
    "title": "MaxisOne Plan 188",
    "payload": "MaxisOne Plan 188"
  },
  {
    "content_type": "text",
    "title": "MaxisOne Share Line",
    "payload": "MaxisOne Share Line"
  }
];

var list_broadband = [
  {
    "content_type": "text",
    "title": "Home 10Mbps",
    "payload": "MaxisOne Home 10Mbps"
  },
  {
    "content_type": "text",
    "title": "Home 30Mbps",
    "payload": "MaxisOne Home 30Mbps"
  },
  {
    "content_type": "text",
    "title": "Home Lite 30Mbps",
    "payload": "MaxisOne Home Lite 30Mbps"
  },
  {
    "content_type": "text",
    "title": "Home 50Mbps",
    "payload": "MaxisOne Home 50Mbps"
  },
  {
    "content_type": "text",
    "title": "Home 100Mbps",
    "payload": "MaxisOne Home 100Mbps"
  }
];

var product_catalogue = {
  "MaxisOne Share Line": {
    "description":
      "Enjoy MaxisOne Share Line with \
      \n-5GB Data \
      \n-Free 5GB for Video Streaming \
      \n-Unlimited calls and sms \
      \n\nThe package is RM48 per month"
  },
  "MaxisOne Plan 98": {
    "description": 
      "With MaxisOne Plan 98, you get \
      \n-10GB of All day Data \
      \n-10GB of Weekend Data \
      \n-Unlimited calls and sms \
      \n\nThe package is RM98 per month"
  },
  "MaxisOne Plan 128": {
    "description": 
      "With MaxisOne Plan 128, you get \
      \n-15GB of All day Data \
      \n-15GB of Weekend Data \
      \n-Unlimited calls and sms \
      \n\nThe package is RM128 per month"
  },
  "MaxisOne Plan 158": {
    "description": 
      "With MaxisOne Plan 158, you get \
      \n-20GB of All day Data \
      \n-20GB of Weekend Data \
      \n-Unlimited calls and sms \
      \n\nThe package is RM158 per month"
  },
  "MaxisOne Plan 188": {
    "description": 
      "With MaxisOne Plan 188, you get \
      \n-25GB of All day Data \
      \n-25GB of Weekend Data \
      \n-Unlimited calls and sms \
      \n\nThe package is RM188 per month"
  },
  "MaxisOne Home 10Mbps": {
    "description":
      "With MaxisOne Home 10Mbps, you can enjoy up to 10Mbps fibre broadband and unlimited home\
      entertainment in every corner of your home \
      \n\nThe package include: \
      \n-Unlimited voice calls to all mobile and landlines \
      \n-Free DECT phone \
      \n\nThe package is RM139 per month \
      \nGet ONE month free if you register now"
  },
  "MaxisOne Home 30Mbps": {
    "description":
      "With MaxisOne Home 30Mbps, you can enjoy up to 30Mbps fibre broadband and unlimited home\
      entertainment in every corner of your home \
      \n\nThe package include: \
      \n-Unlimited iflix access \
      \n-Maxperts consultation with end-to-end-setup \
      \n-Unlimited voice calls to all mobile and landlines \
      \n-Free DECT phone \
      \n\nThe package is RM179 per month \
      \nGet ONE month free if you register now"
  },
  "MaxisOne Home Lite 30Mbps": {
    "description":
      "With MaxisOne Home 30Mbps, you can enjoy up to 30Mbps fibre broadband and unlimited home\
      entertainment in every corner of your home \
      \n\nThe package include: \
      \n-Unlimited iflix access \
      \n-Maxperts consultation with end-to-end-setup \
      \n-Voice calls is at 9cents per minute to all mobile and landlines \
      \n\nThe package is RM179 per month \
      \nGet ONE month free if you register now"
  },
  "MaxisOne Home 50Mbps": {
    "description":
      "With MaxisOne Home 50Mbps, you can enjoy up to 50Mbps fibre broadband and unlimited home\
      entertainment in every corner of your home \
      \n\nThe package include: \
      \n-Unlimited iflix access \
      \n-Maxperts consultation with end-to-end-setup \
      \n-Unlimited voice calls to all mobile and landlines \
      \n-Free DECT phone \
      \n\nThe package is RM219 per month \
      \nGet ONE month free if you register now"
  },
  "MaxisOne Home 100Mbps": {
    "description":
      "With MaxisOne Home 100Mbps, you can enjoy up to 100Mbps fibre broadband and unlimited home\
      entertainment in every corner of your home \
      \n\nThe package include: \
      \n- Unlimited iflix access \
      \n-Maxperts consultation with end-to-end-setup \
      \n-Unlimited voice calls to all mobile and landlines \
      \n-Free DECT phone \
      \n\nThe package is RM299 per month \
      \nGet ONE month free if you register now"
  }
};
