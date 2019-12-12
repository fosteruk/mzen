import should = require('should');
import { RelationBelongsToOne } from '../../../../lib/repo-populator/relation/belongs-to-one';
import Repo from '../../../../lib/repo';
import MockDataSource from '../../../../lib/data-source/mock';

describe('RelationBelongsToOne', function(){
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

    var repoPopulator = new RelationBelongsToOne;
    var docs = await repoPopulator.populate(user, {
      key: 'createdByUserId',
      alias: 'createdByUser'
    }, data.artist);
  
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

    var repoPopulator = new RelationBelongsToOne;
    var docs = await repoPopulator.populate(user, {
      docPath: 'detail.more',
      key: 'createdByUserId',
      alias: 'createdByUser'
    }, data.product);
  
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

    var repoPopulator = new RelationBelongsToOne;
    var docs = await repoPopulator.populate(user, {
      docPath: 'detail.more.*',
      key: 'createdByUserId',
      alias: 'createdByUser'
    }, data.product);
    
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

    var repoPopulator = new RelationBelongsToOne;
    var docs = await repoPopulator.populate(user, {
      docPath: '*.*.*.detail.more',
      key: 'createdByUserId',
      alias: 'createdByUser'
    }, data.product);
    
    should(docs[0].some.unknown.path.detail.more.createdByUser.name).eql('Kevin Foster');
    should(docs[1].some.unknown.path.detail.more.createdByUser.name).eql('Tom Murphy');
  });
  it('should populate multiple doc paths with the same alias', async () => {
    var data = {
      business: [
        {_id: '1', name: 'Google'},
        {_id: '2', name: 'Amazon'},
        {_id: '3', name: 'Microsoft'},
        {_id: '4', name: 'DigitalOcean'},
      ],
      user: [
        {
          _id: '1', 
          name: 'Kevin Foster', 
          businessCustomer: [
            {businessId: '1'},
            {businessId: '2'},
          ],
          businessSupplier: [
            {businessId: '3'},
            {businessId: '4'},
          ]
        }
      ]
    };

    var business = new Repo({
      name: 'business'
    });
    business.dataSource = new MockDataSource(data);

    var repoPopulator = new RelationBelongsToOne;
    var docsA = await repoPopulator.populate(business, {
      alias: 'business',
      docPath: 'businessCustomer.*',
      key: 'businessId'
    }, data.user);

    var docsB = await repoPopulator.populate(business, {
      alias: 'business',
      docPath: 'businessSupplier.*',
      key: 'businessId'
    }, data.user);
  
    should(docsA[0].businessCustomer[0].business.name).eql('Google');
    should(docsB[0].businessSupplier[0].business.name).eql('Microsoft');
  });
});
