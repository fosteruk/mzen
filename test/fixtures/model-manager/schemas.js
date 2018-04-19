'use strict'
var Schema = require('mzen-schema');

// schemas file allows you to full in schemas from other packages

var TestImportedSchema = new Schema({$name: 'testImportedSchema'});

var schemas = [
  TestImportedSchema
];

module.exports = schemas;
