import { Repo } from '../repo';
import { RelationConfig } from './relation-abstract';
import { RelationHasAbstract } from './relation-has-abstract';

export class RelationHasMany extends RelationHasAbstract
{
  async populate(relationRepo: Repo, config: RelationConfig, docs)
  {
    config = this.normalizeConfig(config);
    config.relation = 'hasMany';
    return this.has(relationRepo, config, docs);
  }
}

export default RelationHasMany;
