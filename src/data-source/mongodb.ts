import { MongoClient, Db } from 'mongodb';
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

export class DataSourceMongodb implements DataSourceInterface
{
  protected config: {[key: string]: any};
  private client: MongoClient;
  private db: Db;
  
  constructor(config) 
  {
    this.config = config ? config : {};
    this.client = null;
    this.db = null;
  }
  
  async connect(): Promise<DataSourceInterface>
  {
    const defaultOptions = {
      ignoreUndefined: true, 
      useNewUrlParser: true,
      useUnifiedTopology: true
    };
    const url = this.config.url ? this.config.url : '';
    const customOptions = this.config.options ? this.config.options : {};
    const options = Object.assign({}, defaultOptions, customOptions);

    this.client = await MongoClient.connect(url, options);
    this.db = this.client.db();
    return this;
  }
  
  find(collectionName: string, query?: QuerySelection, options?: QuerySelectionOptions): Promise<any[]>
  {
    query = query ? query : {};
    options = options ? options : {};
    var collection = this.getCollection(collectionName);
    return collection.find(query, this._findOptionsNormalize(options)).toArray();
  }
  
  findOne(collectionName: string, query?: QuerySelection, options?: QuerySelectionOptions): Promise<any>
  {
    query = query ? query : {};
    options = options ? options : {};
    var collection = this.getCollection(collectionName);
    return collection.findOne(query, this._findOptionsNormalize(options));
  }
  
  count(collectionName: string, query?: QuerySelection, options?: QuerySelectionOptions): Promise<number>
  {
    query = query ? query : {};
    options = options ? options : {};
    var collection = this.getCollection(collectionName);
    return collection.countDocuments(query, this._findOptionsNormalize(options));
  }

  async groupCount(collectionName: string, groupFields: string[], query?: QuerySelection): Promise<Array<{_id: any, count: number}>>
  {
    query = query ? query : {};

    var collection = this.getCollection(collectionName);

    /*
    var groupFields = ['width', 'height'];
    var docs = [
      {width: 10, height: 20},
      {width: 10, height: 20},
      {width: 10, height: 20},
      {width: 3, height: 5},
      {width: 3, height: 5},
    ];
    var result = [
      {_id: {width: 10, height: 20}, count: 3},
      {_id: {width: 3, height: 5}, count: 2}
    ];
    */

    var aggregateId = {};
    groupFields.forEach(field => {
      aggregateId[field] = '$' + field;
    });

    var pipline = [];
    if (query) pipline.push({$match: query});
    pipline.push({
      $group: {
        _id: aggregateId, 
        count: {$sum: 1} 
      }
    });
    pipline.push({$project: {count: 1}});

    return await collection.aggregate(pipline).toArray();
  }
  
  async insertMany(collectionName: string, objects: any[], options?: any): Promise<QueryPersistResultInsertMany>
  {
    options = options ? options : {};
    var collection = this.getCollection(collectionName);
    var response = await collection.insertMany(objects, options);
    return {
      count: response.insertedCount,
      ids: response.insertedIds
    };
  }
  
  async insertOne(collectionName: string, object: any, options?: any): Promise<QueryPersistResultInsertOne>
  {
    options = options ? options : {};
    var collection = this.getCollection(collectionName);
    var response = await collection.insertOne(object, options);
    return {
      count: response.insertedCount,
      id: response.insertedId
    };
  }
  
  async updateMany(collectionName: string, querySelect: QuerySelection, queryUpdate: QueryUpdate, options?: any): Promise<QueryPersistResult>
  {
    options = options ? options : {};
    var collection = this.getCollection(collectionName);
    var response = await collection.updateMany(querySelect, queryUpdate, options);
    return { count: response.modifiedCount + response.upsertedCount };
  }
  
  async updateOne(collectionName: string, querySelect: QuerySelection, queryUpdate: QueryUpdate, options: any): Promise<QueryPersistResult>
  {
    options = options ? options : {};
    var collection = this.getCollection(collectionName);
    var response = await collection.updateOne(querySelect, queryUpdate, options);
    return { count: response.modifiedCount + response.upsertedCount };
  }
  
  async deleteMany(collectionName: string, query: QuerySelection): Promise<QueryPersistResult>
  {
    var collection = this.getCollection(collectionName);
    var response = await collection.deleteMany(query);
    return { count: response.deletedCount };
  }
  
  async deleteOne(collectionName: string, query: QuerySelection): Promise<QueryPersistResult>
  {
    var collection = this.getCollection(collectionName);
    var response = await collection.deleteOne(query);
    return { count: response.deletedCount };
  }
  
  drop(collectionName: string): Promise<any>
  {
    return this.getCollection(collectionName).drop().catch(error => {
      // Ignore error code 26 'ns not found' 
      // - otherwise re-throw
      if (error.code != 26) throw error;
    });
  }
  
  createIndex(collectionName: string, indexSpec: IndexSpec | string, options?: IndexOptions): Promise<any>
  {
    var collection = this.getCollection(collectionName);
    return collection.createIndex(indexSpec, options);
  }
  
  dropIndex(collectionName: string, indexName: string): Promise<any>
  {
    var collection = this.getCollection(collectionName);
    return collection.dropIndex(indexName);
  }
  
  dropIndexes(collectionName: string): Promise<any>
  {
    var collection = this.getCollection(collectionName);
    return collection.dropIndexes.apply(collection);
  }
  
  async close(): Promise<any>
  {
    if (this.client) {
      await this.client.close(true);
    } 

    return this;
  }

  private _findOptionsNormalize(options)
  {
    options = options ? options : {};
    if (options.fields) {
      options.projection = options.fields;
      delete options.fields;
    }
    return options;
  }
  
  private getCollection(collectionName?: string, options?)
  {
    return this.db.collection(collectionName, options);
  }
}

export default DataSourceMongodb;
