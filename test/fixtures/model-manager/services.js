'use strict'
var Service = require('../../../lib/service');

// services file allows you to full in services from other packages

var TestImportedService = new Service({name: 'testImportedService'});

var services = [
  TestImportedService
];

module.exports = services;
