'use strict'
var clone = require('clone');

class MockDataSource
{
  constructor(data) {
    this.data = data;
  }
  connect()
  {
    // This is a in memory data store - there is nothing to connect to 
    // - we can resolve immediately
    return Promise.resolve(this);
  }
  find(collectionName, query, fields, findOptions)
  {
    var data = this.filterData(collectionName, query);
    // We must clone the result to prevent circular references
    return Promise.resolve(clone(data));
  }
  findOne(collectionName, query, fields, findOptions)
  {
    var data = this.filterData(collectionName, query);
    // We must clone the result to prevent circular references
    return Promise.resolve(clone(data[0]));
  }
  count(collectionName, query, fields, findOptions)
  {
    var data = this.filterData(collectionName, query);
    var count = Array.isArray(data) ? data.length : 0;
    return Promise.resolve(count);
  }
  filterData(collectionName, query)
  {
    var data = this.data[collectionName]
    var result = [];
    for (var x in data) {
      var skip = false;
      for (var key in query) {
        if (!query.hasOwnProperty(key)) continue;
        var queryValue = query[key];
        if (Array.isArray(queryValue['$in'])) {
          skip = queryValue['$in'].indexOf(data[x][key]) == -1;
        } else {
          skip = (data[x][key] !== queryValue);
        }
        if (skip) break;
      }
      if (!skip) {
        result.push(data[x]);
      }
    }
    return result;
  }
  insertMany(collectionName, docs)
  {
    return Promise.resolve();
  }
  insertOne(collectionName, docs)
  {
    return Promise.resolve();
  }
  updateMany(collectionName, docs)
  {
    return Promise.resolve();
  }
  updateOne(collectionName, docs)
  {
    return Promise.resolve();
  }
  deleteMany(collectionName, docs)
  {
    return Promise.resolve();
  }
  deleteOne(collectionName, docs)
  {
    return Promise.resolve();
  }
  createIndex(collectionName, spec, options)
  {
    return Promise.resolve();
  }
  close()
  {
    return Promise.resolve(this);
  }
}

module.exports = MockDataSource;
