var cs = require('../lib/cloudsearch').cs;

exports.index = function(req, res){
  cs.DescribeDomains(function(error, data) {
    if (error) {
      res.status(500);
      res.render('error', {message: error.Message});
      return;
    }

    var domains = data.Body.DescribeDomainsResponse.DescribeDomainsResult.DomainStatusList.member;
    res.render('index', {domains: domains});
  });
};
