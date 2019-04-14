import { MongoClient, Db } from 'mongodb';
import { 
  DataSourceInterface,
  QuerySelection, 
  QuerySelectionOptions, 
  QueryUpdate, 
  IndexSpec, 
  IndexOptions
} from './interface';

export class MongoDb implements DataSourceInterface
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
    const defaultOptions = {ignoreUndefined: true, useNewUrlParser: true};
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
  
  count(collectionName: string, query?: QuerySelection, options?: QuerySelectionOptions): Promise<any>
  {
    query = query ? query : {};
    options = options ? options : {};
    var collection = this.getCollection(collectionName);
    return collection.count(query, this._findOptionsNormalize(options));
  }
  
  aggregate(collectionName?: string, ...args): Promise<any>
  {
    var collection = this.getCollection(collectionName);
    return collection.aggregate.apply(collection, args).toArray();
  }
  
  insertMany(collectionName: string, objects: any[], options?: any): Promise<any>
  {
    options = options ? options : {};
    var collection = this.getCollection(collectionName);
    return collection.insertMany(objects, options);
  }
  
  insertOne(collectionName: string, object: any, options?: any): Promise<any>
  {
    options = options ? options : {};
    var collection = this.getCollection(collectionName);
    return collection.insertOne(object, options);
  }
  
  updateMany(collectionName: string, querySelect: QuerySelection, queryUpdate: QueryUpdate, options?: any): Promise<any>
  {
    options = options ? options : {};
    var collection = this.getCollection(collectionName);
    return collection.updateMany(querySelect, queryUpdate, options);
  }
  
  updateOne(collectionName: string, querySelect: QuerySelection, queryUpdate: QueryUpdate, options: any): Promise<any>
  {
    options = options ? options : {};
    var collection = this.getCollection(collectionName);
    return collection.updateOne(querySelect, queryUpdate, options);
  }
  
  deleteMany(collectionName: string, query: QuerySelection): Promise<any>
  {
    var collection = this.getCollection(collectionName);
    return collection.deleteMany(query);
  }
  
  deleteOne(collectionName: string, query: QuerySelection): Promise<any>
  {
    var collection = this.getCollection(collectionName);
    return collection.deleteOne(query);
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

export default MongoDb;
