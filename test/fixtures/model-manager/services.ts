import Service from '../../../lib/service';

// services file allows you to full in services from other packages

var TestImportedService = new Service({name: 'testImportedService'});

var services = [
  TestImportedService
];

export default services;
