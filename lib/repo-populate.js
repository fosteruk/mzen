'use strict'
var ObjectPathAccessor = require('./object-path-accessor');

class RepoPopulate
{
  constructor(relationRepo) 
  {
    this.relationRepo = relationRepo;
  }
  hasMany(docs, options)
  {
    options.relation = 'hasMany';
    return this.has(docs, options);
  }
  hasOne(docs, options)
  {
    options.relation = 'hasOne';
    return this.has(docs, options);
  }
  async has(docs, options)
  {
    this.normalizeOptions(options);

    const relationIds = RepoPopulate.prototype.getRelationIds(docs, options);

    // Use query option if provided - allows results to be further filtered in addition to relation id
    options.query[options.key] = {$in: relationIds};
    
    var relatedDocs = await this.relationRepo.find(options.query, options);
    // Group related docs by parent key
    var values = {};
    relatedDocs.forEach(function(relatedDoc, x){
      if (values[relatedDoc[options.key]] == undefined) values[relatedDoc[options.key]] = [];
      values[relatedDoc[options.key]].push(relatedDoc);
    });
    
    return this.populate(docs, options, values);
  }
  async hasManyCount(docs, options)
  {
    this.normalizeOptions(options);

    const relationIds = RepoPopulate.prototype.getRelationIds(docs, options);

    // Use query option if provided - allows results to be further filtered in addition to relation id
    options.query[options.key] = {$in: relationIds};
    
    var aggregateId = {};
    aggregateId[options.key] = '$' + options.key;
    var results = await this.relationRepo.aggregate([
      {$match: options.query},
      {
        $group : {
           _id : aggregateId,
           count: { $sum: 1 }
        }
      }
    ]);

    // Group related docs by parent key
    var values = {};
    results.forEach(function(result, x){
      if (values[result['_id'][options.key]] == undefined) values[result['_id'][options.key]] = 0;
      values[result['_id'][options.key]] = result['count'];
    });
    
    return this.populate(docs, options, values);
  }
  embeddedHasOne(docs, options)
  {
    options.relation = 'embeddedHasOne';
    return this.embeddedHas(docs, options);
  }
  embeddedHasMany(docs, options)
  {
    options.relation = 'embeddedHasMany';
    return this.embeddedHas(docs, options);
  }
  embeddedHas(docs, options)
  {
    this.normalizeOptions(options);

    const relationIds = RepoPopulate.prototype.getRelationIds(docs, options);
    const embeddedDocs = this.getEmebedRelations(options.docPathRelated, docs);

    var values = {};
    embeddedDocs.forEach(function(embeddedDoc, x){
      if (relationIds.indexOf(embeddedDoc[options.key]) != -1) {
        if (values[embeddedDoc[options.key]] == undefined) values[embeddedDoc[options.key]] = [];
        values[embeddedDoc[options.key]].push(embeddedDoc);
      }
    });

    // Use query option if provided - allows results to be further filtered in addition to relation id
    return Promise.resolve(this.populate(docs, options, values));
  }
  belongsToOne(docs, options)
  {
    options.relation = 'belongsToOne';
    return this.belongsTo(docs, options);
  }
  belongsToMany(docs, options)
  {
    options.relation = 'belongsToMany';
    return this.belongsTo(docs, options);
  }
  async belongsTo(docs, options)
  {
    this.normalizeOptions(options);

    const relationIds = RepoPopulate.prototype.getRelationIds(docs, options);
    // Use query option if provided - allows results to be further filtered in addition to relation id
    options.query[options.pkey] = {$in: relationIds};

    var relatedDocs = await this.relationRepo.find(options.query, options);
    // Group related docs by parent key
    let values = {};
    relatedDocs.forEach(function(relatedDoc, x){
      values[relatedDocs[x][options.pkey]] = relatedDocs[x];
    });

    return this.populate(docs, options, values);
  }
  embeddedBelongsToMany(docs, options)
  {
    options.relation = 'embeddedBelongsToMany';
    return this.embeddedBelongsTo(docs, options);
  }
  embeddedBelongsToOne(docs, options)
  {
    options.relation = 'embeddedBelongsToOne';
    return this.embeddedBelongsTo(docs, options);
  }
  embeddedBelongsTo(docs, options)
  {
    this.normalizeOptions(options);

    const relationIds = RepoPopulate.prototype.getRelationIds(docs, options);
    const embeddedDocs = this.getEmebedRelations(options.docPathRelated, docs);

    var values = {};
    embeddedDocs.forEach((embeddedDoc, x) => {
      // We must store the id as a primitive so we can use it as a object field name in our lookup values object
      // - complex types can not be used as object field names
      let id = String(embeddedDoc[options.pkey]);
      if (relationIds.indexOf(id) != -1) {
        // Group related docs by parent key
        values[id] = embeddedDoc;
      }
    });

    // Use query option if provided - allows results to be further filtered in addition to relation id
    return Promise.resolve(this.populate(docs, options, values));
  }
  getRelationIds(docs, options)
  {
    this.normalizeOptions(options);
    
    // We may be passed an array of docs or a single doc 
    // - we want to deal with both situations uniformly
    // - if we are passed a single object we make it an array
    docs = Array.isArray(docs) ? docs : [docs];
    var relationIds = [];
    // If we were given a document path, the path is relative to the object not to the array of objects
    // - prefix the document path with '*' so it will pull all elements from the array
    const docPath = options.docPath ? '*.' + options.docPath : '*';
    const embeddedDocs = ObjectPathAccessor.getPath(docPath, docs);
    
    embeddedDocs.forEach(function(doc, x){
      if (doc) {
        let id = doc[options.sourceKey];
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
  getEmebedRelations(path, docs)
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
  populate(docs, options, values)
  {
    this.normalizeOptions(options);

    // We may be passed an array of docs or a single doc 
    // - we want to deal with both situations uniformly 
    // - if we are passed a single object we make it an array
    docs = Array.isArray(docs) ? docs : [docs];
    // If we were given a document path, the path is relative to the object not to the array of objects
    // - prefix the document path with '*' so it will pull all elements from the array
    const docPath = options.docPath ? '*.' + options.docPath : '*';
    const embeddedDocs = ObjectPathAccessor.getPath(docPath, docs);
  
    embeddedDocs.forEach(function(doc, x){
      if (doc !== Object(doc)) return;
      var sourceKey = doc[options.sourceKey];
      if (sourceKey) {
        if (Array.isArray(sourceKey)) {
          // The source key is an array of keys so we need to look up each value and append
          // - this must be a belongsToMany relation since that is the only relation type that supports
          // - an array of source keys
          doc[options.alias] = [];
          sourceKey.forEach(function(sk, y){
            if (values[sourceKey[y]] !== undefined) doc[options.alias].push(values[sourceKey[y]]);
          });
        } else {
          let isHasOne = (options.relation.toLowerCase().indexOf('hasone') != -1);
          if (values[sourceKey] !== undefined) doc[options.alias] = isHasOne ? values[sourceKey][0] : values[sourceKey];
        }
      }
    });
    
    return docs;
  }
  normalizeOptions(options)
  {
    // pkey is the primary key name to use when looking up relations
    // - the primary key is the key of the source document on has* type relations
    // - the primary key is the key of the related document on blongsTo* type relations
    options.pkey = options['pkey'] ? options['pkey'] : '_id';
    // Key is the field where the relation id is stored in the related document
    // - for all except belongsTo type relations where the key is on the source document
    options.key = options['key'] ? options['key'] : '';

    // relation type name
    options.relation = options['relation'] ? options['relation'] : '';

    // sourceKey is an internal option which refers to either the key or the pkey depending on relation type
    // - sourceKey is the same as key value on belongsTo* type relations
    // - sourceKey is the same as pkey value on has* type relations
    let isBelongsTo = (options['relation'].toLowerCase().indexOf('belongsto') != -1);
    options.sourceKey = isBelongsTo ? options['key'] : options['pkey'];

    // alias is the field name used to store the compiled relations 
    options.alias = options['alias'] ? options['alias'] : '';
    // docPath is path to the object(s) where the relation should be populated
    options.docPath = options['docPath'] ? options['docPath'] : false;
    // docPathRelated is the path to the related objects
    options.docPathRelated = options['docPathRelated'] ? options['docPathRelated'] : false;

    // query is query object used to further filter related objects
    options.query = options['query'] ? options['query'] : {};

    options.populateRelations = options['populateRelations'] !== false;
  }
}
module.exports = RepoPopulate;
