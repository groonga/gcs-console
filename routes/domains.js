var querystring = require('querystring');
var _ = require('underscore');
var http = require('http');
var awssum = require('awssum');
var DocumentService = awssum.load('amazon/cloudsearch').DocumentService;
var url = require('url');
var fs = require('fs');

exports.index = function(req, res) {
  res.render('index', {action: 'index'});
};

function domainToEndpoint(configurationEndpoint, domain, type) {
  var domainIdComponents = domain.DomainId.split('/');

  return 'http://' + type + '-' + domainIdComponents[1] + '-' + domainIdComponents[0] + '.' + configurationEndpoint.hostname + ':' + configurationEndpoint.port;
}

function countBytes(string) {
  string = encodeURIComponent(string);
  var escapedPartsMatcher = /\%[0-9a-f][0-9a-f]/gi;
  var escapedParts = string.match(escapedPartsMatcher);
  var notEscapedParts = string.replace(escapedPartsMatcher, '');
  return notEscapedParts.length + (escapedParts ? escapedParts.length : 0);
}

function createGcsDocumentService(req, domain) {
  var documentService = new DocumentService({
    domainName: domain.DomainName,
    domainId: domain.DomainId
  });
  var configurationEndpoint = url.parse(req.app.get('endpoint'));
  var endpoint = url.parse(
    domainToEndpoint(configurationEndpoint, domain, 'doc')
  );

  documentService.host = function() {
    return endpoint.hostname;
  };
  documentService.addExtras = function(options, args) {
    options.protocol = endpoint.protocol;
    options.port = endpoint.port;
  };
  documentService.addCommonOptions = function(options, args) {
    options.headers['content-type'] = 'application/json';
    options.headers['content-length'] = countBytes(JSON.stringify(args.Docs));
  };
  return documentService;
}

function withDomain(req, res, callback) {
  var domain = _.where(res.locals.domains, {DomainName: req.params.name})[0];
  domain.isSelected = true;

  req.domain = domain;
  req.documentService = createGcsDocumentService(req, domain);

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

exports.show = function(req, res) {
  withDomain(req, res, function(req, res) {
    res.render('domain-show', {
      action: 'domain_show',
      domain: req.domain
    });
  });
};

exports.indexFields = function(req, res) {
  withDomain(req, res, function(req, res) {
    res.render('domain-index-fields', {
      action: 'domain_index_fields',
      domain: req.domain,
      indexFields: req.indexFields
    });
  });
};

exports.search = function(req, res) {
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

    var configurationEndpoint = url.parse(req.app.get('endpoint'));
    var requestURL = domainToEndpoint(configurationEndpoint, req.domain, 'search') + '/2011-02-01/search?' + querystring.stringify(paramsForSearch);

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

exports.create = function(req, res) {
  res.render('domain-create', {
    action: "domain_create",
    domain: null,
    creatingDomainName: null
  });
};

exports.createPost = function(req, res) {
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

exports.delete = function(req, res) {
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

function onToTrue(str) {
  if (str === 'on') {
    return 'true';
  } else {
    return 'false';
  }
}

exports.createIndexField = function(req, res) {
  withDomain(req, res, function(req, res) {
    var request = {
      DomainName: req.domain.DomainName,
      IndexField: {
        IndexFieldName: req.body.name,
        IndexFieldType: req.body.type
      }
    };

    switch (req.body.type) {
      case 'text':
        request.IndexField.TextOptions = {
          FacetEnabled: onToTrue(req.body.facet),
          ResultEnabled: onToTrue(req.body.result)
        };
        break;
      case 'literal':
        request.IndexField.LiteralOptions = {
          FacetEnabled: onToTrue(req.body.facet),
          ResultEnabled: onToTrue(req.body.result),
          SearchEnabled: onToTrue(req.body.search)
        };
        break;
      case 'uint':
        break;
    }

    var doneCallback = function(error, data) {
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
    };

    req.cloudsearch.DefineIndexField(request, doneCallback);
  });
};

exports.deleteIndexField = function(req, res) {
  withDomain(req, res, function(req, res) {
    req.cloudsearch.DeleteIndexField({
      DomainName: req.domain.DomainName,
      IndexFieldName: req.params.indexFieldName
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
      req.flash('info', 'IndexField successfully deleted');
      res.redirect('/domain/' + req.domain.DomainName + '/index_fields');
    });
  });
};

exports.upload = function(req, res) {
  withDomain(req, res, function(req, res) {
    res.render('domain-upload', {
      action: 'domain_upload',
      domain: req.domain
    });
  });
};

exports.uploadPost = function(req, res) {
  withDomain(req, res, function(req, res) {
    fs.readFile(req.files.batch.path, function(err, data) {
      try {
        var docs = JSON.parse(data);
      } catch(e) {
        res.status(400);
        res.render('domain-upload', {
          action: 'domain_upload',
          domain: req.domain,
          error: new Error('Failed to parse JSON')
        });
      }
      var options = { Docs: docs };

      req.documentService.DocumentsBatch(options, function(err, data) {
        if (err) {
          res.status(400);
          res.render('domain-upload', {
            action: 'domain_upload',
            domain: req.domain,
            error: errorToRender(err)
          });
        }

        req.flash('info', 'SDF Batch Uploaded');
        res.redirect('/domain/' + req.domain.DomainName + '/upload');
      });
    });
  });
};
