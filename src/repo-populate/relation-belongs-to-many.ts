import { Repo } from '../repo';
import { RepoPopulateRelationConfig } from './relation-abstract';
import { RepoPopulateRelationBelongsToAbstract } from './relation-belongs-to-abstract';

// Belongs-to-many is a many-to-many using an embedded reference array
// - if a User has many favouriteColors then then an array of favourite 
// - color ids is stored on the user object
export class RepoPopulateRelationBelongsToMany extends RepoPopulateRelationBelongsToAbstract
{
  async populate(relationRepo: Repo, config: RepoPopulateRelationConfig, docs)
  {
    config = this.normalizeConfig(config);
    config.relation = 'belongsToMany';
    return this.belongsTo(relationRepo, config, docs);
  }
}

export default RepoPopulateRelationBelongsToMany;
