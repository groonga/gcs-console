var _ = require('underscore');
exports.index = function(req, res){
  res.render('index');
};

exports.domain = function(req, res){
  var domain = _.where(res.locals.domains, {DomainName: req.params.name})[0];
  res.render('domain-show', {domain: domain});
};
