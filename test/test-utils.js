var spawn = require('child_process').spawn;
var mkdirp = require('mkdirp');
var rimraf = require('rimraf');
var fs = require('fs');
var path = require('path');
var existsSync = fs.existsSync || path.existsSync; // to support older nodes than 0.8

function runServer(path, options, callback) {
  var command = spawn(path, options);
  command.stdout.on('data', function(data) {
    if (data.toString().match(/listening/)) {
      callback();
    }
    process.stdout.write(data);
  });
  command.stderr.on('data', function(data) {
    process.stderr.write(data);
  });
  return command;
}

var Target = function() {
  this.gcsConsolePort = 3335;
  this.gcsPort = 3334;
  this.databaseDir = __dirname + '/../test/tmp/gcs';
  this.databasePath = this.databaseDir + '/gcs';
  this.gcsPath = __dirname + '/../node_modules/.bin/gcs';
  this.gcsConsolePath = __dirname + '/../bin/gcs-console';
  this.rootURL = 'http://localhost:' + this.gcsConsolePort + '/';
};

Target.prototype = {
  gcs: null,
  gcsConsole: null,
  setup: function(done) {
    var self = this;
    var gcsOptions = [
      '--database-path', self.databasePath,
      '--port', self.gcsPort
    ];
    var gcsConsoleOptions = [
      '--port', self.gcsConsolePort,
      '--endpoint', 'http://localhost:' + self.gcsPort
    ];

    if (!existsSync(self.gcsPath)) {
      var error = new Error('gcs executable is not found at ' + self.gcsPath + '. You need to setup gcs to test with gcs-console. Run "npm install gcs" (for the latest release) or "npm install git://github.com/groonga/gcs.git" (for the development)');
      return done(error);
    }

    mkdirp.sync(self.databaseDir);
    self.gcs = runServer(self.gcsPath, gcsOptions, function() {
      self.gcsConsole = runServer(
        self.gcsConsolePath,
        gcsConsoleOptions,
        function() {
          process.on('exit', function() {
            self.teardown();
          });
          done();
        }
      )
    });
  },
  teardown: function() {
    if (this.gcs) {
      this.gcs.kill();
      rimraf.sync(this.databaseDir);
    }
    if (this.gcsConsole) {
      this.gcsConsole.kill();
    }
  }
};

module.exports.Target = Target;
