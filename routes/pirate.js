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
  var ninjas = user.ninjas;
  var ninjaId = getFirstNinja(ninjas);
  res.redirect('/pirate/'+ninjaId);
});

router.get('/:ninja_id', ensureLoggedIn, function(req, res, next) {
  var token = req.user.token;
  var user = req.user;
  var ninjas = user.ninjas;
  var ninjaId = req.params.ninja_id;
  var ninja = getCurrentNinjaFromList(ninjaId, ninjas);
  var viewModel = {currentNinjaId: ninjaId};
  getLocationsByNinjaId(token, ninjaId)
  .then(function(locations){
    if(locations.length > 0){
      viewModel.minSliderTime = getMinLocationTime(locations);
      viewModel.maxSliderTime = getMaxLocationTime(locations);
      viewModel.locations = locations;
    }
    viewModel.ninjaId = ninjaId;
    viewModel.ninja = ninja;
    res.render('pirate', { user: user, viewModel: viewModel });
  });
});

function getCurrentNinjaFromList(currentNinjaId, ninjas){
  for(var i = 0; ninjas.length; i++){
    if(ninjas[i].id == currentNinjaId){
      return ninjas[i];
    }
  }
  return null;
}

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
    url: "http://node-1/api/locations/"+firstNinjaId,
    method: 'GET',
    json: true,
    auth: { bearer: token }
  };

  return rp(options).promise();
}

module.exports = router;
