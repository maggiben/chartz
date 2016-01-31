'use strict';

var config = require('config');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var flash = require('connect-flash'); // To display error messages
var expressValidator = require('express-validator');

// Authentification modules
var passport = require('passport');
var flash = require('connect-flash'); // To display error messages
var expressSession = require('express-session');

// will use REDIS Store
//var MongoDBStore = require('connect-mongodb-session')(expressSession);
var RedisStore = require('connect-redis')(expressSession);
var redis = require("redis").createClient(config.get('redis'));

var uuid = require('node-uuid'); // used to generate the session id

// Retrieving app
var app = express();

// Retrieving controllers. By default, node will load `index.js` in the dir.
//var controllers = require('./controllers');

// 'View' engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
//app.set('view cache', process.env.NODE_ENV == 'prod');

// Default middlewares
app.use(favicon(path.join(__dirname, 'public/images', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(expressValidator());
app.use(cookieParser());
app.use(flash()); // use connect-flash for flash messages stored in session

// Static files serving
app.use(express.static(path.join(__dirname, 'public')));

var store = new RedisStore({
  host: config.get('redis').host,
  port: config.get('redis').port,
  client: redis
});

app.use(expressSession({
  name: 'session',
  secret: 'rYaq$mFa8AWAHE=!9g2Nza2tkn#5bM5+Akwvw#Zrf^Kc',
  /*cookie: {
    path: '/',
    httpOnly: true,
    secure: true,
    maxAge: 24 * 60 * 60 * 1000,
    signed: false,
    magic: 'DEADBEEF'
  },*/
  genid: function () {
    return uuid.v1(); // time based
  },
  resave: true,
  saveUninitialized: true,
  //store: store
}));

// Passport middlewares for auth/session handling
app.use(passport.initialize());
app.use(passport.session());

app.use(flash()); // use connect-flash for flash messages stored in session

// Routes
app.use('/', require('./routes/index'));

module.exports = app;
