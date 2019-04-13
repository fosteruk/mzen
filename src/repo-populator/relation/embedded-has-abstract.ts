import { RelationConfig } from '../../repo-populator';
import { RelationEmbeddedAbstract } from './embedded-abstract';

export abstract class RelationEmbeddedHasAbstract extends RelationEmbeddedAbstract
{
  async embeddedHas(config: RelationConfig, docs)
  {
    config = this.normalizeConfig(config);

    const relationIds = this.getRelationIds(config, docs);
    const embeddedDocs = this.getEmebedRelations(config.docPathRelated, docs);

    var values = {};
    embeddedDocs.forEach(function(embeddedDoc){
      if (relationIds.indexOf(embeddedDoc[config.key]) != -1) {
        if (values[embeddedDoc[config.key]] == undefined) values[embeddedDoc[config.key]] = [];
        values[embeddedDoc[config.key]].push(embeddedDoc);
      }
    });

    return this.populateValues(config, docs, values);
  }
}

export default RelationEmbeddedHasAbstract;
