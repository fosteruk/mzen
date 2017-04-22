'use strict'
var TypeCaster = require('../type-caster');

class Validator
{
  static validateMethod(value, validatorName, options, name, root) 
  {
    options = !options || (typeof options == 'boolean') ? {} : options;
    var valiator = Validator[validatorName];
    if (valiator == undefined) throw new Error('Uknown validator "' + validatorName + '"');

    return valiator(value, options, name, root);
  }

  // Validator function
  // - returns an error message string or an array of error messages on failure otherweise returns boolean true
  static required(value, options, name, root)
  {
    var isValid = (value !== undefined);

    var name = options && options['name'] ? options['name'] : name;
    var message = options && options['message'] ? options['message'] : name + ' is required';
    var result = isValid ? isValid : message;

    return result;
  }

  static notNull(value, options, name, root)
  {
    var isValid = (value !== null) && !(
      // The string value NULL or null are treated as a literal null
      typeof value == 'string' && value.toLowerCase() == 'null'
    );
    var name = options && options['name'] ? options['name'] : name;
    var message = options && options['message'] ? options['message'] : name + ' cannot be null';
    var result = isValid ? isValid : message;
    return result;
  }

  static notEmpty(value, options, name, root)
  {
    function isEmpty(value)
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
    var name = options && options['name'] ? options['name'] : name;
    var message = options && options['message'] ? options['message'] : name + ' cannot be empty';
    var result = !isEmpty(value) ? true : message;
    return result;
  }

  static regex(value, options, name, root)
  {
    var regex = options && options['pattern'] ? new RegExp(options['pattern']) : new RegExp;
    var message = options && options['message'] ? options['message'] : name + ' does not appear to be valid';
    var result = regex.test(value) ? true : message;
    return result;
  }

  static email(value, options, name, root)
  {
    var regex = new RegExp(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
    var name = options && options['name'] ? options['name'] : name;
    var message = options && options['message'] ? options['message'] : name + ' does not appear to be a valid email address';
    var result = regex.test(value) ? true : message;
    return result;
  }

  static length(value, options, name, root)
  {
    var min = options && options['min'] ? options['min'] : null;
    var max = options && options['max'] ? options['max'] : null;
    var name = options && options['name'] ? options['name'] : name;
    var messageMin = options && options['message'] ? options['message'] : name + ' must be at least ' + min + ' characters long';
    var messageMax = options && options['message'] ? options['message'] : name + ' must be no more than ' + max + ' characters long';

    var valueType = TypeCaster.getType(value);

    var resultMin = !min || (
      (value != null) &&
      // In Javascript [[]] evalulates to false - we dont want this
      // - an array is only considered empty if it has zero elements
      ((valueType != Array && valueType != String) || value.length >= min) && 
      (valueType != Number || (isNaN(value) && value >= min)) &&
      (valueType != Object || Object.keys(value).length >= min)
    );

    var resultMax = !max || (
      (value != null) &&
      // In Javascript [[]] evalulates to false - we dont want this
      // - an array is only considered empty if it has zero elements
      ((valueType != Array && valueType != String) || value.length <= max) && 
      (valueType != Number || (isNaN(value) && value <= max)) &&
      (valueType != Object || Object.keys(value).length <= max)
    );

    var result = resultMin && resultMax ? true : (!resultMin ? messageMin : messageMax);

    return result;
  }

  static equality(value, options, name, root)
  {
    var path = options && options['path'] ? options['path'] : null;
    var name = options && options['name'] ? options['name'] : name;
    var message = options && options['message'] ? options['message'] : name + ' does not match';
    var result = !path || root[path] === value ? true : message;
    return result;
  }
}

module.exports = Validator;
