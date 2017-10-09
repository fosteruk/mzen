'use strict'
var MongoClient = require('mongodb').MongoClient;

class MongoDb
{
  constructor(config) {
    this.config = config;
    this.connection = null;
  }
  async connect()
  {
    const defaultOptions = {ignoreUndefined: true};
    const database = this.config['database'] ? this.config['database'] : '';
    const url = this.config['url'] ? this.config['url'] : '';
    const customOptions = this.config['options'] ? this.config['options'] : {};
    const options = Object.assign({}, defaultOptions, customOptions);

    this.connection = await MongoClient.connect(url, options);
    return this;
  }
  find(collectionName, ...args)
  {
    var collection = this.getCollection(collectionName);
    var cursor = collection.find.apply(collection, args);
    return cursor.toArray();
  }
  findOne(collectionName, ...args)
  {
    var collection = this.getCollection(collectionName);
    var cursor = collection.findOne.apply(collection, args);
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
    if (this.connection) {
      await this.connection.close(true);
    } 

    return this;
  }
  getCollection(name, options)
  {
    name = (name == undefined) ? this.collectionName : name;
    return this.connection.collection(name, options);
  }
}
module.exports = MongoDb;
