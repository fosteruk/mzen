import { Repo } from '../repo';
import { RepoPopulateRelationConfig } from './relation-abstract';
import { RepoPopulateRelationHasAbstract } from './relation-has-abstract';

export abstract class RepoPopulateRelationAbstractHasMany extends RepoPopulateRelationHasAbstract
{
  async populate(relationRepo: Repo, config: RepoPopulateRelationConfig, docs)
  {
    config = this.normalizeConfig(config);
    config.relation = 'hasMany';
    return this.has(relationRepo, config, docs);
  }
}

export default RepoPopulateRelationAbstractHasMany;
