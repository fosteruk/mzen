import clone = require('clone');
import { ModelManagerConfig } from './model-manager';
import { QuerySelection, QuerySelectionOptions, QueryUpdate } from './data-source/interface';
import Schema, { SchemaValidationResult, SchemaSpec, ObjectPathAccessor } from 'mzen-schema';
import Service from './service';
import { RepoPopulator, RelationConfig } from './repo-populator';

export class RepoErrorValidation extends Error
{
  validationErrors: any;
  
  constructor(errors)
  {
    super('One or more fields failed validation');
    this.validationErrors = errors;
  }
}

export interface RepoIndexConfig
{
  // fieldname or {fieldA: 1, fieldB: -1} or {location: '2dsphere', description: 'text', otherField: 1}
  spec: {[key: string]: (number | string)} | string;
  // boolean options indicates unique index
  options?: boolean | {
    name?: string,
    unique?: boolean,
    sparse?: boolean,
    background?: boolean,
    expireAfterSeconds?: number
  };
}

export interface RepoConfig
{
  model?: ModelManagerConfig;
  pkey?: string;
  name?: string;
  dataSource?: string;
  collectionName?: string;
  schema?: Schema | SchemaSpec;
  indexes?: {[key: string]: RepoIndexConfig} | Array<RepoIndexConfig>;
  autoIndex?: boolean;
  relations?: {[key: string]: RelationConfig};
  constructors?: {[key: string]: any} | Array<any>;
  schemas?: {[key: string]: Schema} | Array<Schema>;
  repos?: {[key: string]: Repo} | Array<Repo>;
  services?: {[key: string]: Service} | Array<Service>;
}

export interface RepoQueryOptions extends QuerySelectionOptions
{
  populate?: {[key: string]: boolean} | boolean;
  filterPrivate?: boolean;
}

export class Repo
{
  config: RepoConfig;
  name: string;
  dataSource: any;
  schema: Schema;
  populator: RepoPopulator;
  schemas: {[key: string]: Schema | any};
  repos: {[key: string]: Repo | any}; // we allow any because the actual object may be of a class that extends Repo
  constructors: {[key: string]: any};
  services: {[key: string]: Service | any};
  relationPaths: Array<string>;
  
  constructor(options?: RepoConfig)
  {
    this.config = options ? options : {};
    this.config.model = this.config.model ? this.config.model : {}; // The main config is injected here
    this.config.pkey = this.config.pkey ? this.config.pkey : '_id';
    this.config.name = this.config.name ? this.config.name : '';
    this.config.dataSource = this.config.dataSource ? this.config.dataSource : '';
    this.config.collectionName = this.config.collectionName ? this.config.collectionName : this.config.name;
    this.config.schema = this.config.schema ? this.config.schema : {};
    this.config.indexes = this.config.indexes ? this.config.indexes : [];
    this.config.autoIndex = this.config.autoIndex !== undefined ? this.config.autoIndex : true;
    this.config.relations = this.config.relations ? this.config.relations : {};
    this.config.schemas = this.config.schemas ? this.config.schemas : {};
    this.config.repos = this.config.repos ? this.config.repos : {};
    this.config.constructors = this.config.constructors ? this.config.constructors : {};
    this.config.services = this.config.services ? this.config.services : {};

    this.name = this.config.name ? this.config.name : this.constructor.name;

    this.dataSource = null;
    this.schema = null; // constructed in the init() method
    this.populator = null;

    this.schemas = {};
    this.repos = {};
    this.constructors = {};
    this.services = {};

    if (this.config.schemas) this.addSchemas(this.config.schemas);
    if (this.config.repos) this.addRepos(this.config.repos);
    if (this.config.constructors) this.addConstructors(this.config.constructors);
    if (this.config.services) this.addServices(this.config.services);

    // Compile an array of relation aliases which can be used to strip relations of populated docs before saving
    this.relationPaths = [];
    Object.keys(this.config.relations).forEach(alias => {
      let relation = this.config.relations[alias];
      // set 'alias' in the relation config if not set
      // - the alias name is usually defined by the relation config as a the config element key but the alias value
      // - needs to be available within the relation config itself so it can be passed around
      if (relation.alias == undefined) this.config.relations[alias].alias = alias;
      let docPath = relation.docPath ? relation.docPath : null;
      let aliasPath = docPath ? docPath + '.' + relation.alias : relation.alias;
      this.relationPaths.push(aliasPath);
    });
  }
  
  // Init creates indexes
  async init()
  {
    var promises = [];
    if (!this.schema) {
      this.initSchema();
      if (this.config.autoIndex) promises.push(this.createIndexes());
    }
    return Promise.all(promises);
  }
  
  initSchema()
  {
    if (!this.schema) {
      const repoName = this.config.name;
      if (this.config.schema instanceof Schema) {
        this.schema = this.config.schema;
      } else if (this.config.schema && Object.keys(this.config.schema).length) {
        this.schema = new Schema(this.config.schema);
      } else if (this.schemas[repoName]) {
        // If schema is not specified explicitly use the schema with the same name from the schema list
        this.schema = this.schemas[repoName];
      } else {
        // No schema defined - use empty schema
        this.schema = new Schema;
      }
      this.schema.addConstructors(this.constructors);
      this.schema.addSchemas(this.schemas);
    }
  }
  
  getName(): string
  {
    // If repo name == 'Repo' then we are most likely using the name of the default repo constrcutor.
    // This can cause problems because repositories are referred to by name in the model and if we have multiple
    // repositories named 'Repo' we could not be sure which one we are working with
    // For this reason we do not permit a repository to be named 'Repo'
    if (this.name == 'Repo') throw new Error('Repo name not configured - you must specify a repo name when using the default repo entityConstructor');
    return this.name;
  }

  getPopulator()
  {
    return this.populator ? this.populator : this.populator = new RepoPopulator;
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
    return this.schemas[name] ? this.schemas[name] : null;
  }
  
  addSchemas(schemas: Array<Schema> | {[key:string]: Schema})
  {
    // could be an array of schema docs functions or a object map
    var schemasArray = Array.isArray(schemas) ? schemas : Object.values(schemas);
    schemasArray.forEach(schema => this.addSchema(schema));
  }
  
  addRepo(repo: Repo)
  {
    this.repos[repo.getName()] = repo;
  }
  
  getRepo(name): Repo
  {
    return (name == this.name) ? this : this.repos[name];
  }
  
  addRepos(repos: Array<Repo> | {[key:string]: Repo})
  {
    // could be an array of repo docs or a object map
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
  
  addServices(services: Array<Service> | {[key: string]: Service})
  {
    // could be an array of repo docs or a object map
    var servicesArray = Array.isArray(services) ? services : Object.values(services);
    servicesArray.forEach(service => this.addService(service));
  }
  
  drop()
  {
    return this.dataSource.drop(this.config.collectionName);
  }
  
  reset()
  {
    // This method drops the collection and re-creates it with indexes if any are defined
    return this.drop().then(() => {
      return this.config.autoIndex ? this.createIndexes() : null;
    });
  }
  
  async createIndexes()
  {
    var promises = [];
    for (let indexName in this.config.indexes) {
      if (!this.config.indexes.hasOwnProperty(indexName)) continue;
      var index = this.config.indexes[indexName];
      if (index.options == undefined) index.options = {};
      if (index.name) {
        index.options.name = index.name;
      } else {
        index.options.name = indexName;
      }
      promises.push(this.createIndex(index.spec, index.options));
    }
    return Promise.all(promises);
  }
  
  async createIndex(fieldOrSpec, options?)
  {
    return this.dataSource.createIndex(this.config.collectionName, fieldOrSpec, options);
  }
  
  async dropIndex(indexName, options?)
  {
    return this.dataSource.dropIndex(this.config.collectionName, indexName, options);
  }
  
  async dropIndexes()
  {
    return this.dataSource.dropIndexes(this.config.collectionName);
  }
  
  async find(query?: QuerySelection, options?: RepoQueryOptions)
  {
    this.initSchema();

    const optionsAll = this.normalizeFindOptions(options);
    const optionsPropagate = this.getPropagateOptions(optionsAll);
    const optionsQuery = this.getQueryOptions(optionsAll);
    
    query = query ? query : {};
    var validateResult = await this.schema.validateQuery(query);
    if (!validateResult.isValid) {
      throw new RepoErrorValidation(validateResult.errors)
    }

    var docs = await this.dataSource.find(this.config.collectionName, query, optionsQuery);
    return this.findPopulate(docs, optionsPropagate);
  }
  
  async findOne(query?: QuerySelection, options?: RepoQueryOptions)
  {
    this.initSchema();

    const optionsAll = this.normalizeFindOptions(options);
    const optionsPropagate = this.getPropagateOptions(optionsAll);
    const optionsQuery = this.getQueryOptions(optionsAll);

    query = query ? query : {};
    const validateResult = await this.schema.validateQuery(query);
    if (!validateResult.isValid) {
      throw new RepoErrorValidation(validateResult.errors);
    }

    var docs = await this.dataSource.findOne(this.config.collectionName, query, optionsQuery);
    return this.findPopulate(docs, optionsPropagate);
  }
  
  async count(query?: QuerySelection, options?: QuerySelectionOptions)
  {
    this.initSchema();

    query = query ? query : {};
    const validateResult = await this.schema.validateQuery(query);
    if (!validateResult.isValid) {
      throw new RepoErrorValidation(validateResult.errors);
    }

    return this.dataSource.count(this.config.collectionName, query, options);
  }
  
  async aggregate(pipeline, options?)
  {
    this.initSchema();
    return this.dataSource.aggregate(this.config.collectionName, pipeline, options);
  }

  private normalizeFindOptions(options: RepoQueryOptions)
  {
    var options = options ? {...options} : {};
    options.filterPrivate = (options.filterPrivate !== undefined)  ? options.filterPrivate : false;
    options.populate = (options.populate !== undefined)  ? options.populate : null;
    return options;
  }
  
  private getQueryOptions(options)
  {
    options = options ? options : {};

    var queryOptions = {} as QuerySelectionOptions;
    if (options.sort != undefined) queryOptions.sort = options.sort;
    delete options.sort;
    if (options.limit != undefined) queryOptions.limit = options.limit;
    delete options.limit;
    if (options.skip != undefined) queryOptions.skip = options.skip;
    delete options.skip;

    return queryOptions;
  }

  private getPropagateOptions(options)
  {
    // Get find options that should propgate (with query options removed)
    options = options ? options : {};
    return {
      filterPrivate: options.filterPrivate,
      populate: options.populate
    };
  }
  
  private async findPopulate(docs: any, options: any)
  {
    if (options.filterPrivate) {
      this.schema.filterPrivate(docs, 'read');
    }
    docs = docs ? this.schema.applyTransients(docs) : docs;
    return (options.populate === false) ? docs : this.populateAll(docs, options);
  }
  
  async populateAll(docs: any, options?: RepoQueryOptions)
  {
    return this.getPopulator().populateAll(this, docs, options);
  }
  
  async populate(relation: RelationConfig | string, docs?: any, options?: RepoQueryOptions)
  {
    return this.getPopulator().populate(this, relation, docs, options);
  }
  
  async insertMany(docs, options?)
  {
    this.initSchema();
    var args = Array.prototype.slice.call(arguments); // We use Array.slice() to make a copy of the original args
    args[0] = this.stripTransients(docs);

    if (options && options.filterPrivate) {
      this.schema.filterPrivate(args[0], 'write');
    }

    var validateResult = await this.schema.validate(args[0]);
    if (!validateResult.isValid) {
      throw new RepoErrorValidation(validateResult.errors);
    }

    args.unshift(this.config.collectionName); // Prepend collection name to arguments
    return this.dataSource.insertMany.apply(this.dataSource, args);
  }
  
  async insertOne(doc, options?)
  {
    this.initSchema();
    var args = Array.prototype.slice.call(arguments); // We use Array.slice() to make a copy of the original args
    args[0] = this.stripTransients(doc);

    if (options && options.filterPrivate) {
      this.schema.filterPrivate(args[0], 'write');
    }

    var validateResult = await this.schema.validate(args[0]);
    if (!validateResult.isValid) {
      throw new RepoErrorValidation(validateResult.errors);
    }

    args.unshift(this.config.collectionName); // Prepend collection name to arguments
    return this.dataSource.insertOne.apply(this.dataSource, args);
  }
  
  async updateMany(criteria: QuerySelection, update: QueryUpdate, options?)
  {
    this.initSchema();
    criteria = clone(criteria);
    update = clone(update);
    var promises = [];
    var validateResult = {} as SchemaValidationResult;
    var validateResultQuery = {};
    var validateResultUpdate = {};
    criteria = criteria ? criteria : {};

    if (update && update.$set && options && options.filterPrivate ) {
      this.schema.filterPrivate(update.$set, 'write', 'mapPaths');
    }

    promises.push(this.schema.validateQuery(criteria).then((result) => {
      validateResultQuery = result;
    }));

    if (update && update.$set) {
      promises.push(this.schema.validatePaths(update.$set).then((result) => {
        validateResultUpdate = result;
      }));
    }

    await Promise.all(promises);
    validateResult = Schema.mergeValidationResults([validateResultQuery, validateResultUpdate]);
    if (!validateResult.isValid) {
      throw new RepoErrorValidation(validateResult.errors);
    }
    return this.dataSource.updateMany(this.config.collectionName, criteria, update, options);
  }
  
  async updateOne(criteria: QuerySelection, update: QueryUpdate, options?)
  {
    this.initSchema();
    criteria = clone(criteria);
    update = clone(update);
    var promises = [];
    var validationResults = [];
    criteria = criteria ? criteria : {};

    if (update && update.$set && options && options.filterPrivate ) {
      this.schema.filterPrivate(update.$set, 'write', 'mapPaths');
    }

    promises.push(this.schema.validateQuery(criteria).then((result) => {
      validationResults.push(result);
    }));

    if (update && update.$set) {
      promises.push(this.schema.validatePaths(update.$set).then((result) => {
        validationResults.push(result);
      }));
    }

    await Promise.all(promises);
    var validateResult = Schema.mergeValidationResults(validationResults);

    if (!validateResult.isValid) {
      throw new RepoErrorValidation(validateResult.errors);
    }

    return this.dataSource.updateOne(this.config.collectionName, criteria, update, options);
  }
  
  async deleteMany(filter: QuerySelection, options?)
  {
    this.initSchema();
    options = options ? options : {};
    filter = filter ? filter : {};
    var validateResult = await this.schema.validateQuery(filter);
    if (!validateResult.isValid) {
      let error = new RepoErrorValidation('One or more fields failed validation');
      error.validationErrors = validateResult.errors;
      throw error;
    }
    var args = Array.prototype.slice.call(arguments); // We use Array.slice() to make a copy of the original args
    args.unshift(this.config.collectionName); // Prepend collection name to arguments
    return this.dataSource.deleteMany.apply(this.dataSource, args);
  }
  
  async deleteOne(filter: QuerySelection, options?)
  {
    this.initSchema();
    options = options ? options : {};
    filter = filter ? filter : {};
    var validateResult = await this.schema.validateQuery(filter);
    if (!validateResult.isValid) {
      throw new RepoErrorValidation(validateResult.errors);
    }

    var args = Array.prototype.slice.call(arguments); // We use Array.slice() to make a copy of the original args
    args.unshift(this.config.collectionName); // Prepend collection name to arguments
    return this.dataSource.deleteOne.apply(this.dataSource, args);
  }
  
  stripTransients(docs: any)
  {
    this.initSchema();

    var newdocs = clone(docs); // We will be deleting relations so we need to work on a copy
    var isArray = Array.isArray(newdocs);
    var newdocs = isArray ? newdocs : [newdocs];

    this.relationPaths.forEach(function(relationPath){
      ObjectPathAccessor.unsetPath('*.' + relationPath, newdocs);
    });

    this.schema.stripTransients(newdocs);

    var result = isArray ? newdocs : newdocs.pop();
    return result;
  }
}

export default Repo;
