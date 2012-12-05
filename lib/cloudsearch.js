var awssum = require('awssum');
var CloudSearch = awssum.load('amazon/cloudsearch').CloudSearch;
var url = require('url');
var util = require('util');

var cloudsearch = function(endpoint) {
  var endpointURL = url.parse(endpoint);

  CloudSearch.prototype.host = function() {
     return endpointURL.hostname;
  };

  var cs = new CloudSearch({
     accessKeyId: 'dummy-access-key-id',
     secretAccessKey: 'dummy-access-key',
  });

  cs.addExtras = function(options, args) {
     options.protocol = endpointURL.protocol.replace(/:$/, '');
     options.port = endpointURL.port;
  };

  return function(req, res, next) {
    req.cloudsearch = cs;
    res.locals.configurationEndpointURL = endpoint;
    cs.DescribeDomains(function(error, data) {
      if (error) {
        res.status(500);
        res.render('error', {error: new Error(error.Message)});
        console.error("awssum reported an error.\n" + util.inspect(error));
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
