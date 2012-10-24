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
    browser.visit('http://localhost:7576'). // TODO make this configurable
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
