import { Repo } from '../repo';
import { RelationConfig } from './relation-abstract';
import { RelationEmbeddedHasAbstract } from './relation-embedded-has-abstract';

export class RelationEmbeddedHasMany extends RelationEmbeddedHasAbstract
{
  async populate(_relationRepo: Repo, config: RelationConfig, docs)
  {
    config = this.normalizeConfig(config);
    config.relation = 'embeddedHasMany';
    return this.embeddedHas(config, docs);
  }
}

export default RelationEmbeddedHasMany;
