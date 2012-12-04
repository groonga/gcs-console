var fs = require('fs');
var mkdirp = require('mkdirp');

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
    if (fs.existsSync(this.configFilePath())) {
      this.data = JSON.parse(fs.readFileSync(this.configFilePath()));
    }
  },
  save: function() {
    var json = JSON.stringify(this.data);
    mkdirp.sync(this.home);
    fs.writeFileSync(this.configFilePath(), json);
  }
};

module.exports.Config = Config;
