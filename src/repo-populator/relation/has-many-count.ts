import { Repo } from '../../repo';
import { RelationConfig } from '../../repo-populator';
import { RelationAbstract } from './abstract';

export class RelationHasManyCount extends RelationAbstract
{
  async populate(relationRepo: Repo, config: RelationConfig, docs)
  {
    config = this.normalizeConfig(config);

    const relationIds = this.getRelationIds(config, docs);

    // Has many count - counts the number of related documents
    // We first find te relation ids which are stored on the base document
    // We then generate a map of each of those ids to its related count

    // var docs = [{_id: 'a'}, {_id: 'b'}];
    // var relationsIds = [1, 2];
    // var relatedDocs = [{relationId: 'a'},{relationId: 'a'},{relationId: 'a'},{relationId: 'b'},{relationId: 'b'}];
    // var values = {a:3, b:2};

    // Use query option if provided - allows results to be further filtered in addition to relation id
    config.query[config.key] = {$in: relationIds};

    var values = await relationRepo.groupCount(config.key, config.query);

    return this.populateValues(config, docs, values);
  }
}

export default RelationHasManyCount;
