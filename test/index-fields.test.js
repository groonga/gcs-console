var assert = require('chai').assert;
var Browser = require('zombie');
var Target = require('./test-utils').Target;

suite('dashboard', function() {
  var target = new Target();
  setup(function(done) {
    target.setup(done)
  });
  teardown(function() {
    target.teardown()
  });

  test('Create domain and add an index field', function(done) {
    var browser = new Browser();
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
        return browser.clickLink('Index Fields');
      })
      .then(function() {
        assert.equal(browser.location.pathname, "/domain/test/index_fields");
      })
      .then(function() {
        browser.fill('name', 'test');
        return browser.pressButton('Create')
      })
      .then(function() {
        assert.equal(browser.text(".alert"), "IndexField successfully created");
      })
      .then(done, done);
  });
});
