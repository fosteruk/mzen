import { Repo } from '../repo';
import { RepoPopulatorRelationConfig } from './relation-abstract';
import { RepoPopulatorRelationBelongsToAbstract } from './relation-belongs-to-abstract';

export class RepoPopulatorRelationBelongsToOne extends RepoPopulatorRelationBelongsToAbstract
{
  async populate(relationRepo: Repo, config: RepoPopulatorRelationConfig, docs)
  {
    config = this.normalizeConfig(config);
    config.relation = 'belongsToOne';
    return this.belongsTo(relationRepo, config, docs);
  }
}

export default RepoPopulatorRelationBelongsToOne;
