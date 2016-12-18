var should = require('should');
var Schema = require('../../lib/schema');

describe('Schema', function () {
  describe('default value', function () {
    it('should inject default value when undefined', function () {
      var data = {};

      var schema = new Schema({
        house: {$type: Number, $filter: {defaultValue: 5}}
      });

      schema.validate(data);

      should(data.house).eql(5);
    });
    it('should inject default function value when undefined', function () {
      var data = {};

      var schema = new Schema({
        created: {$type: Date, $filter: {defaultValue: () => new Date}}
      });

      schema.validate(data);

      should(data.created.constructor.name).eql('Date');
    });
    it('should inject default value when null', function () {
      var data = {house: null};

      var schema = new Schema({
        house: {$type: Number, $filter: {defaultValue: 5}}
      });

      schema.validate(data);

      should(data.house).eql(5);
    });
    it('should inject default value when null, even when defined as not null', function () {
      var data = {house: null};

      var schema = new Schema({
        house: {$type: Number, $validate: {notNull: true}, $filter: {defaultValue: 5}}
      });

      schema.validate(data);

      should(data.house).eql(5);
    });
    it('should validate injected default value', function () {
      var schemaValid = new Schema({
        house: {$type: Number, $validate: {notNull: true}, $filter: {defaultValue: 5}}
      });
      var schemaInvalidNull = new Schema({
        house: {$type: Number, $validate: {notNull: true}, $filter: {defaultValue: null}}
      });
      var schemaInvalidEmpty = new Schema({
        house: {$type: Number, $validate: {notEmpty: true}, $filter: {defaultValue: 0}}
      });
      var schemaInvalidUndefined = new Schema({
        house: {$type: Number, $validate: {required: true}, $filter: {defaultValue: undefined}}
      });

      var resultValid = schemaValid.validate({});
      var resultInvalidNull = schemaInvalidNull.validate({});
      var resultInvalidEmpty = schemaInvalidEmpty.validate({});
      var resultInvalidUndefined = schemaInvalidUndefined.validate({});

      should(resultValid.isValid).eql(true);
      should(resultInvalidNull.isValid).eql(false);
      should(resultInvalidEmpty.isValid).eql(false);
      should(resultInvalidUndefined.isValid).eql(false);
    });
    it('should validate injected default function value', function () {
      var schemaValid = new Schema({
        house: {$type: Number, $validate: {notNull: true}, $filter: {defaultValue: () => 5}}
      });
      var schemaInvalidNull = new Schema({
        house: {$type: Number, $validate: {notNull: true}, $filter: {defaultValue: () => null}}
      });
      var schemaInvalidEmpty = new Schema({
        house: {$type: Number, $validate: {notEmpty: true}, $filter: {defaultValue: () => 0}}
      });
      var schemaInvalidUndefined = new Schema({
        house: {$type: Number, $validate: {required: true}, $filter: {defaultValue: () => undefined}}
      });

      var resultValid = schemaValid.validate({});
      var resultInvalidNull = schemaInvalidNull.validate({});
      var resultInvalidEmpty = schemaInvalidEmpty.validate({});
      var resultInvalidUndefined = schemaInvalidUndefined.validate({});

      should(resultValid.isValid).eql(true);
      should(resultInvalidNull.isValid).eql(false);
      should(resultInvalidEmpty.isValid).eql(false);
      should(resultInvalidUndefined.isValid).eql(false);
    });
    it('should inject empty object if no default object value is provided', function () {
      var data = {};

      var schema = new Schema({
        user: {
          $type: Object
        }
      });

      schema.validate(data);

      should(data.user).be.type('object');
      should(data.user).eql({});
    });
    it('should inject empty nested object if no default object value is provided', function () {
      var data = {};

      var schema = new Schema({
        user: {
          address: {}
        }
      });

      schema.validate(data);

      should(data.user.address).be.type('object');
      should(data.user.address).eql({});
    });
    it('should set field with primitive type to undefined if not provided', function () {
      var data = {};

      var schema = new Schema({
        name: {$type: String}
      });
      
      schema.validate(data);

      should(data.name).be.type('undefined');
    });
    it('should set field of nested object with primitive type to undefined if not provided', function () {
      var data = {};

      var schema = new Schema({
        user: {
          name: {$type: String}
        }
      });

      schema.validate(data);

      should(data.user.name).be.type('undefined');
    });
    it('should set default value on nested object even if parent object was not provided', function () {
      var data = {};

      var schema = new Schema({
        user: {
          name: {$type: String, $filter: {defaultValue: 'Kevin'}}
        }
      });

      schema.validate(data);

      should(data.user.name).be.type('string');
      should(data.user.name).eql('Kevin');
    });
  });
});
