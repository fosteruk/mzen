import { Repo } from '../../repo';
import { RelationConfig } from '../../repo-populator';
import { RelationEmbeddedHasAbstract } from './embedded-has-abstract';

export class RelationEmbeddedHasMany extends RelationEmbeddedHasAbstract
{
  async populate(_relationRepo: Repo, config: RelationConfig, docs)
  {
    config = this.normalizeConfig(config);
    config.type = 'embeddedHasMany';
    return this.embeddedHas(config, docs);
  }
}

export default RelationEmbeddedHasMany;
