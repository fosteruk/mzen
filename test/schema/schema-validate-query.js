var should = require('should');
var Schema = require('../../lib/schema');

describe('Schema', function () {
  describe('validateQuery', function () {
    it('should cast query parameters', function () {
      var data = {
        name: {$eq: 123},
        age: {$lt: '33'},
        cityId: {$in: ['10', '11', '12']},
        countryId: {$nin: [13, 14, 15]},
      };

      var schema = new Schema({
        name: String,
        age: Number,
        cityId: Number,
        countryId: String
      });

      schema.validateQuery(data);

      should(data.name.$eq).eql('123');
      should(data.name.$eq.constructor).eql(String);
      should(data.age.$lt).eql(33);
      should(data.age.$lt.constructor).eql(Number);
      should(data.cityId.$in).eql([10, 11, 12]);
      should(data.cityId.$in[0].constructor).eql(Number);
      should(data.cityId.$in[1].constructor).eql(Number);
      should(data.cityId.$in[2].constructor).eql(Number);
      should(data.countryId.$nin).eql(['13', '14', '15']);
      should(data.countryId.$nin[0].constructor).eql(String);
      should(data.countryId.$nin[1].constructor).eql(String);
      should(data.countryId.$nin[2].constructor).eql(String);
    });
    it('should cast query parameters within conditional $or', function () {
      var data = {
        '$or': [
          {name: {$eq: 123}},
          {name: {$eq: 456}}
        ]
      };

      var schema = new Schema({
        name: String,
      });

      schema.validateQuery(data);

      should(data.$or[0].name.$eq).eql('123');
      should(data.$or[0].name.$eq.constructor).eql(String);
      should(data.$or[1].name.$eq).eql('456');
      should(data.$or[1].name.$eq.constructor).eql(String);
    });
    it('should cast query parameters of $in operator', function () {
      var data = {
        name: {$in: [123, 456, 789]} 
      };

      var schema = new Schema({
        name: String
      });

      schema.validateQuery(data);

      should(data.name.$in[0]).eql('123');
      should(data.name.$in[0].constructor).eql(String);
      should(data.name.$in[1]).eql('456');
      should(data.name.$in[1].constructor).eql(String);
      should(data.name.$in[2]).eql('789');
      should(data.name.$in[2].constructor).eql(String);
    });
    it('should cast query parameters of $nin operator', function () {
      var data = {
        name: {$nin: [123, 456, 789]} 
      };

      var schema = new Schema({
        name: String
      });

      schema.validateQuery(data);

      should(data.name.$nin[0]).eql('123');
      should(data.name.$nin[0].constructor).eql(String);
      should(data.name.$nin[1]).eql('456');
      should(data.name.$nin[1].constructor).eql(String);
      should(data.name.$nin[2]).eql('789');
      should(data.name.$nin[2].constructor).eql(String);
    });
    it('should cast query parameters within conditional $and', function () {
      var data = {
        '$and': [
          {name: {$eq: 123}},
          {age: {$eq: '35'}}
        ]
      };

      var schema = new Schema({
        name: String,
        age: Number
      });

      schema.validateQuery(data);

      should(data.$and[0].name.$eq).eql('123');
      should(data.$and[0].name.$eq.constructor).eql(String);
      should(data.$and[1].age.$eq).eql(35);
      should(data.$and[1].age.$eq.constructor).eql(Number);
    });
    it('should cast query parameters within nested conditionals', function () {
      var data = {
        '$or': [
          {
            '$and': [
              {name: {$eq: 123}},
              {age: {$eq: '35'}}
            ]
          },
          {
            '$and': [
              {name: {$in: [456]}},
              {age: {$nin: ['37']}}
            ]
          },
        ]
      };

      var schema = new Schema({
        name: String,
        age: Number
      });

      schema.validateQuery(data);

      should(data.$or[0].$and[0].name.$eq).eql('123');
      should(data.$or[0].$and[0].name.$eq.constructor).eql(String);
      should(data.$or[0].$and[1].age.$eq).eql(35);
      should(data.$or[0].$and[1].age.$eq.constructor).eql(Number);
      should(data.$or[1].$and[0].name.$in[0]).eql('456');
      should(data.$or[1].$and[0].name.$in[0].constructor).eql(String);
      should(data.$or[1].$and[1].age.$nin[0]).eql(37);
      should(data.$or[1].$and[1].age.$nin[0].constructor).eql(Number);
    });
  });
});
