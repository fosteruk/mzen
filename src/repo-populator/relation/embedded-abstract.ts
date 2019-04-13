import { RelationAbstract } from './abstract';
import { ObjectPathAccessor } from 'mzen-schema';

export abstract class RelationEmbeddedAbstract extends RelationAbstract
{
  protected getEmebedRelations(path, docs)
  {
    // We may be passed an array of docs or a single doc
    // - we want to deal with both situations uniformly
    // - if we are passed a single object we make it an array
    docs = Array.isArray(docs) ? docs : [docs];
    // If we were given a document path, the path is relative to the object not to the array of objects
    // - prefix the document path with '*' so it will pull all elements from the array
    const docPath = path ? '*.' + path : '*';
    const embeddedDocs = ObjectPathAccessor.getPath(docPath, docs);
    return embeddedDocs;
  }
}

export default RelationEmbeddedAbstract;
