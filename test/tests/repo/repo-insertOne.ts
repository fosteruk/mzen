import should = require('should');
import Repo from '../../../lib/repo';
import MockDataSource from '../../../lib/data-source/mock';

describe('Repo', function () {
  describe('insertOne()', function () {
    it('should type cast documents', function (done) {
      var data = {
        user: [
          {_id: '1', name: 'Kevin', number: '123', string: 543}
        ]
      };

      var user = new Repo({
        name: 'user',
        schema: {
          name: String,
          number: {$type: Number},
          string: {$type: String},
        }
      });
      user.dataSource = new MockDataSource(data);

      user.insertOne(data.user[0], {filterPrivate: true})
      .then(function(){
        should(user.dataSource.dataInsert[0].number).eql(123);
        should(user.dataSource.dataInsert[0].string).eql('543');
        done();
      }).catch(function(err){
        done(err);
      });
    });
    it('should filter private fields', function (done) {
      var data = {
        user: [
          {_id: '1', name: 'Kevin', cannotInsertThisValue: 'test'}
        ]
      };

      var user = new Repo({
        name: 'user',
        schema: {
          name: String,
          cannotInsertThisValue: {$type: String, $filter: {private: true}}
        }
      });
      user.dataSource = new MockDataSource(data);

      user.insertOne(data.user[0], {filterPrivate: true})
      .then(function(){
        should(user.dataSource.dataInsert[0].name).eql('Kevin');
        should(user.dataSource.dataInsert[0].cannotInsertThisValue).eql(undefined);
        done();
      }).catch(function(err){
        done(err);
      });
    });
    it('should filter private "write" fields', function (done) {
      var data = {
        user: [
          {_id: '1', name: 'Kevin', cannotInsertThisValue: 'test'}
        ]
      };

      var user = new Repo({
        name: 'user',
        schema: {
          name: String,
          cannotInsertThisValue: {$type: String, $filter: {private: 'write'}}
        }
      });
      user.dataSource = new MockDataSource(data);

      user.insertOne(data.user[0], {filterPrivate: true})
      .then(function(){
        should(user.dataSource.dataInsert[0].name).eql('Kevin');
        should(user.dataSource.dataInsert[0].cannotInsertThisValue).eql(undefined);
        done();
      }).catch(function(err){
        done(err);
      });
    });
    it('should not filter private "read" fields', function (done) {
      var data = {
        user: [
          {_id: '1', name: 'Kevin', canInsertThisValue: 'test'}
        ]
      };

      var user = new Repo({
        name: 'user',
        schema: {
          name: String,
          canInsertThisValue: {$type: String, $filter: {private: 'read'}}
        }
      });
      user.dataSource = new MockDataSource(data);

      user.insertOne(data.user[0], {filterPrivate: true})
      .then(function(){
        should(user.dataSource.dataInsert[0].name).eql('Kevin');
        should(user.dataSource.dataInsert[0].canInsertThisValue).eql('test');
        done();
      }).catch(function(err){
        done(err);
      });
    });
    it('should not filter private fields by default', function (done) {
      var data = {
        user: [
          {_id: '1', name: 'Kevin', canInsertThisValue: 'test'}
        ]
      };

      var user = new Repo({
        name: 'user',
        schema: {
          name: String,
          canInsertThisValue: {$type: String, $filter: {private: true}}
        }
      });
      user.dataSource = new MockDataSource(data);

      user.insertOne(data.user[0])
      .then(function(){
        should(user.dataSource.dataInsert[0].name).eql('Kevin');
        should(user.dataSource.dataInsert[0].canInsertThisValue).eql('test');
        done();
      }).catch(function(err){
        done(err);
      });
    });
  });
});