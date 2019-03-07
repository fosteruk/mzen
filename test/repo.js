'use strict'
var should = require('should');
var Repo = require('../lib/repo');
var MockDataSource = require('../lib/data-source/mock');

describe('Repo', function () {
  describe('getName()', function () {
    it('should return configured name', function () {
      var userRepo = new Repo({name: 'UserRepo'});
      should(userRepo.getName()).eql('UserRepo');
    });
    it('should return constructor name if name not configured', function () {
      class UserRepo extends Repo {};
      var userRepo = new UserRepo();
      should(userRepo.getName()).eql('UserRepo');

      class NewUserRepo extends UserRepo {};
      var newUserRepo = new NewUserRepo();
      should(newUserRepo.getName()).eql('NewUserRepo');
    });
    it('should throw an exception if repo name is not configured when using the default constructor', function() {
      var aRepo = new Repo();
      (function(){
        aRepo.getName()
      }).should.throw(/Repo name not configured/);
    });
  });
  describe('count()', function () {
    it('should return document count', function (done) {
      var data = {
        user: [
          {_id: '1', name: 'Kevin Foster', userTimezoneId: '1'},
          {_id: '2', name: 'Claire Foster', userTimezoneId: '1'},
          {_id: '2', name: 'Lisa Foster', userTimezoneId: '1'}
        ]
      };

      var userRepo = new Repo({
        name: 'user',
        relations: {
          userTimezone: {
            type: 'belongsTo',
            repo: 'userTimezone',
            key: 'userTimezoneId',
            populate: false
          }
        }
      });
      userRepo.dataSource = new MockDataSource(data);

      userRepo.count({}).then(function(result){
        should(result).eql(3);
        done();
      }).catch(function(err){
        done(err);
      });
    });
  });
  describe('populateAll()', function () {
    it('should populate relations', function (done) {
      var data = {
        userTimezone: [
          {_id: '1',  name: 'Europe/London'}
        ],
        user: [
          {_id: '1', name: 'Kevin Foster', userTimezoneId: '1'}
        ]
      };

      var userRepo = new Repo({
        name: 'user',
        relations: {
          userTimezone: {
            type: 'belongsTo',
            repo: 'userTimezone',
            key: 'userTimezoneId',
            populate: false
          }
        }
      });
      userRepo.dataSource = new MockDataSource(data);

      var userTimezoneRepo = new Repo({
        name: 'userTimezone'
      });
      userTimezoneRepo.dataSource = new MockDataSource(data);
      userRepo.repos['userTimezone'] = userTimezoneRepo;

      userRepo.find({}).then(function(docs){
        should(docs[0]).eql({
          _id: '1',
          name: 'Kevin Foster',
          userTimezoneId: '1'
        });
        userRepo.populateAll(docs, {populate: {userTimezone: true}}).then(function(docs){
          should(docs[0]).eql({
            _id: '1',
            name: 'Kevin Foster',
            userTimezoneId: '1',
            userTimezone: {_id: '1', name: 'Europe/London'}
          });
          done();
        }).catch(function(err){
          done(err);
        });
      }).catch(function(err){
        done(err);
      });
    });
  });
  describe('populate()', function () {
    it('should populate single relation by name', function (done) {
      var data = {
        userTimezone: [
          {_id: '1',  name: 'Europe/London'}
        ],
        user: [
          {_id: '1', name: 'Kevin Foster', userTimezoneId: '1'}
        ]
      };

      var userRepo = new Repo({
        name: 'user',
        relations: {
          userTimezone: {
            type: 'belongsToOne',
            repo: 'userTimezone',
            key: 'userTimezoneId',
            populate: false
          }
        }
      });
      userRepo.dataSource = new MockDataSource(data);

      var userTimezoneRepo = new Repo({
        name: 'userTimezone'
      });
      userTimezoneRepo.dataSource = new MockDataSource(data);
      userRepo.repos['userTimezone'] = userTimezoneRepo;

      userRepo.find({}).then(function(docs){
        should(docs[0]).eql({
          _id: '1',
          name: 'Kevin Foster',
          userTimezoneId: '1'
        });

        userRepo.populate('userTimezone', docs, {}).then(function(docs){
          should(docs[0]).eql({
            _id: '1',
            name: 'Kevin Foster',
            userTimezoneId: '1',
            userTimezone: {_id: '1',  name: 'Europe/London'}
          });
          done();
        }).catch(function(err){
          done(err);
        });
      }).catch(function(err){
        done(err);
      });
    });
    it('should populate single relation', function (done) {
      var data = {
        userTimezone: [
          {_id: '1',  name: 'Europe/London'}
        ],
        user: [
          {_id: '1', name: 'Kevin Foster', userTimezoneId: '1'}
        ]
      };

      var userRepo = new Repo({
        name: 'user',
        relations: {
          userTimezone: {
            type: 'belongsToOne',
            repo: 'userTimezone',
            key: 'userTimezoneId',
            populate: false
          }
        }
      });
      userRepo.dataSource = new MockDataSource(data);

      var userTimezoneRepo = new Repo({
        name: 'userTimezone'
      });
      userTimezoneRepo.dataSource = new MockDataSource(data);
      userRepo.repos['userTimezone'] = userTimezoneRepo;

      userRepo.find({}).then(function(docs){
        should(docs[0]).eql({
          _id: '1',
          name: 'Kevin Foster',
          userTimezoneId: '1'
        });

        userRepo.populate(userRepo.config.relations.userTimezone, docs, {}).then(function(docs){
          should(docs[0]).eql({
            _id: '1',
            name: 'Kevin Foster',
            userTimezoneId: '1',
            userTimezone: {_id: '1',  name: 'Europe/London'}
          });
          done();
        }).catch(function(err){
          done(err);
        });
      }).catch(function(err){
        done(err);
      });
    });
  });
  describe('stripTransients()', function () {
    it('should strip relations', function () {
      var user = new Repo({
        name: 'user',
        relations: {
          userTimezone: {
            type: 'belongsTo',
            repo: 'userTimezone',
            key: 'userTimezoneId',
            populate: true
          }
        }
      });

      var result = user.stripTransients({
        _id: '1',
        name: 'Kevin Foster',
        userTimezoneId: '1',
        userTimezone: {_id: '1',  name: 'Europe/London'}
      });

      should(result).eql({
        _id: '1',
        name: 'Kevin Foster',
        userTimezoneId: '1'
      });
    });
    it('should strip pathrefs', function () {
      var userRepo = new Repo({
        name: 'user',
        schema: {
          _id: String,
          name: String,
          userTimezone: {_id: String,  userId: {$pathRef: '_id'}, name: String}
        }
      });

      var user = userRepo.stripTransients({
        _id: '1',
        name: 'Kevin Foster',
        userTimezone: {_id: '33',  userId: '1', name: 'Europe/London'}
      });

      should(user).eql({
        _id: '1',
        name: 'Kevin Foster',
        userTimezone: {_id: '33', name: 'Europe/London'}
      });
    });
  });
  describe('insert()', function () {
    // Since we seperated schema defination from Repos  the 'strict' option can no longer be passed in repo options
    // - we need to add the ability to specify the $strict option within the schema spec itself
    /*
    it('should fail validation in strict mode if contains unspecified properties', function (done) {
      var data = {
        user: [
          {_id: '1', name: 'Kevin Foster', age: 33}
        ]
      };

      var userRepo = new Repo({
        name: 'user',
        strict: false,
        schema: {
          _id: Number,
          name: String
        }
      });
      userRepo.dataSource = new MockDataSource(data);

      var userRepoStrict = new Repo({
        name: 'user',
        strict: true,
        schema: {
          _id: Number,
          name: String
        }
      });
      userRepoStrict.dataSource = new MockDataSource(data);

      userRepo.insertOne(data.user[0]).catch(function(err){
        should(err).be.undefined();
      });

      userRepoStrict.insertOne(data.user[0]).catch(function(err){
        should(err).be.type('object');
        done();
      }).catch(function(err){
        done(err);
      });
    });
    */
  });
});
