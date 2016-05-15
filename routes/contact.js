var express = require('express');
var passport = require('passport');
var router = express.Router();

// TODO:  required for signin to work.  need a better way
var env = {
    AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID,
    AUTH0_DOMAIN: process.env.AUTH0_DOMAIN,
    AUTH0_CALLBACK_URL: process.env.AUTH0_CALLBACK_URL || 'http://localhost:3000/callback'
}

router.get('/', function(req, res, next) {
    res.render('contact', { user: req.user, env: env });
});



module.exports = router;
