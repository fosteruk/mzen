import { Repo } from '../../repo';
import { RelationConfig } from '../../repo-populator';
import { RelationAbstract } from './abstract';

export class RelationHasManyCount extends RelationAbstract
{
  async populate(relationRepo: Repo, config: RelationConfig, docs)
  {
    config = this.normalizeConfig(config);

    const relationIds = this.getRelationIds(config, docs);

    config.query[config.key] = {$in: relationIds};

    var groupCounts = await relationRepo.groupCount([config.key], config.query);

    var values: {
      [key:string]: number,
      [key:number]: number
    } = {};
    groupCounts.forEach(groupCount => {
      const value = groupCount._id[config.key];
      values[value] = groupCount.count;
    });

    return this.populateValues(config, docs, values);
  }
}

export default RelationHasManyCount;
