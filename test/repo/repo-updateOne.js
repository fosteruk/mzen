'use strict'
var should = require('should');
var Repo = require('../../lib/repo');
var MockDataSource = require('../../lib/data-source/mock');

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

      user.updateOne({}, updateData, {stripPrivate: true})
      .then(function(result){
        should(user.dataSource.dataUpdate[0]['$set'].number).eql(123);
        should(user.dataSource.dataUpdate[0]['$set'].string).eql('543');
        done();
      }).catch(function(err){
        done(err);
      });
    });
    it('should strip private fields', function (done) {
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

      user.updateOne({}, updateData, {stripPrivate: true})
      .then(function(result){
        should(user.dataSource.dataUpdate[0]['$set'].name).eql('Kevin');
        should(user.dataSource.dataUpdate[0]['$set'].cannotInsertThisValue).eql(undefined);
        done();
      }).catch(function(err){
        done(err);
      });
    });
    it('should strip private "write" fields', function (done) {
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

      user.updateOne({}, updateData, {stripPrivate: true})
      .then(function(result){
        should(user.dataSource.dataUpdate[0]['$set'].name).eql('Kevin');
        should(user.dataSource.dataUpdate[0]['$set'].cannotInsertThisValue).eql(undefined);
        done();
      }).catch(function(err){
        done(err);
      });
    });
    it('should not strip private "read" fields', function (done) {
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

      user.updateOne({}, updateData, {stripPrivate: true})
      .then(function(result){
        should(user.dataSource.dataUpdate[0]['$set'].name).eql('Kevin');
        should(user.dataSource.dataUpdate[0]['$set'].canUpdateThisValue).eql('123');
        done();
      }).catch(function(err){
        done(err);
      });
    });
    it('should not not strip private fields by default', function (done) {
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
      .then(function(result){
        should(user.dataSource.dataUpdate[0]['$set'].name).eql('Kevin');
        should(user.dataSource.dataUpdate[0]['$set'].canUpdateThisValue).eql('123');
        done();
      }).catch(function(err){
        done(err);
      });
    });
  });
});
