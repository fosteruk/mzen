import DataSourceMongodb from './data-source/mongodb';
import DataSourceMock from './data-source/mock';
import Repo from './repo';
import RepoPopulator from './repo-populator';
import Service from './service';
import Schema from 'mzen-schema';

export interface ModelManagerConfigDataSource
{
  name?: string;
  type?: 'mongodb'|'mock'|string;
  [key: string]: any;
}

export interface ModelManagerConfig
{
  dataSources?: Array<{[key: string]: ModelManagerConfigDataSource}>;
  constructors?: {[key: string]: any} | Array<any>;
  schemas?: {[key: string]: Schema} | Array<Schema>;
  repos?: {[key: string]: Repo} | Array<Repo>;
  services?: {[key: string]: Service} | Array<Service>;
  app?: any; // adhoc app configuration passed by consumers
}

/**
 * ModelManager
 *
 * The model manager is responsible for loading and initialising repositories, services.
 * It loads repository and service class definitions from the file system.
 */
export class ModelManager
{
  initialised:boolean;
  initialisers: {
    [key: string]: any[]
  };
  config:ModelManagerConfig;
  dataSources:{[key: string]: any};
  constructors:{[key: string]: any};
  schemas:{[key: string]: Schema};
  repos:{[key: string]: Repo};
  services:{[key: string]: Service};
  repoPopulator:RepoPopulator;
  logger:any;
  
  constructor(options?: ModelManagerConfig)
  {
    this.config = options ? options : {};
    this.config.dataSources = this.config.dataSources 
      ? this.config.dataSources : [];
    this.config.constructors = this.config.constructors 
      ? this.config.constructors : {};
    this.config.schemas = this.config.schemas ? this.config.schemas : {};
    this.config.repos = this.config.repos ? this.config.repos : {};
    this.config.services = this.config.services ? this.config.services : {};

    this.logger = console;

    this.initialised = false;
    this.initialisers = {};
    this.dataSources = {};
    this.constructors = {};
    this.schemas = {};
    this.repos = {};
    this.services = {};

    if (this.config.constructors) {
      this.addConstructors(this.config.constructors);
    }
    if (this.config.schemas) {
      this.addSchemas(this.config.schemas);
    }
    if (this.config.repos) {
      this.addRepos(this.config.repos);
    }
    if (this.config.services) {
      this.addServices(this.config.services);
    }
  }

  setLogger(logger)
  {
    this.logger = logger;
  }

  addInitialiser(initialiser, stage?:string)
  {
    stage = stage ? stage : 'default';
    if (this.initialisers[stage] === undefined) {
      this.initialisers[stage] = [];
    }
    this.initialisers[stage].push(initialiser);
  }

  async runInitialisers(stage?:string)
  {
    stage = stage ? stage : 'default';
    if (this.initialisers[stage]) {
      this.initialisers[stage].forEach(async initFunction => {
        await Promise.resolve(initFunction(this));
      });
    }
  }
  
  initDataSourceFromConfig(options)
  {
    var dataSource = null;
    switch (options.type) {
      case 'mongodb':
        dataSource = new DataSourceMongodb(options);
      break;
      case 'mock':
        dataSource = new DataSourceMock(options.data ? options.data : {});
      break;
    }

    return this.initDataSource(options.name, dataSource);
  }
  
  initDataSource(name: string, dataSource)
  {
    return dataSource.connect()
          .then((dataSource) => {
            this.addDataSource(name, dataSource);
            return dataSource;
          });
  }

  getRepoPopulator(): RepoPopulator
  {
    return this.repoPopulator ? this.repoPopulator : this.repoPopulator = new RepoPopulator;
  }

  setRepoPopulator(repoPopulator: RepoPopulator)
  {
    this.repoPopulator = repoPopulator;
  }
  
  getDataSource(name)
  {
    return this.dataSources[name];
  }

  addDataSource(name, dataSource: any)
  {
    this.dataSources[name] = dataSource;
  }
  
  addConstructor(value)
  {
    this.constructors[value.name] = value;
  }
  
  getConstructor(constructorName)
  {
    return this.constructors[constructorName];
  }
  
  addConstructors(constructors)
  {
    // could be an array of constructor functions or a object map 
    var constructorsArray = Array.isArray(constructors) ? constructors : Object.values(constructors);
    constructorsArray.forEach(construct => this.addConstructor(construct));
  }
  
  addSchema(schema: Schema)
  {
    this.schemas[schema.getName()] = schema;
  }
  
  getSchema(name): Schema
  {
    return this.schemas[name];
  }
  
  addSchemas(schemas: Array<Schema> | {[key:string]: Schema})
  {
    // could be an array of schema objects functions or a object map
    var schemasArray = Array.isArray(schemas) ? schemas : Object.values(schemas);
    schemasArray.forEach(schema => this.addSchema(schema));
  }
  
  addRepo(repo: Repo)
  {
    this.repos[repo.getName()] = repo;
  }
  
  getRepo(name): Repo
  {
    return this.repos[name];
  }
  
  addRepos(repos: Array<Repo> | {[key:string]: Repo})
  {
    // could be an array of repo objects or a object map
    var reopsArray = Array.isArray(repos) ? repos : Object.values(repos);
    reopsArray.forEach(repo => this.addRepo(repo));
  }
  
  addService(service: Service)
  {
    this.services[service.getName()] = service;
  }
  
  getService(name): Service
  {
    return this.services[name];
  }
  
  addServices(services: Array<Service> | {[key:string]: Service})
  {
    // could be an array of repo objects or a object map
    var servicesArray = Array.isArray(services) ? services : Object.values(services);
    servicesArray.forEach(service => this.addService(service));
  }
  
  async loadDataSources()
  {
    let promises = [];
    this.config.dataSources.forEach(dataSource => {
      promises.push(this.initDataSourceFromConfig(dataSource));
    });
    await Promise.all(promises);
    return this;
  }
  
  async initSchemas()
  {
     Object.values(this.schemas).forEach(schema => {
       schema.addSchemas(this.schemas);
       schema.addConstructors(this.constructors);
     });
  }
  
  async initRepos()
  {
    const dataSourceNames = Object.keys(this.dataSources);
    const defaultDataSourceName = dataSourceNames[0];
    
    var promises = [];
    Object.values(this.repos).forEach(async repo => {
      // We inject the main config object into every repo so it can access global config values
      repo.config.model = this.config;
      repo.setLogger(this.logger);
      repo.setPopulator(this.getRepoPopulator());
      repo.addConstructors(this.constructors);
      repo.addSchemas(this.schemas);
      repo.addRepos(this.repos);
      repo.addServices(this.services);

      // Data sources are injected into repos to remove the need for a dependency on the ModelManager
      if (this.dataSources[repo.config.dataSource]) {
        repo.dataSource = this.dataSources[repo.config.dataSource];
      } else if (defaultDataSourceName !== undefined) {
        repo.dataSource = this.dataSources[defaultDataSourceName];
      }

      promises.push(repo.init());
    });
    return await Promise.all(promises);
  }
  
  async initServices()
  {
    var promises = [];
    Object.values(this.services).forEach(async service => {
      // We inject the main config object into every service so it can access global config values
      service.config.model = this.config;
      service.setLogger(this.logger);
      service.addRepos(this.repos);
      service.addServices(this.services);
      
      promises.push(service.init());
    });
    return await Promise.all(promises);
  }
  
  async init()
  {
    if (!this.initialised) {
      await this.runInitialisers();
      await this.runInitialisers('00-init');
      await this.loadDataSources();
      await this.initSchemas();
      await this.initRepos();
      await this.initServices();
      await this.runInitialisers('99-final');
      this.initialised = true;
    }

    return this;
  }
  
  async shutdown()
  {
    var promises = [];
    Object.values(this.dataSources).forEach(async dataSource => {
      promises.push(dataSource.close());
    });
    await Promise.all(promises);
    
    return this;
  }
}

export default ModelManager;
