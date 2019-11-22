export interface QueryOperatorLogical
{
  $and?: QuerySelection[];
  $or?: QuerySelection[];
  $not?: QueryOperatorSelection;
  $nor?: QueryOperatorSelection[];
}

export interface QueryOperatorSelection
{
  $eq?: any; // equals
  $gt?: any; // greater than
  $gte?: any; // greater than or equal to
  $in?: any[]; // in
  $lt?: any; // less than
  $lte?: any; // less than or equal to
  $ne?: any; // not equal
  $nin?: any[]; // not in

  $exists?: boolean; // match documents that have or do not have the specified field

  [key: string]: any; // accept implementation specific props
}

export interface QuerySelection
{
  // Property name specifies a field name and may use dot notation to target embedded documents
  [key: string]: QueryOperatorSelection | QueryOperatorLogical | any;
}

export interface QuerySelectionOptions
{
  limit?: number;
  skip?: number;
  sort?: {[key: string]: number};
  fields?: {[key: string]: number}; // doc of fields to include or exclude (not both), {'field':1} or  {'field':0}
  comment?: string; // comment to make looking in logs simpler

  [key: string]: any; // accept implementation specific props
}

export interface QueryUpdate
{
  // in each of these operators the property name specifies a field name 
  // - and may use dot notation to target embedded documents
  $set?: {[key: string]: any};
  $unset?: {[key: string]: any};  // deletes a particular field the specified field value is not important 
  $inc?: {[key: string]: number};  // increments a field by a specified value
  $mul?: {[key: string]: number};  // multiply the value of a field by a number
  $min?: {[key: string]: any};  // updates the value if the specified value is less than the current value of the field
  $max?: {[key: string]: any};  // updates the value if the specified value is greater than the current value of the field (number or date)

  [key: string]: any; // accept implementation specific props
}

export interface IndexSpec
{
  [key: string]: string | number; // { fieldName: 1 } or { fieldName: -1 } or { fieldName: 'text }
}

export interface IndexOptions
{
  name?: string;
  unique?: boolean; 
  sparse?: boolean; // may not be supported by all implementations
  background?: boolean; // may not be supported by all implementations
  expireAfterSeconds?: number;  // may not be supported by all implementations
}

export interface QueryPersistResult
{
  count: number; // number of documents inserted / updated / deleted
}

export interface QueryPersistResultInsertMany extends QueryPersistResult
{
  ids: {[key: number]: any}; // map of the index of the inserted document to the id of the inserted document
}

export interface QueryPersistResultInsertOne extends QueryPersistResult
{
  id: any; // id of inserted or updated documents if only one doc was inserted / updated or id of the first doc inserted/updated
}

export interface DataSourceInterface
{
  connect(): Promise<DataSourceInterface>;
  
  find(collectionName: string, query?: QuerySelection, options?: QuerySelectionOptions): Promise<any[]>;
  
  findOne(collectionName: string, query?: QuerySelection, options?: QuerySelectionOptions): Promise<any>;
  
  count(collectionName: string, query?: QuerySelection, options?: QuerySelectionOptions): Promise<number>;

  groupCount(collectionName: string, groupFields: string[], query?: QuerySelection): Promise<Array<{_id: any, count: number}>>;
  
  insertMany(collectionName: string, docs: any[], options?: any): Promise<QueryPersistResultInsertMany>;
  
  insertOne(collectionName: string, doc: any, options?: any): Promise<QueryPersistResultInsertOne>;
  
  update(collectionName: string, querySelect: QuerySelection, queryUpdate: QueryUpdate, options?: any): Promise<QueryPersistResult>;
  
  deleteMany(collectionName: string, query: QuerySelection): Promise<QueryPersistResult>;
  
  deleteOne(collectionName: string, query: QuerySelection): Promise<QueryPersistResult>;
  
  drop(collectionName: string): Promise<any>;
  
  createIndex(collectionName: string, spec: IndexSpec | string, options?: IndexOptions): Promise<any>;
  
  dropIndex(collectionName: string, indexName: string): Promise<any>;
  
  dropIndexes(collectionName: string): Promise<any>;

  close(): Promise<any>;
}

export default DataSourceInterface;
