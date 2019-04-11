import { Repo } from '../repo';
import { RepoPopulateRelationConfig } from './relation-abstract';
import { RepoPopulateRelationEmbeddedHasAbstract } from './relation-embedded-has-abstract';

export abstract class RepoPopulateRelationEmbeddedHasOne extends RepoPopulateRelationEmbeddedHasAbstract
{
  async has(relationRepo: Repo, config: RepoPopulateRelationConfig, docs)
  {
    config = this.normalizeConfig(config);
    config.relation = 'embeddedHasOne';
    return this.embeddedHas(relationRepo, config, docs);
  }
}

export default RepoPopulateRelationEmbeddedHasOne;
