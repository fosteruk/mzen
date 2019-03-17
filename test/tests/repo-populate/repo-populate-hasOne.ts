import should = require('should');
import RepoPopulate from '../../../lib/repo-populate';
import Repo from '../../../lib/repo';
import MockDataSource from '../../../lib/data-source/mock';

describe('RepoPopulate.hasOne', function () {
  describe('hasOne()', function () {
    it('should populate', function (done) {
      var data = {
        userTimezone: [
          {_id: '1', userId: '9', name: 'Europe/London'}
        ],
        user: [
          {_id: '9', name: 'Kevin Foster'}
        ]
      };

      var userTimezone = new Repo({
        name: 'userTimezone'
      });
      userTimezone.dataSource = new MockDataSource(data);
      var repoPopulate = new RepoPopulate(userTimezone);

      repoPopulate.hasOne(data.user, {
        key: 'userId',
        alias: 'timezone'
      }).then(function(docs){
        should(docs[0].timezone.name).eql('Europe/London');
        done();
      }).catch(function(err){
        done(err);
      });
    });
    it('should populate embedded', function (done) {
      var data = {
        forum: [
          {_id: 'ref12380', detail: {topPoster:
              {_id: '9', name: 'Kevin Foster'}
          }}
        ],
        userTimezone: [
          {_id: '5', userId: '9', name: 'Europe/London'}
        ],
      };

      var userTimezone = new Repo({
        name: 'userTimezone'
      });
      userTimezone.dataSource = new MockDataSource(data);
      var repoPopulate = new RepoPopulate(userTimezone);

      repoPopulate.hasOne(data.forum, {
        docPath: 'detail.topPoster',
        key: 'userId',
        alias: 'timezone'
      }).then(function(docs){
        should(docs[0].detail.topPoster.timezone.name).eql('Europe/London');
        done();
      }).catch(function(err){
        done(err);
      });
    });
    it('should populate embedded array', function (done) {
      var data = {
        forum: [
          {_id: 'ref12380', detail: {topPosters: [
              {_id: '9', name: 'Kevin Foster'},
              {_id: '12', name: 'Tom Murphy'},
          ]}}
        ],
        userTimezone: [
          {_id: '5', userId: '9', name: 'Europe/London'},
          {_id: '6', userId: '12', name: 'America/Toronto'},
        ],
      };

      var userTimezone = new Repo({
        name: 'userTimezone'
      });
      userTimezone.dataSource = new MockDataSource(data);
      var repoPopulate = new RepoPopulate(userTimezone);

      repoPopulate.hasOne(data.forum, {
        docPath: 'detail.topPosters.*',
        key: 'userId',
        alias: 'timezone'
      }).then(function(docs){
        should(docs[0].detail.topPosters[0].timezone.name).eql('Europe/London');
        should(docs[0].detail.topPosters[1].timezone.name).eql('America/Toronto');
        done();
      }).catch(function(err){
        done(err);
      });
    });
    it('should populate embedded wildcard path', function (done) {
      var data = {
        forum: [
          {some: {unknown: {path: {_id: 'ref12380', detail: {topPoster:
              {_id: '9', name: 'Kevin Foster'}
          }}}}}
        ],
        userTimezone: [
          {_id: '5', userId: '9', name: 'Europe/London'}
        ],
      };

      var userTimezone = new Repo({
        name: 'userTimezone'
      });
      userTimezone.dataSource = new MockDataSource(data);
      var repoPopulate = new RepoPopulate(userTimezone);

      repoPopulate.hasOne(data.forum, {
        docPath: '*.*.*.detail.topPoster',
        key: 'userId',
        alias: 'timezone'
      }).then(function(docs){
        should(docs[0].some.unknown.path.detail.topPoster.timezone.name).eql('Europe/London');
        done();
      }).catch(function(err){
        done(err);
      });
    });
  });
});
