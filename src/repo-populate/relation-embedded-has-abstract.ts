import { Repo } from '../repo';
import { RepoPopulateRelationAbstract, RepoPopulateRelationConfig } from './relation-abstract';

export abstract class RepoPopulateRelationEmbeddedHasAbstract extends RepoPopulateRelationAbstract
{
  async embeddedHas(relationRepo: Repo, config: RepoPopulateRelationConfig, docs)
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

    return this.populate(relationRepo, config, docs, values);
  }
}

export default RepoPopulateRelationAbstractEmbeddedHas;
