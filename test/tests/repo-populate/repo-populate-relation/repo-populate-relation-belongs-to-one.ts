import should = require('should');
import RepoPopulateRelation from '../../../../lib/repo-populate-relation';
import Repo from '../../../../lib/repo';
import MockDataSource from '../../../../lib/data-source/mock';

describe('belongsToOne()', function(){
  it('should populate', async () => {
    var data = {
      artist: [
        {_id: '1', name: 'Radiohead', createdByUserId: '1'}
      ],
      user: [
        {_id: '1', name: 'Kevin Foster'}
      ]
    };

    var user = new Repo({
      name: 'user'
    });
    user.dataSource = new MockDataSource(data);
    var repoPopulate = new RepoPopulateRelation(user);

    var docs = await repoPopulate.belongsToOne(data.artist, {
      key: 'createdByUserId',
      alias: 'createdByUser'
    });
  
    should(docs[0].createdByUser.name).eql('Kevin Foster');
  });
  it('should populate embedded', async () => {
    var data = {
      product: [
        {_id: '1', detail: { more: {
          name: 'Macbook Pro',
          createdByUserId: '1'
        }}},
        {_id: '2', detail:{ more:{
          name: 'MSI GE60',
          createdByUserId: '2'
        }}},
      ],
      user: [
        {_id: '1', name: 'Kevin Foster'},
        {_id: '2', name: 'Tom Murphy'}
      ]
    };

    var user = new Repo({
      name: 'user'
    });
    user.dataSource = new MockDataSource(data);
    var repoPopulate = new RepoPopulateRelation(user);

    var docs = await repoPopulate.belongsToOne(data.product, {
      docPath: 'detail.more',
      key: 'createdByUserId',
      alias: 'createdByUser'
    });
  
    should(docs[0].detail.more.createdByUser.name).eql('Kevin Foster');
    should(docs[1].detail.more.createdByUser.name).eql('Tom Murphy');
  });
  it('should populate embedded array', async () => {
    var data = {
      product: [
        {_id: '1', detail: { more: [
          {
            name: 'Macbook Pro',
            createdByUserId: '1'
          },
          {
            name: 'MSI GE60',
            createdByUserId: '2'
          }
        ]}}
      ],
      user: [
        {_id: '1', name: 'Kevin Foster'},
        {_id: '2', name: 'Tom Murphy'}
      ]
    };

    var user = new Repo({
      name: 'user'
    });
    user.dataSource = new MockDataSource(data);
    var repoPopulate = new RepoPopulateRelation(user);

    var docs = await repoPopulate.belongsToOne(data.product, {
      docPath: 'detail.more.*',
      key: 'createdByUserId',
      alias: 'createdByUser'
    });
    
    should(docs[0].detail.more[0].createdByUser.name).eql('Kevin Foster');
    should(docs[0].detail.more[1].createdByUser.name).eql('Tom Murphy');
  });
  it('should populate embedded wildcard path', async () => {
    var data = {
      product: [
        {some: {unknown: {path: {_id: 'a1', detail: { more:{
          name: 'Macbook Pro',
          createdByUserId: '1'
        }}}}}},
        {some: {unknown: {path: {_id: 'a2', detail: { more:{
          name: 'MSI GE60',
          createdByUserId: '2'
        }}}}}}
      ],
      user: [
        {_id: '1', name: 'Kevin Foster'},
        {_id: '2', name: 'Tom Murphy'}
      ]
    };

    var user = new Repo({
      name: 'user'
    });
    user.dataSource = new MockDataSource(data);
    var repoPopulate = new RepoPopulateRelation(user);

    var docs = await repoPopulate.belongsToOne(data.product, {
      docPath: '*.*.*.detail.more',
      key: 'createdByUserId',
      alias: 'createdByUser'
    });
    
    should(docs[0].some.unknown.path.detail.more.createdByUser.name).eql('Kevin Foster');
    should(docs[1].some.unknown.path.detail.more.createdByUser.name).eql('Tom Murphy');
  });
});
