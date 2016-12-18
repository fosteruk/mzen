'use strict'

var ObjectID = require('mongodb').ObjectID;

class TypeCaster
{  
  /**
   * Get Type
   *
   * If value is a function that will be returned otherwise the values constructor will be returned.
   */
  static getType(value)
  {
    return typeof value == 'function' ? value : (value).constructor;
  }
  
  static getTypeName(value)
  {
    return TypeCaster.getType(value).name;
  }

  static cast(toType, value)
  {
    var fromTypeName = TypeCaster.getTypeName(value);
    var fromTypeCaster = TypeCaster.type[fromTypeName];
    if (fromTypeCaster == undefined) throw new Error('Can not cast from unkown type "' + fromTypeName + '"');
    
    var toTypeName = TypeCaster.getTypeName(toType);
    var toTypeCaster = TypeCaster.type[TypeCaster.getTypeName(toType)];
    if (toTypeCaster == undefined) throw new Error('Can not cast to unkown type "' + toTypeName + '"');

    var result = value;
    // If there is a cast function for toType then we cast the value
    // - otherwise the case is not supported so we simply return the original value
    var castFunctionName = TypeCaster.getCastFunctionName(fromTypeName);
    //console.log(toTypeName, toType, castFunctionName);
    if (typeof toTypeCaster[castFunctionName] == 'function') {
      result = toTypeCaster[castFunctionName](value);
    }
    
    return result;
  }
  
  static getCastFunctionName(typeName) 
  {
    return 'cast' + typeName.charAt(0).toUpperCase() + typeName.slice(1);
  }
}

class TypeCasterString
{
  static castNumber(value)
  {
    return (value).toString();
  }
  
  static castBoolean(value)
  {
    return (value) ? '1' : '0';
  }
  
  static castObjectID(value)
  {
    return value.toString();
  }
}

class TypeCasterNumber
{
  static castString(value)
  {
    return (+value);
  }
  
  static castBoolean(value)
  {
    return (value) ? 1 : 0;
  }
}

class TypeCasterBoolean
{
  static castString(value)
  {
    value = value.trim().toLowerCase();
    return (value == '1' || value == 'true');
  }
  
  static castNumber(value)
  {
    return (value > 0);
  }
}

class TypeCasterDate
{
  static castString(value)
  {
    var result = undefined;
    if (value == '' || value.toLowerCase() == 'now') {
      result = new Date();
    } else {
      result = new Date(value);
    }
    return result;
  }
  
  static castNumber(value)
  {
    return new Date(value);
  }
}

class TypeCasterObjectID
{
  static castString(value)
  {
    return new ObjectID(value);
  }
}

TypeCaster.type = {
  String: TypeCasterString, 
  Number: TypeCasterNumber,
  Boolean: TypeCasterBoolean,
  Object: {}, // Object is a valid type but we can not cast a primitive to an object so it has no cast methods
  Array: {}, // Array is a valid type but we can not cast a primitive to an object so it has no cast methods
  Date: TypeCasterDate,
  ObjectID: TypeCasterObjectID, // This is a mongodb specific type
};

module.exports = TypeCaster;
