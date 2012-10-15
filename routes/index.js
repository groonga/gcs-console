var querystring = require('querystring');
var _ = require('underscore');
var http = require('http');

exports.index = function(req, res) {
  res.render('index');
};

function prepareCurrentDomain(req, res) {
  var domain = _.where(res.locals.domains, {DomainName: req.params.name})[0];
  domain.isSelected = true;
  return domain;
}

exports.domain = function(req, res) {
  var domain = prepareCurrentDomain(req, res);
  res.render('domain-show', {domain: domain});
};

exports.domainSearch = function(req, res) {
  var domain = prepareCurrentDomain(req, res);
  var query = req.query.query;
  var size = 10;
  var start = 0; // TODO support paginate

  req.cloudsearch.DescribeIndexFields({
    DomainName: domain.DomainName
  }, function(error, data) {
    if (error) {
      res.status(500);
      res.render('error', {message: error.Message});
      return;
    }
    var indexFields = data.Body.DescribeIndexFieldsResponse.DescribeIndexFieldsResult.IndexFields.member;
    var indexFieldNames = indexFields.map(function(indexField) {
      return indexField.Options.IndexFieldName;
    });

    var paramsForSearch = {
      q: query,
      size: size,
      start: start,
      'return-fields': indexFieldNames.join(',')
    };
    var requestURL = 'http://' + domain.SearchService.Endpoint + '/2011-02-01/search?' + querystring.stringify(paramsForSearch);

    var buffer = '';
    var results = null;
    http.get(requestURL, function(searchResponse) {
      searchResponse.setEncoding('utf8');
      searchResponse.on('data', function (chunk) {
        buffer += chunk;
      });
      searchResponse.on('end', function() {
        var locals = {
          domain: domain,
          query: query,
          requestURL: requestURL,
          results: JSON.parse(buffer),
          start: start
        };
        res.render('domain-search', locals);
      });
    });
  });

  // TODO handle errors
}
