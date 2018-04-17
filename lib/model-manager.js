'use strict'
var MongoDb = require('./data-source/mongodb');
var ResourceLoader = require('./resource-loader');
var Schema = require('mzen-schema');
var Repo = require('./repo');
var Service = require('./service');

/**
 * ModelManager
 *
 * The model manager is responsible for loading and initialising repositories, services.
 * It loads repository and service class definitions from the file system.
 */
class ModelManager
{
  constructor(options)
  {
    this.config = options ? options : {};
    this.config['dataSources'] = this.config['dataSources'] ? this.config['dataSources'] : [];
    this.config['modelDirs'] = this.config['modelDirs'] ? this.config['modelDirs'] : [];
    this.config['schemasDirName'] = this.config['schemasDirName'] ? this.config['schemasDirName'] : 'schemas';
    this.config['entitiesDirName'] = this.config['entitiesDirName'] ? this.config['entitiesDirName'] : 'entities';
    this.config['reposDirName'] = this.config['reposDirName'] ? this.config['reposDirName'] : 'repos';
    this.config['servicesDirName'] = this.config['servicesDirName'] ? this.config['servicesDirName'] : 'services';
    this.config['constructors'] = this.config['constructors'] ? this.config['constructors'] : {};
    this.config['schemas'] = this.config['schemas'] ? this.config['schemas'] : {};
    this.config['repos'] = this.config['repos'] ? this.config['repos'] : {};
    this.config['services'] = this.config['services'] ? this.config['services'] : {};

    this.dataSources = {};
    this.constructors = {};
    this.schemas = {};
    this.repos = {};
    this.services = {};

    if (this.config['constructors']) {
      this.addConstructors(this.config['constructors']);
    }
    if (this.config['schemas']) {
      this.addSchemas(this.config['schemas']);
    }
    if (this.config['repos']) {
      this.addRepos(this.config['repos']);
    }
    if (this.config['services']) {
      this.addServices(this.config['services']);
    }
  }
  loadResources()
  {
    const loader = new ResourceLoader();
    return Promise.resolve().then(() => {
      // Load Entity Constructors
      const entities = loader.getResources(this.config['modelDirs'], this.config['entitiesDirName']);
      for (let resourcePath in entities) {
        this.addConstructor(entities[resourcePath]);
      }

      // Load Schemas
      const schemas = loader.getResources(this.config['modelDirs'], this.config['schemasDirName']);
      for (let resourcePath in schemas) {
        const config = loader.getResourceConfig(resourcePath);
        const schema = new schemas[resourcePath](null, config);
        this.addSchema(schema);
      }

      // Load Repos
      const repos = loader.getResources(this.config['modelDirs'], this.config['reposDirName']);
      for (let resourcePath in repos) {
        const config = loader.getResourceConfig(resourcePath);
        const repo = new repos[resourcePath](config);
        this.addRepo(repo);
      }

      // Load services
      const services = loader.getResources(this.config['modelDirs'], this.config['servicesDirName']);
      for (let resourcePath in services) {
        const config = loader.getResourceConfig(resourcePath);
        const service = new services[resourcePath](config);
        this.addService(service);
      }

      return this;
    });
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
  addConstructor(value)
  {
    this.constructors[value.name] = value;
  }
  getConstructor(constructorName)
  {
    return this.constructors[constructorName] ? this.constructors[constructorName] : null;
  }
  addConstructors(constructors)
  {
    if (constructors) {
      if (Array.isArray(constructors)) {
        constructors.forEach((construct) => {
          if (typeof construct == 'function') {
            this.addConstructor(construct);
          }
        });
      } else {
        Object.keys(constructors).forEach((constructorName) => {
          if (typeof constructors[constructorName] == 'function') {
            this.addConstructor(constructors[constructorName]);
          }
        });
      }
    }
  }
  addSchema(schema)
  {
    this.schemas[schema.getName()] = schema;
  }
  addSchemas(schemas)
  {
    if (schemas) {
      if (Array.isArray(schemas)) {
        schemas.forEach((schema) => {
          if (schema instanceof Schema) {
            this.addSchema(schema);
          }
        });
      } else {
        Object.keys(schemas).forEach((schemaName) => {
          if (schemas[schemaName] instanceof Schema) {
            this.addSchema(schemas[schemaName]);
          }
        });
      }
    }
  }
  addRepo(repo)
  {
    this.repos[repo.getName()] = repo;
  }
  addRepos(repos)
  {
    if (repos) {
      if (Array.isArray(repos)) {
        schemas.forEach((repo) => {
          if (repo instanceof Repo) {
            this.addRepo(repo);
          }
        });
      } else {
        Object.keys(repos).forEach((repoName) => {
          if (repos[repoName] instanceof Repo) {
            this.addRepo(repos[repoName]);
          }
        });
      }
    }
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
  addServices(services)
  {
    if (services) {
      if (Array.isArray(services)) {
        services.forEach((service) => {
          if (service instanceof Service) {
            this.addService(service);
          }
        });
      } else {
        Object.keys(services).forEach((serviceName) => {
          if (services[serviceName] instanceof Service) {
            this.addService(services[serviceName]);
          }
        });
      }
    }
  }
  getService(name)
  {
    const service = this.services[name];
    return service;
  }
  async initSchemas()
  {
    for (var schemaName in this.schemas) {
      const schema = this.schemas[schemaName];
      schema.addSchemas(this.schemas);
      schema.addConstructors(this.constructors);
    }
  }
  async initRepos()
  {
    const dataSourceNames = Object.keys(this.dataSources);
    const defaultDataSourceName = dataSourceNames[0];

    for (var repoName in this.repos) {
      const repo = this.repos[repoName];

      // We inject the main config object into every repo so it can access global config values
      repo.config.model = this.config;
      repo.addRepos(this.repos);
      repo.addSchemas(this.schemas);
      repo.addConstructors(this.constructors);
      repo.addServices(this.services);

      // Data sources are injected into repos to remove the need for a dependency on the ModelManager
      if (this.dataSources[repo.config['dataSource']]) {
        repo.dataSource = this.dataSources[repo.config['dataSource']];
      } else if (defaultDataSourceName !== undefined) {
        repo.dataSource = this.dataSources[defaultDataSourceName];
      }

      await repo.init();
    }
  }
  async initServices()
  {
    for (var serviceName in this.services) {
      const service = this.services[serviceName];
      // We inject the main config object into every service so it can access global config values
      service.config.model = this.config;
      service.repos = this.repos;
      service.services = this.services;

      await service.init();
    }
  }
  async init()
  {
    await this.loadDataSources();
    await this.loadResources();
    await this.initSchemas();
    await this.initRepos();
    await this.initServices();

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
