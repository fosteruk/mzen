'use strict'
var clone = require('clone');
var RepoPopulate = require('./repo-populate');
var ObjectPathAccessor = require('./object-path-accessor');
var Schema = require('./schema');
var TypeCaster = require('./type-caster');

class RepoErrorValidation extends Error 
{
  constructor(errors)
  {
    super('One or more fields failed validation');
    this.validationErrors = errors;
  }
}

class Repo
{
  constructor(options = {}) 
  {
    this.config = options;
    this.config['pkey'] = this.config['pkey'] ? this.config['pkey'] : '_id';
    this.config['name'] = this.config['name'] ? this.config['name'] : '';
    this.config['dataSource'] = this.config['dataSource'] ? this.config['dataSource'] : '';
    this.config['collectionName'] = this.config['collectionName'] ? this.config['collectionName'] : this.config['name'];
    this.config['schema'] = this.config['schema'] ? this.config['schema'] : {};
    this.config['indexes'] = this.config['indexes'] ? this.config['indexes'] : [];
    this.config['autoIndex'] = this.config['autoIndex'] !== undefined ? this.config['autoIndex'] : true;
    this.config['relations'] = this.config['relations'] ? this.config['relations'] : {};
    this.config['entityConstructor'] = this.config['entityConstructor'] ? this.config['entityConstructor'] : null;
    this.config['embeddedConstructors'] = this.config['embeddedConstructors'] ? this.config['embeddedConstructors'] : [];
    this.config['api'] = this.config['api'] ? this.config['api'] : {};
    this.config['api']['endpoints'] = this.config['api']['endpoints'] ? this.config['api']['endpoints'] : {};
    this.config['api']['endpointsEnabled'] = this.config['endpointsEnabled'] ? this.config['endpointsEnabled'] : {};

    this.dataSource = null;
    this.repos = {};

    // Compile an array of relation aliases which can be used to strip relations of populated objects before saving
    this.relationAliases = [];
    for (var alias in this.config['relations']) {
      if (!this.config['relations'].hasOwnProperty(alias)) continue;
      // set 'alias' in the relation config if not set
      // - the alias name is usually defined by the relation config as a the config element key but the alias value 
      // - needs to be available within the relation config itself so it can be passed around
      if (this.config['relations'][alias].alias == undefined) this.config['relations'][alias].alias = alias;
      this.relationAliases.push(this.config['relations'][alias].alias);
    }

    this.schema = TypeCaster.getType(this.config['schema']) == Schema ? this.config['schema'] : new Schema(this.config['schema'], options);
  }
  // Init creates indexes
  init()
  {
    var promises = [];
    if (this.config['autoIndex']) promises.push(this.createIndexes());
    return Promise.all(promises);
  }
  getName()
  {
    // Repo name defaults to the name of the entityConstructor
    var name = this.config['name'] ? this.config['name'] : this.constructor.name;
    // If repo name == 'Repo' then we are most likely using the name of the default repo constrcutor. 
    // This can cause problems because repositories are referred to by name in the model and if we have multiple 
    // repositories named 'Repo' we could not be sure which one we are working with
    // For this reason we do not permit a repository to be named 'Repo' 
    if (name == 'Repo') throw new Error('Repo name not configured - you must specify a repo name when using the default repo entityConstructor');
    return name;
  }
  createIndexes()
  {
    var promises = [];
    for (var indexName in this.config['indexes']) {
      if (!this.config['indexes'].hasOwnProperty(indexName)) continue;
      var index = this.config['indexes'][indexName];
      if (index['options'] == undefined) index['options'] = {};
      if (index['name']) {
        index['options']['name'] = index['name'];
      } else {
        index['options']['name'] = indexName;
      }
      promises.push(this.createIndex(index['spec'], index['options']));
    }
    return Promise.all(promises);  
  }
  createIndex(fieldOrSpec, options)
  {
    return this.dataSource.createIndex(this.config['collectionName'], fieldOrSpec, options);
  }
  dropIndex(indexName, options)
  {
    return this.dataSource.dropIndex(this.config['collectionName'], indexName, options);
  }
  dropIndexes()
  {
    return this.dataSource.dropIndexes(this.config['collectionName']);
  }
  find()
  {
    var findOptions = this.findQueryOptions(arguments);
    var validateResult = this.schema.validateQuery(findOptions.query);
    
    if (!validateResult.isValid) {
      return Promise.reject(new RepoErrorValidation(validateResult.errors));
    }
    
    return this.dataSource.find(this.config['collectionName'], findOptions.query, findOptions.fields, findOptions.queryOptions)
    .then(function(objects){
      return this.findPopulate(objects, findOptions);
    }.bind(this));
  }
  findOne()
  {
    var findOptions = this.findQueryOptions(arguments);
    var validateResult = this.schema.validateQuery(findOptions.query);
    
    if (!validateResult.isValid) {
      return Promise.reject(new RepoErrorValidation(validateResult.errors));
    }
    
    return this.dataSource.findOne(this.config['collectionName'], findOptions.query, findOptions.fields, findOptions.queryOptions)
    .then(function(objects){
      return this.findPopulate(objects, findOptions);
    }.bind(this));
  }
  count(query, options)
  {
    var findOptions = this.findQueryOptions(arguments);
    var validateResult = this.schema.validateQuery(query);
    
    if (!validateResult.isValid) {
      return Promise.reject(new RepoErrorValidation(validateResult.errors));
    }
    
    return this.dataSource.count(this.config['collectionName'], query, options)
    .then(function(count){
      return count;
    }.bind(this));
  }
  aggregate(pipeline, options)
  {
    return this.dataSource.aggregate(this.config['collectionName'], pipeline, options)
    .then(function(objects){
      return objects;
    }.bind(this));
  }
  findQueryOptions(findArguments)
  {
    // This method parses query options for finder methods and compiles into an array that is easier to consunme
    
    var query = {};
    var fields = {};
    var options = {};

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

    options['populate'] = (options['populate'] !== undefined)  ? options['populate'] : {};

    var findOptions = {
      query: query,
      fields: fields,
      options: options,
      queryOptions: {}
    };
    // Find options should not be propagated to further calls to find during population
    // - so we create a seperate options object
    var queryOptions = {};
    if (options['sort'] != undefined) queryOptions['sort'] = options['sort'];
    delete options['sort'];
    if (options['limit'] != undefined) queryOptions['limit'] = options['limit'];
    delete options['limit'];
    if (options['skip'] != undefined) queryOptions['skip'] = options['skip'];
    delete options['skip'];
    if (options['hint'] != undefined) queryOptions['hint'] = options['hint'];
    delete options['hint'];
    
    // We dont wan to propogate embedded constructor config
    queryOptions['embeddedConstructors'] = (options['embeddedConstructors'] !== undefined) ? options['embeddedConstructors'] : this.config['embeddedConstructors'];
    delete options['embeddedConstructors'];
    
    queryOptions['entityConstructor'] = (options['entityConstructor'] !== undefined) ? options['entityConstructor'] : this.config['entityConstructor'];
    // Allow entityConstructor option to propogate if its false
    // - If we dont want to populate entity prototypes on this repo we also dont want to populate them on relations
    if (options['entityConstructor'] !== false) delete options['entityConstructor'];
    
    findOptions['queryOptions'] = queryOptions;
  
    return findOptions;
  }
  applyConstructors(objects, findOptions)
  {
    var constructors = findOptions.queryOptions['embeddedConstructors'] ? findOptions.queryOptions['embeddedConstructors'] : {};   
    if (findOptions.queryOptions['entityConstructor']) {
      // Entity constructor path is the root - so we use an empty string
      constructors[''] = findOptions.queryOptions['entityConstructor'];
    }
    
    var result = objects;
    if (findOptions.queryOptions['entityConstructor'] !== false) {
      var isArray = Array.isArray(objects);
      objects = isArray ? objects : [objects];
      // If entityConstructor is exactly false then constructors have been supressed so dont apply any constructors
      if (Object.keys(constructors).length) {
        for (var documentPath in constructors) {
          if (!constructors.hasOwnProperty(documentPath)) continue;
          var construct = constructors[documentPath];
          if (construct === false) continue; // If constructor value is exactly false then the constructor has been supressed
          // Document path is relative to document we are working on an array of documents so we must prefix '*.'
          // If there is no document path then we are working on every element in an array so the path is simply '*'
          var path = documentPath.length ? '*.' + documentPath : '*';
          ObjectPathAccessor.mutatePath(path, objects, function(rawObject){
            var object = new construct;
            Object.assign(object, rawObject);
            return object;
          });
        }
      }
      result = isArray ? objects : objects[0];
    }
    
    return result;
  }
  findPopulate(objects, findOptions)
  {
    objects = this.applyConstructors(objects, findOptions);
    if (findOptions.options['populateRelations'] === false) {
      return Promise.resolve(objects);
    } else {
      return this.populateAll(objects, findOptions.options);
    }
  }
  populate(relation, objects, options)
  {
    options = (options == Object(options)) ? options : {};
    
    // If relation as passed as string relation name lookup the relation config
    relation = (typeof relation == 'string') ? this.config.relations[relation] : relation;

    return this.getPopulatePromise(relation, options, objects).then(function(){
      return objects;
    });
  }
  getFlattenedRelations(options)
  { 
    // This method returns an array of arrays - were each child array contains relations for a given relation depth
    // In order to populate a relation at a given depth its parent relation must have already been populated
    // to ensure parent relations are populate first we populate in order of relation depth
    
    var flattenedRelationsRecursive = this.getFlattenedRelationsRecursive(options);
    
    var flattenedRelations = [];
    flattenedRelationsRecursive.forEach(function(relationConfig){
      var depth = relationConfig['depth'];
      var relation = relationConfig['relation'];
      var path = relationConfig['path'];
      // Remove relations based on query options
      var populate = (relation['populate'] !== undefined) ? relation['populate'] : false;
      // Relation populate value can be overriden by option to populateAll()
      var populate = (options['populate'][path] !== undefined) ? options['populate'][path] : populate;
      if (!populate) return;
      
      // Sort into depth arrays
      if (flattenedRelations[depth] == undefined) flattenedRelations[depth] = [];
      flattenedRelations[depth].push(relation);
    });
    
    return flattenedRelations;
  }
  getFlattenedRelationsRecursive(options = {}, parentRepo, basePath = [], flatRelations = [])
  {
    var parentRepo = parentRepo ? parentRepo : this.config.name;
    for (var alias in this.config['relations']) {  
      var depth = (basePath.depth == undefined) ? 0 : basePath.depth;
      var relation = clone(this.config['relations'][alias]); // copy the relation we dont want to modify the original
      var populate = (relation['populate'] !== undefined) ? relation['populate'] : false;

      var recursion = relation['recursion'] ? relation['recursion'] : 0;

      relation.documentPath = basePath.length ? basePath.join('.') : '';
      var flatRelation = {
        depth: depth,
        path: relation.documentPath.length ?  relation.documentPath + '.' + relation.alias : relation.alias,
        id: parentRepo + '.' + relation.alias,
        relation: relation
      };
      
      // How many parents of this relation are the same relation?
      var realtionDepths = [];
      flatRelations.forEach(function(existingFlatRelation){
        if (existingFlatRelation.id == flatRelation.id && existingFlatRelation.depth < depth) {
          realtionDepths[existingFlatRelation.depth] =  true;
        }
      });
      flatRelation.recursionCount = realtionDepths.length;
      
      if (flatRelation.recursionCount > 0) {
        continue;
      }
      
      flatRelations.push(flatRelation);
      
      if (relation.type != 'hasManyCount') {
    		var newBasePath = basePath.slice();
    		newBasePath.push(relation.alias);
        newBasePath.depth = depth + 1;
        
        if (relation.type == 'hasMany' || relation.type == 'belongsToMany') { 
          newBasePath.push('*');
        }
        
        var repo = this.getRepo(relation.repo);
        flatRelations.concat(repo.getFlattenedRelationsRecursive(options, relation.repo, newBasePath, flatRelations));
      }
    }
    // sort by document path length
    flatRelations = flatRelations.sort(function(a, b) {
      return a.depth != b.depth ? a.depth - b.depth : a.pathString > b.pathString ;
    });

    return flatRelations;
  }
  populateAll(objects, options = {})
  {
    var flattenedRelations = this.getFlattenedRelations(options);
    options.populateRelations = false; // Dont populate recursively - we already flattened the relations
    
    var populateDepth = function(relations, options, objects) {
      var populatePromises = [];
      if (relations) {
        for (let x in relations) {
          var relation = relations[x];
          var populatePromise = this.getPopulatePromise(relation, options, objects);
          populatePromises.push(populatePromise);
        }
      }
      return Promise.all(populatePromises);
    }.bind(this);
  
    var promise = Promise.resolve();
    for (let depth in flattenedRelations) {
      let relations = flattenedRelations[depth];
      promise = promise.then(function(){
        return populateDepth(relations, options, objects);
      });
    }
    
    return promise.then(function(){
      return objects;
    });
  }
  getPopulatePromise(relation, options = {}, objects = [])
  {
    // Clone the options because we dont want changes to the options object to change the original object
    var relationOptions = clone(options);
    relationOptions['documentPath'] = relation['documentPath'];
    relationOptions['key'] =  relation['key'];
    relationOptions['alias'] =  relation['alias'];
    relationOptions['query'] = relation['query'];
    relationOptions['sort'] =  options['sort'] ? options['sort'] : relation['sort'];
    relationOptions['skip'] =  options['skip'] ? options['skip'] : relation['skip'];
    relationOptions['entityConstructor'] = options['entityConstructor'];
    relationOptions['populateRelations'] = options['populateRelations'];

    var repo = this.getRepo(relation.repo);
    var repoPopulate = new RepoPopulate(repo);
    
    return repoPopulate[relation.type](objects, relationOptions);
  }
  insertMany(objects, options)
  {
    var args = Array.prototype.slice.call(arguments); // We use Array.slice() to make a copy of the original args
    args[0] = this.stripTransients(args[0]);

    var promise = new Promise(function(resolve, reject){
      var validateResult = this.schema.validate(args[0]);
      
      if (!validateResult.isValid) {
        return reject(new RepoErrorValidation(validateResult.errors));
      }
      
      args.unshift(this.config['collectionName']); // Prepend collection name to arguments
      this.dataSource.insertMany.apply(this.dataSource, args).then(function(result){
        resolve(args[0]);
      }).catch(function(error){
        reject(error);
      });
    }.bind(this));
    return promise;
  }
  insertOne(object, options)
  {
    var args = Array.prototype.slice.call(arguments); // We use Array.slice() to make a copy of the original args
    args[0] = this.stripTransients(args[0]);

    var promise = new Promise(function(resolve, reject){
      var validateResult = this.schema.validate(args[0]);
      
      if (!validateResult.isValid) {
        return reject(new RepoErrorValidation(validateResult.errors));
      }
      
      args.unshift(this.config['collectionName']); // Prepend collection name to arguments
      this.dataSource.insertOne.apply(this.dataSource, args).then(function(result){
        resolve(args[1]);
      }).catch(function(error){
        reject(error);
      });
    }.bind(this));
    return promise;
  }
  updateMany(criteria, update, options)
  {
    var args = Array.prototype.slice.call(arguments); // We use Array.slice() to make a copy of the original args

    var promise = new Promise(function(resolve, reject){
      try {
        criteria = criteria ? criteria : {};
        var validateResultQuery = this.schema.validateQuery(criteria);
        var validateResultUpdate = {};
        if (update && update['$set']) {
          var validateResultUpdate = this.schema.validatePaths(update['$set']);
        }
        var validateResult = Schema.mergeValidationResults([validateResultQuery, validateResultUpdate]);
        
        if (!validateResult.isValid) {
          return reject(new RepoErrorValidation(validateResult.errors));
        }
        
        args.unshift(this.config['collectionName']); // Prepend collection name to arguments
        this.dataSource.updateMany.apply(this.dataSource, args).then(function(result){
          resolve(args[1]);
        }).catch(function(error){
          reject(error);
        });
      } catch (e) {
        reject(e);
      }
    }.bind(this));
		return promise;
  }
  updateOne(criteria, update, options)
  {
    var args = Array.prototype.slice.call(arguments); // We use Array.slice() to make a copy of the original args

    var promise = new Promise(function(resolve, reject){
      criteria = criteria ? criteria : {};
      
      var validationResults = [];
      validationResults.push(this.schema.validateQuery(criteria));
      if (update && update['$set']) {
        validationResults.push(this.schema.validatePaths(update['$set']));
      }
      var validateResult = Schema.mergeValidationResults(validationResults);
      
      if (!validateResult.isValid) {
        return reject(new RepoErrorValidation(validateResult.errors));
      }
      
      args.unshift(this.config['collectionName']); // Prepend collection name to arguments
      this.dataSource.updateOne.apply(this.dataSource, args).then(function(result){
      	resolve(result);
      });
    }.bind(this));
    return promise;
  }
  deleteMany(filter, options)
  {
    filter = filter ? filter : {};
    var validateResult = this.schema.validateQuery(filter);
    
    if (!validateResult.isValid) {
      var error = new RepoErrorValidation('One or more fields failed validation');
      error.validationErrors = validateResult.errors;
      return Promise.reject(error);
    }
    
    var args = Array.prototype.slice.call(arguments); // We use Array.slice() to make a copy of the original args
    args.unshift(this.config['collectionName']); // Prepend collection name to arguments
    return this.dataSource.deleteMany.apply(this.dataSource, args);
  }
  deleteOne(filter, options)
  {
    filter = filter ? filter : {};
    var validateResult = this.schema.validateQuery(filter);
    
    if (!validateResult.isValid) {
      return Promise.reject(new RepoErrorValidation(validateResult.errors));
    }
    
    var args = Array.prototype.slice.call(arguments); // We use Array.slice() to make a copy of the original args
    args.unshift(this.config['collectionName']); // Prepend collection name to arguments
    return this.dataSource.deleteOne.apply(this.dataSource, args);
  }
  stripTransients(objects)
  {
    var newObjects = clone(objects); // We will be deleting relations so we need to work on a copy
    var isArray = Array.isArray(newObjects);
    var newObjects = isArray ? newObjects : [newObjects];
    
    newObjects.forEach(function(newObject, x){
      this.relationAliases.forEach(function(alias, y){
        if (newObjects[x][alias]) delete newObjects[x][alias];
      });
    }, this);

    var result = isArray ? newObjects : newObjects.pop();
    return result;
  }
  getRepo(name)
  {
    return this.repos[name];
  }
}

Repo.errors = {
  validation: RepoErrorValidation
};

module.exports = Repo;
