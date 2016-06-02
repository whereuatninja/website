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
    var resData = {};
    getLocationsByNinjaId(token, ninjaId, queryParameters)
    .then(function(locations){
        res.render('locationlist', {locations: locations},  function(err, html) {
            resData.locations = locations;
            console.log("***locations: %j", resData.locations);
            resData.locationListHtml = html;
            //res.json(resData);
        });
        console.log("***after locations: %j", resData.locations);
        return getMostRecentLocationByUserId(token, ninjaId);
    })
    .then(function(mostRecentLocation){
        if(mostRecentLocation){
            resData.mostRecentLocation = mostRecentLocation[0];
        }
        console.log("filtered location data: %j", resData);
        res.json(resData);
    });
});

function getMostRecentLocationByUserId(token, userId){
    var options = {
        url: process.env.API_URL+"/locations/"+userId+"?mostRecent=true",
        method: 'GET',
        json: true,
        auth: { bearer: token }
    };

    return rp(options).promise();
}

function getLocationsByNinjaId(token, ninjaId, queryParameters){

    var options = {
        url: process.env.API_URL+"/locations/"+ninjaId,
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