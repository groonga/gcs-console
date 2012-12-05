var assert = require('chai').assert;
var Browser = require('zombie');
var Target = require('./test-utils').Target;
var utils = require('./test-utils').utils;

suite('first time', function() {
  var target = new Target();
  setup(function(done) {
    target.setup(done)
  });
  teardown(function() {
    target.teardown()
  });

  test('should redirect to password configuration', function(done) {
    var browser = new Browser();

    browser
      .visit(target.rootURL)
      .then(function() {
        assert.equal(browser.location.pathname, '/admin/password');
      })
      .then(done, done);
  });

  test('config admin user', function(done) {
    var browser = new Browser();

    utils.withAdminConfigured(target, browser)
      .then(function() {
        assert.equal(browser.location.pathname, '/');
        assert.equal(browser.text('title'), 'Groonga CloudSearch Console');
      })
      .then(done, done);
  });
});


suite('password configured', function() {
  var target = new Target();
  setup(function(done) {
    target.setup(done)
  });
  teardown(function() {
    target.teardown()
  });

  test('GET / without credentials', function(done) {
    var browser = new Browser();
    utils.withAdminConfigured(target, browser)
      .then(function() {
        var browserWithoutPassword = new Browser();
        browserWithoutPassword
          .visit(target.rootURL)
          .fail(function(error) {
            assert.equal(browserWithoutPassword.statusCode, 401);
            assert.isNotNull(error);
            done();
          })
      });
  });

  test('GET / with wrong password', function(done) {
    var browser = new Browser();
    utils.withAdminConfigured(target, browser)
      .then(function() {
        var browserWithWrongPassword = new Browser();
        browserWithWrongPassword.authenticate().basic('username', 'wrong-password');
        browserWithWrongPassword
          .visit(target.rootURL)
          .fail(function(error) {
            assert.equal(browserWithWrongPassword.statusCode, 401);
            assert.isNotNull(error);
            done();
          });
      });
  });
});
