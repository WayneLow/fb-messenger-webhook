const
    redis = require('redis'),
    config = require('config');

const URL = config.get('redis_url');
//var client = redis.createClient(URL);
//setInterval(function() {
//    console.log("ping");
//    client.ping();
//}, 1000 * 60 * 5);

exports.SET = function(key, value) {
    var client = redis.createClient(URL);
    client.set(key, value);
    client.quit();
}

exports.GET = function(key, callback) {
    var client = redis.createClient(URL);
    client.get(key, callback);
    client.quit();
}

