var fs = require('fs');
var mkdirp = require('mkdirp');
var existsSync = fs.existsSync || require('path').existsSync; // to support older nodes than 0.8

var CONFIG_FILE_NAME = 'config.json';
var Config = function(home) {
  this.home = home;
  this.load();
};

Config.prototype = {
  home: null,
  data: {},
  configFilePath: function() {
    return this.home + '/' + CONFIG_FILE_NAME;
  },
  load: function() {
    if (existsSync(this.configFilePath())) {
      this.data = JSON.parse(fs.readFileSync(this.configFilePath()));
    }
  },
  save: function() {
    var json = JSON.stringify(this.data);
    mkdirp.sync(this.home, 0700);
    var file = fs.openSync(this.configFilePath(), 'w', 0600);
    fs.writeSync(file, json)
    fs.closeSync(file);
  }
};

module.exports.Config = Config;
