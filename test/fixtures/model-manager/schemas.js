"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mzen_schema_1 = require("mzen-schema");
// schemas file allows you to full in schemas from other packages
var TestImportedSchema = new mzen_schema_1.default({ $name: 'testImportedSchema' });
var schemas = [
    TestImportedSchema
];
exports.default = schemas;
