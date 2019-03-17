"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_1 = require("./data-source/mongodb");
const resource_loader_1 = require("./resource-loader");
/**
 * ModelManager
 *
 * The model manager is responsible for loading and initialising repositories, services.
 * It loads repository and service class definitions from the file system.
 */
class ModelManager {
    constructor(options) {
        this.config = options ? options : {};
        this.config.dataSources = this.config.dataSources ? this.config.dataSources : {};
        this.config.modelDirs = this.config.modelDirs ? this.config.modelDirs : [];
        this.config.schemasDirName = this.config.schemasDirName ? this.config.schemasDirName : 'schema';
        this.config.constructorsDirName = this.config.constructorsDirName ? this.config.constructorsDirName : 'constructor';
        this.config.reposDirName = this.config.reposDirName ? this.config.reposDirName : 'repo';
        this.config.servicesDirName = this.config.servicesDirName ? this.config.servicesDirName : 'service';
        this.config.constructors = this.config.constructors ? this.config.constructors : {};
        this.config.schemas = this.config.schemas ? this.config.schemas : {};
        this.config.repos = this.config.repos ? this.config.repos : {};
        this.config.services = this.config.services ? this.config.services : {};
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
    loadResources() {
        return __awaiter(this, void 0, void 0, function* () {
            const loader = new resource_loader_1.default();
            // Load Entity Constructors
            // First load any constructors specified in the constructors.js file of the model directory
            const constructorsCollection = loader.getResources(this.config.modelDirs, null, '.js', [], ['constructors.js']);
            for (let resourcePath in constructorsCollection) {
                this.addConstructors(constructorsCollection[resourcePath]);
            }
            // Load any constructors specified in the constructor directory of the model directory
            const constructors = loader.getResources(this.config.modelDirs, this.config.constructorsDirName);
            for (let resourcePath in constructors) {
                this.addConstructor(constructors[resourcePath]);
            }
            // Load Schemas
            // First load any schemas specified in the schemas.js file of the model directory
            const schemasCollection = loader.getResources(this.config.modelDirs, null, '.js', [], ['schemas.js']);
            for (let resourcePath in schemasCollection) {
                this.addSchemas(schemasCollection[resourcePath]);
            }
            // Load any schemas specified in the schema directory of the model directory
            const schemas = loader.getResources(this.config.modelDirs, this.config.schemasDirName);
            for (let resourcePath in schemas) {
                const config = loader.getResourceConfig(resourcePath);
                const schema = new schemas[resourcePath](null, config);
                this.addSchema(schema);
            }
            // Load Repos
            // First load any repos specified in the repos.js file of the model directory
            const reposCollection = loader.getResources(this.config.modelDirs, null, '.js', [], ['repos.js']);
            for (let resourcePath in reposCollection) {
                this.addRepos(reposCollection[resourcePath]);
            }
            // Load any repos specified in the repo directory of the model directory
            const repos = loader.getResources(this.config.modelDirs, this.config.reposDirName);
            for (let resourcePath in repos) {
                const config = loader.getResourceConfig(resourcePath);
                const repo = new repos[resourcePath](config);
                this.addRepo(repo);
            }
            // Load services
            // First load any services specified in the services.js file of the model directory
            const servicesCollection = loader.getResources(this.config.modelDirs, null, '.js', [], ['services.js']);
            for (let resourcePath in servicesCollection) {
                this.addServices(servicesCollection[resourcePath]);
            }
            // Load any services specified in the service directory of the model directory
            const services = loader.getResources(this.config.modelDirs, this.config.servicesDirName);
            for (let resourcePath in services) {
                const config = loader.getResourceConfig(resourcePath);
                const service = new services[resourcePath](config);
                this.addService(service);
            }
            return this;
        });
    }
    addDataSourceFromConfig(options) {
        var dataSource = null;
        switch (options.type) {
            case 'mongodb':
                dataSource = new mongodb_1.default(options);
                break;
        }
        return this.addDataSource(options.name, dataSource);
    }
    addDataSource(name, dataSource) {
        return dataSource.connect()
            .then((dataSource) => {
            this.dataSources[name] = dataSource;
            return dataSource;
        });
    }
    getDataSource(name) {
        const dataSource = this.dataSources[name] ? this.dataSources[name] : null;
        return dataSource;
    }
    addConstructor(value) {
        this.constructors[value.name] = value;
    }
    getConstructor(constructorName) {
        return this.constructors[constructorName] ? this.constructors[constructorName] : null;
    }
    addConstructors(constructors) {
        if (constructors) {
            if (Array.isArray(constructors)) {
                constructors.forEach((construct) => {
                    if (typeof construct == 'function') {
                        this.addConstructor(construct);
                    }
                });
            }
            else {
                Object.keys(constructors).forEach((constructorName) => {
                    if (typeof constructors[constructorName] == 'function') {
                        this.addConstructor(constructors[constructorName]);
                    }
                });
            }
        }
    }
    addSchema(schema) {
        this.schemas[schema.getName()] = schema;
    }
    addSchemas(schemas) {
        if (schemas) {
            if (Array.isArray(schemas)) {
                schemas.forEach((schema) => {
                    this.addSchema(schema);
                });
            }
            else {
                Object.keys(schemas).forEach((schemaName) => {
                    this.addSchema(schemas[schemaName]);
                });
            }
        }
    }
    addRepo(repo) {
        this.repos[repo.getName()] = repo;
    }
    addRepos(repos) {
        if (repos) {
            if (Array.isArray(repos)) {
                repos.forEach((repo) => {
                    this.addRepo(repo);
                });
            }
            else {
                Object.keys(repos).forEach((repoName) => {
                    this.addRepo(repos[repoName]);
                });
            }
        }
    }
    getRepo(repoName) {
        const repo = this.repos[repoName] ? this.repos[repoName] : null;
        return repo;
    }
    addService(service) {
        this.services[service.getName()] = service;
    }
    addServices(services) {
        if (services) {
            if (Array.isArray(services)) {
                services.forEach((service) => {
                    this.addService(service);
                });
            }
            else {
                Object.keys(services).forEach((serviceName) => {
                    this.addService(services[serviceName]);
                });
            }
        }
    }
    getService(name) {
        const service = this.services[name];
        return service;
    }
    loadDataSources() {
        return __awaiter(this, void 0, void 0, function* () {
            const sourcesCount = this.config['dataSources'].length;
            let promises = [];
            if (sourcesCount > 0) {
                this.config.dataSources.forEach(dataSource => {
                    promises.push(this.addDataSourceFromConfig(dataSource));
                });
            }
            yield Promise.all(promises);
            return this;
        });
    }
    initSchemas() {
        return __awaiter(this, void 0, void 0, function* () {
            for (var schemaName in this.schemas) {
                const schema = this.schemas[schemaName];
                schema.addSchemas(this.schemas);
                schema.addConstructors(this.constructors);
            }
        });
    }
    initRepos() {
        return __awaiter(this, void 0, void 0, function* () {
            const dataSourceNames = Object.keys(this.dataSources);
            const defaultDataSourceName = dataSourceNames[0];
            for (var repoName in this.repos) {
                const repo = this.repos[repoName];
                // We inject the main config object into every repo so it can access global config values
                repo.config.model = this.config;
                repo.addConstructors(this.constructors);
                repo.addSchemas(this.schemas);
                repo.addRepos(this.repos);
                repo.addServices(this.services);
                // Data sources are injected into repos to remove the need for a dependency on the ModelManager
                if (this.dataSources[repo.config.dataSource]) {
                    repo.dataSource = this.dataSources[repo.config.dataSource];
                }
                else if (defaultDataSourceName !== undefined) {
                    repo.dataSource = this.dataSources[defaultDataSourceName];
                }
                yield repo.init();
            }
        });
    }
    initServices() {
        return __awaiter(this, void 0, void 0, function* () {
            for (var serviceName in this.services) {
                const service = this.services[serviceName];
                // We inject the main config object into every service so it can access global config values
                service.config.model = this.config;
                service.addRepos(this.repos);
                service.addServices(this.services);
                yield service.init();
            }
        });
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.loadDataSources();
            yield this.loadResources();
            yield this.initSchemas();
            yield this.initRepos();
            yield this.initServices();
            return this;
        });
    }
    shutdown() {
        var promises = [];
        for (let key in this.dataSources) {
            if (!this.dataSources.hasOwnProperty(key))
                continue;
            promises.push(this.dataSources[key].close());
        }
        return Promise.all(promises);
    }
}
exports.ModelManager = ModelManager;
exports.default = ModelManager;
//# sourceMappingURL=model-manager.js.map