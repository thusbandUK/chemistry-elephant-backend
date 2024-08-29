var express = require('express');
var express = require('express');
var passport = require('passport');
var GoogleStrategy = require('passport-google-oidc');
//this is the new one for postgresql
var dbAccess = require('../dbConfig');
//this is the one that came with the tutorial
var db = require('../db');
var router = express.Router();

var dbAccess = require('../dbConfig');
const Pool = require('pg').Pool
const pool = new Pool(dbAccess);

/*
Okay, that's interesting, even though you're validating via google, you still need to call the db. But as in, you're
storing them in the db, no?
*/

passport.use(new GoogleStrategy({
  clientID: process.env['GOOGLE_CLIENT_ID'],
  clientSecret: process.env['GOOGLE_CLIENT_SECRET'],
  callbackURL: '/oauth2/redirect/google',
  scope: [ 'profile' ]
}, function verify(issuer, profile, cb) {
  pool.query('SELECT * FROM federated_credentials WHERE provider = $1 AND subject = $2', [
    issuer,
    profile.id
  ], function(err, row) {
    if (err) { return cb(err); }
    
    if (!row.rows[0]) {
      pool.query('INSERT INTO users (name) VALUES ($1) RETURNING *', [
        profile.displayName
      ], function(err, results) {
        if (err) { return cb(err); }
        var id = results.rows[0].id
        
        pool.query('INSERT INTO federated_credentials (user_id, provider, subject) VALUES ($1, $2, $3) RETURNING *', [
          id,
          issuer,
          profile.id
        ], function(err) {
          if (err) { return cb(err); }
          var user = {
            id: id,
            name: profile.displayName
          };
          return cb(null, user);
        });
      });
    } else {
      
      pool.query('SELECT * FROM users WHERE id = $1', [ row.rows[0].user_id ], function(err, row) {
        if (err) { return cb(err); }
        if (!row.rows[0]) { return cb(null, false); }
        
        return cb(null, row.rows[0]);
      });
    }
  });
}));



passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    cb(null, { id: user.id, username: user.username, name: user.name });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});

router.get('/login', function(req, res, next) {
  res.render('login');
});

router.get('/login/federated/google', passport.authenticate('google'));

router.get('/oauth2/redirect/google', passport.authenticate('google', {
  successRedirect: '/',
  failureRedirect: '/login'
}));

router.post('/logout', function(req, res, next) {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

module.exports = router;