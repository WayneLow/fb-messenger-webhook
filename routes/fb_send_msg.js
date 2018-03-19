'use strict'

const
    config = require('config'),
    request = require('request'); 


// Generate a page access token for your page from the App Dashboard
const PAGE_ACCESS_TOKEN = (process.env.MESSENGER_PAGE_ACCESS_TOKEN) ?
  (process.env.MESSENGER_PAGE_ACCESS_TOKEN) :
  config.get('pageAccessToken');


/*
 * Send an image using the Send API.
 *
 */
exports.sendImageMessage = function (recipientId, url) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "image",
        payload: {
          url: url
        }
      }
    }
  };

  callSendAPI(messageData);
}


/*
 * Send a Gif using the Send API.
 *
 */
exports.sendGifMessage = function (recipientId, url) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "image",
        payload: {
          url: url
        }
      }
    }
  };

  callSendAPI(messageData);
}


/*
 * Send audio using the Send API.
 *
 */
exports.sendAudioMessage = function (recipientId, url) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "audio",
        payload: {
          url: url
        }
      }
    }
  };

  callSendAPI(messageData);
}


/*
 * Send a video using the Send API.
 *
 */
exports.sendVideoMessage = function (recipientId, url) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "video",
        payload: {
          url: url
        }
      }
    }
  };

  callSendAPI(messageData);
}


/*
 * Send a file using the Send API.
 *
 */
exports.sendFileMessage = function (recipientId, url) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "file",
        payload: {
          url: url
        }
      }
    }
  };

  callSendAPI(messageData);
}


/*
 * Send a text message using the Send API.
 *
 */
exports.sendTextMessage = function (recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText,
      metadata: "DEVELOPER_DEFINED_METADATA"
    }
  };

  callSendAPI(messageData);
}


/*
 * Send a button message using the Send API.
 * bottons: [{type: "web_url", url: "", title: ""}, 
 *           {type: "postback", title:, payload: ""},
 *           {type: "phone_number", title: "", payload: ""}]
 */
exports.sendButtonMessage = function (recipientId, text, buttons) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: text,
          buttons: buttons
        }
      }
    }
  };  

  callSendAPI(messageData);
}


/*
 * Send a Structured Message (Generic Message type) using the Send API.
 *
 * elements: [{title, subtitle, item_url, image_url, buttons:[]}, {}]
 */
exports.sendGenericMessage = function (recipientId, elements) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: elements
        }
      }
    }
  };  

  callSendAPI(messageData);
}


/*
 * Send a Structured Message (Generic Message type) using the Send API.
 *
 * elements: [{title, subtitle, item_url, image_url, buttons:[]}, {}]
 */
exports.sendListMessage = function (recipientId, elements) {
  var messageData = {
    recipient:{
      id:recipientId
    }, 
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "list",
          top_element_style: "compact",
          elements: [
            {
              title: "Classic T-Shirt Collection",
              subtitle: "See all our colors",
              image_url: "https://image.spreadshirtmedia.com/image-server/v1/products/1003716746/views/1,width=800,height=800,appearanceId=1,backgroundColor=fff,version=1485256808/i-eat-ass-t-shirt-men-s-t-shirt.jpg",          
              buttons: [
                {
                  title: "View",
                  type: "web_url",
                  url: "https://image.spreadshirtmedia.com/image-server/v1/products/1003716746/views/1,width=800,height=800,appearanceId=1,backgroundColor=fff,version=1485256808/i-eat-ass-t-shirt-men-s-t-shirt.jpg",
                  messenger_extensions: true,
                  webview_height_ratio: "tall",
                  fallback_url: "https://image.spreadshirtmedia.com/image-server/v1/products/1003716746/views/1,width=800,height=800,appearanceId=1,backgroundColor=fff,version=1485256808/i-eat-ass-t-shirt-men-s-t-shirt.jpg"            
                }
              ]
            },
            {
              title: "Classic White T-Shirt",
              subtitle: "See all our colors",
              default_action: {
                type: "web_url",
                url: "https://image.spreadshirtmedia.com/image-server/v1/products/1003716746/views/1,width=800,height=800,appearanceId=1,backgroundColor=fff,version=1485256808/i-eat-ass-t-shirt-men-s-t-shirt.jpg",
                messenger_extensions: true,
                webview_height_ratio: "tall",
                fallback_url: "https://image.spreadshirtmedia.com/image-server/v1/products/1003716746/views/1,width=800,height=800,appearanceId=1,backgroundColor=fff,version=1485256808/i-eat-ass-t-shirt-men-s-t-shirt.jpg"
              }
            },
            {
              title: "Classic Blue T-Shirt",
              image_url: "https://image.spreadshirtmedia.com/image-server/v1/products/1003716746/views/1,width=800,height=800,appearanceId=1,backgroundColor=fff,version=1485256808/i-eat-ass-t-shirt-men-s-t-shirt.jpg",
              subtitle: "100% Cotton, 200% Comfortable",
              default_action: {
                type: "web_url",
                url: "https://image.spreadshirtmedia.com/image-server/v1/products/1003716746/views/1,width=800,height=800,appearanceId=1,backgroundColor=fff,version=1485256808/i-eat-ass-t-shirt-men-s-t-shirt.jpg",
                messenger_extensions: true,
                webview_height_ratio: "tall",
                fallback_url: "https://image.spreadshirtmedia.com/image-server/v1/products/1003716746/views/1,width=800,height=800,appearanceId=1,backgroundColor=fff,version=1485256808/i-eat-ass-t-shirt-men-s-t-shirt.jpg"
              },
              buttons: [
                {
                  title: "Shop Now",
                  type: "web_url",
                  url: "https://image.spreadshirtmedia.com/image-server/v1/products/1003716746/views/1,width=800,height=800,appearanceId=1,backgroundColor=fff,version=1485256808/i-eat-ass-t-shirt-men-s-t-shirt.jpg",
                  messenger_extensions: true,
                  webview_height_ratio: "tall",
                  fallback_url: "https://image.spreadshirtmedia.com/image-server/v1/products/1003716746/views/1,width=800,height=800,appearanceId=1,backgroundColor=fff,version=1485256808/i-eat-ass-t-shirt-men-s-t-shirt.jpg"            
                }
              ]        
            }
          ],
           buttons: [
            {
              "title": "View More",
              "type": "postback",
              "payload": "payload"            
            }
          ]  
        }
      }
    }
  };  

  callSendAPI(messageData);
}

/*
 * Send a receipt message using the Send API.
 *
 * receipt: {ID, name, currency, payment_method, timestamp, elements, address, summary, adjustments}
 * receipt.elements: [{title, subtitle, quantity, price, currency, image_url}, ...]
 * receipt.address: {street_1, street_2, city, postal_code, state, country}
 * receipt.summary: {subtotal, shipping_cost, total_tax, total_cost}
 * receipt.adjustments: [{name, amount}, ...]
 */
exports.sendReceiptMessage = function (recipientId, receipt) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message:{
      attachment: {
        type: "template",
        payload: {
          template_type: "receipt",
          recipient_name: receipt.name,
          order_number: receipt.ID,
          currency: receipt.currency,
          payment_method: receipt.payment_method,        
          timestamp: receipt.timestamp, 
          elements: receipt.elements,
          address: receipt.address,
          summary: receipt.summary, 
          adjustments: receipt.adjustments 
        }
      }
    }
  };

  callSendAPI(messageData);
}


/*
 * Send a message with Quick Reply buttons.
 *
 * text: String text
 * quick_replies: [{content_type, title, payload}, ...]
 */
exports.sendQuickReply = function (recipientId, text, quick_replies) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: text,
      quick_replies: quick_replies
    }
  };

  callSendAPI(messageData);
}


/*
 * Send a read receipt to indicate the message has been read
 *
 */
exports.sendReadReceipt = function (recipientId) {
  console.log("Sending a read receipt to mark message as seen");

  var messageData = {
    recipient: {
      id: recipientId
    },
    sender_action: "mark_seen"
  };

  callSendAPI(messageData);
}


/*
 * Turn typing indicator on
 *
 */
exports.sendTypingOn = function (recipientId) {
  console.log("Turning typing indicator on");

  var messageData = {
    recipient: {
      id: recipientId
    },
    sender_action: "typing_on"
  };

  callSendAPI(messageData);
}


/*
 * Turn typing indicator off
 *
 */
exports.sendTypingOff = function (recipientId) {
  console.log("Turning typing indicator off");

  var messageData = {
    recipient: {
      id: recipientId
    },
    sender_action: "typing_off"
  };

  callSendAPI(messageData);
}


/*
 * Send a message with the account linking call-to-action
 *
 */
exports.sendAccountLinking = function (recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: "Welcome. Link your account.",
          buttons:[{
            type: "account_link",
            url: SERVER_URL + "/authorize"
          }]
        }
      }
    }
  };  

  callSendAPI(messageData);
}


/*
 * Call the Send API. The message data goes in the body. If successful, we'll 
 * get the message id in a response 
 *
 */
function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: PAGE_ACCESS_TOKEN },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      if (messageId) {
        console.log("Successfully sent message with id %s to recipient %s", 
          messageId, recipientId);
      } else {
      console.log("Successfully called Send API for recipient %s", 
        recipientId);
      }
    } else {
      console.error("Failed calling Send API", response.statusCode, response.statusMessage, body.error);
    }
  });  
}
