import { Repo } from '../repo';
import { RepoPopulatorRelationConfig } from './relation-abstract';
import { RepoPopulatorRelationEmbeddedHasAbstract } from './relation-embedded-has-abstract';

export class RepoPopulatorRelationEmbeddedHasMany extends RepoPopulatorRelationEmbeddedHasAbstract
{
  async populate(_relationRepo: Repo, config: RepoPopulatorRelationConfig, docs)
  {
    config = this.normalizeConfig(config);
    config.relation = 'embeddedHasMany';
    return this.embeddedHas(config, docs);
  }
}

export default RepoPopulatorRelationEmbeddedHasMany;
