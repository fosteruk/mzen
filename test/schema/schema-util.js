'use strict'
var should = require('should');
var SchemaUtil = require('../../lib/schema/util');

describe('SchemaUtil', function () {
  describe('getSpec()', function () {
    it('should return spec', function () {
      var spec = {
        house: {
          rooms: [{
            name: String,
            sleepHere: Boolean
          }]
        }
      };
      
      var result = SchemaUtil.getSpec('', spec);
      should(result).eql(spec);
    });
    it('should return fields config for path field', function () {
      var spec = {
        house: {
          rooms: [[{
            name: String,
            sleepHere: Boolean
          }]]
        }
      };

      var result = SchemaUtil.getSpec('house', spec);
      should(result).eql(spec.house);
    });
    it('should return fields config for path deep field', function () {
      var spec = {
        house: {
          rooms: [[{
            name: String,
            sleepHere: Boolean
          }]]
        }
      };

      var result = SchemaUtil.getSpec('house.rooms', spec);
      should(result).eql(spec.house.rooms);
    });
    it('should return fields config for path deep array', function () {
      var spec = {
        house: {
          rooms: [[{
            name: String,
            sleepHere: Boolean
          }]]
        }
      };

      var result = SchemaUtil.getSpec('house.rooms.*.*', spec);
      should(result).eql(spec.house.rooms[0][0]);
    });
    it('should return fields config for path deep array using array index path', function () {
      var spec = {
        house: {
          rooms: [[{
            name: String,
            sleepHere: Boolean
          }]]
        }
      };

      var result = SchemaUtil.getSpec('house.rooms.0.1', spec);
      should(result).eql(spec.house.rooms[0][0]);
    });
    it('should return fields config for path deep array using array index path for array defined with object descriptor', function () {
      var spec = {
        house: {
          rooms: {$type: Array, $spec: 
                    {$type: Array, $spec: {
                      name: String,
                      sleepHere: Boolean
                  }}}
        }
      };

      var result = SchemaUtil.getSpec('house.rooms.0', spec);
      should(result).eql(spec.house.rooms.$spec);
    });
    it('should return fields config for path deep array field', function () {
      var spec = {
        house: {
          rooms: [[{
            name: String,
            sleepHere: Boolean
          }]]
        }
      };

      var result = SchemaUtil.getSpec('house.rooms.*.*.name', spec);
      should(result).eql(spec.house.rooms[0][0].name);
    });
  });
});
