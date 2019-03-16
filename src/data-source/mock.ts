import clone from 'clone';

export class MockDataSource
{
  data: {[key: string]: any};
  dataInsert: Array<any>;
  dataUpdate: Array<any>;
  queryCount: number;
  
  constructor(data) 
  {
    this.data = data;
    // On every call to insert data we append to this array 
    // - so our tests can assert the state of the data at the point of insert
    this.dataInsert = [];
    // On every call to update data we append to this array 
    // - so our tests can assert the state of the data at the point of update
    this.dataUpdate = [];
    this.queryCount = 0;
  }
  
  connect()
  {
    // This is a in memory data store - there is nothing to connect to 
    // - we can resolve immediately
    return Promise.resolve(this);
  }
  
  // @ts-ignore - 'fields' is declared but its value is never read
  find(collectionName, query, fields, findOptions)
  {
    this.queryCount++;
    var data = this.filterData(collectionName, query, findOptions);
    // We must clone the result to prevent circular references
    return Promise.resolve(clone(data));
  }
  
  // @ts-ignore - 'fields' is declared but its value is never read
  findOne(collectionName, query, fields, findOptions)
  {
    this.queryCount++;
    var data = this.filterData(collectionName, query, findOptions);
    // We must clone the result to prevent circular references
    return Promise.resolve(clone(data[0]));
  }
  
  // @ts-ignore - 'fields' is declared but its value is never read
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
    var data = this.data[collectionName];
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
      if (options['limit'] && result.length == options['limit']) break;
    }
    return result;
  }
  
  // @ts-ignore - 'collectionName' is declared but its value is never read
  insertMany(collectionName, docs)
  {
    this.queryCount++;
    this.dataInsert = this.dataInsert.concat(docs);
    return Promise.resolve();
  }
  
  // @ts-ignore - 'collectionName' is declared but its value is never read
  insertOne(collectionName, doc)
  {
    this.queryCount++;
    this.dataInsert.push(doc);
    return Promise.resolve();
  }
  
  // @ts-ignore - 'collectionName' is declared but its value is never read
  updateMany(collectionName, criteria, update, options)
  {
    this.queryCount++;
    this.dataUpdate = this.dataUpdate.concat(update);
    return Promise.resolve();
  }
  
  // @ts-ignore - 'collectionName' is declared but its value is never read
  updateOne(collectionName, criteria, update, options)
  {
    this.queryCount++;
    this.dataUpdate = this.dataUpdate.concat(update);
    return Promise.resolve();
  }
  
  // @ts-ignore - 'collectionName' is declared but its value is never read
  deleteMany(collectionName, docs)
  {
    this.queryCount++;
    return Promise.resolve();
  }
  
  // @ts-ignore - 'collectionName' is declared but its value is never read
  deleteOne(collectionName, doc)
  {
    this.queryCount++;
    return Promise.resolve();
  }
  
  // @ts-ignore - 'collectionName' is declared but its value is never read
  drop(collectionName)
  {
    this.queryCount++;
    return Promise.resolve();
  }
  
  // @ts-ignore - 'collectionName' is declared but its value is never read
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

export default MockDataSource;
