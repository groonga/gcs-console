var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path');
var flash = require('connect-flash');

function setupApplication(app) {
  var auth = function(req, res, next) {
    // middleware that does nothing
    next();
  };

  var user = app.get('user'), password = app.get('password');
  if (user && password) {
    auth = express.basicAuth(user, password);
  }

  app.configure(function(){
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser('keyboard cat'));
    app.use(express.session({ cookie: { maxAge: 60000 }}));
    app.use(flash());
    app.use((function() {
      return function(req, res, next) {
        res.locals.info = req.flash('info');
        next();
      }
    })());
    app.use(express.static(path.join(__dirname, 'public')));
    app.use(require('./lib/cloudsearch').cloudsearch(app.get('endpoint')));
    app.use(app.router);
  });

  app.configure('development', function(){
  });

  app.get('/', auth, routes.index);
  app.get('/domain/:name', auth, routes.domain);
  app.get('/domain/:name/search', auth, routes.domainSearch);
  app.get('/domain_create', auth, routes.domainCreate);
  app.post('/domain_create', auth, routes.domainCreatePost);
  app.delete('/domain/:name', auth, routes.domainDelete);
}

module.exports.setupApplication = setupApplication;
