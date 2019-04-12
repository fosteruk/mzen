import { Repo } from '../repo';
import { RepoPopulatorRelationConfig } from './relation-abstract';
import { RepoPopulatorRelationEmbeddedHasAbstract } from './relation-embedded-has-abstract';

export class RepoPopulatorRelationEmbeddedHasOne extends RepoPopulatorRelationEmbeddedHasAbstract
{
  async populate(_relationRepo: Repo, config: RepoPopulatorRelationConfig, docs)
  {
    config = this.normalizeConfig(config);
    config.relation = 'embeddedHasOne';
    return this.embeddedHas(config, docs);
  }
}

export default RepoPopulatorRelationEmbeddedHasOne;
