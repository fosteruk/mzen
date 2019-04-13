import { Repo } from '../../repo';
import { RelationConfig } from '../../repo-populator';
import { RelationEmbeddedBelongsToAbstract } from './embedded-belongs-to-abstract';

export class RelationEmbeddedBelongsToOne extends RelationEmbeddedBelongsToAbstract
{
  async populate(_relationRepo: Repo, config: RelationConfig, docs)
  {
    config = this.normalizeConfig(config);
    config.type = 'embeddedBelongsToOne';
    return this.embeddedBelongsTo(config, docs);
  }
}

export default RelationEmbeddedBelongsToOne;
