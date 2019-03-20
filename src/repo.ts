import clone = require('clone');
import RepoPopulate from './repo-populate';
import ObjectPathAccessor from './object-path-accessor';
import Schema, { SchemaValidationResult, SchemaSpec } from 'mzen-schema';

export class RepoErrorValidation extends Error
{
  validationErrors: Array<any>;
  
  constructor(errors)
  {
    super('One or more fields failed validation');
    this.validationErrors = errors;
  }
}

export interface RepoConfig
{
  model?: {[key: string]: any};
  pkey?: string;
  name?: string;
  dataSource?: string;
  collectionName?: string;
  schema?: SchemaSpec;
  indexes?: Array<any>;
  autoIndex?: boolean;
  relations?: {[key: string]: any};
  schemas?: {[key: string]: any};
  repos?: {[key: string]: any};
  constructors?: {[key: string]: any};
  services?: {[key: string]: any};
}

export interface RepoQueryOptions
{
  populate?: {[key: string]: boolean};
  filterPrivate?: boolean; 
  sort?: {[key: string]: number};
  limit?: number;
  skip?: number;
  hint?: string | {[key: string]: number};
  collation?: {
     locale?: string,
     caseLevel?: boolean,
     caseFirst?: string,
     strength?: number,
     numericOrdering?: boolean,
     alternate?: string,
     maxVariable?: string,
     backwards?: boolean
  };
}

export interface RepoPopulateOptions
{
  repo?: string;
  type?: string;
  docPath?: string;
  docPathRelated?: string;
  key?: string | number;
  alias?: string | number;
  query?: any;
  sort?: {[key: string]: number};
  limit?: number;
  skip?: number;
  entityConstructor?: any;
  populateRelations?: boolean;
}

export class Repo
{
  config: RepoConfig;
  name: string;
  dataSource: any;
  schema: any;
  schemas: {[key: string]: any};
  repos: {[key: string]: any};
  constructors: {[key: string]: any};
  services: {[key: string]: any};
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
    this.schemas = {};
    this.repos = {};
    this.constructors = {};
    this.services = {};

    if (this.config.schemas) this.addSchemas(this.config.schemas);
    if (this.config.repos) this.addRepos(this.config.repos);
    if (this.config.constructors) this.addConstructors(this.config.constructors);
    if (this.config.services) this.addServices(this.config.services);

    // Compile an array of relation aliases which can be used to strip relations of populated objects before saving
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
  
  getName()
  {
    // If repo name == 'Repo' then we are most likely using the name of the default repo constrcutor.
    // This can cause problems because repositories are referred to by name in the model and if we have multiple
    // repositories named 'Repo' we could not be sure which one we are working with
    // For this reason we do not permit a repository to be named 'Repo'
    if (this.name == 'Repo') throw new Error('Repo name not configured - you must specify a repo name when using the default repo entityConstructor');
    return this.name;
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
          this.addSchema(schema);
        });
      } else {
        Object.keys(schemas).forEach((schemaName) => {
          this.addSchema(schemas[schemaName]);
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
        repos.forEach(repo => {
          this.addRepo(repo);
        });
      } else {
        Object.keys(repos).forEach(repoName => {
          this.addRepo(repos[repoName]);
        });
      }
    }
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
          this.addService(service);
        });
      } else {
        Object.keys(services).forEach((serviceName) => {
          this.addService(services[serviceName]);
        });
      }
    }
  }
  
  getService(name)
  {
    const service = this.services[name];
    return service;
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
  
  createIndexes()
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
  
  createIndex(fieldOrSpec, options?)
  {
    return this.dataSource.createIndex(this.config.collectionName, fieldOrSpec, options);
  }
  
  dropIndex(indexName, options?)
  {
    return this.dataSource.dropIndex(this.config.collectionName, indexName, options);
  }
  
  dropIndexes()
  {
    return this.dataSource.dropIndexes(this.config.collectionName);
  }
  
  // @ts-ignore 'args' is declared but its value is never read.
  async find(...args: any[])
  {
    this.initSchema();
    const findOptions = this.findQueryOptions(arguments);
    var validateResult = await this.schema.validateQuery(findOptions.query);
    if (!validateResult.isValid) {
      throw new RepoErrorValidation(validateResult.errors)
    }
    // @ts-ignore - Expected 0 arguments, but got 2 - variable method arguments
    var objects = await this.dataSource.find(this.config.collectionName, findOptions.query, findOptions.fields, findOptions.queryOptions);
    return this.findPopulate(objects, findOptions);
  }
  
  // @ts-ignore 'args' is declared but its value is never read.
  async findOne(...args: any[])
  {
    this.initSchema();
    const findOptions = this.findQueryOptions(arguments);
    var validateResult = await this.schema.validateQuery(findOptions.query);
    if (!validateResult.isValid) {
      throw new RepoErrorValidation(validateResult.errors);
    }
    // @ts-ignore - Expected 0 arguments, but got 2 - variable method arguments
    var objects = await this.dataSource.findOne(this.config.collectionName, findOptions.query, findOptions.fields, findOptions.queryOptions);
    return this.findPopulate(objects, findOptions);
  }
  
  async count(query, options?)
  {
    this.initSchema();
    var validateResult = await this.schema.validateQuery(query);
    if (!validateResult.isValid) {
      return new RepoErrorValidation(validateResult.errors);
    }
    return this.dataSource.count(this.config.collectionName, query, options);
  }
  
  aggregate(pipeline, options?)
  {
    return this.dataSource.aggregate(this.config.collectionName, pipeline, options);
  }
  
  findQueryOptions(findArguments)
  {
    // This method parses query options for finder methods and compiles into an array that is easier to consunme

    var query = {};
    var fields = {};
    var options = {} as RepoQueryOptions;

    query = findArguments[0];
    switch (Object.keys(findArguments).length) {
      case 2:
        options = findArguments[1];
      break;
      case 3:
        fields = findArguments[1];
        options = findArguments[2];
      break;
    }

    options.populate = (options.populate !== undefined)  ? options.populate : {};
    options.filterPrivate = (options.filterPrivate !== undefined)  ? options.filterPrivate : false;

    var findOptions = {query, fields, options, queryOptions: {}};
    // Find query options should not be propagated to further calls to find during population
    // - so we create a seperate options object for the query and remove options we dont want to propagate
    var queryOptions = {} as RepoQueryOptions;
    if (options.sort != undefined) queryOptions.sort = options.sort;
    delete options.sort;
    if (options.limit != undefined) queryOptions.limit = options.limit;
    delete options.limit;
    if (options.skip != undefined) queryOptions.skip = options.skip;
    delete options.skip;
    if (options.hint != undefined) queryOptions.hint = options.hint;
    delete options.hint;
    if (options.collation != undefined) queryOptions.collation = options.collation;
    delete options.collation;

    findOptions.queryOptions = queryOptions;

    return findOptions;
  }
  
  async findPopulate(objects, findOptions)
  {
    if (findOptions.options.filterPrivate) {
      this.schema.filterPrivate(objects, 'read');
    }
    objects = objects ? this.schema.applyTransients(objects, findOptions) : objects;
    if (findOptions.options.populateRelations === false) {
      return objects;
    } else {
      return this.populateAll(objects, findOptions.options);
    }
  }
  
  async populate(relation, objects, options)
  {
    options = (options == Object(options)) ? options : {};

    // If relation is passed as string relation name, lookup the relation config
    relation = (typeof relation == 'string') ? this.config.relations[relation] : relation;

    await this.getPopulatePromise(relation, options, objects); // side affect modified objects
    return objects;
  }
  
  getFlattenedRelations(options)
  {
    // This method returns an array of arrays - were each child array contains relations for a given relation depth
    // In order to populate a relation at a given depth its parent relation must have already been populated
    // To ensure parent relations are populate first we populate in order of relation depth

    const flattenedRelationsRecursive = this.getFlattenedRelationsRecursive(options);

    var flattenedRelations = [];
    flattenedRelationsRecursive.forEach(function(relationConfig){
      const depth = relationConfig.depth;
      const relation = relationConfig.relation;
      const path = relationConfig.path;
      // Remove relations based on query options
      let populate = (relation.populate !== undefined) ? relation.populate : false;
      // Relation populate value can be overriden by option to populateAll()
      populate = (options.populate[path] !== undefined) ? options.populate[path] : populate;
      if (!populate) return;

      // Sort into depth arrays
      if (flattenedRelations[depth] == undefined) flattenedRelations[depth] = [];
      flattenedRelations[depth].push(relation);
    });

    return flattenedRelations;
  }
  
  getFlattenedRelationsRecursive(options = {}, parentRepo?, basePath = [], flatRelations = [])
  {
    parentRepo = parentRepo ? parentRepo : this.config.name;
    for (var alias in this.config.relations) {
      const depth = basePath.length;
      const relation = clone(this.config.relations[alias]); // copy the relation we dont want to modify the original
      const recursion = relation.recursion ? relation.recursion : 0;

      // Append base path
      relation.docPath = (relation.docPath)
                         ? (basePath && basePath.length ? basePath.join('.') + '.' + relation.docPath : relation.docPath)
                         : (basePath && basePath.length ? basePath.join('.') : '');

      // Append base path
      relation.docPathRelated = (relation.docPathRelated)
                                ? (basePath && basePath.length ? basePath.join('.') + '.' + relation.docPathRelated : relation.docPathRelated)
                                : (basePath && basePath.length ? basePath.join('.') : '');

      const flatRelation = {
        depth: depth,
        path: relation.docPath ? relation.docPath + '.' + relation.alias : relation.alias,
        id: parentRepo + '.' + relation.alias,
        relation: relation,
        recursionCount: 0
      };

      // How many parents of this relation are the same relation?
      let realtionDepths = [];
      flatRelations.forEach(function(existingFlatRelation){
        if (existingFlatRelation.id == flatRelation.id && existingFlatRelation.depth < depth) {
          realtionDepths[existingFlatRelation.depth] =  true;
        }
      });
      flatRelation.recursionCount = realtionDepths.length;

      if (flatRelation.recursionCount > recursion) {
        continue;
      }

      flatRelations.push(flatRelation);

      if (relation.type != 'hasManyCount') {
    		let newBasePath = basePath.slice();
    		newBasePath.push(relation.alias);

        if (relation.type == 'hasMany' || relation.type == 'belongsToMany') {
          newBasePath.push('*');
        }

        const repo = this.getRepo(relation.repo);
        flatRelations.concat(repo.getFlattenedRelationsRecursive(options, relation.repo, newBasePath, flatRelations));
      }
    }
    // sort by document path length
    flatRelations = flatRelations.sort(function(a, b) {
      return a.depth != b.depth ? a.depth - b.depth : ((a.path > b.path) ? 1 : 0);
    });

    return flatRelations;
  }
  
  populateAll(objects, options: {populateRelations?: boolean, populate: {[key: string]: boolean} | boolean})
  {
    const flattenedRelations = this.getFlattenedRelations(options);
    options.populateRelations = false; // Dont populate recursively - we already flattened the relations
    var populateDepth = (relations, options, objects) => {
      let populatePromises = [];
      if (relations) {
        for (let x in relations) {
          let relation = relations[x];
          if ((Array.isArray(objects) && relation.limit)) {
            // This relation is using the limit option so we can not populate a collection of objects in a single query
            // - as it would produce in unexpcetd results.
            // We must populate each document individually with a seperate query
            objects.forEach((object) => {
              populatePromises.push(this.getPopulatePromise(relation, options, object));
            });
          } else {
            populatePromises.push(this.getPopulatePromise(relation, options, objects));
          }
        }
      }
      return Promise.all(populatePromises);
    };

    var promise = Promise.resolve([]);
    for (let depth in flattenedRelations) {
      let relations = flattenedRelations[depth];
      promise = promise.then(() => {
        return populateDepth(relations, options, objects);
      });
    }

    return promise.then(() => objects);
  }
  
  getPopulatePromise(relation, options: RepoPopulateOptions = {}, objects = [])
  {
    this.initSchema();

    // Clone the options because we dont want changes to the options object to change the original object
    var relationOptions = clone(options);
    relationOptions.repo = relation.repo;
    relationOptions.type = relation.type;
    relationOptions.docPath = relation.docPath ? relation.docPath : '';
    relationOptions.docPathRelated = relation.docPathRelated ? relation.docPathRelated : '';
    relationOptions.key = relation.key;
    relationOptions.alias = relation.alias;
    relationOptions.query = relation.query;
    relationOptions.sort = options.sort ? options.sort : relation.sort;
    relationOptions.limit = options.limit ? options.limit : relation.limit;
    relationOptions.skip = options.skip ? options.skip : relation.skip;
    relationOptions.entityConstructor = options.entityConstructor;
    relationOptions.populateRelations = options.populateRelations;

    var repo = this.getRepo(relation.repo);
    var repoPopulate = new RepoPopulate(repo);

    return repoPopulate[relation.type](objects, relationOptions);
  }
  
  async insertMany(objects, options?)
  {
    this.initSchema();
    var args = Array.prototype.slice.call(arguments); // We use Array.slice() to make a copy of the original args
    args[0] = this.stripTransients(objects);

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
  
  async insertOne(object, options?)
  {
    this.initSchema();
    var args = Array.prototype.slice.call(arguments); // We use Array.slice() to make a copy of the original args
    args[0] = this.stripTransients(object);

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
  
  async updateMany(criteria, update, options?)
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
  
  async updateOne(criteria, update, options?)
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
  
  async deleteMany(filter, options?)
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
  
  async deleteOne(filter, options?)
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
  
  stripTransients(objects)
  {
    this.initSchema();

    var newObjects = clone(objects); // We will be deleting relations so we need to work on a copy
    var isArray = Array.isArray(newObjects);
    var newObjects = isArray ? newObjects : [newObjects];

    this.relationPaths.forEach(function(relationPath){
      ObjectPathAccessor.unsetPath('*.' + relationPath, newObjects);
    });

    this.schema.stripTransients(newObjects);

    var result = isArray ? newObjects : newObjects.pop();
    return result;
  }
  
  getRepo(name)
  {
    return (name == this.config.name) ? this : this.repos[name];
  }
}

export default Repo;
