var cs = require('../lib/cloudsearch').cs;

exports.index = function(req, res){
  cs.DescribeDomains(function(error, data) {
    var domains = data.Body.DescribeDomainsResponse.DescribeDomainsResult.DomainStatusList.member;
    res.render('index', {domains: domains});
  });
};
