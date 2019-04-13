import { Repo } from '../../repo';
import { RelationConfig } from '../../repo-populator';
import { RelationHasAbstract } from './has-abstract';

export class RelationHasMany extends RelationHasAbstract
{
  async populate(relationRepo: Repo, config: RelationConfig, docs)
  {
    config = this.normalizeConfig(config);
    config.type = 'hasMany';
    return this.has(relationRepo, config, docs);
  }
}

export default RelationHasMany;
