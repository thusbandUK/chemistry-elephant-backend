require('dotenv').config();

var indexRouter = require('./routes/index');
var authRouter = require('./routes/auth');

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var logger = require('morgan');
var session = require('express-session');

//var session = require('express-session');
var passport = require('passport');

var SQLiteStore = require('connect-sqlite3')(session);

var indexRouter = require('./routes/index');

var app = express();

//imports for node-postgres
const pg = require('pg');
//const dotenv = require('dotenv').config();

/*accesses database login details from .env file via dbConfig.js to establish new client pool*/
const pgSession = require('connect-pg-simple')(session);
var dbAccess = require('./dbConfig');

const Pool = require('pg').Pool
const pgPool = new Pool(dbAccess);
//imports for node-postgres ends



app.locals.pluralize = require('pluralize');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.static(path.join(__dirname, 'public')));

/*
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false,
  store: new SQLiteStore({ db: 'sessions.db', dir: './var/db' })
}));
*/
app.use(session({
  store: new pgSession ({
    // connect-pg-simple options:
    pool : pgPool,
    tableName : "session"
  }),
  secret: 'keyboard cat',
  //httpOnly: false,
  saveUninitialized: true,
  //secret: process.env.FOO_COOKIE_SECRET,
  resave: false,
  cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 } // 30 days
  // Insert express-session options here
}));

app.use(passport.authenticate('session'));

app.use('/', indexRouter);

app.use('/', authRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

var listener = app.listen(8888, function(){
  console.log('Listening on port ' + listener.address().port); //Listening on port 8888
});

module.exports = app;
