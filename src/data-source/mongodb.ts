import { MongoClient, Db } from 'mongodb';

export class MongoDb
{
  config: {[key: string]: any};
  client: MongoClient;
  db: Db;
  
  constructor(config) 
  {
    this.config = config ? config : {};
    this.client = null;
    this.db = null;
  }
  
  async connect()
  {
    const defaultOptions = {ignoreUndefined: true, useNewUrlParser: true};
    const url = this.config.url ? this.config.url : '';
    const customOptions = this.config.options ? this.config.options : {};
    const options = Object.assign({}, defaultOptions, customOptions);
    
    console.log(MongoClient);

    this.client = await MongoClient.connect(url, options);
    this.db = this.client.db();
    return this;
  }
  
  _findOptionsNormalize(options, extra)
  {
    options = options ? options : {};
    extra = extra ? extra : {};
    if (extra.fields) options.projection = extra.fields;
    return options;
  }
  
  find(collectionName, query, fields, options)
  {
    var findArgs = [];
    if (query) findArgs.push(query);
    if (fields || options) findArgs.push(this._findOptionsNormalize(options, {fields}));
    
    var collection = this.getCollection(collectionName);
    var cursor = collection.find.apply(collection, findArgs);
    return cursor.toArray();
  }
  
  findOne(collectionName, query, fields, options)
  {
    var findArgs = [];
    if (query) findArgs.push(query);
    if (fields || options) findArgs.push(this._findOptionsNormalize(options, {fields}));
      
    var collection = this.getCollection(collectionName);
    var cursor = collection.findOne.apply(collection, findArgs);
    return cursor;
  }
  
  count(collectionName, ...args)
  {
    var collection = this.getCollection(collectionName);
    var count = collection.count.apply(collection, args);
    return count;
  }
  
  aggregate(collectionName, ...args)
  {
    var collection = this.getCollection(collectionName);
    var cursor = collection.aggregate.apply(collection, args);
    return cursor.toArray();
  }
  
  insertMany(collectionName, objects, options)
  {
    var collection = this.getCollection(collectionName);
    return collection.insertMany(objects, options);
  }
  
  insertOne(collectionName, object, options)
  {
    var collection = this.getCollection(collectionName);
    return collection.insertOne(object, options);
  }
  
  updateMany(collectionName, ...args)
  {
    var collection = this.getCollection(collectionName);
    return collection.updateMany.apply(collection, args);
  }
  
  updateOne(collectionName, ...args)
  {
    var collection = this.getCollection(collectionName);
    return collection.updateOne.apply(collection, args);
  }
  
  deleteMany(collectionName, ...args)
  {
    var collection = this.getCollection(collectionName);
    return collection.deleteMany.apply(collection, args);
  }
  
  deleteOne(collectionName, ...args)
  {
    var collection = this.getCollection(collectionName);
    return collection.deleteOne.apply(collection, args);
  }
  
  drop(collectionName)
  {
    return this.getCollection(collectionName).drop().catch((error) => {
      // Ignore error code 26 'ns not found' 
      // - otherwise re-throw
      if (error.code != 26) throw error;
    });
  }
  
  createIndex(collectionName, ...args)
  {
    var collection = this.getCollection(collectionName);
    return collection.createIndex.apply(collection, args);
  }
  
  dropIndex(collectionName, ...args)
  {
    var collection = this.getCollection(collectionName);
    return collection.dropIndex.apply(collection, args);
  }
  
  dropIndexes(collectionName)
  {
    var collection = this.getCollection(collectionName);
    return collection.dropIndexes.apply(collection);
  }
  
  async close()
  {
    if (this.client) {
      await this.client.close(true);
    } 

    return this;
  }
  
  getCollection(name, options?)
  {
    return this.db.collection(name, options);
  }
}

export default MongoDb;
