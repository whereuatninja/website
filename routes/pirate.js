var express = require('express');
var passport = require('passport');
var request = require('request');
var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn()
var router = express.Router();

/* GET user profile. */
router.get('/', ensureLoggedIn, function(req, res, next) {
  var userId = "87c6673b-ca53-440f-80ea-9c581caa6c1b";

  getUserObj(req.user.token, function(ninjas){
    var firstNinjaId = getFirstNinja(ninjas);
    console.log("firstNinjaId: "+firstNinjaId);
    getLocationsFromNinja(firstNinjaId, function(locations){
      console.log(locations);
      res.render('pirate', { user: req.user, locations: locations, ninjas: ninjas});
    });
  });
});

function getFirstNinja(ninjas){
  if(ninjas && ninjas.length > 0){
    return ninjas[0];
  }
  return undefined;
}

function getLocationsFromNinja(firstNinjaId, callback){
  var options = {
    //url: "http://dev.whereuat.ninja/api/locations/84af3469-d270-407f-8717-01fd9ffac57e",
    url: "http://dev.whereuat.ninja/api/locations/"+firstNinjaId,
    method: 'GET'
  };

  var requestCallback = function(error, response, body){
    callback(body);
  };

  request(options,requestCallback);
}


function getUserObj(token, callback){
  var options = {
    url: "http://node-1:3000/api/ninjas",
    method: 'GET',
    json: true,
    auth: { bearer: token }
  };
  var requestCallback = function(error, response, body){
    callback(body);
  };
  request(options, requestCallback);
}

module.exports = router;
