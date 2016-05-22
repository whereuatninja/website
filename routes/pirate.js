var express = require('express');
var passport = require('passport');
//var request = require('request');
var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn();
var router = express.Router();
var rp = require('request-promise');

/* GET user profile. */
router.get('/', ensureLoggedIn, function(req, res, next) {
  var token = req.user.token;
  var user = req.user;
  var viewModel = {};
  getNinjas(token)
  .then(function(ninjas){
    viewModel.ninjas = ninjas;
    var ninjaId = getFirstNinja(ninjas);
    viewModel.currentNinjaId = ninjaId;
    return getLocationsByNinjaId(token, ninjaId);
  })
  .then(function(locations){
    viewModel.locations = locations;
     res.render('pirate', { user: user, viewModel: viewModel });
  });
});

router.get('/:ninja_id', ensureLoggedIn, function(req, res, next) {
  var token = req.user.token;
  var user = req.user;
  var ninjaId = req.params.ninja_id;
  var viewModel = {currentNinjaId: ninjaId};
  getNinjas(token)
  .then(function(ninjas){
    viewModel.ninjas = ninjas;
    return getLocationsByNinjaId(token, ninjaId);
  })
  .then(function(locations){
    if(locations.length > 0){
      viewModel.minSliderTime = getMinLocationTime(locations);
      viewModel.maxSliderTime = getMaxLocationTime(locations);
      viewModel.locations = locations;
      viewModel.ninjaId = ninjaId;
    }
    res.render('pirate', { user: user, viewModel: viewModel });
  });
});

function getMaxLocationTime(locations){
  return locations[0].time;
}

function getMinLocationTime(locations){
  return locations[locations.length-1].time;
}

function getFirstNinja(ninjas){
  if(ninjas && ninjas.length > 0){
    return ninjas[0].id;
  }
  return undefined;
}

function getLocationsByNinjaId(token, firstNinjaId){
  var options = {
    url: "http://node-1:3000/api/locations/"+firstNinjaId,
    method: 'GET',
    json: true,
    auth: { bearer: token }
  };

  return rp(options).promise();
}

function getNinjas(token){
  var options = {
    url: "http://node-1:3000/api/ninjas",
    method: 'GET',
    json: true,
    auth: { bearer: token }
  };
  return rp(options).promise();
}

module.exports = router;
