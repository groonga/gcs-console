var assert = require('chai').assert;
var Browser = require('zombie');
var Target = require('./test-utils').Target;
var utils = require('./test-utils').utils;

suite('dashboard', function() {
  var target = new Target();
  setup(function(done) {
    target.setup(done)
  });
  teardown(function() {
    target.teardown()
  });

  test('Create domain, add an index field and delete the index field', function(done) {
    var browser = new Browser();

    utils.withAdminConfigured(target, browser)
      .then(function() {
        return browser.visit(target.rootURL);
      })
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
        assert.equal(browser.text('.alert-warn'), "No IndexField is defined");
      })
      .then(function() {
        browser.fill('name', 'test');
        return browser.pressButton('Create')
      })
      .then(function() {
        assert.equal(browser.location.pathname, "/domain/test/index_fields");
        assert.equal(browser.text(".alert"), "IndexField successfully created");
      })
      .then(function() {
        assert.equal(browser.text("h3"), "Delete 'test' Index Field");
        assert.equal(browser.text(".modal-body p"), "Are you sure?");
        return browser.pressButton('Delete')
      })
      .then(function() {
        assert.equal(browser.text(".alert-info"), "IndexField successfully deleted");
        assert.equal(browser.location.pathname, "/domain/test/index_fields");
        assert.equal(browser.text('.alert-warn'), "No IndexField is defined");
      })
      .then(done, done);
  });
});
