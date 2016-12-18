var should = require('should');
var Schema = require('../../lib/schema');

describe('Schema', function () {
  describe('validatePaths', function () {
    it('should process field name', function () {
      var paths = {age: '35'};
      
      var schema = new Schema({
        age: Number
      });

      var result = schema.validatePaths(paths);
      
      should(paths.age).eql(35);
      should(paths.age.constructor).eql(Number);
    });
    it('should process field path', function () {
      var paths = {'name.first': 12345};
      
      var schema = new Schema({
        name: {first: String}
      });

      var result = schema.validatePaths(paths);
      
      should(paths['name.first']).eql('12345');
      should(paths['name.first'].constructor).eql(String);
    });
    it('should process field path array element', function () {
      var paths = {
        'names.0.first': 1234
      };
      
      var schema = new Schema({
        names: [{first: String}]
      });

      var result = schema.validatePaths(paths);
      
      should(paths['names.0.first']).eql('1234');
      should(paths['names.0.first'].constructor).eql(String);
    });
    it('should process field path array', function () {
      var paths = {
        'names.*.first': 1234
      };
      
      var schema = new Schema({
        names: [{first: String}]
      });

      var result = schema.validatePaths(paths);
      
      should(paths['names.*.first']).eql('1234');
      should(paths['names.*.first'].constructor).eql(String);
    });
  });
});
