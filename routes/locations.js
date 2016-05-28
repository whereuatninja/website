var express = require('express');
var passport = require('passport');
//var request = require('request');
var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn();
var router = express.Router();
var rp = require('request-promise');

router.get('/:ninja_id', ensureLoggedIn, function(req, res, next) {
    var token = req.user.token;
    console.log("query parms: %j", req.query);
    var ninjaId = req.params.ninja_id;
    var queryParameters = getQueryParameters(req.query);
    getLocationsByNinjaId(token, ninjaId, queryParameters)
    .then(function(locations){
        res.render('locationlist', {locations: locations},  function(err, html) {
            console.log(html);
            var resData = {
                locations: locations,
                locationListHtml: html
            };
            res.json(resData);
        });
    });
});

function getLocationsByNinjaId(token, ninjaId, queryParameters){

    var options = {
        url: "http://node-1/api/locations/"+ninjaId,
        qs: queryParameters,
        method: 'GET',
        json: true,
        auth: { bearer: token }
    };

    return rp(options).promise();
}

function getQueryParameters(query){
    var afterParameter = query.after? query.after : "";
    var beforeParameter = query.before? query.before : "";
    var params = {
        after: afterParameter,
        before: beforeParameter
    }
    return params;
}

module.exports = router;