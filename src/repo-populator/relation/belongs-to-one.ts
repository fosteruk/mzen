import { Repo } from '../../repo';
import { RelationConfig } from '../../repo-populator';
import { RelationBelongsToAbstract } from './belongs-to-abstract';

export class RelationBelongsToOne extends RelationBelongsToAbstract
{
  async populate(relationRepo: Repo, config: RelationConfig, docs)
  {
    config = this.normalizeConfig(config);
    config.type = 'belongsToOne';
    return this.belongsTo(relationRepo, config, docs);
  }
}

export default RelationBelongsToOne;
