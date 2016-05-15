var express = require('express');
var passport = require('passport');
var request = require('request');
var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn()
var router = express.Router();

/* GET user profile. */
router.get('/', ensureLoggedIn, function(req, res, next) {
  getUserObj(req.user.token, function(ninjas){
    var firstNinjaId = getFirstNinja(ninjas);
    getLocationsFromNinja(req.user.token, firstNinjaId, function(locations){
      var stringifiedLocations = JSON.stringify(locations);
      var viewModel = {
        locations: locations,
        ninjas: ninjas,
        stringifiedLocations: stringifiedLocations
      };
      res.render('pirate', { user: req.user, viewModel: viewModel });
    });
  });
});

function getFirstNinja(ninjas){
  if(ninjas && ninjas.length > 0){
    return ninjas[0];
  }
  return undefined;
}

function getLocationsFromNinja(token, firstNinjaId, callback){
  var options = {
    url: "http://node-1:3000/api/locations/"+firstNinjaId,
    method: 'GET',
    json: true,
    auth: { bearer: token }
  };

  var requestCallback = function(error, response, body){
    callback(body);
  };

  request(options,requestCallback);
}


function getUserObj(token, callback){
  console.log("token:"+token);
  var options = {
    url: "http://node-1:3000/api/ninjas",
    method: 'GET',
    json: true,
    auth: { bearer: token }
  };
  var requestCallback = function(error, response, body){
    console.log("body: %j", body);
    callback(body);
  };
  request(options, requestCallback);
}

module.exports = router;
