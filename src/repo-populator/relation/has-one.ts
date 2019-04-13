import { Repo } from '../../repo';
import { RelationConfig } from './abstract';
import { RelationHasAbstract } from './has-abstract';

export class RelationHasOne extends RelationHasAbstract
{
  async populate(relationRepo: Repo, config: RelationConfig, docs)
  {
    config = this.normalizeConfig(config);
    config.relation = 'hasOne';
    return this.has(relationRepo, config, docs);
  }
}

export default RelationHasOne;
