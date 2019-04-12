import { Repo } from '../repo';
import { RepoPopulatorRelationConfig } from './relation-abstract';
import { RepoPopulatorRelationBelongsToAbstract } from './relation-belongs-to-abstract';

// Belongs-to-many is a many-to-many using an embedded reference array
// - if a User has many favouriteColors then then an array of favourite 
// - color ids is stored on the user object
export class RepoPopulatorRelationBelongsToMany extends RepoPopulatorRelationBelongsToAbstract
{
  async populate(relationRepo: Repo, config: RepoPopulatorRelationConfig, docs)
  {
    config = this.normalizeConfig(config);
    config.relation = 'belongsToMany';
    return this.belongsTo(relationRepo, config, docs);
  }
}

export default RepoPopulatorRelationBelongsToMany;
