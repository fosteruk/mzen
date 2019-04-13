import { Repo } from '../../repo';
import { RelationConfig } from './abstract';
import { RelationEmbeddedHasAbstract } from './embedded-has-abstract';

export class RelationEmbeddedHasOne extends RelationEmbeddedHasAbstract
{
  async populate(_relationRepo: Repo, config: RelationConfig, docs)
  {
    config = this.normalizeConfig(config);
    config.relation = 'embeddedHasOne';
    return this.embeddedHas(config, docs);
  }
}

export default RelationEmbeddedHasOne;
