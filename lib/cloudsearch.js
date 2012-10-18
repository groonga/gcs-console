var awssum = require('awssum');
var CloudSearch = awssum.load('amazon/cloudsearch').CloudSearch;

var cloudsearch = function(host, port, protocol) {
  host = host || 'localhost';
  protocol = protocol || 'http';
  port = port || 7575;

  CloudSearch.prototype.host = function() {
     return host;
  };

  var cs = new CloudSearch({
     accessKeyId: 'dummy-access-key-id',
     secretAccessKey: 'dummy-access-key',
  });

  cs.addExtras = function(options, args) {
     options.protocol = protocol;
     options.port = port;
  };

  return function(req, res, next) {
    req.cloudsearch = cs;
    res.locals.configurationEndpointURL =
      protocol + '://' + host + ':' + port;
    cs.DescribeDomains(function(error, data) {
      if (error) {
        res.status(500);
        res.render('error', {error: new Error(error.Message)});
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
