
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path');

var app = express();

app.configure(function(){
  app.set('port', process.env.GCS_CONSOLE_PORT || 7576);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(require('./lib/cloudsearch').cloudsearch());
  app.use(app.router);
});

app.configure('development', function(){
});

app.get('/', routes.index);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Groonga CloudSearch Console listening on port " +
              app.get('port'));
});
