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

  test('Create, upload and search', function(done) {
    var browser = new Browser();
    browser.authenticate().basic('user', 'pass');
    browser
      .visit(target.rootURL)
      .then(function() {
        return browser.clickLink('Create New Domain');
      })
      .then(function() {
        browser.fill('domain_name', 'companies');
        return browser.pressButton('Create')
      })
      .then(function() {
        assert.equal(browser.text('.alert'), 'Domain successfully created');
        assert.equal(browser.location.pathname, '/domain/companies');
      })
      .then(function() {
        return browser.clickLink('Index Fields');
      })
      .then(function() {
        assert.equal(browser.location.pathname, '/domain/companies/index_fields');
        assert.equal(browser.text('.alert-warn'), 'No IndexField is defined');
      })
      .then(function() {
        browser.fill('name', 'name');
        return browser.pressButton('Create')
      })
      .then(function() {
        browser.fill('name', 'address');
        return browser.pressButton('Create')
      })
      .then(function() {
        browser.fill('name', 'email_address');
        return browser.pressButton('Create')
      })
      .then(function() {
        browser.fill('name', 'age');
        return browser.pressButton('Create')
      })
      .then(function() {
        browser.fill('name', 'product');
        return browser.pressButton('Create')
      })
      .then(function() {
        return browser.clickLink('Upload');
      })
      .then(function() {
        assert.equal(browser.text('h2'), 'Upload SDF Batch');
      })
      .then(function() {
        browser.attach('batch', __dirname + '/fixtures/add.sdf.json');
        return browser.pressButton('Upload');
      })
      .then(function() {
        assert.equal(browser.text('.alert'), 'SDF Batch Uploaded');
      })
      .then(function() {
        return browser.clickLink('Search');
      })
      .then(function() {
        // Zombie.js does not handle GET form at this time.
        // So hit the search result page directly.
        return browser.visit(target.rootURL + 'domain/companies/search?query=tokyo');
      })
      .then(function() {
        assert.equal(browser.text('.alert-info'), 'Found 3 records. Showing 1 - 3 (3 records).');
      })
      .then(done, done);
  });
});
