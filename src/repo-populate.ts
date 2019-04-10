import { Repo, RepoRelationConfig, RepoQueryOptions } from './repo';
import RepoPopulateRelation from './repo-populate-relation';
import clone = require('clone');

export class RepoPopulate
{
  repo: Repo;
  
  constructor(repo: Repo)
  {
    this.repo = repo;
  }
  
  async populateAll(docs: any, options?: RepoQueryOptions)
  {
    const flattenedRelations = this.getFlattenedRelations(options);
    options.populate = false; // Dont populate recursively - we already flattened the relations

    for (let depth in flattenedRelations) {
      if (!flattenedRelations[depth]) continue;

      let populatePromises = [];
      flattenedRelations[depth].forEach(relation => {
        if (Array.isArray(docs) && relation.limit) {
          // This relation is using the limit option so we can not populate a collection of docs in a single query
          // - as it would produce in unexpcetd results.
          // We must populate each document individually with a seperate query
          docs.forEach(doc => {
            populatePromises.push(this.populate(relation, doc, options));
          });
        } else {
          populatePromises.push(this.populate(relation, docs, options));
        }
      });

      await Promise.all(populatePromises);
    }

    return docs;
  }

  async populate(relation: RepoRelationConfig | string, docs?: any, options?: RepoQueryOptions)
  {
    // If relation is passed as string relation name, lookup the relation config
    relation = (typeof relation == 'string') ? this.repo.config.relations[relation] : relation;

    // Clone the options because we dont want changes to the options doc to change the original doc
    var relationPopulateConfig = options ? clone({...relation, ...options}): clone({...relation});

    var relationRepo = this.repo.getRepo(relation.repo);
    var repoPopulate = new RepoPopulateRelation(relationRepo);

    await repoPopulate[relation.type](relationPopulateConfig, docs);

    return docs;
  }

  private getFlattenedRelations(options: any)
  {
    // In order to populate a relation at a given depth its parent relation must have already been populated
    // To ensure parent relations are populate first we populate in order of relation depth
    // This method returns an array of arrays - were each child is an array of relation configs for a given relation depth
    // [
    //  [relationConfigA, relationConfigB], // depth 1 to be populated first
    //  [relationConfigB, relationConfigC] // depth 2 to be populated second
    // ]
    const flattenedRelationsRecursive = this.getFlattenedRelationsRecursive(options);

    var flattenedRelations = [];
    flattenedRelationsRecursive.forEach(relationConfig => {
      const { depth, relation } = relationConfig;
      // Sort into depth arrays
      if (flattenedRelations[depth] == undefined) flattenedRelations[depth] = [];
      flattenedRelations[depth].push(relation);
    });

    return flattenedRelations;
  }
  
  private getFlattenedRelationsRecursive(options: any, flatRelations?: Array<any>, basePath?: string)
  {
    flatRelations = flatRelations ? flatRelations : [];
    basePath = basePath ? basePath : null;

    var basePathParts = basePath ? basePath.split('.') : [];

    for (var x in this.repo.config.relations) {
      const relation = clone(this.repo.config.relations[x]); // copy the relation we dont want to modify the original
      const depth = basePathParts.length;
      const recursion = relation.recursion ? relation.recursion : 0;
      const autoPopulate = relation.autoPopulate != undefined ? relation.autoPopulate : false;
      const populate = relation.populate != undefined ? relation.populate : true;
      const queryPopulate = options.populate != undefined ? options.populate : true;

      // Append base path
      relation.docPath = (relation.docPath)
                         ? (basePath ? basePath + '.' + relation.docPath : relation.docPath)
                         : basePath;

      // Append base path
      relation.docPathRelated = (relation.docPathRelated)
                                ? (basePath ? basePath + '.' + relation.docPathRelated : relation.docPathRelated)
                                : basePath;

      const path = relation.docPath ? relation.docPath + '.' + relation.alias : relation.alias;


      if (
        !queryPopulate || // query said dont populate any relations
        (queryPopulate[path] !== undefined && !queryPopulate[path]) || // query said dont populate this path
        (queryPopulate[path] === undefined && !autoPopulate) // query didnt specificaly enable population and relation auto population is disabled
      ) {
        // relation should not populate - continue to next relation
        continue;
      }

      const flatRelation = {
        id: this.repo.name + '.' + relation.alias,
        depth,
        path,
        relation,
        recursionCount: 0
      };

      // How many parents of this relation are the same relation?
      let realtionDepths = [];
      flatRelations.forEach(existingFlatRelation => {
        if (existingFlatRelation.id == flatRelation.id && existingFlatRelation.depth < depth) {
          realtionDepths[existingFlatRelation.depth] =  true;
        }
      });
      flatRelation.recursionCount = realtionDepths.length;

      // If we have reached the recursion count skip this relation
      if (flatRelation.recursionCount > recursion) continue;

      flatRelations.push(flatRelation);

      // hasManyCountRelation does not require recursive populations since its data is just a number
      if (relation.type == 'hasManyCount') continue;

      // Recurse into this relation only if populate is true or is populate relation path is true
      if (populate) {
        let newbasePathParts = [...basePathParts];
        newbasePathParts.push(relation.alias);
        if (relation.type == 'hasMany' || relation.type == 'belongsToMany') {
          newbasePathParts.push('*');
        }

        new RepoPopulate(
          this.repo.getRepo(relation.repo)
        ).getFlattenedRelationsRecursive(options, flatRelations, newbasePathParts.join('.'));
      }
    }
    // sort by document path length
    flatRelations.sort(
      (a, b) => (a.depth != b.depth ? a.depth - b.depth : ((a.path > b.path) ? 1 : 0))
    );

    return flatRelations;
  }
}

export default RepoPopulate;
