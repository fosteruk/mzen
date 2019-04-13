import { Repo } from '../../repo';
import { RelationConfig } from './abstract';
import { RelationBelongsToAbstract } from './belongs-to-abstract';

// Belongs-to-many is a many-to-many using an embedded reference array
// - if a User has many favouriteColors then then an array of favourite 
// - color ids is stored on the user object
export class RelationBelongsToMany extends RelationBelongsToAbstract
{
  async populate(relationRepo: Repo, config: RelationConfig, docs)
  {
    config = this.normalizeConfig(config);
    config.relation = 'belongsToMany';
    return this.belongsTo(relationRepo, config, docs);
  }
}

export default RelationBelongsToMany;
