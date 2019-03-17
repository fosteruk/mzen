"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const service_1 = require("../../../lib/service");
// services file allows you to full in services from other packages
var TestImportedService = new service_1.default({ name: 'testImportedService' });
var services = [
    TestImportedService
];
exports.default = services;
