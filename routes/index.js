var awssum = require('awssum');
var CloudSearch = awssum.load('amazon/cloudsearch').CloudSearch;

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

exports.index = function(req, res){
  cs.DescribeDomains(function(error, data) {
    var domains = data.Body.DescribeDomainsResponse.DescribeDomainsResult.DomainStatusList.member;
    res.render('index', {domains: domains});
  })
};
