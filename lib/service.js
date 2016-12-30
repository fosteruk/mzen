'use strict'

var Schema = require('./schema');

class Service
{
  constructor(options = {}) {
    this.config = options;
    this.config['actionSuffix'] = this.config['actionSuffix'] ? this.config['actionSuffix'] : 'Act';
    this.config['action'] = this.config['action'] ? this.config['action'] : {};
    this.config['api'] = this.config['api'] ? this.config['api'] : {};
    this.config['api']['endpoints'] = this.config['api']['endpoints'] ? this.config['api']['endpoints'] : {};
    this.config['api']['endpointsEnabled'] = this.config['endpointsEnabled'] ? this.config['endpointsEnabled'] : {};
    this.repos = {};
    this.services = {};
  }
  init()
  {
    // Prepare schemas 
    for (let actionName in this.config['action']){
      if (!this.config['action'].hasOwnProperty(actionName)) continue;
      if (this.config['action'][actionName]['schema']) {
        this.config['action'][actionName]['schema'] = this.prepSchema(this.config['action'][actionName]['schema']);
      }
    }
    
    // This method might need to do async work at some point we return a promise
    return Promise.resolve();
  }
  getName()
  {
    // Service name defaults to the name of the constructor
    const name = this.config['name'] ? this.config['name'] : this.constructor.name;
    // If service name == 'Service' then we are most likely using the name of the default service constrcutor. 
    // This can cause problems because services are referred to by name in the model and if we have multiple 
    // services named 'Service' we could not be sure which one we are working with
    // For this reason we do not permit a service to be named 'Service' 
    if (name == 'Service') throw new Error('Service name not configured - you must specify a service name when using the default service constructor');
    return name;
  }
  getRepo(name)
  {
    return this.repos[name];
  }
  getService(name)
  {
    return this.services[name];
  }
}
module.exports = Service;
