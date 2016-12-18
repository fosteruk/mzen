'use strict'
var MongoDb = require('./data-source/mongodb');
var ResourceLoader = require('./resource-loader');
//var RepoUser = require('./repo/user');
//var ServiceUserAuth = require('./service/user-auth');

/**
 * ModelManager
 *
 * The model manager is responsible for loading and initialising repositories, services. 
 * It loads repository and service class definitions from the file system.
 */
class ModelManager
{
  constructor(options) {
    this.config = options ? options : {};
    this.config['dataSources'] = this.config['dataSources'] ? this.config['dataSources'] : [];
    this.config['modelDirs'] = this.config['modelDirs'] ? this.config['modelDirs'] : [];
    this.config['entitiesDirName'] = this.config['entitiesDirName'] ? this.config['entitiesDirName'] : 'entities';
    this.config['reposDirName'] = this.config['reposDirName'] ? this.config['reposDirName'] : 'repos';
    this.config['servicesDirName'] = this.config['servicesDirName'] ? this.config['servicesDirName'] : 'services';
    
    this.dataSources = {};
    this.repos = {};
    this.entityConstructors = {};
    this.services = {};
  }
  loadResources()
  {
    var loader = new ResourceLoader();
    return this.loadDataSources().then(
      function(){
        // Load Entity Constructors
        var entities = loader.getResources(this.config['modelDirs'], this.config['entitiesDirName']);
        for (let resourcePath in entities) {
          if (!entities.hasOwnProperty(resourcePath)) continue;
          this.addEntityConstructor(entities[resourcePath]);
        }
        
        // Load Repos
        var repos = loader.getResources(this.config['modelDirs'], this.config['reposDirName']);
        for (let resourcePath in repos) {
          if (!repos.hasOwnProperty(resourcePath)) continue;
          
          var config = loader.getResourceConfig(resourcePath);
          this.repoConfigPrepare(config); // Replaces entity constructor names with actual constructor functions
          var repo = new repos[resourcePath](config);
          this.addRepo(repo);
        }

        // Load services
        var services = loader.getResources(this.config['modelDirs'], this.config['servicesDirName']);
        for (let resourcePath in services) {
          if (!services.hasOwnProperty(resourcePath)) continue;
          
          var config = loader.getResourceConfig(resourcePath);
          var service = new services[resourcePath](config);
          this.addService(service);
        }

        return this;
      }.bind(this)
    );
  }
  repoConfigPrepare(config)
  {
    // When a repo specifies a constructor config by name, we need to replace the constructor name
    // - with the actual contructor function which will have been previously loaded from the 
    // - configured entity constructor directory
    function constructorNotFound(constructorName)
    {
        throw Error('Failed to locate entity with name "' + constructorName + '"');
    }
    
    if (typeof config['entityConstructor'] == 'string') {
      // Repo was configured with string entity name - replace with entity constructor
      var entityConstructor = this.getEntityConstructor(config['entityConstructor']);
      if (entityConstructor) {
        config['entityConstructor'] = entityConstructor;
      } else {
        constructorNotFound(config['entityConstructor']);
      }
    }
    if (config['embeddedConstructors'] != undefined && Object.keys(config['embeddedConstructors']).length) {
      for (var documentPath in config['embeddedConstructors']) {
        if (!config['embeddedConstructors'].hasOwnProperty(documentPath)) continue;
        
        var embeddedConstructor = config['embeddedConstructors'][documentPath];
        if (typeof embeddedConstructor == 'string') {
          // Repo was configured with string entity name - replace with entity constructor
          var embeddedConstructor = this.getEntityConstructor(embeddedConstructor);
          if (embeddedConstructor) {
            config['embeddedConstructors'][documentPath] = embeddedConstructor;
          } else {
            constructorNotFound(constructorName);
          }
        }
      }
    }
  }
  loadDataSources()
  {
    var sourcesCount = this.config['dataSources'].length;
    if (sourcesCount == 0) {
      // No data sources to load
      return Promise.resolve(this);
    } else {
      var promises = [];
      
      this.config['dataSources'].forEach(function(dataSource, x){
        var config = this.config['dataSources'][x];
        promises.push(this.addDataSourceFromConfig(config));
      }, this);

      return Promise.all(promises).then(function(){
        return this;
      }.bind(this));
    }
  }
  addDataSourceFromConfig(options)
  {
    var dataSource = null;
    switch (options.type) {
      case 'mongodb':
        dataSource = new MongoDb(options);
      break;
    }
    
    return this.addDataSource(options.name, dataSource);
  }
  addDataSource(name, dataSource)
  {
      return dataSource.connect()
            .then(
              function(dataSource){
                this.dataSources[name] = dataSource;
                return dataSource;
              }.bind(this)
            );
  }
  getDataSource(name)
  {
    var dataSource = this.dataSources[name] ? this.dataSources[name] : null;
    return dataSource;
  }
  addEntityConstructor(entityConstructor)
  {
    this.entityConstructors[entityConstructor.name] = entityConstructor;
  }
  getEntityConstructor(entityConstructorName)
  {
    var entityConstructor = this.entityConstructors[entityConstructorName] ? this.entityConstructors[entityConstructorName] : null;
    return entityConstructor;
  }
  addRepo(repo)
  {
    this.repos[repo.getName()] = repo;
  }
  getRepo(repoName)
  {
    var repo = this.repos[repoName] ? this.repos[repoName] : null;
    return repo;
  }
  addService(service)
  {
    this.services[service.getName()] = service;
  }
  getService(name)
  {
    var service = this.services[name];
    return service;
  }
  init()
  {
    return this.loadResources().then(function(){
      var dataSourceNames = Object.keys(this.dataSources);
      var defaultDataSourceName = dataSourceNames[0];
      var promises = [];
      for (var repoName in this.repos) {
        if (!this.repos.hasOwnProperty(repoName)) continue;
        
        var repo = this.repos[repoName];
        // Each repo must have a reference to the repo hash so they can load relation data
        repo.repos = this.repos;
        // Data sources are injected into repos to remove the need for a dependency on the ModelManager
        if (this.dataSources[repo.config['dataSource']]) {
          repo.dataSource = this.dataSources[repo.config['dataSource']];
        } else if (defaultDataSourceName !== undefined) {
          repo.dataSource = this.dataSources[defaultDataSourceName];
        }
        promises.push(repo.init());
      }
      for (var serviceName in this.services) {
        if (!this.services.hasOwnProperty(serviceName)) continue;
        
        var service = this.services[serviceName];
        service.repos = this.repos;
        service.services = this.services;
        
        promises.push(service.init());
      }
      return Promise.all(promises).then(function(){
        return this;
      });
    }.bind(this));
  }
  shutdown()
  {
    var promises = [];
    for (var key in this.dataSources) {
      if (!this.dataSources.hasOwnProperty(key)) continue;
      
      promises.push(this.dataSources[key].close());
    }
    return Promise.all(promises);
  }
}

module.exports = ModelManager;
