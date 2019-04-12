import { Repo } from '../repo';
import { RepoPopulateRelationAbstract, RepoPopulateRelationConfig } from './relation-abstract';

export abstract class RepoPopulateRelationBelongsToAbstract extends RepoPopulateRelationAbstract
{
  async belongsTo(relationRepo: Repo, config: RepoPopulateRelationConfig, docs)
  {
    config = this.normalizeConfig(config);

    const relationIds = this.getRelationIds(config, docs);
    // Use query option if provided - allows results to be further filtered in addition to relation id
    config.query[config.pkey] = {$in: relationIds};
    // @ts-ignore - Expected 0 arguments, but got 2 - variable method arguments
    var relatedDocs = await relationRepo.find(config.query, config);
    // Group related docs by parent key
    let values = {};
    
    relatedDocs.forEach((relatedDoc, x) => {
      values[relatedDoc[config.pkey]] = relatedDocs[x];
    });

    return this.populateValues(config, docs, values);
  }
}

export default RepoPopulateRelationBelongsToAbstract;
