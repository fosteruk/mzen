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
  has(docs, options)
  {
    this.normalizeOptions(options);

    const relationIds = RepoPopulate.prototype.getRelationIds(docs, options);

    // Use query option if provided - allows results to be further filtered in addition to relation id
    options.query[options.key] = {$in: relationIds};
    
    return this.relationRepo.find(options.query, options).then((relatedDocs) => {
      // Group related docs by parent key
      var values = {};
      
      relatedDocs.forEach(function(relatedDoc, x){
        if (values[relatedDoc[options.key]] == undefined) values[relatedDoc[options.key]] = [];
        values[relatedDoc[options.key]].push(relatedDoc);
      });
      
      return this.populate(docs, options, values);
    });
  }
  hasManyCount(docs, options)
  {
    this.normalizeOptions(options);

    const relationIds = RepoPopulate.prototype.getRelationIds(docs, options);

    // Use query option if provided - allows results to be further filtered in addition to relation id
    options.query[options.key] = {$in: relationIds};
    
    var aggregateId = {};
    aggregateId[options.key] = '$' + options.key;
    return this.relationRepo.aggregate([
      {$match: options.query},
      {
        $group : {
           _id : aggregateId,
           count: { $sum: 1 }
        }
      }
    ]).then((results) => {
      // Group related docs by parent key
      let values = {};
      
      results.forEach(function(result, x){
        if (values[result['_id'][options.key]] == undefined) values[result['_id'][options.key]] = 0;
        values[result['_id'][options.key]] = result['count'];
      });
      
      return this.populate(docs, options, values);
    });
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
  belongsTo(docs, options)
  {
    this.normalizeOptions(options);

    const relationIds = RepoPopulate.prototype.getRelationIds(docs, options);
    // Use query option if provided - allows results to be further filtered in addition to relation id
    options.query[options.pkey] = {$in: relationIds};

    return this.relationRepo.find(options.query, options).then((relatedDocs) => {
      // Group related docs by parent key
      let values = {};
      relatedDocs.forEach(function(relatedDoc, x){
        values[relatedDocs[x][options.pkey]] = relatedDocs[x];
      });

      return this.populate(docs, options, values);
    });
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
    const documentPath = options.documentPath ? '*.' + options.documentPath : '*';
    const embeddedDocs = ObjectPathAccessor.getPath(documentPath, docs);
    
    embeddedDocs.forEach(function(doc, x){
      if (doc) {
        if (Array.isArray(doc[options.sourceKey])) {
          // Only belongsToMany relation supports an array of source keys
          relationIds = relationIds.concat(doc[options.sourceKey]);
        } else {
          relationIds.push(doc[options.sourceKey]);
        }
      }
    });
    
    return Array.from(new Set(relationIds));
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
    const documentPath = options.documentPath ? '*.' + options.documentPath : '*';
    const embeddedDocs = ObjectPathAccessor.getPath(documentPath, docs);
  
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
          doc[options.alias] = (options.relation == 'hasOne') ? values[sourceKey][0] : values[sourceKey];
        }
      }
    });
    
    return docs;
  }
  normalizeOptions(options)
  {
    options.pkey = options['pkey'] ? options['pkey'] : '_id';
    options.key = options['key'] ? options['key'] : '';
    options.relation = options['relation'] ? options['relation'] : '';
    options.sourceKey = options['relation'].substring(0, 9) == 'belongsTo' ? options['key'] : options['pkey'];
    options.alias = options['alias'] ? options['alias'] : '';
    options.documentPath = options['documentPath'] ? options['documentPath'] : false;
    options.query = options['query'] ? options['query'] : {};
    options.populateRelations = options['populateRelations'] !== false;
  }
}
module.exports = RepoPopulate;
