'use strict'
var clone = require('clone');
var ObjectID = require('mongodb').ObjectID;
var Mapper = require('./schema/mapper');
var Validator = require('./schema/validator');
var TypeCaster = require('./type-caster');

class Mixed {}

class Schema
{
  constructor(spec, options) 
  {
    this.spec = (spec == undefined) ? {} : spec;
    this.options = (options == undefined) ? {} : options;
    this.mapper = new Mapper(this.spec, this.options);
  }
  validate(object)
  {
    var meta = {path: '', errors: {}, root: object};
    var isArray = Array.isArray(object);
    var objects = isArray ? object : [object];

    this.mapper.map(objects, (fieldSpec, fieldName, fieldContainer, path) => {
      meta['path'] = path;
      fieldContainer[fieldName] = this.validateField(fieldSpec, fieldName, fieldContainer[fieldName], meta);
    });

    meta.isValid = (Object.keys(meta.errors).length == 0);
    return meta;
  }
  validatePaths(paths, meta)
  {
    var meta = meta ? meta : {path: '', errors: {}};
    var objects = Array.isArray(paths) ? paths : [paths];

    this.mapper.mapPaths(objects, (fieldSpec, fieldName, fieldContainer, path) => {
      meta['path'] = path;
      meta['root'] = fieldContainer;
      fieldContainer[fieldName] = this.validateField(fieldSpec, fieldName, fieldContainer[fieldName], meta);
    });
    
    meta.isValid = (Object.keys(meta.errors).length == 0);
    return meta;
  }
  validateQuery(query)
  {
    var meta = meta ? meta : {path: '', errors: {}};

    this.mapper.mapQueryPaths(query, (path, queryPathFieldName, container) => {
      var paths = {};
      paths[path] = container[queryPathFieldName];
      this.mapper.mapPaths(paths, (fieldSpec, fieldName, fieldContainer, path) => {
        container[queryPathFieldName] = this.validateField(fieldSpec, fieldName, fieldContainer[fieldName], meta);
      });
    });

    meta.isValid = (Object.keys(meta.errors).length == 0);
    return meta;
  }
  stripPrivateFields(object, mode)
  {
    mode = mode ? mode : true;
    this.mapper.map(object, (fieldSpec, fieldName, fieldContainer, path) => {
      const filters = fieldSpec && fieldSpec['$filter'] ? fieldSpec['$filter'] : {};
      if (filters['private'] === true || filters['private'] == mode){
        delete fieldContainer[fieldName];
      }
    });
  }
  validateField(spec, fieldName, value, meta = {})
  {
    meta['path'] = (meta['path'] == undefined) ? fieldName : meta['path'];
    
    var fieldType = undefined;
    // If the field type is a string value then it should contain the string name of the required type (converted to a constructor later). 
    // - Otherwise we need to find the constructor, if the value is not already a constructor ([] or {}) 
    if (spec) fieldType = spec.constructor == String ? spec : TypeCaster.getType(spec);
    if (fieldType == Object && spec['$type'] !== undefined) fieldType = spec['$type'];

    if (fieldType && fieldType.constructor == String) { 
      // The fieldType was specified with a String value (not a string constructor)
      // Attempt to covert the field type to a constructor
      fieldType = Schema.types[fieldType];
    }

    const validators = spec && spec['$validate'] ? spec['$validate'] : {};
    const filters = spec && spec['$filter'] ? spec['$filter'] : {};
    
    // notNull can be defaulted via global option
    validators['notNull'] = validators['notNull'] !== undefined ? validators['notNull'] : this.options['defaultNotNull'];
      
    var defaultValue = filters['defaultValue'];
    if (defaultValue === undefined) {
      if (fieldType == Object) {
        defaultValue = {};
      } else if (fieldType == Array) {
        defaultValue = [];
      } else if (fieldType == Schema.types.ObjectID) {
        defaultValue = function(){
          return new Schema.types.ObjectID;
        };
      }
    }
    
    if ((value === undefined || Schema.isNull(value)) && defaultValue !== undefined) {
      value = (typeof defaultValue == 'function') ? defaultValue() : defaultValue;
    }

    if (!Number.isInteger(fieldName) && !Schema.isValidFieldName(fieldName)) {
      meta.errors[path] = {path: meta['path'], message: 'Invalid field name'};
    }

    var path = meta['path'];

    Object.keys(validators).forEach((validatorName) => {
      let results = Validator.validateMethod(value, validatorName, validators[validatorName], path, meta['root']);
      if (results !== true) {
        // results can be a string error or an array of errors
        results = Array.isArray(results) ? results : [results];
        results.forEach((result) =>{
          meta.errors[path] = {path: path, message: result};
        });
      }
    });
    
    if (value != undefined) {
      // We only attempt to type cast if the type was specified, the value is not null and not undefined
      // - a type cast failure would result in an error which we do not want in the case of undefined or null
      // - these indicate no-value, and so there is nothing to cast
      if (fieldType && fieldType != Mixed) value = this.typeCast(fieldType, value, meta);
    }

    if (fieldType == Object) {
      // If in strict mode we must ensure there are no fields which are not defined by the spec
      if (this.options['strict']) {
        for (let fieldName in value) {
          var path = path + '.' + fieldName;
          if (spec[fieldName] == undefined) {
            meta.errors[path] = {path: path, message: 'Field not specified'};
          }
        }
      }
    }

    return value;
  }
  typeCast(requiredType, value, meta = {})
  {
    var result = value;
    
    var valueType = TypeCaster.getType(value);

    if (requiredType != valueType) {
      result = TypeCaster.cast(requiredType, value);

      let resultType = TypeCaster.getType(result);
      if (
        // We failed to convert to the specified type
        resultType != requiredType || 
        // We converted to type 'number' but the result was NaN so its invalid
        (valueType != Number && resultType == Number && isNaN(result)) 
      ) {
        let path = meta['path'];
        let origValue = ([String, Number, Boolean].indexOf(valueType) != -1) ? "'" + value + "'" : '';
        meta.errors[path] = {path: path, message: origValue + ' of type ' + valueType.name + ' cannot be cast to type ' + requiredType.name};
      }
    }

    return result;
  }
  static isNull(value)
  {
    var result = value === null || (
      // The string value NULL or null are treated as a literal null
      typeof value == 'string' && value.toLowerCase() == 'null'
    );
    
    return result;
  }
  static isValidFieldName(fieldName)
  {
    var valid = true;
    if (valid && fieldName.charAt(0) == '$') valid = false;
    return valid;
  }
  static mergeValidationResults(results)
  {
    results = Array.isArray(results) ? results : [];
    var finalResult = {errors: {}};
    results.forEach(function(result, x){
      if (result.errors) Object.assign(finalResult.errors, result.errors)
    });
    finalResult.isValid = (Object.keys(finalResult.errors).length == 0);
    return finalResult;
  }
}

Schema.queryOperators = ['$eq', '$gt', '$gte', '$lt', '$lte', '$ne', '$in', '$nin', '$or', '$and', '$not', '$nor'];

Schema.types = {
  String: String,
  Number: Number,
  Boolean: Boolean,
  Array: Array,
  Object: Object,
  Date: Date,
  ObjectID: ObjectID,
  Mixed: Mixed
};

module.exports = Schema;
