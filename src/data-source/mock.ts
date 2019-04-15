import { 
  DataSourceInterface,
  QuerySelection, 
  QuerySelectionOptions, 
  QueryUpdate, 
  IndexSpec, 
  IndexOptions,
  QueryPersistResult,
  QueryPersistResultInsertMany,
  QueryPersistResultInsertOne
} from './interface';
import clone = require('clone');

export class DataSourceMock implements DataSourceInterface
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
  
  async connect(): Promise<DataSourceInterface>
  {
    // This is a in memory data store - there is nothing to connect to 
    // - we can resolve immediately
    return Promise.resolve(this);
  }
  
  async find(collectionName: string, query?: QuerySelection, options?: QuerySelectionOptions): Promise<any[]>
  {
    this.queryCount++;
    var data = this.filterData(collectionName, query, options);
    // We must clone the result to prevent circular references
    return clone(data);
  }
  
  async findOne(collectionName: string, query?: QuerySelection, options?: QuerySelectionOptions): Promise<any>
  {
    this.queryCount++;
    var data = this.filterData(collectionName, query, options);
    // We must clone the result to prevent circular references
    return clone(data[0]);
  }
  
  async count(collectionName: string, query?: QuerySelection, options?: QuerySelectionOptions): Promise<any>
  {
    this.queryCount++;
    var data = this.filterData(collectionName, query, options);
    var count = Array.isArray(data) ? data.length : 0;
    return count;
  }

  async groupCount(_collectionName: string, _groupFields: string[], _query?: QuerySelection): Promise<Array<{_id: any, count: number}>>
  {
    return [{_id: {name: 'Tom'}, count: 10}];
  }
  
  filterData(collectionName, query?: QuerySelection, options?: QuerySelectionOptions)
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
  
  async insertMany(_collectionName: string, docs: any[], _options?: any): Promise<QueryPersistResultInsertMany>
  {
    this.queryCount++;
    this.dataInsert = this.dataInsert.concat(docs);
    return {
      count: docs.length,
      ids: docs.map((value, index) => value && value._id ? value._id : index)
    };
  }
  
  async insertOne(_collectionName: string, doc: any, _options?: any): Promise<QueryPersistResultInsertOne>
  {
    this.queryCount++;
    this.dataInsert.push(doc);
    return {
      count: 1,
      id: doc && doc._id ? doc._id : 1
    };
  }
  
  async updateMany(_collectionName: string, _querySelect: QuerySelection, queryUpdate: QueryUpdate, _options?: any): Promise<QueryPersistResult>
  {
    this.queryCount++;
    this.dataUpdate = this.dataUpdate.concat(queryUpdate);
    return {
      count: 10
    };
  }
  
  async updateOne(_collectionName: string, _querySelect: QuerySelection, queryUpdate: QueryUpdate, _options: any): Promise<QueryPersistResult>
  {
    this.queryCount++;
    this.dataUpdate = this.dataUpdate.concat(queryUpdate);
    return {
      count: 1
    };
  }
  
  // @ts-ignore - 'collectionName' is declared but its value is never read
  async deleteMany(collectionName: string, query: QuerySelection): Promise<QueryPersistResult>
  {
    this.queryCount++;
    return {
      count: 10
    };
  }
  
  async deleteOne(_collectionName: string, _query: QuerySelection): Promise<QueryPersistResult>
  {
    this.queryCount++;
    return {
      count: 1
    };
  }
  
  drop(_collectionName: string): Promise<any>
  {
    this.queryCount++;
    return Promise.resolve();
  }
  
  createIndex(_collectionName: string, _indexSpec: IndexSpec | string, _options?: IndexOptions): Promise<any>
  {
    this.queryCount++;
    return Promise.resolve();
  }

  async dropIndex(_collectionName: string, _indexName: string): Promise<any>
  {
    return true;
  }
  
  async dropIndexes(_collectionName: string): Promise<any>
  {
    return true;
  }
  
  close(): Promise<any>
  {
    this.queryCount++;
    return Promise.resolve(this);
  }
}

export default DataSourceMock;
