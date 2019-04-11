import { Repo } from '../repo';
import { RepoPopulateRelationConfig } from './relation-abstract';
import { RepoPopulateRelationEmbeddedHasAbstract } from './relation-embedded-has-abstract';

export abstract class RepoPopulateRelationEmbeddedHasMany extends RepoPopulateRelationEmbeddedHasAbstract
{
  async has(relationRepo: Repo, config: RepoPopulateRelationConfig, docs)
  {
    config = this.normalizeConfig(config);
    config.relation = 'embeddedHasMany';
    return this.embeddedHas(relationRepo, config, docs);
  }
}

export default RepoPopulateRelationEmbeddedHasMany;
