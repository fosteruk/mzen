import { Repo } from '../repo';
import { RelationConfig } from './relation-abstract';
import { RelationEmbeddedBelongsToAbstract } from './relation-embedded-belongs-to-abstract';

export class RelationEmbeddedBelongsToMany extends RelationEmbeddedBelongsToAbstract
{
  async populate(_relationRepo: Repo, config: RelationConfig, docs)
  {
    config = this.normalizeConfig(config);
    config.relation = 'embeddedBelongsToMany';
    return this.embeddedBelongsTo(config, docs);
  }
}

export default RelationEmbeddedBelongsToMany;
