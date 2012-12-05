exports.adminPassword = function(req, res) {
  var config = req.app.get('config');
  if (config.data.adminUsername && config.data.adminPassword) {
    return res.redirect('/');
  }
  return res.render('admin-password');
};

var Config = require('../lib/config').Config;
exports.adminPasswordPost = function(req, res) {
  var config = req.app.get('config');

  if (config.data.adminUsername && config.data.adminPassword) {
    return res.redirect('/');
  }

  var username = req.body.username;
  var password = req.body.password;

  if (username && password) {
    config.data.adminUsername = username;
    config.data.adminPassword = password;
    config.save();
    return res.redirect('/');
  } else {
    return res.render('admin-password', {
      error: new Error('Username and Password should not be empty')
    });
  }
};
