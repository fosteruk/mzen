import { Repo } from '../repo';
import { RepoPopulateRelationConfig } from './relation-abstract';
import { RepoPopulateRelationEmbeddedHasAbstract } from './relation-embedded-has-abstract';

export class RepoPopulateRelationEmbeddedHasMany extends RepoPopulateRelationEmbeddedHasAbstract
{
  async populate(_relationRepo: Repo, config: RepoPopulateRelationConfig, docs)
  {
    config = this.normalizeConfig(config);
    config.relation = 'embeddedHasMany';
    return this.embeddedHas(config, docs);
  }
}

export default RepoPopulateRelationEmbeddedHasMany;
