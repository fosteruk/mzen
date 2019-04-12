import should = require('should');
import Repo from '../../lib/repo';
import MockDataSource from '../../lib/data-source/mock';

describe('Repo', function(){
  describe('getName()', function(){
    it('should return configured name', function(){
      var userRepo = new Repo({name: 'UserRepo'});
      should(userRepo.getName()).eql('UserRepo');
    });
    it('should return constructor name if name not configured', function(){
      class UserRepo extends Repo {};
      var userRepo = new UserRepo();
      should(userRepo.getName()).eql('UserRepo');

      class NewUserRepo extends UserRepo {};
      var newUserRepo = new NewUserRepo();
      should(newUserRepo.getName()).eql('NewUserRepo');
    });
    it('should throw an exception if repo name is not configured when using the default constructor', function(){
      var aRepo = new Repo();
      should.throws(function(){
        aRepo.getName()
      }, /Repo name not configured/);
    });
  });
  describe('count()', function(){
    it('should return document count', async () => {
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
            autoPopulate: false
          }
        }
      });
      userRepo.dataSource = new MockDataSource(data);

      const result = await userRepo.count({});
      should(result).eql(3);
    });
  });
  describe('populateAll()', function(){
    it('should populate relations', async () => {
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
            autoPopulate: false
          }
        }
      });
      userRepo.dataSource = new MockDataSource(data);

      var userTimezoneRepo = new Repo({
        name: 'userTimezone'
      });
      userTimezoneRepo.dataSource = new MockDataSource(data);
      userRepo.repos.userTimezone = userTimezoneRepo;

      var docs = await userRepo.find();
      should(docs[0]).eql({
        _id: '1',
        name: 'Kevin Foster',
        userTimezoneId: '1'
      });

      await userRepo.populateAll(docs, {populate: {userTimezone: true}});
      should(docs[0]).eql({
        _id: '1',
        name: 'Kevin Foster',
        userTimezoneId: '1',
        userTimezone: {_id: '1', name: 'Europe/London'}
      });
    });
    it('should load relation by performing one query per document if limit option was specified', async () => {
      var data = {
        mother: [
          {_id: '5', name: 'Alison'},
          {_id: '6', name: 'Gina'}
        ],
        child: [
          {_id: '1', motherId: '5', name: 'Kevin'},
          {_id: '2', motherId: '5', name: 'Lisa'},
          {_id: '3', motherId: '5', name: 'Claire'},
          {_id: '4', motherId: '6', name: 'Ian'},
          {_id: '5', motherId: '6', name: 'Brenda'},
          {_id: '6', motherId: '6', name: 'Alison'},
        ],
      };
      var dataSource = new MockDataSource(data);
  
      var motherRepo = new Repo({
        name: 'mother',
        relations: {
          children: {
            type: 'hasMany',
            repo: 'child',
            key: 'motherId',
            alias: 'children',
            limit: 1,
            autoPopulate: false
          }
        }
      });
      motherRepo.dataSource = dataSource;
  
      var childRepo = new Repo({
        name: 'child'
      });
      childRepo.dataSource = dataSource;
      motherRepo.repos.child = childRepo;
  
      var docs = await motherRepo.find();

      await motherRepo.populateAll(docs, {populate: {children: true}});
      // Query count should be 3
      // - 1 for the initial find query and then 2 for populating relations
      should(dataSource.queryCount).eql(3);
      should(docs[0].children.length).eql(1);
      should(docs[1].children.length).eql(1);
    });
  });
  describe('populate()', function(){
    it('should populate single relation by name', async () => {
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
            autoPopulate: false
          }
        }
      });
      userRepo.dataSource = new MockDataSource(data);

      var userTimezoneRepo = new Repo({
        name: 'userTimezone'
      });
      userTimezoneRepo.dataSource = new MockDataSource(data);
      userRepo.repos.userTimezone = userTimezoneRepo;

      var docs = await userRepo.find();
      should(docs[0]).eql({
        _id: '1',
        name: 'Kevin Foster',
        userTimezoneId: '1'
      });

      await userRepo.populate('userTimezone', docs, {});
      should(docs[0]).eql({
        _id: '1',
        name: 'Kevin Foster',
        userTimezoneId: '1',
        userTimezone: {_id: '1',  name: 'Europe/London'}
      });
    });
    it('should populate single relation', async () => {
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
            autoPopulate: false
          }
        }
      });
      userRepo.dataSource = new MockDataSource(data);

      var userTimezoneRepo = new Repo({
        name: 'userTimezone'
      });
      userTimezoneRepo.dataSource = new MockDataSource(data);
      userRepo.repos.userTimezone = userTimezoneRepo;

      var docs = await userRepo.find();
      should(docs[0]).eql({
        _id: '1',
        name: 'Kevin Foster',
        userTimezoneId: '1'
      });

      await userRepo.populate(userRepo.config.relations.userTimezone, docs, {});
      should(docs[0]).eql({
        _id: '1',
        name: 'Kevin Foster',
        userTimezoneId: '1',
        userTimezone: {_id: '1',  name: 'Europe/London'}
      });
    });
    it('should load relation by performing one query per document if limit option was specified', async () => {
      var data = {
        mother: [
          {_id: '5', name: 'Alison'},
          {_id: '6', name: 'Gina'}
        ],
        child: [
          {_id: '1', motherId: '5', name: 'Kevin'},
          {_id: '2', motherId: '5', name: 'Lisa'},
          {_id: '3', motherId: '5', name: 'Claire'},
          {_id: '4', motherId: '6', name: 'Ian'},
          {_id: '5', motherId: '6', name: 'Brenda'},
          {_id: '6', motherId: '6', name: 'Alison'},
        ],
      };
      var dataSource = new MockDataSource(data);
  
      var motherRepo = new Repo({
        name: 'mother',
        relations: {
          children: {
            type: 'hasMany',
            repo: 'child',
            key: 'motherId',
            alias: 'children',
            limit: 1,
            autoPopulate: false
          }
        }
      });
      motherRepo.dataSource = dataSource;
  
      var childRepo = new Repo({
        name: 'child'
      });
      childRepo.dataSource = dataSource;
      motherRepo.repos.child = childRepo;
  
      var docs = await motherRepo.find();

      await motherRepo.populate('children', docs);
      // Query count should be 3
      // - 1 for the initial find query and then 2 for populating relations
      should(dataSource.queryCount).eql(3);
      should(docs[0].children.length).eql(1);
      should(docs[1].children.length).eql(1);
    });
  });
  describe('stripTransients()', function(){
    it('should strip relations', function(){
      var user = new Repo({
        name: 'user',
        relations: {
          userTimezone: {
            type: 'belongsTo',
            repo: 'userTimezone',
            key: 'userTimezoneId',
            autoPopulate: true
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
    it('should strip pathrefs', function(){
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
  describe('insert()', function(){
    // Since we seperated schema defination from Repos the 'strict' option can no longer be passed in repo options
    // - we need to add the ability to specify the $strict option within the schema spec itself
    /*
    it('should fail validation in strict mode if contains unspecified properties', async () => {
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

  require('./repo/repo-find');
  require('./repo/repo-find-one');
  require('./repo/repo-insert-many');
  require('./repo/repo-insert-one');
  require('./repo/repo-update-many');
  require('./repo/repo-update-one');
});
