'use strict'
var MongoClient = require('mongodb').MongoClient;

class MongoDb
{
  constructor(config) {
    this.config = config;
    this.connection = null;
  }
  connect()
  {
    const database = this.config['database'] ? this.config['database'] : '';
    const url = this.config['url'] ? this.config['url'] : '';
    const options = this.config['options'] ? this.config['options'] : {};
    
    return MongoClient.connect(url, options)
          .then(function(db){
            this.connection = db;
            return this;
          }.bind(this));
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
  insertMany(collectionName, ...args)
  {
    var collection = this.getCollection(collectionName);
    return collection.insertMany.apply(collection, args);
  }
  insertOne(collectionName, object, options)
  {
    var collection = this.getCollection(collectionName);
    console.log('test');
    return new Promise((resolve, reject) => {
      collection.insertOne(object, options, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
    });
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
  drop(collectionName, ...args)
  {
    var collection = this.getCollection(collectionName);
    return collection.drop.apply(collection, args);
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
  close()
  {
    if (this.connection) {
      return this.connection.close(true).then(function(){
        return this;
      });
    } else {
      // We never connected so we can resolve immediately 
      return Promise.resolve(this);
    }
  }
  getCollection(name)
  {
    name = (name == undefined) ? this.collectionName : name;
    return this.connection.collection(name);
  }
}
module.exports = MongoDb;
