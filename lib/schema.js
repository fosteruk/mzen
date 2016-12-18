'use strict'

var clone = require('clone');
var ObjectID = require('mongodb').ObjectID;
var TypeCaster = require('./type-caster');

class Mixed {}

class Schema
{
  constructor(spec, options) 
  {
    this.spec = (spec == undefined) ? {} : spec;
    this.options = (options == undefined) ? {} : options;
  }
  validate(object)
  {
    var meta = {path: '', errors: {}};
    var isArray = Array.isArray(object);
    var objects = isArray ? object : [object];
    // Clone the spec as it may be temporarily modified in the process of validation
    var spec = clone(this.spec);
    
    objects.forEach(function(object, x){
      meta['path'] = isArray ? '[' + x + ']' : '';
      this.validateRecursive(spec, object, meta);
    }, this);
    
    meta.isValid = (Object.keys(meta.errors).length == 0);
    return meta;
  }
  validatePaths(paths, meta)
  {
    var meta = meta ? meta : {path: '', errors: {}};
    var objects = Array.isArray(paths) ? paths : [paths];

    meta['path'] = meta['path'] ? meta['path'] : '';
    objects.forEach(function(object){
      for (let fieldPath in object) {
        if (!object.hasOwnProperty(fieldPath)) continue;
        var isQueryOperator = (Schema.queryOperators.indexOf(fieldPath) !== -1);
        
        var containsOperator = false;
        var operator = null;
        if (TypeCaster.getType(object[fieldPath]) == Object) {
          // If value is an which contains a query operator we must process it as a query part
          for (let x = 0; x < Schema.queryOperators.length; x++) {
            operator = Schema.queryOperators[x];
            if (object[fieldPath][operator] !== undefined) {
              containsOperator = true; 
              break;
            }
          }
        } 
        
        if (containsOperator) {
          if (object[fieldPath]['$in'] || object[fieldPath]['$nin']) {
            // We need to convert the object to an array
            object[fieldPath][operator] = Object.keys(object[fieldPath][operator]).map(function(key){ return object[fieldPath][operator][key]; });
            
            // Validate the elements of the array rather than the array value itself
            object[fieldPath][operator].forEach(function(value, x){
              var spec = this.getSpec(fieldPath);
              object[fieldPath][operator][x] = this.validateField(spec, object[fieldPath][operator][x], meta);
            }.bind(this));
          } else {
            // Validate operator value not the operator object itself
            var spec = this.getSpec(fieldPath);
            object[fieldPath][operator] = this.validateField(spec, object[fieldPath][operator], meta);
          }
        } else {
          meta['path'] = fieldPath;
          var spec = this.getSpec(fieldPath);
          object[fieldPath] = this.validateField(spec, object[fieldPath], meta);
        }
      }
    }.bind(this));
    
    meta.isValid = (Object.keys(meta.errors).length == 0);
    return meta;
  }
  validateQuery(query)
  {
    var meta = meta ? meta : {path: '', errors: {}};
    
    var validateQueryRecursive = function(query) {
      if (TypeCaster.getType(query) == Object) {
        for (let fieldName in query) {
          if (!query.hasOwnProperty(fieldName)) continue;
          var isQueryOperator = (Schema.queryOperators.indexOf(fieldName) !== -1);

          if (isQueryOperator) {
            // If the opertator is no an array operator then we want to remove the operator with its value
            if (['$or', '$and'].indexOf(fieldName) != -1) {
              query[fieldName].forEach(function(value, x){
                validateQueryRecursive(query[fieldName][x], meta);
              }.bind(this));
            } 
          } else {
            this.validatePaths(query, meta);
          }
        }
      } else if (Array.isArray(query)) {
        query.forEach(function(arrayValue, x){
          validateQueryRecursive(query[x], meta);
        }.bind(this));
      }
      return query;
    }.bind(this);
    
    validateQueryRecursive(query);
    
    meta.isValid = (Object.keys(meta.errors).length == 0);
    return meta;
  }
  validateRecursive(spec, object, meta = {})
  {
    meta['path'] = (meta['path'] == undefined) ? '' : meta['path'];
  
    // If match all spec is defined, newSpec defaults to an empty object since any spec rules should be replaced by the match-all
    // - defaults to original spec
    var matchAllSpec = (spec && spec['*'] != undefined) ? spec['*'] : undefined;
    var newSpec = (matchAllSpec != undefined) ? {} :  spec;
    for (var fieldName in object) {
      if (!object.hasOwnProperty(fieldName)) continue;
      
      if (matchAllSpec !== undefined) {
        // If match all '*' field spec is set, we generate a new spec object using the match all spec for every field
        newSpec[fieldName] = matchAllSpec;
      } else if (spec === undefined || spec[fieldName] === undefined) {
        // Any properties of the object under validation, that are not defined defined in the spec
        // - are injected into the spec as "undefined" to allow default validations to be applied
        // If no spec is specified, all fields are set as undefined. This allows default validations to be applied.
        newSpec[fieldName] = undefined;
      }
      var path = meta['path'] + '."' + fieldName + '"';
      if (!Schema.isValidFieldName(fieldName)) {
        meta.errors[path] = {path: path, message: 'Invalid field name'};
      }
    }
    spec = newSpec;

    var basePath = meta['path'];

    for (var fieldName in spec) {
      if (!spec.hasOwnProperty(fieldName)) continue;
      if (fieldName.indexOf('$') === 0) continue; // Descriptor proptery
      meta['path'] = basePath + '.' + fieldName;
      object[fieldName] = this.validateField(spec[fieldName], object[fieldName], meta);
      // MongoDB NodeJS driver converts properties with value undefined to value null on insert 
      // - In order to avoid this we must remove properties with value undefined
      if (object[fieldName] === undefined) delete object[fieldName];
    }

    // If in strict mode we must ensure there are no fields which are not defined by the spec
    if (this.options['strict']) {
      for (var fieldName in object) {
        if (!object.hasOwnProperty(fieldName)) continue;
        var path = basePath + '.' + fieldName;
        if (spec[fieldName] == undefined) {
          meta.errors[path] = {path: path, message: 'Field not specified'};
        }
      }
    }
  }
  validateArrayElements(spec, array, meta = {})
  {
    meta['path'] = (meta['path'] == undefined) ? '' : meta['path'];

    var basePath = meta['path'];
    array.forEach(function(element, x){
      meta['path'] = basePath + '[' + x + ']';
      array[x] = this.validateField(spec, array[x], meta);
    }, this);
  }
  validateField(field, value, meta = {})
  {
    meta['path'] = (meta['path'] == undefined) ? '' : meta['path'];
    
    var fieldType = undefined;
    // If the field type is a string value then it should contain the string name of the required type (converted to a constructor later). 
    // - Otherwise we need to find the constructor, if the value is not already a constructor ([] or {}) 
    if (field) fieldType = field.constructor == String ? field : TypeCaster.getType(field);
    if (fieldType == Object && field['$type'] !== undefined) fieldType = field['$type'];

    if (fieldType && fieldType.constructor == String) { 
      // The fieldType was specified with a String value (not a string constructor)
      // Attempt to covert the field type to a constructor
      fieldType = Schema.types[fieldType];
    }
    
    var validators = field && field['$validate'] ? field['$validate'] : {};
    var filters = field && field['$filter'] ? field['$filter'] : {};
    
    // notNull can be defaulted via global option
    var notNull = validators['notNull'] !== undefined ? validators['notNull'] : this.options['defaultNotNull'];
    if (notNull === undefined) notNull = false; 
      
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
    
    var path = meta['path'];
    if (validators['required'] && value === undefined) {
      meta.errors[path] = {path: path, message: 'Required'};
    } else if (notNull && Schema.isNull(value)) {
      meta.errors[path] = {path: path, message: 'Cannot be NULL'};
    } else if (validators['notEmpty'] && Schema.isEmpty(value)) {
      meta.errors[path] = {path: path, message: 'Can not be empty'};
    } else if (value != undefined) {
      // We only attempt to type cast if the type was specified, the value is not null and not undefined
      // - a type cast failure would result in an error which we do not want in the case of undefined or null
      // - these indicate no-value, and so there is nothing to cast
      switch (fieldType) {
        case Object:
          this.validateRecursive(field, value, meta);
        break;
        case Array:
          var spec  = undefined;
          if (Array.isArray(field) && field[0]) {
            // If the field is an array the specification for the array shoud be contained in the first element
            spec = field[0];
          } else if (TypeCaster.getType(field) == Object && field['$spec']) {
            // If the field type is an object which specifies type "Array" 
            // - then the array spec should be specified using the "spec" property 
            spec = field['$spec'];
          }
          if (spec) {
            this.validateArrayElements(spec, value, meta);
          }
        break;
        default:
          if (fieldType && fieldType != Mixed) value = this.typeCast(fieldType, value, meta);
        break;
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

      var resultType = TypeCaster.getType(result);
      if (
        // We failed to convert to the specified type
        resultType != requiredType || 
        // We converted to type 'number' but the result was NaN so its invalid
        (valueType != Number && resultType == Number && isNaN(result)) 
      ) {
        var path = meta['path'];
        var origValue = ([String, Number, Boolean].indexOf(valueType) != -1) ? "'" + value + "'" : '';
        meta.errors[path] = {path: path, message: origValue + ' of type ' + valueType.name + ' cannot be cast to type ' + requiredType.name};
      }
    }

    return result;
  }
  static isEmpty(value)
  {
    var valueType = value ? TypeCaster.getType(value) : undefined;
    var result = (
      value == undefined ||
      // In Javascript [[]] evalulates to false - we dont want this
      // - an array is only considered empty if it has zero elements
      (valueType != Array && value == false) || 
      (valueType == Number && isNaN(value)) ||
      (valueType == Object && Object.keys(value).length == 0) ||
      (valueType == Array && value.length == 0)
    );
    return result;
  }
  static isNull(value)
  {
    var result = value === null || (
      // The string value NULL or null are treated a literal null
      typeof value == 'string' && value.toLowerCase() == 'null'
    );
    
    return result;
  }
  static isValidFieldName(fieldName)
  {
    var valid = true;
    if (fieldName.charAt(0) == '$') valid = false;
    if (fieldName.indexOf('.') !== -1) valid = false;
    return valid;
  }
  getSpec(path, spec)
  {
    var spec = spec ? spec : this.spec;
    
    var pathParts = path && path ? path.split('.') : [];
    
    var currentPathPart = pathParts.shift();
    if (currentPathPart) {
      if (spec[currentPathPart]) {
        spec = spec[currentPathPart];
      } else {
        var partAsNumber = TypeCaster.cast(Number, currentPathPart);
        var partIsNumber = TypeCaster.getType(partAsNumber) == Number && !isNaN(partAsNumber);
        if (currentPathPart != '*' && partIsNumber == false) {
          // There are no spec defined for the given path
          // - and the path is not an array so there is no matching field config
          return undefined;
        } 
      }
    }
    
    if (pathParts.length) {
      var type =  TypeCaster.getType(spec);
      if (type == Array && spec.length) {
        spec = spec[0];
      } else if (type == Object && spec['$spec']) {
        spec = spec['$spec'];
      }
      spec = this.getSpec(pathParts.join('.'), spec);
    } 

    return spec;
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
