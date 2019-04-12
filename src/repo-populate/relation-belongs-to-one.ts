import { Repo } from '../repo';
import { RepoPopulateRelationConfig } from './relation-abstract';
import { RepoPopulateRelationBelongsToAbstract } from './relation-belongs-to-abstract';

export class RepoPopulateRelationBelongsToOne extends RepoPopulateRelationBelongsToAbstract
{
  async populate(relationRepo: Repo, config: RepoPopulateRelationConfig, docs)
  {
    config = this.normalizeConfig(config);
    config.relation = 'belongsToOne';
    return this.belongsTo(relationRepo, config, docs);
  }
}

export default RepoPopulateRelationBelongsToOne;
