var awssum = require('awssum');
var CloudSearch = awssum.load('amazon/cloudsearch').CloudSearch;

var cloudsearch = function() {
  CloudSearch.prototype.host = function() {
     return 'localhost';
  };

  var cs = new CloudSearch({
     accessKeyId: 'dummy-access-key-id',
     secretAccessKey: 'dummy-access-key',
  });

  cs.addExtras = function(options, args) {
     options.protocol = 'http';
     options.port = 7575;
  };

  return function(req, res, next) {
    req.cloudsearch = cs;
    cs.DescribeDomains(function(error, data) {
      if (error) {
        res.status(500);
        res.render('error', {message: error.Message});
        return;
      }

      var domains = data.Body.DescribeDomainsResponse.DescribeDomainsResult.DomainStatusList.member;
      if (!domains) {
        domains = [];
      } else if (!(domains instanceof Array)) {
        domains = [domains];
      }
      res.locals.domains = domains;
      next();
    });
  };
};

module.exports.cloudsearch = cloudsearch;
