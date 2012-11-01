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

  test('GET /', function(done) {
    var browser = new Browser();
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

suite('Basic auth configured', function() {
  var target = new Target({auth: 'user:password'});
  setup(function(done) {
    target.setup(done)
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
    browser.authenticate().basic('user', 'password');
    browser.visit(target.rootURL)
    .then(function() {
      assert.ok(browser.success);
      done();
    });
  })
});
