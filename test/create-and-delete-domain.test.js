var assert = require('chai').assert;
var Browser = require('zombie');
var Target = require('./test-utils').Target;

var config = {
  adminUsername: 'user',
  adminPassword: 'pass'
};

suite('dashboard', function() {
  var target = new Target();
  setup(function(done) {
    target.setup(done, config)
  });
  teardown(function() {
    target.teardown()
  });

  test('Create and delete a domain', function(done) {
    var browser = new Browser();
    browser.authenticate().basic('user', 'pass');
    browser
      .visit(target.rootURL)
      .then(function() {
        return browser.clickLink('Create New Domain');
      })
      .then(function() {
        browser.fill('domain_name', 'test');
        return browser.pressButton('Create')
      })
      .then(function() {
        assert.equal(browser.text(".alert"), "Domain successfully created");
        assert.equal(browser.location.pathname, "/domain/test");
      })
      .then(function() {
        return browser.clickLink('Delete this domain');
      })
      .then(function() {
        assert.equal(browser.text(".modal-body p"), "Are you sure?");
      })
      .then(function() {
        return browser.pressButton('Delete');
      })
      .then(function() {
        assert.equal(browser.text(".alert"), "Domain successfully deleted");
        assert.equal(browser.location.pathname, "/");
      })
      .then(done, done);
  });
});
