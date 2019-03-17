import Schema from 'mzen-schema';

// schemas file allows you to full in schemas from other packages

var TestImportedSchema = new Schema({$name: 'testImportedSchema'});

var schemas = [
  TestImportedSchema
];

export default schemas;
