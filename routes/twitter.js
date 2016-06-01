var express = require('express');
var passport = require('passport');
//var request = require('request');
var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn();
var router = express.Router();
var rp = require('request-promise');

router.get('/embeddedTweet', ensureLoggedIn, function(req, res, next) {

    var token = req.user.token;
    console.log("query parms: %j", req.query);
    var tweetUrl = req.query.url;

    var options = {
        url: "https://api.twitter.com/1/statuses/oembed.json?url="+tweetUrl,
        method: 'GET',
        json: true
    };

    rp(options)
        .then(function(twitterJson){
            res.json(twitterJson);
        })
        .catch(function(err){
            console.log("twitter error %j", err);
            res.json({});
        });
});

module.exports = router;