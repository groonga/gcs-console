jQuery(document).ready(function($) {
  function IndexFieldsOptionsViewModel() {
    var self = this;

    /* observers */
    this.chosenType = ko.observable();
    this.searchChecked = ko.observable();
    this.facetChecked = ko.observable();
    this.resultChecked = ko.observable();

    /* treat choosable options for each type */
    this.searchChoosable = ko.computed(function() {
      return this.chosenType() === 'literal';
    }, this);
    this.facetChoosable = ko.computed(function() {
      return this.chosenType() !== 'uint';
    }, this);
    this.resultChoosable = ko.computed(function() {
      return this.chosenType() !== 'uint';
    }, this);

    /* set initial options for each type */
    this.chosenType.subscribe(function(newType) {
      switch (newType) {
        case 'text':
          self.searchChecked(true);
          self.facetChecked(false);
          self.resultChecked(false);
          break;
        case 'literal':
          self.searchChecked(false);
          self.facetChecked(false);
          self.resultChecked(false);
          break;
        case 'uint':
          self.searchChecked(true);
          self.facetChecked(true);
          self.resultChecked(true);
          break;
      }
    });

    /* 'facet' and 'result' are exclusive except for uint */
    this.facetChecked.subscribe(function(facetChecked) {
      if (self.chosenType() === 'uint') {
        return;
      }
      if (facetChecked) {
        self.resultChecked(false);
      }
    });
    this.resultChecked.subscribe(function(resultChecked) {
      if (self.chosenType() === 'uint') {
        return;
      }
      if (resultChecked) {
        self.facetChecked(false);
      }
    });
  }

  ko.applyBindings(new IndexFieldsOptionsViewModel());
});
