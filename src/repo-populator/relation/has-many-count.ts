import { Repo } from '../../repo';
import { RelationConfig } from '../../repo-populator';
import { RelationAbstract } from './abstract';

export class RelationHasManyCount extends RelationAbstract
{
  async populate(relationRepo: Repo, config: RelationConfig, docs)
  {
    config = this.normalizeConfig(config);

    const relationIds = this.getRelationIds(config, docs);

    console.log({config, relationIds});

    // Has many count - counts the number of related documents
    // We first find te relation ids which are stored on the base document
    // We then generate a map of each of those ids to its related count

    // var docs = [{_id: 'a'}, {_id: 'b'}];
    // var relationsIds = [1, 2];
    // var relatedDocs = [{relationId: 'a'},{relationId: 'a'},{relationId: 'a'},{relationId: 'b'},{relationId: 'b'}];
    // var values = {a:3, b:2};

    // Use query option if provided - allows results to be further filtered in addition to relation id
    config.query[config.key] = {$in: relationIds};

    var aggregateId = {};
    aggregateId[config.key] = '$' + config.key;
    var results = await relationRepo.aggregate([
      {$match: config.query},
      {
        $group: {
          _id: aggregateId, 
          count: { $sum: 1 } 
        }
      },
      {$project: { count: 1 }}
    ]);

    // Group related docs by parent key
    var values = {};
    results.forEach(result => {
      if (values[result['_id'][config.key]] == undefined) values[result['_id'][config.key]] = 0;
      values[result['_id'][config.key]] = result['count'];
    });

    return this.populateValues(config, docs, values);
  }
}

export default RelationHasManyCount;
