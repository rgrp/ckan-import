var CKAN = require('ckan')
  , csv = require('csv')
  , parse = require('csv-parse')
  ;

var Importer = function(ckanInstance, apiKey) {
  this.client = new CKAN.Client(ckanInstance, apiKey);
};

module.exports = Importer;

Importer.prototype.importResource = function(dataStream, resourceJson, cb) {
  var self = this;
  // TODO: get this from the CKAN instance (?)
  var resourceId = resourceJson.id;
  var fields = [];
  if (resourceJson.schema && resourceJson.schema.fields) {
    fields = resourceJson.schema.fields.map(function(field) {
      var type = field.type in CKAN.jsonTableSchema2CkanTypes ? CKAN.jsonTableSchema2CkanTypes[field.type] : field.type;
      return {
        id: field.name,
        type: type
      };
    });
  }
  var data ={
    fields: fields,
    resource_id: resourceId
  };
  if (resourceJson.primaryKey) {
    data.primary_key = resourceJson.primaryKey
  }
  // note columns: true has no affect atm - see
  // https://github.com/wdavidw/node-csv-parse/issues/1
  parse(dataStream, {columns: true}, function(err, rows) {
    // assume a header row on the CSV file
    var cols = rows.shift();
    data.records = rows.map(function(row) {
      var tmp = {};
      cols.forEach(function(field, idx) {
        tmp[field] = row[idx];
      });
      return tmp;
    });
    self.client.action('dataset_create', data, cb);
  });
};

