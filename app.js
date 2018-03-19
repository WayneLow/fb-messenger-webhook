'use strict';

const
    express = require('express'),
    config = require('config'),
    path = require('path'),
    bodyParser = require('body-parser'),
    crypto = require('crypto'),
    logger = require('morgan'),
    cors = require('cors'),

    index = require('./routes/index'),
    authorize = require('./routes/authorize'),
    webhook = require('./routes/webhook'),
    chatAPI = require('./routes/chatAPI');

    //zendesk = require('./models/zendesk');

require("cf-deployment-tracker-client").track();
console.log("Start");
//zendesk.zendesk_init();
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ verify: verifyRequestSignature }));
app.use(cors());
app.use(logger('dev'));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/authorize', authorize);
app.use('/webhook', webhook);
app.use('/chatapi', chatAPI);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


// App Secret can be retrieved from the App Dashboard
const APP_SECRET = (process.env.MESSENGER_APP_SECRET) ? 
  process.env.MESSENGER_APP_SECRET :
  config.get('appSecret');

if (!(APP_SECRET)) {
  console.error("Missing config values");
  process.exit(1);
}


/*
 * Verify that the callback came from Facebook. Using the App Secret from 
 * the App Dashboard, we can verify the signature that is sent with each 
 * callback in the x-hub-signature field, located in the header.
 *
 * https://developers.facebook.com/docs/graph-api/webhooks#setup
 *
 */
function verifyRequestSignature(req, res, buf) {
  var signature = req.headers["x-hub-signature"];

  if (!signature) {
    // For testing, let's log an error. In production, you should throw an 
    // error.
    console.error("Couldn't validate the signature.");
  } else {
    var elements = signature.split('=');
    var method = elements[0];
    var signatureHash = elements[1];

    var expectedHash = crypto.createHmac('sha1', APP_SECRET)
                        .update(buf)
                        .digest('hex');

    if (signatureHash != expectedHash) {
      throw new Error("Couldn't validate the request signature.");
    }
  }
}


module.exports = app;
