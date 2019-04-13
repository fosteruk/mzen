import { Repo } from '../../repo';
import { RelationConfig } from './abstract';
import { RelationBelongsToAbstract } from './belongs-to-abstract';

export class RelationBelongsToOne extends RelationBelongsToAbstract
{
  async populate(relationRepo: Repo, config: RelationConfig, docs)
  {
    config = this.normalizeConfig(config);
    config.relation = 'belongsToOne';
    return this.belongsTo(relationRepo, config, docs);
  }
}

export default RelationBelongsToOne;
