import { Repo } from '../repo';
import { RepoPopulateRelationConfig } from './relation-abstract';
import { RepoPopulateRelationAbstract } from './relation-abstract';

export class RepoPopulateRelationAbstractHasManyCount extends RepoPopulateRelationAbstract
{
  async populate(relationRepo: Repo, config: RepoPopulateRelationConfig, docs)
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

export default RepoPopulateRelationAbstractHasManyCount;
