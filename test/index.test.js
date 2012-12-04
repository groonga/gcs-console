var assert = require('chai').assert;
var Browser = require('zombie');
var Target = require('./test-utils').Target;

var config = {
  adminUsername: 'user',
  adminPassword: 'pass'
};

suite('first time', function() {
  var target = new Target();
  setup(function(done) {
    target.setup(done)
  });
  teardown(function() {
    target.teardown()
  });

  test('config admin user', function(done) {
    var browser = new Browser();

    browser.authenticate().basic('user', 'pass');
    browser
      .visit(target.rootURL)
      .then(function() {
        assert.equal(browser.location.pathname, '/admin/password');
        assert.equal(browser.text('.alert'), 'The admin account for Groonga CloudSearch Console has not been configured yet. You must configure it to use Groonga CloudSearch Console.');
      })
      .then(function() {
        browser.fill('username', 'user');
        browser.fill('password', 'pass');
        return browser.pressButton('Save')
      })
      .then(function() {
        assert.equal(browser.text('title'), 'Groonga CloudSearch Console');
      })
      .then(done, done);
  });
});

suite('dashboard', function() {
  var target = new Target();
  setup(function(done) {
    target.setup(done, config)
  });
  teardown(function() {
    target.teardown()
  });

  test('GET /', function(done) {
    var browser = new Browser();
    browser.authenticate().basic('user', 'pass');
    browser.visit(target.rootURL).
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

suite('Password configured', function() {
  var target = new Target();
  setup(function(done) {
    target.setup(done, config)
  });
  teardown(function() {
    target.teardown()
  });

  test('GET / without credentials', function(done) {
    var browser = new Browser();
    browser.visit(target.rootURL)
    .fail(function(error) {
      assert.equal(browser.statusCode, 401);
      assert.isNotNull(error);
      done();
    });
  })

  test('GET / with wrong password', function(done) {
    var browser = new Browser();
    browser.authenticate().basic('user', 'wrong-password');
    browser.visit(target.rootURL)
    .fail(function(error) {
      assert.equal(browser.statusCode, 401);
      assert.isNotNull(error);
      done();
    });
  })

  test('GET / with correct password', function(done) {
    var browser = new Browser();
    browser.authenticate().basic('user', 'pass');
    browser.visit(target.rootURL)
    .then(function() {
      assert.ok(browser.success);
      done();
    });
  })
});
