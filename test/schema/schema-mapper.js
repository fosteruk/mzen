var should = require('should');
var SchemaMapper = require('../../lib/schema/mapper');

describe('SchemaMapper', function () {
  describe('map', function () {
    it('should callback with field spec', function () {
      var spec = {name: String};
      var schemaIterator = new SchemaMapper(spec);

      var results = [];
      schemaIterator.map({name: 'Kevin'}, function(fieldSpec){
        results.push({fieldSpec});
      });
      should(results[0].fieldSpec).eql(spec);
      should(results[1].fieldSpec).eql(spec.name);
    });
    it('should callback with field name', function () {
      var spec = {name: String};
      var schemaIterator = new SchemaMapper(spec);

      var results = [];
      schemaIterator.map({name: 'Kevin'}, function(fieldSpec, fieldName){
        results.push({fieldName});
      });
      should(results[0].fieldName).eql(0);
      should(results[1].fieldName).eql('name');
    });
    it('should callback with field index of array value', function () {
      var spec = {names: [String]};
      var schemaIterator = new SchemaMapper(spec);

      var results = [];
      schemaIterator.map({names: ['Kevin']}, function(fieldSpec, fieldName){
        results.push({fieldName});
      });

      should(results[0].fieldName).eql(0);
      should(results[1].fieldName).eql('names');
      should(results[2].fieldName).eql(0);
    });
    it('should callback with field container object', function () {
      var spec = {name: String};
      var schemaIterator = new SchemaMapper(spec);
      var value = [{name: 'Kevin'}];

      var results = [];
      schemaIterator.map(value, function(fieldSpec, fieldName, fieldContainer){
        results.push({fieldContainer});
      });

      should(results[0].fieldContainer).eql(value);
      should(results[1].fieldContainer).eql(value[0]);
    });
    it('should callback with field container array', function () {
      var spec = {names: [String]};
      var schemaIterator = new SchemaMapper(spec);
      var value = [{names: ['Kevin']}];

      var results = [];
      schemaIterator.map(value, function(fieldSpec, fieldName, fieldContainer){
        results.push({fieldContainer});
      });
      
      should(results[0].fieldContainer).eql(value);
      should(results[1].fieldContainer).eql(value[0]);
      should(results[2].fieldContainer).eql(value[0].names);
    });
    it('should callback with field path', function () {
      var spec = {name: String};
      var schemaIterator = new SchemaMapper(spec);

      var results = [];
      schemaIterator.map({name: 'Kevin'}, function(fieldSpec, fieldName, fieldContainer, path){
        results.push({path});
      });

      should(results[0].path).eql('');
      should(results[1].path).eql('name');
    });
  });
  describe('mapPaths', function () {
    it('should callback with field spec', function () {
      var spec = {name: String};
      var schemaIterator = new SchemaMapper(spec);
      schemaIterator.mapPaths({'name': 'Kevin'}, function(fieldSpec){
        should(fieldSpec).eql(String);
      });
    });
    it('should callback with field name', function () {
      var spec = {name: String};
      var schemaIterator = new SchemaMapper(spec);
      schemaIterator.mapPaths({'name': 'Kevin'}, function(fieldSpec, fieldName){
        should(fieldName).eql('name');
      });
    });
    it('should callback with field index of array value', function () {
      var spec = {names: [String]};
      var schemaIterator = new SchemaMapper(spec);
      
      var results = [];
      schemaIterator.mapPaths({'names': ['Kevin']}, function(fieldSpec, fieldName){
        results.push({fieldName});
      });
      should(results[0].fieldName).eql('names');
      should(results[1].fieldName).eql(0);
    });
    it('should callback with field container object', function () {
      var spec = {name: String};
      var schemaIterator = new SchemaMapper(spec);
      var object = {name: 'Kevin'};
      schemaIterator.mapPaths({name: 'Kevin'}, function(fieldSpec, fieldName, fieldContainer){
        should(fieldContainer).eql(object);
      });
    });
    it('should callback with field container array', function () {
      var spec = {names: [String]};
      var schemaIterator = new SchemaMapper(spec);
      var value = {names: ['Kevin']};

      var results = [];
      schemaIterator.mapPaths({names: ['Kevin']}, function(fieldSpec, fieldName, fieldContainer){
        results.push({fieldContainer});
      });
      should(results[0].fieldContainer).eql(value);
      should(results[1].fieldContainer).eql(value.names);
    });
    it('should callback with field path', function () {
      var spec = {name: String};
      var schemaIterator = new SchemaMapper(spec);
      schemaIterator.mapPaths({name: 'Kevin'}, function(fieldSpec, fieldName, fieldContainer, path){
        should(path).eql('name');
      });
    });
  });
});
