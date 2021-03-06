import clone = require('clone');
import { ModelManagerConfig } from './model-manager';
import { 
  QuerySelection, 
  QuerySelectionOptions, 
  QueryUpdate, 
  QueryPersistResult, 
  QueryPersistResultInsertMany, 
  QueryPersistResultInsertOne 
} from './data-source/interface';
import Schema, { SchemaValidationResult, SchemaSpec, ObjectPathAccessor } from 'mzen-schema';
import Service from './service';
import { RepoPopulator, RelationConfig } from './repo-populator';

export class RepoErrorValidation extends Error
{
  validationErrors: any;
  
  constructor(errors)
  {
    const errorPaths = errors ? Object.keys(errors) : [];
    const errorPathsString = errorPaths.length ? ' (' + errorPaths.join(', ') + ')' : '';
    super('One or more fields'+ errorPathsString + ' failed validation');
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
    [key: string]: any; // allow implementation specific props
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
  populator?: RepoPopulator;
  constructors?: {[key: string]: any} | Array<any>;
  schemas?: {[key: string]: Schema} | Array<Schema>;
  repos?: {[key: string]: Repo} | Array<Repo>;
  services?: {[key: string]: Service} | Array<Service>;
}

export interface RepoQueryOptions extends QuerySelectionOptions
{
  populate?: {[key: string]: boolean} | boolean;
  filterPrivate?: boolean;
  // mzen query validator can not handle complex queries 
  // - some times the only option is to skip query validation
  skipValidation?: boolean;
  [key: string]: any; // allow implementation specific props
}

export class Repo
{
  initialised:boolean;
  config:RepoConfig;
  name:string;
  dataSource:any;
  schema:Schema;
  populator:RepoPopulator;
  schemas:{[key: string]: Schema | any};
  repos:{[key: string]: Repo | any}; // we allow any because the actual object may be of a class that extends Repo
  constructors:{[key: string]: any};
  services:{[key: string]: Service | any};
  relationPaths:Array<string>;
  logger:any;
  
  constructor(options?: RepoConfig)
  {
    this.initialised = false;

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
    this.config.populator = this.config.populator ? this.config.populator : null;
    this.config.schemas = this.config.schemas ? this.config.schemas : {};
    this.config.repos = this.config.repos ? this.config.repos : {};
    this.config.constructors = this.config.constructors ? this.config.constructors : {};
    this.config.services = this.config.services ? this.config.services : {};

    this.logger = console;

    this.name = this.config.name ? this.config.name : this.constructor.name;

    this.dataSource = null;
    this.schema = null; // constructed in the init() method
    this.populator = this.config.populator;

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
    this.compileRelationPaths();
  }

  setLogger(logger)
  {
    this.logger = logger;
  }
  
  // Init creates indexes
  async init()
  {
    if (!this.initialised) {
      var promises = [];
      if (!this.schema) {
        this.initSchema();
        if (this.config.autoIndex) promises.push(this.createIndexes());
      }
      await Promise.all(promises);
      this.initialised = true;
    }
  }

  compileRelationPaths()
  {
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
    if (this.name == 'Repo') throw new Error('Repo name not configured - ' 
      + 'you must specify a repo name when using the default repo constructor');
    return this.name;
  }

  getPopulator()
  {
    return this.populator ? this.populator : this.populator = new RepoPopulator;
  }

  setPopulator(populator:RepoPopulator)
  {
    this.populator = populator;
  }
  
  addConstructor(value:Function)
  {
    this.constructors[value.name] = value;
  }
  
  getConstructor(constructorName:string)
  {
    return this.constructors[constructorName] ? this.constructors[constructorName] : null;
  }
  
  addConstructors(constructors:Array<Function> | {[key:string]: Function})
  {
    // could be an array of constructor functions or a object map 
    var constructorsArray = Array.isArray(constructors) ? constructors : Object.values(constructors);
    constructorsArray.forEach(construct => this.addConstructor(construct));
  }
  
  addSchema(schema:Schema)
  {
    this.schemas[schema.getName()] = schema;
  }
  
  getSchema(name:string): Schema
  {
    return this.schemas[name] ? this.schemas[name] : null;
  }
  
  addSchemas(schemas:Array<Schema> | {[key:string]: Schema})
  {
    // could be an array of schema docs functions or a object map
    var schemasArray = Array.isArray(schemas) ? schemas : Object.values(schemas);
    schemasArray.forEach(schema => this.addSchema(schema));
  }
  
  addRepo(repo:Repo)
  {
    this.repos[repo.getName()] = repo;
  }
  
  getRepo(name:string): Repo
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
  
  async reset()
  {
    // This method drops the collection and re-creates it with indexes if any are defined
    await this.drop();
    if (this.config.autoIndex) {
      await this.createIndexes();
    }
  }
  
  async createIndexes()
  {
    var promises = [];
    for (let indexName in this.config.indexes) {
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
  
  async find(query?:QuerySelection, options?:RepoQueryOptions): Promise<any[]>
  {
    this.initSchema();

    const optionsAll = this.normalizeFindOptions(options);
    const optionsPropagate = this.getPropagateOptions(optionsAll);
    const optionsQuery = this.getQueryOptions(optionsAll);
    
    query = query ? query : {};
    let errors = await this.validateQuery(query, options);
    if (errors) throw new RepoErrorValidation(errors);

    var docs = await this.dataSource.find(this.config.collectionName, query, optionsQuery);
    return this.findPopulate(docs, optionsPropagate);
  }
  
  async findOne(query?:QuerySelection, options?:RepoQueryOptions): Promise<any>
  {
    this.initSchema();

    const optionsAll = this.normalizeFindOptions(options);
    const optionsPropagate = this.getPropagateOptions(optionsAll);
    const optionsQuery = this.getQueryOptions(optionsAll);

    query = query ? query : {};
    let errors = await this.validateQuery(query, options);
    if (errors) throw new RepoErrorValidation(errors);

    var docs = await this.dataSource.findOne(this.config.collectionName, query, optionsQuery);
    return this.findPopulate(docs, optionsPropagate);
  }
  
  async count(query?:QuerySelection, options?:RepoQueryOptions): Promise<number>
  {
    this.initSchema();

    query = query ? query : {};
    let errors = await this.validateQuery(query, options);
    if (errors) throw new RepoErrorValidation(errors);

    return this.dataSource.count(this.config.collectionName, query, options);
  }

  async groupCount(groupFields:string[], query?:QuerySelection): Promise<Array<{_id: any, count: number}>>
  {
    this.initSchema();

    query = query ? query : {};
    return this.dataSource.groupCount(this.config.collectionName, groupFields, query);
  }

  async findGroup(groupFields:string[], query?:QuerySelection): Promise<any[]>
  {
    this.initSchema();

    query = query ? query : {};
    return this.dataSource.findGroup(this.config.collectionName, groupFields, query);
  }

  private normalizeFindOptions(options:RepoQueryOptions)
  {
    var options = options ? {...options} : {};
    options.skipValidation = (options.skipValidation !== undefined)  ? options.skipValidation : false;
    options.filterPrivate = (options.filterPrivate !== undefined)  ? options.filterPrivate : false;
    options.populate = (options.populate !== undefined)  ? options.populate : null;
    return options;
  }
  
  private getQueryOptions(options)
  {
    var queryOptions: QuerySelectionOptions = options ? {...options} : {};
    if (queryOptions.filterPrivate !== undefined) delete queryOptions.filterPrivate;
    if (queryOptions.populate !== undefined) delete queryOptions.populate;
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
  
  private async findPopulate(docs:any, options:any)
  {
    if (options.filterPrivate) {
      docs = this.schema.filterPrivate(docs, 'read');
    }
    docs = docs ? this.schema.applyTransients(docs) : docs;
    return (options.populate === false) ? docs : this.populateAll(docs, options);
  }
  
  async populateAll(docs: any, options?:RepoQueryOptions)
  {
    return this.getPopulator().populateAll(this, docs, options);
  }
  
  async populate(relation:RelationConfig|string, docs?:any, options?:RepoQueryOptions)
  {
    return this.getPopulator().populate(this, relation, docs, options);
  }
  
  async insertMany(docs, options?): Promise<QueryPersistResultInsertMany>
  {
    this.initSchema();
    var args = Array.prototype.slice.call(arguments); // We use Array.slice() to make a copy of the original args
    args[0] = this.stripTransients(docs);

    if (options && options.filterPrivate) {
      args[0] = this.schema.filterPrivate(args[0], 'write');
    }

    var validateResult = await this.schema.validate(args[0]);
    if (!validateResult.isValid) {
      throw new RepoErrorValidation(validateResult.errors);
    }

    args.unshift(this.config.collectionName); // Prepend collection name to arguments
    return this.dataSource.insertMany.apply(this.dataSource, args);
  }
  
  async insertOne(doc, options?): Promise<QueryPersistResultInsertOne>
  {
    this.initSchema();
    var args = Array.prototype.slice.call(arguments); // We use Array.slice() to make a copy of the original args
    args[0] = this.stripTransients(doc);

    if (options && options.filterPrivate) {
      args[0] =this.schema.filterPrivate(args[0], 'write');
    }

    var validateResult = await this.schema.validate(args[0]);
    if (!validateResult.isValid) {
      throw new RepoErrorValidation(validateResult.errors);
    }

    args.unshift(this.config.collectionName); // Prepend collection name to arguments
    return this.dataSource.insertOne.apply(this.dataSource, args);
  }

  async _updatePrepare(filter:QuerySelection, update:QueryUpdate, options?): Promise<{
    f:QuerySelection, u:QueryUpdate, o?
  }>
  {
    this.initSchema();
    filter = clone(filter);
    update = clone(update);
    var promises = [];
    var validateResult = {} as SchemaValidationResult;
    var validateResultQuery = {};
    var validateResultUpdate = {};
    filter = filter ? filter : {};

    if (update && update.$set) {
      update.$set = this.stripTransients(update.$set, 'mapPaths');
      if (options && options.filterPrivate) {
        update.$set = this.schema.filterPrivate(update.$set, 'write', 'mapPaths');
      }
    }

    promises.push(this.schema.validateQuery(filter).then((result) => {
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

    return {
      f: filter,
      u: update,
      o: options
    };
  }
  
  async updateMany(filter:QuerySelection, update:QueryUpdate, options?): Promise<QueryPersistResult>
  {
    const { f, u, o } = await this._updatePrepare(filter, update, options); 
    return this.dataSource.updateMany(this.config.collectionName, f, u, o);
  }
  
  async updateOne(filter:QuerySelection, update:QueryUpdate, options?): Promise<QueryPersistResult>
  {
    const { f, u, o } = await this._updatePrepare(filter, update, options); 
    return this.dataSource.updateOne(this.config.collectionName, f, u, o);
  }

  async _deletePrepare(filter:QuerySelection, options?): Promise<{f:QuerySelection, o?}>
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
    return {
      f: filter,
      o: options
    };
  }
  
  async deleteMany(filter:QuerySelection, options?): Promise<QueryPersistResult>
  {
    const { f, o } = await this._deletePrepare(filter, options);
    return this.dataSource.deleteMany(this.config.collectionName, f, o);
  }
  
  async deleteOne(filter:QuerySelection, options?): Promise<QueryPersistResult>
  {
    const { f, o } = await this._deletePrepare(filter, options);
    return this.dataSource.deleteOne(this.config.collectionName, f, o);
  }

  async validateQuery(query?:QuerySelection, options?: RepoQueryOptions)
  {
    var errors = null;
    query = query ? query : {};

    const optionsAll = this.normalizeFindOptions(options);
    if (!optionsAll.skipValidation) {
      const validateResult = await this.schema.validateQuery(query);
      if (!validateResult.isValid) {
        errors = validateResult.errors;
      }
    }
    
    return errors;
  }
  
  stripTransients(docs:any, mapperType?:string)
  {
    this.initSchema();

    var mapperType = (mapperType == 'mapPaths') ? 'mapPaths' : 'map';

    var newdocs = clone(docs); // We will be deleting relations so we need to work on a copy
    var isArray = Array.isArray(newdocs);
    var newdocs = isArray ? newdocs : [newdocs];

    this.relationPaths.forEach(function(relationPath){
      ObjectPathAccessor.unsetPath('*.' + relationPath, newdocs);
    });

    newdocs = this.schema.stripTransients(newdocs, mapperType);

    return isArray ? newdocs : newdocs.pop();
  }
}

export default Repo;
