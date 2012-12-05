var express = require('express')
  , http = require('http')
  , path = require('path');
var flash = require('connect-flash');
var bcrypt = require('bcrypt');

var Config = require('./lib/config').Config;
var routes = {
  domains: require('./routes/domains'),
  admin: require('./routes/admin')
};

function setupApplication(app) {
  var auth;

  var config = new Config(app.get('home'));
  app.set('config', config);

  auth = function(req, res, next) {
    var adminUsername = config.data.adminUsername;
    var adminPassword = config.data.adminPassword;
    if (adminUsername && adminPassword) {
      return express.basicAuth(function(username, password) {
        return username === adminUsername && bcrypt.compareSync(password, adminPassword);
      })(req, res, next);
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

  app.get('/', auth, routes.domains.index);
  app.get('/domain/:name', auth, routes.domains.show);
  app.get('/domain/:name/search', auth, routes.domains.search);
  app.get('/domain/:name/index_fields', auth, routes.domains.indexFields);
  app.get('/domain/:name/upload', auth, routes.domains.upload);
  app.post('/domain/:name/upload', auth, routes.domains.uploadPost);
  app.get('/domain_create', auth, routes.domains.create);
  app.post('/domain_create', auth, routes.domains.createPost);
  app.post('/domain/:name/index_fields', auth, routes.domains.createIndexField);
  app.delete('/domain/:name/index_fields/:indexFieldName', auth, routes.domains.deleteIndexField);
  app.delete('/domain/:name', auth, routes.domains.delete);

  app.get('/admin/password', routes.admin.password);
  app.post('/admin/password', routes.admin.passwordPost);
}

module.exports.setupApplication = setupApplication;
