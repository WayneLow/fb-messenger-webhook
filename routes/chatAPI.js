'use strict';

const
    config = require('config'),
    redis_chat = require('../models/redis_client'),
    watson_chat = require('../models/watson_conversation'),
    express = require('express'),
    router = express.Router();



var hist_flag = "";

router.post('/', function (req, res) {
	var payload = req.body.data;
	console.log('RAW:', req.body);

	quickReplyMessage_Handler('007', payload, function(output){
    var data = {
      display_name:'Watson',
      msg:output,
      nick:'agent:4487018',
      option:[],
      timestamp:Date.now(),
      type:'chat.msg'
    };

		res.json(data);
	})
});

function quickReplyMessage_Handler(senderID, payload, callback) {
    switch(payload) {
        case 'B_BROADBAND':
          callback("Please select a plan.\nMaxisOne Home 10Mbps\nMaxisOne Home 30Mbps\nMaxisOne Home 50Mbps\nMaxisOne Home 100Mbps");
          break;
        case 'B_POSTPAID':
          callback("Please select a plan.\nMaxisOne Plan 98\nMaxisOne Plan 128\nMaxisOne Plan 158\nMaxisOne Plan 188");
          break;
        case 'B_CONFIRM':
          callback("Thank you for signing up with us.");
          break;
        default:
            textMessage_Handler(senderID, payload, callback);
            break;
    }
}


function textMessage_Handler(senderID, messageText, callback) {
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
          callback(
          	"It is under the coverage of " + context.PRODUCT_ENQ[context.PRODUCT_ENQ.length - 1]
          );

          //call_for_action(senderID, context['PRODUCT_ENQ'][context.PRODUCT_ENQ.length - 1], callback);
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
        console.log('Message to Watson', messageText);
        watson_chat.analyzeChat(
            messageText, 
            JSON.parse(object),  
            function (err, response) {
                processResponse(err, response, senderID, callback);
            }
        );
    });
}

// Process the conversation response.
function processResponse(err, response, senderID, callback) {
  console.log("In Process Response", response);
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
        callback(product_catalogue[product]['description']);

        delete chat_context['product'];
        break;
      case 'W_PRODUCT_OUT_OF_BOUND':
        callback("The product you key-in is not available. Which category are you looking at?B_BROADBAND or B_POSTPAID");
        delete chat_context['product'];
        break;
      case 'W_PRODUCT_COMPARE':
        var productA = chat_context['PRODUCT_A'];
        var productB = chat_context['PRODUCT_B'];
        var temp = "Comparing " + productA + " with " + productB + "\n\n" +
          "E.g. With MaxisOne Home 30Mbps, you will get free wireless DECT phone and unlimited voice calls to all mobile and landlines. \
          \n\nWith MaxisOne Home Lite 30Mbps, we don't provide wireless DECT phone and voice call is at 9 cents per minute to all landlines and mobile networks."
        callback(temp);

        chat_context['PRODUCT_A'] = "";
        chat_context['PRODUCT_B'] = "";
        break;
      case 'W_BROADBAND_RECOMM_ENGINE':
        var usage = chat_context['USAGE'];
        if (usage == "HIGH") {
          callback("To suit your needs, the minimal required speed is 30Mbps");
        }
        else if (usage == "LOW") {
          callback(
            "Your usage is consider low, you can freely  \
            select the plans according to your budget");
        }

        chat_context['RECOMM_PRODUCT_CATE']="";
        chat_context['USAGE']="";
        //call_for_action(senderID, chat_context['PRODUCT_ENQ'][chat_context.PRODUCT_ENQ.length - 1], callback);
        break;
      case 'W_NETWORK_COVERAGE':
        var verify_address = "Are you refering to your current billing address? \
          \nNo3, Jalan Gembira, Taman Malaysia, 56100 Kuala Lumpur"
        callback(verify_address);
        break;
      case 'W_NETWORK_COVERAGE_OLD_LOCATION':
        var no_covered = "I'm sorry to inform you that currently your location do not have coverage of " +
        chat_context['PRODUCT_ENQ'][chat_context.PRODUCT_ENQ.length - 1];
        callback(no_covered);
        break;
      case 'W_NETWORK_COVERAGE_NEW_LOCATION':
        hist_flag = 'NETWORK_COVERAGE_NEW_LOCATION';
        var question = "Please insert the addresss intended."
        callback(question);
        break;
      case 'W_NETWORK_CONSISTENCY':
        var assure = "Maxis assures the consistency of the speed because our infrastructure support redundant fibre connectivity\
        \n\nIt means if one fibre connection broke, there are extra backup fibre connections to ensure you are conneced 24/7.";
        callback(assure);

        //call_for_action(senderID, chat_context['PRODUCT_ENQ'][chat_context.PRODUCT_ENQ.length - 1], callback);
        break;
      case 'W_VERIFY_SIM_DELIVERY':
        var message = "Thank you for considering our " + chat_context['PRODUCT_CFA'] +
        ". \ \n\nDo you want me to send the SIM card over to your billing address?";
        callback(message);
        break;
      case 'W_CLOSE_SALES':
        var product = chat_context['PRODUCT_CFA'];
        callback("Please type the B_CONFIRM button for final confirmation if you agree to sign up for "+ product);
        chat_context["PRODUCT_CFA"]="";
        break;
      case 'W_BROADBAND_INSTALL_DATE':
        // Get date and time from context and check for availability
        var message = "Sorry, the date is currently fully book. \
        \n\nI will pass the conversation to our live agent";
        callback(message);

        break;
      default:
        if (response.output.text.length == 2){
          callback(response.output.text[0] + '\n\n' + response.output.text[1]);
        }
        else {
          callback(response.output.text[0]);
        }
    }
  }

  // Update redis on the chat context for future references
  redis_chat.SET("chat:"+senderID, JSON.stringify(chat_context));
}

function call_for_action(senderID, product, callback) {
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
                processResponse(err, response, senderID, callback);
            }
        );
    });
}

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

module.exports = router;
