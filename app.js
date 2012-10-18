
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path');
var flash = require('connect-flash');

var app = express();

app.configure(function(){
  app.set('port', process.env.GCS_CONSOLE_PORT || 7576);
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
  app.use(require('./lib/cloudsearch').cloudsearch());
  app.use(app.router);
});

app.configure('development', function(){
});

app.get('/', routes.index);
app.get('/domain/:name', routes.domain);
app.get('/domain/:name/search', routes.domainSearch);
app.get('/domain_create', routes.domainCreate);
app.post('/domain_create', routes.domainCreatePost);
app.delete('/domain/:name', routes.domainDelete);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Groonga CloudSearch Console listening on port " +
              app.get('port'));
});
