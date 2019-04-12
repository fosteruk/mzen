import { Repo } from '../repo';
import { RelationConfig } from './relation-abstract';
import { RelationEmbeddedBelongsToAbstract } from './relation-embedded-belongs-to-abstract';

export class RelationEmbeddedBelongsToOne extends RelationEmbeddedBelongsToAbstract
{
  async populate(_relationRepo: Repo, config: RelationConfig, docs)
  {
    config = this.normalizeConfig(config);
    config.relation = 'embeddedBelongsToOne';
    return this.embeddedBelongsTo(config, docs);
  }
}

export default RelationEmbeddedBelongsToOne;
