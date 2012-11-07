var querystring = require('querystring');
var _ = require('underscore');
var http = require('http');

exports.index = function(req, res) {
  res.render('index', {action: 'index'});
};

function withDomain(req, res, callback) {
  var domain = _.where(res.locals.domains, {DomainName: req.params.name})[0];
  domain.isSelected = true;

  req.domain = domain;

  // get index fields
  req.cloudsearch.DescribeIndexFields({
    DomainName: domain.DomainName
  }, function(error, data) {
    if (error) {
      res.status(500);
      res.render('error', {error: new Error(error.Message)});
      return;
    }
    var indexFields = convertToArray(data.Body.DescribeIndexFieldsResponse.DescribeIndexFieldsResult.IndexFields.member);

    req.indexFields = indexFields;
    callback(req, res);
  });

  return domain;
}

function convertToArray(data) {
  // awssum returns undefined for 0 item, object itself for 1 item,
  // array for >1 items. Make all of them as a Array.
  if (!data) {
    return [];
  } else if (!(data instanceof Array)) {
    return [data];
  } else {
    return data;
  }
}

function errorToRender(error) {
  var errorToRender = null;
  try {
    errorToRender = new Error(error.Body.Response.Errors.Error.Message);
  } catch(e) {
    errorToRender = e;
  }
  return errorToRender;
}

exports.domain = function(req, res) {
  withDomain(req, res, function(req, res) {
    res.render('domain-show', {
      action: 'domain_show',
      domain: req.domain
    });
  });
};

exports.domainIndexFields = function(req, res) {
  withDomain(req, res, function(req, res) {
    res.render('domain-index-fields', {
      action: 'domain_index_fields',
      domain: req.domain,
      indexFields: req.indexFields
    });
  });
};

exports.domainSearch = function(req, res) {
  withDomain(req, res, function(req, res) {
    var query = req.query.query;
    var size = 5;
    var start = Number(req.query.start || 0);

    if (query === undefined) {
      var locals = {
        action: 'domain_search',
        domain: req.domain,
        query: null,
        requestURL: null,
        results: null
      };
      res.render('domain-search', locals);
      return;
    }

    var indexFieldNames = req.indexFields.map(function(indexField) {
      return indexField.Options.IndexFieldName;
    });

    var paramsForSearch = {
      q: query,
      size: size,
      start: start,
      'return-fields': indexFieldNames.join(',')
    };
    var requestURL = 'http://' + req.domain.SearchService.Endpoint + '/2011-02-01/search?' + querystring.stringify(paramsForSearch);

    var buffer = '';
    var results = null;
    http.get(requestURL, function(searchResponse) {
      searchResponse.setEncoding('utf8');
      searchResponse.on('data', function (chunk) {
        buffer += chunk;
      });
      searchResponse.on('end', function() {
        var results = JSON.parse(buffer);
        var locals = {
          action: 'domain_search',
          domain: req.domain,
          query: query,
          requestURL: requestURL,
          results: results,
          start: start,
          nextLink: null,
          previousLink: null
        };

        if (results.hits) {
          if (results.hits.found > start + results.hits.hit.length) {
            var nextLinkParams = {
              query: query,
              start: start + results.hits.hit.length
            };
            locals.nextLink = '/domain/' +
              req.domain.DomainName +
              '/search?' +
              querystring.stringify(nextLinkParams);
          }

          if (start - size >= 0) {
            var previousLinkParams = {
              query: query,
              start: start - size
            };
            locals.previousLink = '/domain/' +
              req.domain.DomainName +
              '/search?' +
              querystring.stringify(previousLinkParams);
          }
        }

        res.render('domain-search', locals);
      });
    });
    // TODO handle errors
  });
};

exports.domainCreate = function(req, res) {
  res.render('domain-create', {
    action: "domain_create",
    domain: null,
    creatingDomainName: null
  });
};

exports.domainCreatePost = function(req, res) {
  var domainName = req.body.domain_name;
  req.cloudsearch.CreateDomain({
    DomainName: domainName
  }, function(error, data) {
    if (error) {
      if (error.Message) {
        res.status(500);
        res.render('error', {error: new Error(error.Message)});
        return;
      }

      res.render('domain-create', {
        action: "domain_create",
        domain: null,
        creatingDomainName: domainName,
        error: errorToRender(error)
      });
      return;
    }

    var domainCreated = data.Body.CreateDomainResponse.CreateDomainResult.DomainStatus;
    req.flash('info', 'Domain successfully created');
    res.redirect('/domain/' + domainCreated.DomainName);
  });
};

exports.domainDelete = function(req, res) {
  req.cloudsearch.DeleteDomain({
    DomainName: req.params.name
  }, function(error, data) {
    if (error) {
      res.status(500);
      res.render('error', {error: new Error(error.Message)});
      return;
    }

    req.flash('info', 'Domain successfully deleted');
    res.redirect('/');
  });
};

exports.domainCreateIndexField = function(req, res) {
  withDomain(req, res, function(req, res) {
    req.cloudsearch.DefineIndexField({
      DomainName: req.domain.DomainName,
      IndexField: {
        IndexFieldName: req.body.name,
        IndexFieldType: req.body.type
      }
    }, function(error, data) {
      if (error) {
        res.status(500);
        res.render('domain-index-fields', {
          error: errorToRender(error),
          action: 'domain_index_fields',
          domain: req.domain,
          indexFields: req.indexFields
        });
        return;
      }
      req.flash('info', 'IndexField successfully created');
      res.redirect('/domain/' + req.domain.DomainName + '/index_fields');
    });
  });
};
