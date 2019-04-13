import { Repo } from '../../repo';
import { RelationConfig } from '../../repo-populator';
import { RelationHasAbstract } from './has-abstract';

export class RelationHasOne extends RelationHasAbstract
{
  async populate(relationRepo: Repo, config: RelationConfig, docs)
  {
    config = this.normalizeConfig(config);
    config.type = 'hasOne';
    return this.has(relationRepo, config, docs);
  }
}

export default RelationHasOne;
