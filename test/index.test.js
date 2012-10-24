var assert = require('chai').assert;
var Browser = require('zombie');
var spawn = require('child_process').spawn;
var mkdirp = require('mkdirp');
var rimraf = require('rimraf');
var fs = require('fs');
var path = require('path');
var existsSync = fs.existsSync || path.existsSync; // to support older nodes than 0.8

// TODO extract these test helpers to another file

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

suite('dashboard', function() {
  var gcs, gcsConsole;
  var databaseDir = __dirname + '/../test/tmp/gcs';
  var databasePath = databaseDir + '/gcs';
  setup(function(done) {
    var gcsPath = __dirname + '/../node_modules/.bin/gcs';
    var gcsOptions = [
      '--database-path', databasePath
    ]; // TODO set port for gcs
    var gcsConsolePath = __dirname + '/../bin/gcs-console';
    var gcsConsoleOptions = []; // TODO set port of gcs and gcs-console

    if (!existsSync(gcsPath)) {
      var error = new Error('gcs executable is not found at ' + gcsPath + '. You need to setup gcs to test with gcs-console. Run "npm install gcs" (for the latest release) or "npm install git://github.com/groonga/gcs.git" (for the development)');
      return done(error);
    }

    mkdirp.sync(databaseDir);
    gcs = runServer(gcsPath, gcsOptions, function() {
      gcsConsole = runServer(gcsConsolePath, gcsConsoleOptions, function() {
        done();
      })
    });
  });

  teardown(function() {
    if (gcs) {
      gcs.kill();
      rimraf.sync(databaseDir);
    }
    if (gcsConsole) {
      gcsConsole.kill();
    }
  });

  test('GET /', function(done) {
    var browser = new Browser();
    browser.visit('http://localhost:7576'). // TODO make this configurable
      then(function() {
        assert.ok(browser.success);
        assert.equal(browser.text('title'), 'Groonga CloudSearch Console');
        done();
      }).
      fail(function(error) {
        done(error);
      });
  });
});
