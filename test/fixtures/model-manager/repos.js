'use strict'
var Repo = require('../../../lib/repo');

// repos file allows you to full in repos from other packages

var TestImportedRepo = new Repo({name: 'testImportedRepo'});

var repos = [
  TestImportedRepo
];

module.exports = repos;
