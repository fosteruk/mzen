var should = require('should');
var Schema = require('../../lib/schema');

describe('Schema', function () {
  describe('stripPrivateFields', function () {
    it('strip private params', function () {
      var data = {
        name: 123,
        age: 35
      };

      var schema = new Schema({
        name: {$type: String, $filter: {private: true}},
      });

      schema.stripPrivateFields(data);

      should(data).eql({age: 35});
    });
    it('strip private params with mode write', function () {
      var data = {
        name: 123,
        age: 35
      };

      var schema = new Schema({
        name: {$type: String, $filter: {private: 'write'}},
      });

      schema.stripPrivateFields(data, 'write');

      should(data).eql({age: 35});
    });
    it('strip private params with mode read', function () {
      var data = {
        name: 123,
        age: 35
      };

      var schema = new Schema({
        name: {$type: String, $filter: {private: 'read'}},
      });

      schema.stripPrivateFields(data, 'read');

      should(data).eql({age: 35});
    });
  });
});
