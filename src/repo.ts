import clone = require('clone');
import RepoPopulate from './repo-populate';
import { ModelManagerConfig } from './model-manager';
import Schema, { SchemaValidationResult, SchemaSpec, ObjectPathAccessor } from 'mzen-schema';
import Service from './service';

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
  relations?: {[key: string]: RepoRelationConfig};
  constructors?: {[key: string]: any} | Array<any>;
  schemas?: {[key: string]: Schema} | Array<Schema>;
  repos?: {[key: string]: Repo} | Array<Repo>;
  services?: {[key: string]: Service} | Array<Service>;
}

export interface RepoQueryOptions
{
  limit?: number;
  skip?: number;
  sort?: {[key: string]: number};
  populate?: {[key: string]: boolean} | boolean;
  filterPrivate?: boolean; 
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

export interface RepoRelationConfig extends RepoQueryOptions
{
  repo?: string;
  type?: string;
  docPath?: string;
  docPathRelated?: string;
  key?: string;
  alias?: string;
  query?: any;
  recursion?: number;
  autoPopulate?: boolean;
}

export class Repo
{
  config: RepoConfig;
  name: string;
  dataSource: any;
  schema: Schema;
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
  
  getName(): string
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
    return (name == this.name) ? this : this.repos[name];
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
  
  addServices(services: Array<Service> | {[key: string]: Service})
  {
    // could be an array of repo objects or a object map
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
      throw new RepoErrorValidation(validateResult.errors);
    }
    return this.dataSource.count(this.config.collectionName, query, options);
  }
  
  async aggregate(pipeline, options?)
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

    //options.populate = (options.populate !== undefined)  ? options.populate : true;
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
  
  async findPopulate(objects: any, findOptions: any)
  {
    if (findOptions.options.filterPrivate) {
      this.schema.filterPrivate(objects, 'read');
    }
    objects = objects ? this.schema.applyTransients(objects) : objects;
    return (findOptions.options.populate === false) ? objects : this.populateAll(objects, findOptions.options);
  }
  
  getFlattenedRelations(options: any)
  {
    // In order to populate a relation at a given depth its parent relation must have already been populated
    // To ensure parent relations are populate first we populate in order of relation depth
    // This method returns an array of arrays - were each child is an array of relation configs for a given relation depth
    // [
    //  [relationConfigA, relationConfigB], // depth 1 to be populated first
    //  [relationConfigB, relationConfigC] // depth 2 to be populated second
    // ]
    const flattenedRelationsRecursive = this.getFlattenedRelationsRecursive(options);

    var flattenedRelations = [];
    flattenedRelationsRecursive.forEach(relationConfig => {
      const { depth, relation } = relationConfig;
      // Sort into depth arrays
      if (flattenedRelations[depth] == undefined) flattenedRelations[depth] = [];
      flattenedRelations[depth].push(relation);
    });

    return flattenedRelations;
  }
  
  getFlattenedRelationsRecursive(options: any, flatRelations?: Array<any>, basePath?: string[])
  {
    // parentRepo?, basePath?: Array<string>, flatRelations?: Array<any>
    flatRelations = flatRelations ? flatRelations : [];
    basePath = basePath ? basePath : [];

    for (var x in this.config.relations) {
      const relation = clone(this.config.relations[x]); // copy the relation we dont want to modify the original
      const depth = basePath.length;
      const recursion = relation.recursion ? relation.recursion : 0;
      const autoPopulate = relation.autoPopulate != undefined ? relation.autoPopulate : false;
      const populate = relation.populate != undefined ? relation.populate : true;
      const queryPopulate = options.populate != undefined ? options.populate : true;

      // Append base path
      relation.docPath = (relation.docPath)
                         ? (basePath && basePath.length ? basePath.join('.') + '.' + relation.docPath : relation.docPath)
                         : (basePath && basePath.length ? basePath.join('.') : '');

      // Append base path
      relation.docPathRelated = (relation.docPathRelated)
                                ? (basePath && basePath.length ? basePath.join('.') + '.' + relation.docPathRelated : relation.docPathRelated)
                                : (basePath && basePath.length ? basePath.join('.') : '');

      const path = relation.docPath ? relation.docPath + '.' + relation.alias : relation.alias;


      if (
        !queryPopulate || // query said dont populate any relations
        (queryPopulate[path] !== undefined && !queryPopulate[path]) || // query said dont populate this path
        (queryPopulate[path] === undefined && !autoPopulate) // query didnt specificaly enable population and relation auto population is disabled
      ) {
        // relation should not populate - continue to next relation
        continue;
      }

      const flatRelation = {
        id: this.name + '.' + relation.alias,
        depth,
        path,
        relation,
        recursionCount: 0
      };

      // How many parents of this relation are the same relation?
      let realtionDepths = [];
      flatRelations.forEach(existingFlatRelation => {
        if (existingFlatRelation.id == flatRelation.id && existingFlatRelation.depth < depth) {
          realtionDepths[existingFlatRelation.depth] =  true;
        }
      });
      flatRelation.recursionCount = realtionDepths.length;

      // If we have reached the recursion count skip this relation
      if (flatRelation.recursionCount > recursion) continue;

      flatRelations.push(flatRelation);

      // hasManyCountRelation does not require recursive populations since its data is just a number
      if (relation.type == 'hasManyCount') continue;

      // Recurse into this relation only if populate is true or is populate relation path is true
      if (populate) {
        let nextBasePath = basePath.slice();
        nextBasePath.push(relation.alias);
        if (relation.type == 'hasMany' || relation.type == 'belongsToMany') {
          nextBasePath.push('*');
        }

        this.getRepo(relation.repo).getFlattenedRelationsRecursive(options, flatRelations, nextBasePath);
      }
    }
    // sort by document path length
    flatRelations.sort(function(a, b) {
      return a.depth != b.depth ? a.depth - b.depth : ((a.path > b.path) ? 1 : 0);
    });

    return flatRelations;
  }
  
  async populateAll(objects: any, options?: RepoQueryOptions)
  {
    const flattenedRelations = this.getFlattenedRelations(options);
    options.populate = false; // Dont populate recursively - we already flattened the relations

    for (let depth in flattenedRelations) {
      let populatePromises = [];
      if (flattenedRelations[depth]) {
        for (let x in flattenedRelations[depth]) {
          let relation = flattenedRelations[depth][x];
          if ((Array.isArray(objects) && relation.limit)) {
            // This relation is using the limit option so we can not populate a collection of objects in a single query
            // - as it would produce in unexpcetd results.
            // We must populate each document individually with a seperate query
            objects.forEach(object => {
              populatePromises.push(this.populate(relation, object, options));
            });
          } else {
            populatePromises.push(this.populate(relation, objects, options));
          }
        }
      }
      await Promise.all(populatePromises);
    }

    return objects;
  }
  
  async populate(relation: RepoRelationConfig | string, objects?: any, options?: RepoQueryOptions)
  {
    this.initSchema();

    // If relation is passed as string relation name, lookup the relation config
    relation = (typeof relation == 'string') ? this.config.relations[relation] : relation;

    // Clone the options because we dont want changes to the options object to change the original object
    var opts = options ? clone({...relation, ...options}): clone({...relation});

    var repo = this.getRepo(relation.repo);
    var repoPopulate = new RepoPopulate(repo);

    await repoPopulate[relation.type](objects, opts);

    return objects;
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
  
  stripTransients(objects: any)
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
}

export default Repo;
