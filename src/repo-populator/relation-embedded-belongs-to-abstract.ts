import { RelationAbstract, RelationConfig } from './relation-abstract';

export abstract class RelationEmbeddedBelongsToAbstract extends RelationAbstract
{
  async embeddedBelongsTo(config: RelationConfig, docs)
  {
    config = this.normalizeConfig(config);

    const relationIds = this.getRelationIds(config, docs);
    const embeddedDocs = this.getEmebedRelations(config.docPathRelated, docs);

    var values = {};
    embeddedDocs.forEach(embeddedDoc => {
      // We must store the id as a primitive so we can use it as a object field name in our lookup values object
      // - complex types can not be used as object field names
      let id = String(embeddedDoc[config.pkey]);
      if (relationIds.indexOf(id) != -1) {
        // Group related docs by parent key
        values[id] = embeddedDoc;
      }
    });

    return this.populateValues(config, docs, values);
  }
}

export default RelationEmbeddedBelongsToAbstract;
