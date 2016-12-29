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
    for (var actionName in this.config['action']){
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
  /**
   * Execute action
   *
   * An action is a method on a service object whos name ends with this.actionSuffix which defaults to 'Act'.
   * The second parameter is the request object which is passed as the single argument to the action method.
   */
  execute(actionName, request)
  {
    const method = this.getActionMethod(actionName);
    var result = Promise.resolve();
    if (typeof method == 'function') {
        result = Promise.resolve(
          method.call(this, request)
      ); 
    } else {
      throw new Error('Invalid service action');
    }
    return result;
  }
  prepRequest(request, action)
  {
    var promises = [];
    
    if (action) {
      const actionConfig = this.config['action'][action];
      if (actionConfig) {
        var autoLoadPromises = [];
        if (actionConfig['autoload']) {
          promises.push(this.autoloadParams(actionConfig, request));
        }
        if (actionConfig['schema']) {
          promises.push([Promise.resolve(this.applySchemaValiation(actionConfig, request))]);
        }
      }
    }
    
    const promise = promises.length == 0 ? Promise.resolve() : Promise.all(promises);
    return promise.then(function(){
      return request;
    });
  }
  applySchemaValiation(actionConfig, request)
  {
    if (actionConfig && actionConfig['schema']) {
      const schema = new Schema(actionConfig['schema']);
      schema.validate(request);
    }
  }
  prepSchema(schema)
  {
    var getRepoSchema = function(schemaRepoDescriptor) {
      const repoName = schemaRepoDescriptor.constructor == String ? schemaRepoDescriptor : schemaRepoDescriptor['name'];
      const repoPath = schemaRepoDescriptor.constructor == Object ? schemaRepoDescriptor['path'] : '';
      
      const repo = this.getRepo(repoName);
      return repo.schema.getSpec(repoPath);
    }.bind(this);
    
    if (schema['$repo']) { 
      schema = getRepoSchema(schema['$repo']);
    }
    
    for (var propName in schema) {
      if (!schema.hasOwnProperty(propName)) continue;
      if (schema[propName].constructor == 'Object') {
        if (schema[propName]['$repo']) {
          schema[propName] = getRepoSchema(schema[propName]['$repo']);
        } else {
          schema[propName] = this.prepSchema(schema[propName]);
        }
      } else if (schema[propName].constructor == 'Array') {
        schema[propName].forEach(function(element, x){
          if (schema[propName][x]['$repo']) {
            schema[propName][x] = getRepoSchema(schema[propName][x]['$repo']);
          }
        });
      }
    }
    
    return schema;
  }
  autoloadParams(actionConfig, request)
  {
    var promises = [];
    if (actionConfig && actionConfig['autoload']) {
      // Replace param ids with entities
      for (var paramName in actionConfig['autoload']) {
        if (!actionConfig['autoload'].hasOwnProperty(paramName)) continue;
        
        const requestValue = request[paramName];
        if (requestValue == undefined) continue; // Param was not provided in the request - nothing to do here
        
        const isArray = Array.isArray(requestValue);
        const ids = isArray ? requestValue : [requestValue];
        const paramConfig = actionConfig['autoload'][paramName];
        // Given param is an array but we are not expecting an array
        // - skip this parmater since we can not do any further processing 
        // - todo: this should really produce an error but im not sure how that would be handled
        if (isArray && !paramConfig['isArray']) continue; 
        
        // Add a default query limit as a security measure
        const limit = paramConfig['limit'] ? paramConfig['limit'] : 1000;
        
        var repoName = paramConfig['repo'];
        if (repoName) {
          var repo = this.repos[repoName];
          if (repo) {
            var key = paramConfig['key'] ? paramConfig['key'] : repo.config['pkey'];
            if (key){
              var query = {};
              query[key] = isArray ? {'$in': ids} : ids[0];
              var promise = repo.find(query, {limit: limit}).then(function(entities){
                request[paramName] = !isArray && entities ? entities[0] : entities;
              });
              promises.push(promise);
            }
          }
        }
      }
    }
    
    var promise = promises.length == 0 ? Promise.resolve() : Promise.all(promises);
    return promise;
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
