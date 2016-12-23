'use strict'
var clone = require('clone');

class MockDataSource
{
  constructor(data) {
    this.data = data;
    this.queryCount = 0;
  }
  connect()
  {
    // This is a in memory data store - there is nothing to connect to 
    // - we can resolve immediately
    return Promise.resolve(this);
  }
  find(collectionName, query, fields, findOptions)
  {
    this.queryCount++;
    var data = this.filterData(collectionName, query, findOptions);
    // We must clone the result to prevent circular references
    return Promise.resolve(clone(data));
  }
  findOne(collectionName, query, fields, findOptions)
  {
    this.queryCount++;
    var data = this.filterData(collectionName, query, findOptions);
    // We must clone the result to prevent circular references
    return Promise.resolve(clone(data[0]));
  }
  count(collectionName, query, fields, findOptions)
  {
    this.queryCount++;
    var data = this.filterData(collectionName, query, findOptions);
    var count = Array.isArray(data) ? data.length : 0;
    return Promise.resolve(count);
  }
  filterData(collectionName, query, options)
  {
    options = options ? options : {};
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
      if (options['limit'] && x+1 == options['limit']) break;
    }
    return result;
  }
  insertMany(collectionName, docs)
  {
    this.queryCount++;
    return Promise.resolve();
  }
  insertOne(collectionName, docs)
  {
    this.queryCount++;
    return Promise.resolve();
  }
  updateMany(collectionName, docs)
  {
    this.queryCount++;
    return Promise.resolve();
  }
  updateOne(collectionName, docs)
  {
    this.queryCount++;
    return Promise.resolve();
  }
  deleteMany(collectionName, docs)
  {
    this.queryCount++;
    return Promise.resolve();
  }
  deleteOne(collectionName, docs)
  {
    this.queryCount++;
    return Promise.resolve();
  }
  createIndex(collectionName, spec, options)
  {
    this.queryCount++;
    return Promise.resolve();
  }
  close()
  {
    this.queryCount++;
    return Promise.resolve(this);
  }
}

module.exports = MockDataSource;
