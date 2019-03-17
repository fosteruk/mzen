import should = require('should');
import RepoPopulate from '../../../lib/repo-populate';
import Repo from '../../../lib/repo';
import MockDataSource from '../../../lib/data-source/mock';

describe('RepoPopulate.belongsToOne', function () {
  describe('belongsToOne()', function () {
    it('should populate', function (done) {
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
      var repoPopulate = new RepoPopulate(user);

      repoPopulate.belongsToOne(data.artist, {
        key: 'createdByUserId',
        alias: 'createdByUser'
      }).then(function(docs){
        should(docs[0].createdByUser.name).eql('Kevin Foster');
        done();
      }).catch(function(err){
        done(err);
      });
    });
    it('should populate embedded', function (done) {
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
      var repoPopulate = new RepoPopulate(user);

      repoPopulate.belongsToOne(data.product, {
        docPath: 'detail.more',
        key: 'createdByUserId',
        alias: 'createdByUser'
      }).then(function(docs){
        should(docs[0].detail.more.createdByUser.name).eql('Kevin Foster');
        should(docs[1].detail.more.createdByUser.name).eql('Tom Murphy');
        done();
      }).catch(function(err){
        done(err);
      });
    });
    it('should populate embedded array', function (done) {
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
      var repoPopulate = new RepoPopulate(user);

      repoPopulate.belongsToOne(data.product, {
        docPath: 'detail.more.*',
        key: 'createdByUserId',
        alias: 'createdByUser'
      }).then(function(docs){
        should(docs[0].detail.more[0].createdByUser.name).eql('Kevin Foster');
        should(docs[0].detail.more[1].createdByUser.name).eql('Tom Murphy');
        done();
      }).catch(function(err){
        done(err);
      });
    });
    it('should populate embedded wildcard path', function (done) {
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
      var repoPopulate = new RepoPopulate(user);

      repoPopulate.belongsToOne(data.product, {
        docPath: '*.*.*.detail.more',
        key: 'createdByUserId',
        alias: 'createdByUser'
      }).then(function(docs){
        should(docs[0].some.unknown.path.detail.more.createdByUser.name).eql('Kevin Foster');
        should(docs[1].some.unknown.path.detail.more.createdByUser.name).eql('Tom Murphy');
        done();
      }).catch(function(err){
        done(err);
      });
    });
  });
});
