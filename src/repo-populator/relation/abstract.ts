import { Repo } from '../../repo';
import { RelationConfig } from '../../repo-populator';
import { ObjectPathAccessor } from 'mzen-schema';
import clone = require('clone');


export abstract class RelationAbstract
{
  abstract populate(relationRepo: Repo, relationConfig: RelationConfig, docs);

  protected getRelationIds(config: RelationConfig, docs)
  {
    config = this.normalizeConfig(config);

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
  
  protected populateValues(config: RelationConfig, docs, values)
  {
    config = this.normalizeConfig(config);

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
          let isHasOne = (config.type.toLowerCase().indexOf('hasone') != -1);
          if (values[sourceKey] !== undefined) doc[config.alias] = isHasOne ? values[sourceKey][0] : values[sourceKey];
        }
      }
    });

    return docs;
  }
  
  protected normalizeConfig(relationConfig: RelationConfig)
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
    config.type = config.type ? config.type : '';

    // sourceKey is an internal option (not specified by the user but set for internal handling) 
    // - which refers to either the key or the pkey depending on relation type
    // - sourceKey is the same as key value on belongsTo* type relations
    // - sourceKey is the same as pkey value on has* type relations
    config.sourceKey = (config.type.toLowerCase().indexOf('belongsto') != -1) ? config.key : config.pkey;

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

export default RelationAbstract;
