import should = require('should');
import Repo from '../../../lib/repo';
import MockDataSource from '../../../lib/data-source/mock';

describe('Repo', function () {
  describe('updateOne()', function () {
    it('should return type casted documents', function (done) {
      var updateData = {
        $set: {
          number: '123',
          string: '543'
        }
      };

      var user = new Repo({
        name: 'user',
        schema: {
          number: {$type: Number},
          string: {$type: String},
        }
      });
      user.dataSource = new MockDataSource({});

      user.updateOne({}, updateData, {filterPrivate: true})
      .then(function(){
        should(user.dataSource.dataUpdate[0]['$set'].number).eql(123);
        should(user.dataSource.dataUpdate[0]['$set'].string).eql('543');
        done();
      }).catch(function(err){
        done(err);
      });
    });
    it('should filter private fields', function (done) {
      var updateData = {
        $set: {
          name: 'Kevin',
          cannotInsertThisValue: '123'
        }
      };

      var user = new Repo({
        name: 'user',
        schema: {
          name: String,
          cannotInsertThisValue: {$type: String, $filter: {private: true}}
        }
      });
      user.dataSource = new MockDataSource({});

      user.updateOne({}, updateData, {filterPrivate: true})
      .then(function(){
        should(user.dataSource.dataUpdate[0]['$set'].name).eql('Kevin');
        should(user.dataSource.dataUpdate[0]['$set'].cannotInsertThisValue).eql(undefined);
        done();
      }).catch(function(err){
        done(err);
      });
    });
    it('should filter private "write" fields', function (done) {
      var updateData = {
        $set: {
          name: 'Kevin',
          cannotInsertThisValue: '123'
        }
      };

      var user = new Repo({
        name: 'user',
        schema: {
          name: String,
          cannotInsertThisValue: {$type: String, $filter: {private: 'write'}}
        }
      });
      user.dataSource = new MockDataSource({});

      user.updateOne({}, updateData, {filterPrivate: true})
      .then(function(){
        should(user.dataSource.dataUpdate[0]['$set'].name).eql('Kevin');
        should(user.dataSource.dataUpdate[0]['$set'].cannotInsertThisValue).eql(undefined);
        done();
      }).catch(function(err){
        done(err);
      });
    });
    it('should not filter private "read" fields', function (done) {
      var updateData = {
        $set: {
          name: 'Kevin',
          canUpdateThisValue: '123'
        }
      };

      var user = new Repo({
        name: 'user',
        schema: {
          name: String,
          canUpdateThisValue: {$type: String, $filter: {private: 'read'}}
        }
      });
      user.dataSource = new MockDataSource({});

      user.updateOne({}, updateData, {filterPrivate: true})
      .then(function(){
        should(user.dataSource.dataUpdate[0]['$set'].name).eql('Kevin');
        should(user.dataSource.dataUpdate[0]['$set'].canUpdateThisValue).eql('123');
        done();
      }).catch(function(err){
        done(err);
      });
    });
    it('should not not filter private fields by default', function (done) {
      var updateData = {
        $set: {
          name: 'Kevin',
          canUpdateThisValue: '123'
        }
      };

      var user = new Repo({
        name: 'user',
        schema: {
          name: String,
          canUpdateThisValue: {$type: String, $filter: {private: true}}
        }
      });
      user.dataSource = new MockDataSource({});

      user.updateOne({}, updateData)
      .then(function(){
        should(user.dataSource.dataUpdate[0]['$set'].name).eql('Kevin');
        should(user.dataSource.dataUpdate[0]['$set'].canUpdateThisValue).eql('123');
        done();
      }).catch(function(err){
        done(err);
      });
    });
  });
});
