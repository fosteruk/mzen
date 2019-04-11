import { Repo, RepoRelationConfig } from './repo';
import { ObjectPathAccessor } from 'mzen-schema';
import clone = require('clone');

export interface RepoPopulateRelationConfig extends RepoRelationConfig
{
  relation?: string;
  sourceKey?: string;
}

export class RepoPopulateRelation
{
  relationRepo: Repo;
  
  constructor(relationRepo: Repo)
  {
    this.relationRepo = relationRepo;
  }
  
  async hasMany(config: RepoPopulateRelationConfig, docs)
  {
    config = RepoPopulateRelation.normalizeConfig(config);
    config.relation = 'hasMany';
    return this.has(config, docs);
  }
  
  async hasOne(config: RepoPopulateRelationConfig, docs)
  {
    config = RepoPopulateRelation.normalizeConfig(config);
    config.relation = 'hasOne';
    return this.has(config, docs);
  }
  
  async has(config: RepoPopulateRelationConfig, docs)
  {
    config = RepoPopulateRelation.normalizeConfig(config);

    const relationIds = RepoPopulateRelation.getRelationIds(config, docs);

    // Use query option if provided - allows results to be further filtered in addition to relation id
    config.query[config.key] = {$in: relationIds};
    // @ts-ignore - Expected 0 arguments, but got 2 - variable method arguments
    var relatedDocs = await this.relationRepo.find(config.query, config);
    // Group related docs by parent key
    var values = {};
    relatedDocs.forEach(relatedDoc => {
      if (values[relatedDoc[config.key]] == undefined) values[relatedDoc[config.key]] = [];
      values[relatedDoc[config.key]].push(relatedDoc);
    });

    return RepoPopulateRelation.populate(config, docs, values);
  }
  
  async hasManyCount(config: RepoPopulateRelationConfig, docs)
  {
    config = RepoPopulateRelation.normalizeConfig(config);

    const relationIds = RepoPopulateRelation.getRelationIds(config, docs);

    // Use query option if provided - allows results to be further filtered in addition to relation id
    config.query[config.key] = {$in: relationIds};

    var aggregateId = {};
    aggregateId[config.key] = '$' + config.key;
    var results = await this.relationRepo.aggregate([
      {$match: config.query},
      {
        $group : {
           _id : aggregateId,
           count: { $sum: 1 }
        }
      }
    ]);

    // Group related docs by parent key
    var values = {};
    results.forEach(result => {
      if (values[result['_id'][config.key]] == undefined) values[result['_id'][config.key]] = 0;
      values[result['_id'][config.key]] = result['count'];
    });

    return RepoPopulateRelation.populate(config, docs, values);
  }
  
  async embeddedHasOne(config: RepoPopulateRelationConfig, docs)
  {
    config = RepoPopulateRelation.normalizeConfig(config);
    config.relation = 'embeddedHasOne';
    return this.embeddedHas(config, docs);
  }
  
  async embeddedHasMany(config: RepoPopulateRelationConfig, docs)
  {
    config = RepoPopulateRelation.normalizeConfig(config);
    config.relation = 'embeddedHasMany';
    return this.embeddedHas(config, docs);
  }
  
  async embeddedHas(config: RepoPopulateRelationConfig, docs)
  {
    config = RepoPopulateRelation.normalizeConfig(config);

    const relationIds = RepoPopulateRelation.getRelationIds(config, docs);
    const embeddedDocs = RepoPopulateRelation.getEmebedRelations(config.docPathRelated, docs);

    var values = {};
    embeddedDocs.forEach(function(embeddedDoc){
      if (relationIds.indexOf(embeddedDoc[config.key]) != -1) {
        if (values[embeddedDoc[config.key]] == undefined) values[embeddedDoc[config.key]] = [];
        values[embeddedDoc[config.key]].push(embeddedDoc);
      }
    });

    return RepoPopulateRelation.populate(config, docs, values);
  }
  
  async belongsToOne(config: RepoPopulateRelationConfig, docs)
  {
    config = RepoPopulateRelation.normalizeConfig(config);
    config.relation = 'belongsToOne';
    return this.belongsTo(config, docs);
  }
  
  async belongsToMany(config: RepoPopulateRelationConfig, docs)
  {
    config = RepoPopulateRelation.normalizeConfig(config);
    config.relation = 'belongsToMany';
    return this.belongsTo(config, docs);
  }
  
  async belongsTo(config: RepoPopulateRelationConfig, docs)
  {
    config = RepoPopulateRelation.normalizeConfig(config);

    const relationIds = RepoPopulateRelation.getRelationIds(config, docs);
    // Use query option if provided - allows results to be further filtered in addition to relation id
    config.query[config.pkey] = {$in: relationIds};
    // @ts-ignore - Expected 0 arguments, but got 2 - variable method arguments
    var relatedDocs = await this.relationRepo.find(config.query, config);
    // Group related docs by parent key
    let values = {};
    
    relatedDocs.forEach((relatedDoc, x) => {
      values[relatedDoc[config.pkey]] = relatedDocs[x];
    });

    return RepoPopulateRelation.populate(config, docs, values);
  }
  
  async embeddedBelongsToMany(config: RepoPopulateRelationConfig, docs)
  {
    config = RepoPopulateRelation.normalizeConfig(config);
    config.relation = 'embeddedBelongsToMany';
    return this.embeddedBelongsTo(config, docs);
  }
  
  async embeddedBelongsToOne(config: RepoPopulateRelationConfig, docs)
  {
    config = RepoPopulateRelation.normalizeConfig(config);
    config.relation = 'embeddedBelongsToOne';
    return this.embeddedBelongsTo(config, docs);
  }
  
  async embeddedBelongsTo(config: RepoPopulateRelationConfig, docs)
  {
    config = RepoPopulateRelation.normalizeConfig(config);

    const relationIds = RepoPopulateRelation.getRelationIds(config, docs);
    const embeddedDocs = RepoPopulateRelation.getEmebedRelations(config.docPathRelated, docs);

    var values = {};
    embeddedDocs.forEach(embeddedDoc => {
      // We must store the id as a primitive so we can use it as a object field name in our lookup values object
      // - complex types can not be used as object field names
      let id = String(embeddedDoc[config.pkey]);
      if (relationIds.indexOf(id) != -1) {
        // Group related docs by parent key
        values[id] = embeddedDoc;
      }
    });

    return RepoPopulateRelation.populate(config, docs, values);
  }
  
  static getRelationIds(config: RepoPopulateRelationConfig, docs)
  {
    config = RepoPopulateRelation.normalizeConfig(config);

    // We may be passed an array of docs or a single doc
    // - we want to deal with both situations uniformly
    // - if we are passed a single object we make it an array
    docs = Array.isArray(docs) ? docs : [docs];
    var relationIds = [];
    // If we were given a document path, the path is relative to the object not to the array of objects
    // - prefix the document path with '*' so it will pull all elements from the array
    const docPath = config.docPath ? '*.' + config.docPath : '*';
    const embeddedDocs = ObjectPathAccessor.getPath(docPath, docs);

    embeddedDocs.forEach(doc => {
      if (doc) {
        let id = doc[config.sourceKey];
        if (Array.isArray(id)) {
          // Only belongsToMany relation supports an array of source keys
          id.forEach((anId) => {
            // We must store the id as a primitive as they are referenced as by lookup object
            // - complex types can not be used as object field names
            anId = String(anId);
            if (relationIds.indexOf(anId) == -1) {
              relationIds.push(anId);
            }
          });
        } else {
          // We must store the id as a primitive as they are referenced as by lookup object
          // - complex types can not be used as object field names
          relationIds.push(String(id));
        }
      }
    });

    return relationIds;
  }
  
  static getEmebedRelations(path, docs)
  {
    // We may be passed an array of docs or a single doc
    // - we want to deal with both situations uniformly
    // - if we are passed a single object we make it an array
    docs = Array.isArray(docs) ? docs : [docs];
    // If we were given a document path, the path is relative to the object not to the array of objects
    // - prefix the document path with '*' so it will pull all elements from the array
    const docPath = path ? '*.' + path : '*';
    const embeddedDocs = ObjectPathAccessor.getPath(docPath, docs);
    return embeddedDocs;
  }
  
  static populate(config: RepoPopulateRelationConfig, docs, values)
  {
    config = RepoPopulateRelation.normalizeConfig(config);

    // We may be passed an array of docs or a single doc
    // - we want to deal with both situations uniformly
    // - if we are passed a single object we make it an array
    docs = Array.isArray(docs) ? docs : [docs];
    // If we were given a document path, the path is relative to the object not to the array of objects
    // - prefix the document path with '*' so it will pull all elements from the array
    const docPath = config.docPath ? '*.' + config.docPath : '*';
    const embeddedDocs = ObjectPathAccessor.getPath(docPath, docs);

    embeddedDocs.forEach(doc => {
      if (doc !== Object(doc)) return;
      var sourceKey = doc[config.sourceKey];
      if (sourceKey) {
        if (Array.isArray(sourceKey)) {
          // The source key is an array of keys so we need to look up each value and append
          // - this must be a belongsToMany relation since that is the only relation type that supports
          // - an array of source keys
          doc[config.alias] = [];
          sourceKey.forEach(function(sk){
            if (values[sk] !== undefined) doc[config.alias].push(values[sk]);
          });
        } else {
          let isHasOne = (config.relation.toLowerCase().indexOf('hasone') != -1);
          if (values[sourceKey] !== undefined) doc[config.alias] = isHasOne ? values[sourceKey][0] : values[sourceKey];
        }
      }
    });

    return docs;
  }
  
  static normalizeConfig(relationConfig: RepoPopulateRelationConfig)
  {
    var config = clone(relationConfig);
    // pkey is the primary key name to use when looking up relations
    // - the primary key is the key of the source document on has* type relations
    // - the primary key is the key of the related document on blongsTo* type relations
    config.pkey = config.pkey ? config.pkey : '_id';
    // Key is the field where the relation id is stored in the related document
    // - for all except belongsTo type relations where the key is on the source document
    config.key = config.key ? config.key : '';

    // relation type name
    config.relation = config.relation ? config.relation : '';

    // sourceKey is an internal option (not specified by the user but set for internal handling) 
    // - which refers to either the key or the pkey depending on relation type
    // - sourceKey is the same as key value on belongsTo* type relations
    // - sourceKey is the same as pkey value on has* type relations
    let isBelongsTo = (config.relation.toLowerCase().indexOf('belongsto') != -1);
    config.sourceKey = isBelongsTo ? config.key : config.pkey;

    // alias is the field name used to store the compiled relations
    config.alias = config.alias ? config.alias : '';
    // docPath is path to the object(s) where the relation should be populated
    config.docPath = config.docPath ? config.docPath : null;
    // docPathRelated is the path to the related objects
    config.docPathRelated = config.docPathRelated ? config.docPathRelated : null;

    // query is query object used to further filter related objects
    config.query = config.query ? config.query : {};

    config.populate = config.populate !== false;

    return config;
  }
}

export default RepoPopulateRelation;
