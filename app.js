var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path');
var flash = require('connect-flash');
var Config = require('./lib/config').Config;

function setupApplication(app) {
  var auth;

  var config = new Config(app.get('home'));
  app.set('config', config);

  auth = function(req, res, next) {
    var username = config.data.adminUsername;
    var password = config.data.adminPassword;
    if (username && password) {
      return express.basicAuth(username, password)(req, res, next);
    } else {
      return res.redirect('/admin/password');
    }
  };

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
  app.get('/domain/:name/index_fields', auth, routes.domainIndexFields);
  app.get('/domain/:name/upload', auth, routes.domainUpload);
  app.post('/domain/:name/upload', auth, routes.domainUploadPost);
  app.get('/domain_create', auth, routes.domainCreate);
  app.post('/domain_create', auth, routes.domainCreatePost);
  app.post('/domain/:name/index_fields', auth, routes.domainCreateIndexField);
  app.delete('/domain/:name/index_fields/:indexFieldName', auth, routes.domainDeleteIndexField);
  app.delete('/domain/:name', auth, routes.domainDelete);

  app.get('/admin/password', routes.adminPassword);
  app.post('/admin/password', routes.adminPasswordPost);
}

module.exports.setupApplication = setupApplication;
