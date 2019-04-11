import { Repo } from '../repo';
import { RepoPopulateRelationAbstract, RepoPopulateRelationConfig } from './relation-abstract';

export abstract class RepoPopulateRelationHasAbstract extends RepoPopulateRelationAbstract
{
  async has(relationRepo: Repo, config: RepoPopulateRelationConfig, docs)
  {
    config = this.normalizeConfig(config);

    const relationIds = this.getRelationIds(config, docs);

    // Use query option if provided - allows results to be further filtered in addition to relation id
    config.query[config.key] = {$in: relationIds};
    // @ts-ignore - Expected 0 arguments, but got 2 - variable method arguments
    var relatedDocs = await relationRepo.find(config.query, config);
    // Group related docs by parent key
    var values = {};
    relatedDocs.forEach(relatedDoc => {
      if (values[relatedDoc[config.key]] == undefined) values[relatedDoc[config.key]] = [];
      values[relatedDoc[config.key]].push(relatedDoc);
    });

    return this.populateValues(config, docs, values);
  }
}

export default RepoPopulateRelationHasAbstract;
