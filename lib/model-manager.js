'use strict'
var MongoDb = require('./data-source/mongodb');
var ResourceLoader = require('./resource-loader');

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
    const loader = new ResourceLoader();
    return Promise.resolve().then(() => {
        // Load Entity Constructors
        const entities = loader.getResources(this.config['modelDirs'], this.config['entitiesDirName']);
        for (let resourcePath in entities) {
          if (!entities.hasOwnProperty(resourcePath)) continue;
          this.addEntityConstructor(entities[resourcePath]);
        }
        
        // Load Repos
        const repos = loader.getResources(this.config['modelDirs'], this.config['reposDirName']);
        for (let resourcePath in repos) {
          if (!repos.hasOwnProperty(resourcePath)) continue;
          
          const config = loader.getResourceConfig(resourcePath);
          this.repoConfigPrepare(config); // Replaces entity constructor names with actual constructor functions
          const repo = new repos[resourcePath](config);
          this.addRepo(repo);
        }

        // Load services
        const services = loader.getResources(this.config['modelDirs'], this.config['servicesDirName']);
        for (let resourcePath in services) {
          if (!services.hasOwnProperty(resourcePath)) continue;
          
          const config = loader.getResourceConfig(resourcePath);
          const service = new services[resourcePath](config);
          this.addService(service);
        }

        return this;
    });
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
      const entityConstructor = this.getEntityConstructor(config['entityConstructor']);
      if (entityConstructor) {
        config['entityConstructor'] = entityConstructor;
      } else {
        constructorNotFound(config['entityConstructor']);
      }
    }
    if (config['embeddedConstructors'] != undefined && Object.keys(config['embeddedConstructors']).length) {
      for (let documentPath in config['embeddedConstructors']) {
        if (!config['embeddedConstructors'].hasOwnProperty(documentPath)) continue;
        
        let embeddedConstructor = config['embeddedConstructors'][documentPath];
        if (typeof embeddedConstructor == 'string') {
          // Repo was configured with string entity name - replace with entity constructor
          embeddedConstructor = this.getEntityConstructor(embeddedConstructor);
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
    const sourcesCount = this.config['dataSources'].length;
    if (sourcesCount == 0) {
      // No data sources to load
      return Promise.resolve(this);
    } else {
      let promises = [];
      
      this.config['dataSources'].forEach(function(dataSource, x){
        var config = this.config['dataSources'][x];
        promises.push(this.addDataSourceFromConfig(config));
      }, this);

      return Promise.all(promises).then(() => this);
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
            .then((dataSource) => {
              this.dataSources[name] = dataSource;
              return dataSource;
            });
  }
  getDataSource(name)
  {
    const dataSource = this.dataSources[name] ? this.dataSources[name] : null;
    return dataSource;
  }
  addEntityConstructor(entityConstructor)
  {
    this.entityConstructors[entityConstructor.name] = entityConstructor;
  }
  getEntityConstructor(entityConstructorName)
  {
    const entityConstructor = this.entityConstructors[entityConstructorName] ? this.entityConstructors[entityConstructorName] : null;
    return entityConstructor;
  }
  addRepo(repo)
  {
    this.repos[repo.getName()] = repo;
  }
  getRepo(repoName)
  {
    const repo = this.repos[repoName] ? this.repos[repoName] : null;
    return repo;
  }
  addService(service)
  {
    this.services[service.getName()] = service;
  }
  getService(name)
  {
    const service = this.services[name];
    return service;
  }
  async init()
  {
    await this.loadDataSources(); 
    await this.loadResources();

    let dataSourceNames = Object.keys(this.dataSources);
    const defaultDataSourceName = dataSourceNames[0];
    let promises = [];
    for (let repoName in this.repos) {
      const repo = this.repos[repoName];
      // We inject the main config object into every repo so it can access global config values
      repo.config.model = this.config;
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
    for (let serviceName in this.services) {  
      const service = this.services[serviceName];
      // We inject the main config object into every service so it can access global config values
      service.config.model = this.config;
      service.repos = this.repos;
      service.services = this.services;
      promises.push(service.init());
    }
    await Promise.all(promises);
    return this;
  }
  shutdown()
  {
    var promises = [];
    for (let key in this.dataSources) {
      if (!this.dataSources.hasOwnProperty(key)) continue;
      promises.push(this.dataSources[key].close());
    }
    return Promise.all(promises);
  }
}

module.exports = ModelManager;
