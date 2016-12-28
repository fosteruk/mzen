var should = require('should');
var Schema = require('../../lib/schema');

describe('Schema', function () {
  describe('validation', function () {
    /*
    it('should validate field name', function () {
      // Valid field names cannot contain '.' or start with '$'
      var validDataA = {name: 1};
      var validDataB = {name$: 1};
      var invalidDataA = {$name: 1};
      var invalidDataB = {'name.first': 1};

      var schema = new Schema();

      var resultValidA = schema.validate(validDataA);
      var resultValidB = schema.validate(validDataB);
      var resultInvalidA = schema.validate(invalidDataA);
      var resultInvalidB = schema.validate(invalidDataB);

      should(resultValidA.isValid).eql(true);
      should(resultValidB.isValid).eql(true);
      should(resultInvalidA.isValid).eql(false);
      should(resultInvalidB.isValid).eql(false);
    });
    */
    it('should validate required field', function () {
      var validData = {house: 1};
      var invalidData = {other: 1};

      var schema = new Schema({
        house: {$type: Number, $validate: {required: true}}
      });

      var resultValid = schema.validate(validData);
      var resultInvalid = schema.validate(invalidData);

      should(resultValid.isValid).eql(true);
      should(resultInvalid.isValid).eql(false);
    });
    it('should accept a null value to satisfy required setting', function () {
      // The 'required' option simply specifies that the field exists regardless of its value
      var data = {name: null};

      var schema = new Schema({
        name: {$validate: {required: true}}
      });

      var result = schema.validate(data);

      should(result.isValid).eql(true);
    });
    it('should validate required embedded field', function () {
      var validData = {house: {bedRooms: '3', discounted: '1'}};
      var invalidData = {house: {bedRooms: '2'}};

      var schema = new Schema({
        house: {
          bedRooms: Number,
          discounted: {$type: Boolean, $validate: {required: true}},
        }
      });

      var resultValid = schema.validate(validData);
      var resultInvalid = schema.validate(invalidData);

      should(resultValid.isValid).eql(true);
      should(resultInvalid.isValid).eql(false);
    });
    it('should validate required embedded field when given array of objects', function () {
      var validData = [
        {house: {bedRooms: '3', discounted: '1'}},
        {house: {bedRooms: '2', discounted: '0'}}
      ];

      var invalidData = [
        {house: {bedRooms: '3', discounted: '1'}},
        {house: {bedRooms: '2'}}
      ];

      var schema = new Schema({
        house: {
          bedRooms: Number,
          discounted: {$type: Boolean, $validate: {required: true}},
        }
      });

      var resultValid = schema.validate(validData);
      var resultInvalid = schema.validate(invalidData);

      should(resultValid.isValid).eql(true);
      should(resultInvalid.isValid).eql(false);
    });
    it('should validate notNull field', function () {
      var validData = {name: 'Kevin'};
      var invalidData = {name: null};

      var schema = new Schema({
        name: {$type: String, $validate: {notNull: true}}
      });

      var validResult = schema.validate(validData);
      var invalidResult = schema.validate(invalidData);

      should(validResult.isValid).eql(true);
      should(invalidResult.isValid).eql(false);
    });
    it('should validate notEmpty field', function () {
      // An empty field is any falsy value: undefined, null, false, 0, '', [], {}
      var validData = {name: 'Kevin'};

      var invalidDataUndefined = {name: undefined};
      var invalidDataNull = {name: null};
      var invalidDataFalse = {name: false};
      var invalidDataZero = {name: 0};
      var invalidDataEmptyString = {name: ''};

      var validDataNotEmptyArray = {name: [1]};
      var invalidDataEmptyArray = {name: []};
      
      var validDataNotEmptyArrayContainsArray = {name: [[]]};

      var validDataNotEmptyObject = {name: {test: 1}};
      var invalidDataEmptyObject = {name: {}};

      var schema = new Schema({
        name: {$type: Schema.types.Mixed, $validate: {notEmpty: true}}
      });

      var resultValid = schema.validate(validData);

      var resultInvalidUndefined = schema.validate(invalidDataUndefined);
      var resultInvalidNull = schema.validate(invalidDataNull);
      var resultInvalidFalse = schema.validate(invalidDataFalse);
      var resultInvalidZero = schema.validate(invalidDataZero);
      var resultInvalidEmptyString = schema.validate(invalidDataEmptyString);

      var resultValidNotEmptyArray = schema.validate(validDataNotEmptyArray);
      var resultInvalidEmptyArray = schema.validate(invalidDataEmptyArray);
      
      var resultValidNNotEmptyArrayContainsArray = schema.validate(validDataNotEmptyArrayContainsArray);

      var resultValidNotEmptyObject = schema.validate(validDataNotEmptyObject);
      var resultInvalidEmptyObject = schema.validate(invalidDataEmptyObject);

      should(resultValid.isValid).eql(true);

      should(resultInvalidUndefined.isValid).eql(false);
      should(resultInvalidNull.isValid).eql(false);
      should(resultInvalidFalse.isValid).eql(false);
      should(resultInvalidZero.isValid).eql(false);
      should(resultInvalidEmptyString.isValid).eql(false);

      should(resultValidNotEmptyArray.isValid).eql(true);
      should(resultInvalidEmptyArray.isValid).eql(false);
      
      should(resultValidNNotEmptyArrayContainsArray.isValid).eql(true);

      should(resultValidNotEmptyObject.isValid).eql(true);
      should(resultInvalidEmptyObject.isValid).eql(false);
    });
    it('should validate notEmpty object with spec', function () {
      // An empty object is an object is zero fields
      var validData = {name: {first: 'Kevin'}};

      var invalidDataUndefined = {name: undefined};
      var invalidDataNull = {name: null};

      var validDataNotEmptyObject = {name: {other: 1}};
      var invalidDataEmptyObject = {name: {}};

      var schema = new Schema({
        name: {$type: 'Object', $validate: {notEmpty: true}, $spec: {
          first: {$type: String}
        }}
      });

      var resultValid = schema.validate(validData);
      var resultInvalidUndefined = schema.validate(invalidDataUndefined);
      var resultInvalidNull = schema.validate(invalidDataNull);
      var resultValidNotEmptyObject = schema.validate(validDataNotEmptyObject);
      var resultInvalidEmptyObject = schema.validate(invalidDataEmptyObject);


      should(resultValid.isValid).eql(true);
      should(resultInvalidUndefined.isValid).eql(false);
      should(resultInvalidNull.isValid).eql(false);
      should(resultValidNotEmptyObject.isValid).eql(true);
      should(resultInvalidEmptyObject.isValid).eql(false);
    });
    it('should validate notEmpty array with spec', function () {
      // An empty field is any falsy value: undefined, null, false, 0, '', [], {}
      var validDataNotEmptyArray = {name: [1]};
      var validDataNotEmptyArrayArray = {name: [[1]]};
      var validDataNotEmptyArrayZero = {name: [0]};
      var validDataNotEmptyArrayNull = {name: [null]};
      var validDataNotEmptyArrayUndefined = {name: [undefined]};
      var validDataNotEmptyArrayFalse = {name: [false]};
      var validDataNotEmptyArrayEmptyArray = {name: [[]]};
      
      var invalidDataEmptyArray = {name: []};

      var schema = new Schema({
        name: {$type: Array, $validate: {notEmpty: true}}
      });

      var resultValidNotEmptyArray = schema.validate(validDataNotEmptyArray);
      var resultValidNotEmptyArrayArray = schema.validate(validDataNotEmptyArrayArray);
      var resultValidEmptyArrayZero = schema.validate(validDataNotEmptyArrayZero);
      var resultValidEmptyArrayNull = schema.validate(validDataNotEmptyArrayNull);
      var resultValidEmptyArrayUndefined = schema.validate(validDataNotEmptyArrayUndefined);
      var resultValidEmptyArrayFalse = schema.validate(validDataNotEmptyArrayFalse);
      var resultValidEmptyArrayEmptyArray = schema.validate(validDataNotEmptyArrayEmptyArray);
      
      var resultInvalidDataEmptyArray = schema.validate(invalidDataEmptyArray);

      should(resultValidNotEmptyArray.isValid).eql(true);
      should(resultValidNotEmptyArrayArray.isValid).eql(true);
      should(resultValidEmptyArrayZero.isValid).eql(true);
      should(resultValidEmptyArrayNull.isValid).eql(true);
      should(resultValidEmptyArrayUndefined.isValid).eql(true);
      should(resultValidEmptyArrayFalse.isValid).eql(true);
      should(resultValidEmptyArrayEmptyArray.isValid).eql(true);
      
      should(resultInvalidDataEmptyArray.isValid).eql(false);
    });
    it('should validate notEmpty on array elements with mixed type values', function () {
      // An empty field is any falsy value: undefined, null, false, 0, '', [], {}
      var validDataNotEmptyArray = {name: [1]};
      var validDataNotEmptyArrayArray = {name: [[1]]};

      var invalidDataEmptyArrayZero = {name: [0]};
      var invalidDataEmptyArrayNull = {name: [null]};
      var invalidDataEmptyArrayUndefined = {name: [undefined]};
      var invalidDataEmptyArrayFalse = {name: [false]};
      var invalidDataEmptyArrayEmptyArray = {name: [[]]};

      var schema = new Schema({
        name: [{$type: 'Mixed', $validate: {notEmpty: true}}]
      });

      var resultValidNotEmptyArray = schema.validate(validDataNotEmptyArray);
      var resultValidNotEmptyArrayArray = schema.validate(validDataNotEmptyArrayArray);

      var resultInvalidEmptyArrayZero = schema.validate(invalidDataEmptyArrayZero);
      var resultInvalidEmptyArrayNull = schema.validate(invalidDataEmptyArrayNull);
      var resultInvalidEmptyArrayUndefined = schema.validate(invalidDataEmptyArrayUndefined);
      var resultInvalidEmptyArrayFalse = schema.validate(invalidDataEmptyArrayFalse);
      var resultInvalidEmptyArrayEmptyArray = schema.validate(invalidDataEmptyArrayEmptyArray);

      should(resultValidNotEmptyArray.isValid).eql(true);
      should(resultValidNotEmptyArrayArray.isValid).eql(true);

      should(resultInvalidEmptyArrayZero.isValid).eql(false);
      should(resultInvalidEmptyArrayNull.isValid).eql(false);
      should(resultInvalidEmptyArrayUndefined.isValid).eql(false);
      should(resultInvalidEmptyArrayFalse.isValid).eql(false);
      should(resultInvalidEmptyArrayEmptyArray.isValid).eql(false);
    });
    it('should validate notNull on array elements with mixed type values', function () {
      // An empty field is any falsy value: undefined, null, false, 0, '', [], {}
      var validDataNotNullArray = {name: [1]};
      var validDataNotNullArrayArray = {name: [[1]]};
      var invalidDataNullArray = {name: [null]};

      var schema = new Schema({
        name: [{$type: 'Mixed', $validate: {notNull: true}}]
      });

      var resultValidNotNullArray = schema.validate(validDataNotNullArray);
      var resultValidNotNullArrayArray = schema.validate(validDataNotNullArrayArray);

      var resultInvalidNullArray = schema.validate(invalidDataNullArray);

      should(resultValidNotNullArray.isValid).eql(true);
      should(resultValidNotNullArrayArray.isValid).eql(true);
      should(resultInvalidNullArray.isValid).eql(false);
    });
    it('should fail validation if attempt to cast object to primitive', function () {
      var validData = {person: 'Kevin'};
      var invalidData = {person: {age: '33'}};

      var schema = new Schema({
        person: String
      });

      var resultValid = schema.validate(validData);
      var resultInvalid = schema.validate(invalidData);

      should(resultValid.isValid).eql(true);
      should(resultInvalid.isValid).eql(false);
    });
    it('should fail validation in strict mode if unspecified field exists', function () {
      var validData = {age: '33'};
      var invalidData = {age: '33', pi: '3.14159265359'};

      var schema = new Schema({
        age: Number
      }, {strict: true});

      var resultValid = schema.validate(validData);
      var resultInvalid = schema.validate(invalidData);

      should(resultValid.isValid).eql(true);
      should(resultInvalid.isValid).eql(false);
    });
    it('should honour defaultNotNull value', function () {
      var validData = {name: 'Kevin'};
      var invalidData = {name: null};

      var schema = new Schema({name: String}, {defaultNotNull: true});

      var validResult = schema.validate(validData);
      var invalidResult = schema.validate(invalidData);

      should(validResult.isValid).eql(true);
      should(invalidResult.isValid).eql(false);
    });
    it('should honour defaultNotNull value even if field is not defined in spec', function () {
      var validData = {name: {first: 'Kevin'}};
      var invalidData = {name: {first: null}};

      var schema = new Schema({name: {last: String}}, {defaultNotNull: true});

      var validResult = schema.validate(validData);
      var invalidResult = schema.validate(invalidData);

      should(validResult.isValid).eql(true);
      should(invalidResult.isValid).eql(false);
    });
  });
});
