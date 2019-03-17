"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const repo_1 = require("../../../lib/repo");
// repos file allows you to full in repos from other packages
var TestImportedRepo = new repo_1.default({ name: 'testImportedRepo' });
var repos = [
    TestImportedRepo
];
exports.default = repos;
