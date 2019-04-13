import { Repo } from '../../repo';
import { RelationAbstract, RelationConfig } from './abstract';

export class RelationHasManyCount extends RelationAbstract
{
  async populate(relationRepo: Repo, config: RelationConfig, docs)
  {
    config = this.normalizeConfig(config);

    const relationIds = this.getRelationIds(config, docs);

    // Use query option if provided - allows results to be further filtered in addition to relation id
    config.query[config.key] = {$in: relationIds};

    var aggregateId = {};
    aggregateId[config.key] = '$' + config.key;
    var results = await relationRepo.aggregate([
      {$match: config.query},
      {
        $group : {
           _id : aggregateId,
           count: { $sum: 1 }
        }
      }
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
