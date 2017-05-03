'use strict'
var should = require('should');
var Repo = require('../../lib/repo');
var MockDataSource = require('../../lib/data-source/mock');

describe('Repo', function () {
  describe('find()', function () {
    it('should find queried data', function (done) {
      var data = {
        user: [
          {_id: '1', name: 'Kevin Foster'},
          {_id: '1', name: 'Tom Murphy'}
        ]
      };

      var user = new Repo({
        name: 'user'
      });
      user.dataSource = new MockDataSource(data);

      user.find({})
      .then(function(docs){
        should(docs[0].name).eql('Kevin Foster');
        should(docs[1].name).eql('Tom Murphy');
        done();
      }).catch(function(err){
        done(err);
      });
    });
    it('should populate hasOne relation', function (done) {
      var data = {
        userTimezone: [
          {_id: '1', userId: '1', name: 'Europe/London'}
        ],
        user: [
          {_id: '1', name: 'Kevin Foster'}
        ]
      };
      var dataSource = new MockDataSource(data);

      var user = new Repo({
        name: 'user',
        relations: {
          userTimezone: {
            type: 'hasOne',
            repo: 'userTimezone',
            key: 'userId',
            alias: 'userTimezone',
            populate: true
          }
        }
      });
      user.dataSource = dataSource;

      var userTimezone = new Repo({
        name: 'userTimezone'
      });
      userTimezone.dataSource = dataSource;
      user.repos['userTimezone'] = userTimezone;

      user.find({})
      .then(function(docs){
        should(docs[0].name).eql('Kevin Foster');
        should(docs[0].userTimezone.name).eql('Europe/London');
        done();
      }).catch(function(err){
        done(err)
      });
    });
    it('should populate belongsTo relation', function (done) {
      var data = {
        userTimezone: [
          {_id: '1',  name: 'Europe/London'}
        ],
        user: [
          {_id: '1', name: 'Kevin Foster', userTimezoneId: '1'}
        ]
      };
      var dataSource = new MockDataSource(data);
      
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
      user.dataSource = dataSource;

      var userTimezone = new Repo({
        name: 'userTimezone'
      });
      userTimezone.dataSource = dataSource;
      user.repos['userTimezone'] = userTimezone;

      user.find({})
      .then(function(docs){
        should(docs[0].name).eql('Kevin Foster');
        should(docs[0].userTimezone.name).eql('Europe/London');
        done();
      }).catch(function(err){
        done(err);
      });
    });
    it('should populate hasMany relation', function (done) {
      var data = {
        artist: [
          {_id: '1', name: 'Radiohead'}
        ],
        album: [
          {_id: '1', name: 'Pablo Honey', artistId: '1'},
          {_id: '2', name: 'The Bends', artistId: '1'},
          {_id: '3', name: 'OK Computer', artistId: '1'},
          {_id: '4', name: 'Kid A', artistId: '1'}
        ]
      };
      var dataSource = new MockDataSource(data);
      
      var artist = new Repo({
        name: 'artist',
        relations: {
          albums: {
            type: 'hasMany',
            repo: 'album',
            key: 'artistId',
            populate: true
          }
        }
      });
      artist.dataSource = dataSource;

      var album = new Repo({
        name: 'album'
      });
      album.dataSource = dataSource;
      artist.repos['album'] = album;

      artist.find({})
      .then(function(docs){
        should(docs[0].albums[0].name).eql('Pablo Honey');
        should(docs[0].albums[1].name).eql('The Bends');
        should(docs[0].albums[2].name).eql('OK Computer');
        should(docs[0].albums[3].name).eql('Kid A');
        done();
      }).catch(function(err){
        done(err);
      });
    });
    it('should populate hasOne relation with query option', function (done) {
      var data = {
        userTimezone: [
          {_id: '1', userId: '1', name: 'Europe/London Deleted', deleted: 1},
          {_id: '2', userId: '1', name: 'Europe/London', deleted: 0},
        ],
        user: [
          {_id: '1', name: 'Kevin Foster'}
        ]
      };
      var dataSource = new MockDataSource(data);
      
      var userRepo = new Repo({
        name: 'user',
        relations: {
          userTimezone: {
            type: 'hasOne',
            repo: 'userTimezone',
            key: 'userId',
            alias: 'userTimezone',
            query: {deleted: 0},
            populate: true
          }
        }
      });
      userRepo.dataSource = dataSource;

      var userTimezoneRepo = new Repo({
        name: 'userTimezone'
      });
      userTimezoneRepo.dataSource = dataSource;
      userRepo.repos['userTimezone'] = userTimezoneRepo;

      userRepo.find({})
      .then(function(docs){
        should(docs[0].name).eql('Kevin Foster');
        should(docs[0].userTimezone.name).eql('Europe/London');
        should(docs[0].userTimezone.deleted).eql(0);
        done();
      }).catch(function(err){
        done(err);
      });
    });
    it('should populate hasMany relation with query option', function (done) {
      var data = {
        artist: [
          {_id: '1', name: 'Radiohead'}
        ],
        album: [
          {_id: '1', name: 'Pablo Honey', artistId: '1', deleted: 0},
          {_id: '2', name: 'The Bends', artistId: '1', deleted: 1},
          {_id: '3', name: 'OK Computer', artistId: '1', deleted: 0},
          {_id: '4', name: 'Kid A', artistId: '1', deleted: 0}
        ]
      };
      var dataSource = new MockDataSource(data);

      var artist = new Repo({
        name: 'artist',
        relations: {
          albums: {
            type: 'hasMany',
            repo: 'album',
            key: 'artistId',
            query: {deleted: 0},
            populate: true
          }
        }
      });
      artist.dataSource = dataSource;

      var album = new Repo({
        name: 'album'
      });
      album.dataSource = dataSource;
      artist.repos['album'] = album;

      artist.find({})
      .then(function(docs){
        should(docs[0].albums[0].name).eql('Pablo Honey');
        //should(docs[0].albums[1].name).eql('The Bends'); // this wont appear because doesnt match query option 
        should(docs[0].albums[1].name).eql('OK Computer');
        should(docs[0].albums[2].name).eql('Kid A');
        done();
      }).catch(function(err){
        done(err);
      });
    });
    it('should populate self relation with one level of recursion only', function (done) {
      var data = {
        user: [
          {_id: '1', name: 'Kevin'},
          {_id: '2', name: 'Tom', referredByUserId: '1'},
          {_id: '3', name: 'Sarah', referredByUserId: '1'},
        ]
      };

      var user = new Repo({
        name: 'user',
        relations: {
          referer: {
            type: 'belongsToOne',
            repo: 'user',
            key: 'referredByUserId',
            populate: true
          },
          referred: {
            type: 'hasMany',
            repo: 'user',
            key: 'referredByUserId',
            populate: true
          },
        }
      });
      user.dataSource = new MockDataSource(data);
      user.repos['user'] = user;

      user.find({}).then(function(docs){
        should(docs[0].name).eql('Kevin');
        should(docs[0].referer).eql(undefined);
        should(docs[0].referred[0].name).eql('Tom');
        should(docs[0].referred[0].referer).eql(undefined);
        should(docs[0].referred[1].name).eql('Sarah');
        should(docs[0].referred[1].referer).eql(undefined);
        should(docs[1].name).eql('Tom');
        should(docs[1].referer.name).eql('Kevin');
        should(docs[2].name).eql('Sarah');
        should(docs[2].referer.name).eql('Kevin');
        done();
      }).catch(function(err){
        done(err);
      });
    });
    it('should return entity objects if entity constructor given in repo', function (done) {
      var data = {
        user: [
          {_id: '1', name_first: 'Kevin', name_last: 'Foster'},
          {_id: '2', name_first: 'Tom', name_last: 'Murphy'},
        ]
      };

      var User = class {
        getFullname(){
          return this.name_first + ' ' + this.name_last;
        }
      };

      var user = new Repo({
        name: 'user',
        entityConstructor: User
      });
      user.dataSource = new MockDataSource(data);

      user.find({})
      .then(function(docs){
        should(docs[0].getFullname).be.type('function');
        should(docs[0].getFullname()).eql('Kevin Foster');
        should(docs[1].getFullname()).eql('Tom Murphy');
        done();
      }).catch(function(err){
        done(err);
      });
    });
    it('should return entity objects if entity constructor given in relation repo', function (done) {
      var data = {
        userTimezone: [
          {_id: '1', name: 'Europe/London'}
        ],
        user: [
          {_id: '1', name: 'Kevin Foster', timeZoneId: '1'}
        ]
      };
      var dataSource = new MockDataSource(data);
      
      var userRepo = new Repo({
        name: 'user',
        relations: {
          userTimezone: {
            type: 'belongsTo',
            repo: 'userTimezone',
            key: 'timeZoneId',
            alias: 'userTimezone',
            populate: true
          }
        }
      });
      userRepo.dataSource = dataSource;

      var timezone = class {
        getName(){
          return this.name;
        }
      };

      var userTimezoneRepo = new Repo({
        name: 'userTimezone',
        entityConstructor: timezone
      });
      userTimezoneRepo.dataSource = dataSource;
      userRepo.repos['userTimezone'] = userTimezoneRepo;

      userRepo.find({})
      .then(function(docs){
        should(docs[0].userTimezone.getName).be.type('function');
        should(docs[0].userTimezone.getName()).eql('Europe/London');
        done();
      }).catch(function(err){
        done(err);
      });
    });
    it('should return entity objects if entity constructor given in relation repo in relation of relation', function (done) {
      var data = {
        country: [
          {_id: '1', name: 'United Kingdom'}
        ],
        timezone: [
          {_id: '1', name: 'Europe/London', countryId: '1'}
        ],
        user: [
          {_id: '1', name: 'Kevin Foster', timeZoneId: '1'}
        ]
      };
      var dataSource = new MockDataSource(data);
      
      var userRepo = new Repo({
      name: 'user',
        relations: {
        userTimezone: {
          type: 'belongsTo',
          repo: 'timezone',
          key: 'timeZoneId',
          alias: 'timezone',
          populate: true
        }
      }
      });
      userRepo.dataSource = dataSource;

      var Timezone = class {
        getName(){
          return this.name + ' Timezone';
        }
      };
      var timezoneRepo = new Repo({
        name: 'timezone',
        entityConstructor: Timezone,
        relations: {
          country: {
            type: 'belongsTo',
            repo: 'country',
            key: 'countryId',
            alias: 'country',
            populate: true
          }
        }
      });
      timezoneRepo.dataSource = dataSource;
      userRepo.repos['timezone'] = timezoneRepo;
      
      var Country = class {
        getName(){
          return this.name + ' Country';
        }
      };
      var countryRepo = new Repo({
        name: 'country',
        entityConstructor: Country
      });
      countryRepo.dataSource = dataSource;
      timezoneRepo.repos['country'] = countryRepo;
      userRepo.repos['country'] = countryRepo;

      userRepo.find({})
      .then(function(docs){
        should(docs[0].timezone.getName).be.type('function');
        should(docs[0].timezone.getName()).eql('Europe/London Timezone');
        done();
      }).catch(function(err){
        done(err);
      });
    });
    it('should return embedded entity objects if embedded constructor given in repo', function (done) {
      var data = {
        user: [
          {
            _id: '1', 
            name_first: 'Kevin', 
            name_last: 'Foster',
            contact: {
              address: '123 Picton Road',
              tel: '123 456 789'
            }
          },
          {
            _id: '2', 
            name_first: 'Tom', 
            name_last: 'Murphy',
            contact: {
              address: '5 Marina Tower',
              tel: '133 436 109'
            }
          },
        ]
      };

      var Contact = class {
        getAddress(){
          return this.address + ' (@)';
        }
      };

      var user = new Repo({
        name: 'user',
        embeddedConstructors: {
          'contact': Contact
        }
      });
      user.dataSource = new MockDataSource(data);

      user.find({})
      .then(function(docs){
        should(docs[0].contact.getAddress).be.type('function');
        should(docs[0].contact.getAddress()).eql('123 Picton Road (@)');
        should(docs[1].contact.getAddress()).eql('5 Marina Tower (@)');
        done();
      }).catch(function(err){
        done(err);
      });
    });
    it('should return deep embedded entity objects if ebedded constructor given in repo', function (done) {
      var data = {
        website: [
          {
            _id: '1',
            name: 'Google',
            users:  [
              {
                _id: '1', 
                name_first: 'Kevin', 
                name_last: 'Foster',
                contact: {
                  address: '123 Picton Road',
                  tel: '123 456 789'
                }
              },
              {
                _id: '2', 
                name_first: 'Tom', 
                name_last: 'Murphy',
                contact: {
                  address: '5 Marina Tower',
                  tel: '133 436 109'
                }
              },
            ]
          }
        ]
      };

      var Contact = class {
        getAddress(){
          return this.address + ' (@)';
        }
      };

      var website = new Repo({
        name: 'website',
        embeddedConstructors: {
          'users.*.contact': Contact
        }
      });
      website.dataSource = new MockDataSource(data);

      website.find({})
      .then(function(docs){
        should(docs[0].users[0].contact.getAddress).be.type('function');
        should(docs[0].users[0].contact.getAddress()).eql('123 Picton Road (@)');
        should(docs[0].users[1].contact.getAddress()).eql('5 Marina Tower (@)');
        done();
      }).catch(function(err){
        done(err);
      });
    });
    it('should allow constructor to be disabled via option', function (done) {
      var data = {
        user: [
          {_id: '1', name_first: 'Kevin', name_last: 'Foster'},
          {_id: '2', name_first: 'Tom', name_last: 'Murphy'},
        ]
      };

      var User = class {
        getFullname(){
          return this.name_first + ' ' + this.name_last;
        }
      };

      var userRepo = new Repo({
        name: 'user',
        entityConstructor: User
      });
      userRepo.dataSource = new MockDataSource(data);

      userRepo.find({}, {entityConstructor: false})
      .then(function(docs){
        should(docs[0].name_first).eql('Kevin');
        should(docs[0].getFullname).be.undefined();
        done();
      }).catch(function(err){
        done(err);
      });
    });
    it('should allow relation constructor to be disabled via option', function (done) {
      var data = {
        userTimezone: [
          {_id: '1', userId: '1', name: 'Europe/London'}
        ],
        user: [
          {_id: '1', name: 'Kevin Foster'}
        ]
      };
      var dataSource = new MockDataSource(data);
      
      var userRepo = new Repo({
        name: 'user',
        relations: {
          userTimezone: {
            type: 'hasOne',
            repo: 'userTimezone',
            key: 'userId',
            alias: 'userTimezone',
            populate: true
          }
        }
      });
      userRepo.dataSource = dataSource;

      var Timezone = class {
        getName(){
          return this.name;
        }
      };

      var userTimezoneRepo = new Repo({
        name: 'userTimezone',
        entityConstructor: Timezone
      });
      userTimezoneRepo.dataSource = dataSource;
      userRepo.repos['userTimezone'] = userTimezoneRepo;

      userRepo.find({}, {entityConstructor: false}).then(function(docs){
        should(docs[0].userTimezone.getName).be.type('undefined');
        should(docs[0].userTimezone.name).eql('Europe/London');
        done();
      }).catch(function(err){
        done(err);
      });
    });
    it('should allow relation to be enabled via populate option', function (done) {
      var data = {
        userTimezone: [
          {_id: '1', name: 'Europe/London'}
        ],
        user: [
          {_id: '1', timezoneId: '1', name: 'Kevin Foster'}
        ]
      };
      var dataSource = new MockDataSource(data);
      
      var userRepo = new Repo({
        name: 'user',
        relations: {
          userTimezone: {
            type: 'belongsToOne',
            repo: 'userTimezone',
            key: 'timezoneId',
            alias: 'userTimezone',
            populate: false // important - initialy the relation is configured not to populate
          }
        }
      });
      userRepo.dataSource = dataSource;

      var userTimezoneRepo = new Repo({
        name: 'userTimezone'
      });
      userTimezoneRepo.dataSource = dataSource;
      userRepo.repos['userTimezone'] = userTimezoneRepo;

      userRepo.find({}, {populate: {userTimezone: true}}).then(function(docs){
        should(docs[0].userTimezone.name).eql('Europe/London');
        done();
      }).catch(function(err){
        done(err);
      });
    });
    it('should allow relation to be disabled via populate option', function (done) {
      var data = {
        userTimezone: [
          {_id: '1', name: 'Europe/London'}
        ],
        user: [
          {_id: '1', timezoneId: '1', name: 'Kevin Foster'}
        ]
      };
      var dataSource = new MockDataSource(data);
      
      var userRepo = new Repo({
        name: 'user',
        relations: {
          userTimezone: {
            type: 'belongsToOne',
            repo: 'userTimezone',
            key: 'timezoneId',
            alias: 'userTimezone',
            populate: true
          }
        }
      });
      userRepo.dataSource = dataSource;

      var userTimezoneRepo = new Repo({
        name: 'userTimezone'
      });
      userTimezoneRepo.dataSource = dataSource;
      userRepo.repos['userTimezone'] = userTimezoneRepo;

      userRepo.find({}, {populate: {userTimezone: false}}).then(function(docs){
        should(docs[0].userTimezone).be.type('undefined');
        done();
      }).catch(function(err){
        done(err);
      });
    });
    it('should allow nested relation to be enabled via populate option', function (done){
      var data = {
        country: [
          {_id: '1', name: 'UK'}
        ],
        userTimezone: [
          {_id: '1', countryId: '1', name: 'Europe/London'}
        ],
        user: [
          {_id: '1', userTimezoneId: '1', name: 'Kevin Foster'}
        ]
      };
      var dataSource = new MockDataSource(data);
      
      var userRepo = new Repo({
        name: 'user',
        relations: {
          userTimezone: {
            type: 'belongsToOne',
            repo: 'userTimezone',
            key: 'userTimezoneId',
            alias: 'userTimezone',
            populate: true
          }
        }
      });
      userRepo.dataSource = dataSource;

      var userTimezoneRepo = new Repo({
        name: 'userTimezone',
        relations: {
          country: {
            type: 'belongsToOne',
            repo: 'country',
            key: 'countryId',
            alias: 'country',
            recursion: 1,
            populate: false // important - initialy the relation is configured not to populate
          }
        }
      });
      userTimezoneRepo.dataSource = dataSource;
      userRepo.repos['userTimezone'] = userTimezoneRepo;
      
      var countryRepo = new Repo({
        name: 'country'
      });
      countryRepo.dataSource = dataSource;
      userTimezoneRepo.repos['country'] = countryRepo;
      userRepo.repos['country'] = countryRepo;

      userRepo.find({}, {populate: {'userTimezone.country': true}}).then(function(docs){
        should(docs[0].userTimezone.name).eql('Europe/London');
        should(docs[0].userTimezone.country.name).eql('UK');
        done();
      }).catch(function(err){
        done(err);
      });
    });
    it('should allow nested relation to be disabled via populate option', function (done){
      var data = {
        country: [
          {_id: '1', name: 'UK'}
        ],
        userTimezone: [
          {_id: '1', countryId: '1', name: 'Europe/London'}
        ],
        user: [
          {_id: '1', userTimezoneId: '1', name: 'Kevin Foster'}
        ]
      };
      var dataSource = new MockDataSource(data);
      
      var userRepo = new Repo({
        name: 'user',
        relations: {
          userTimezone: {
            type: 'belongsToOne',
            repo: 'userTimezone',
            key: 'userTimezoneId',
            alias: 'userTimezone',
            populate: true
          }
        }
      });
      userRepo.dataSource = dataSource;

      var userTimezoneRepo = new Repo({
        name: 'userTimezone',
        relations: {
          country: {
            type: 'belongsToOne',
            repo: 'country',
            key: 'countryId',
            alias: 'country',
            recursion: 1,
            populate: true // important - initialy the relation is configured to populate
          }
        }
      });
      userTimezoneRepo.dataSource = dataSource;
      userRepo.repos['userTimezone'] = userTimezoneRepo;
      
      var countryRepo = new Repo({
        name: 'country'
      });
      countryRepo.dataSource = dataSource;
      userTimezoneRepo.repos['country'] = countryRepo;
      userRepo.repos['country'] = countryRepo;

      userRepo.find({}, {populate: {'userTimezone.country': false}}).then(function(docs){
        should(docs[0].userTimezone.name).eql('Europe/London');
        should(docs[0].userTimezone.country).be.type('undefined');
        done();
      }).catch(function(err){
        done(err);
      });
    });
    it('should not recurse relations by default', function (done){
      var data = {
        mother: [
          {_id: '1', name: 'Alison'}
        ],
        child: [
          {_id: '1', motherId: '1', name: 'Kevin'}
        ]
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
            populate: true
          }
        }
      });
      motherRepo.dataSource = dataSource;

      var childRepo = new Repo({
        name: 'child',
        relations: {
          mother: {
            type: 'belongsToOne',
            repo: 'mother',
            key: 'motherId',
            alias: 'mother',
            populate: true
          }
        }
      });
      childRepo.dataSource = dataSource;
      childRepo.repos['mother'] = motherRepo;
      motherRepo.repos['child'] = childRepo;
      
      motherRepo.find({}).then(function(docs){
        should(docs[0].name).eql('Alison');
        should(docs[0].children[0].name).eql('Kevin');
        should(docs[0].children[0].mother.name).eql('Alison');
        should(docs[0].children[0].mother.children).be.type('undefined');
        done();
      }).catch(function(err){
        done(err);
      });
    });
    it('should recurse relation up to recursion config value 1', function (done){
      var data = {
        mother: [
          {_id: '1', name: 'Alison'}
        ],
        child: [
          {_id: '1', motherId: '1', name: 'Kevin'}
        ]
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
            populate: true,
            recursion: 1
          }
        }
      });
      motherRepo.dataSource = dataSource;

      var childRepo = new Repo({
        name: 'child',
        relations: {
          mother: {
            type: 'belongsToOne',
            repo: 'mother',
            key: 'motherId',
            alias: 'mother',
            populate: true
          }
        }
      });
      childRepo.dataSource = dataSource;
      childRepo.repos['mother'] = motherRepo;
      motherRepo.repos['child'] = childRepo;
      
      motherRepo.find({}).then(function(docs){
        should(docs[0].name).eql('Alison');
        should(docs[0].children[0].name).eql('Kevin');
        should(docs[0].children[0].mother.name).eql('Alison');
        should(docs[0].children[0].mother.children[0].name).eql('Kevin');
        should(docs[0].children[0].mother.children[0].mother).be.type('undefined');
        done();
      }).catch(function(err){
        done(err);
      });
    });
    it('should load relation by performing one query per document if limit option was specified', function (done){
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
            populate: true
          }
        }
      });
      motherRepo.dataSource = dataSource;

      var childRepo = new Repo({
        name: 'child'
      });
      childRepo.dataSource = dataSource;
      motherRepo.repos['child'] = childRepo;
      
      motherRepo.find({}).then(function(docs){
        // Query count should be 3 
        // - 1 for the initial find query and then 2 for populating relations
        should(dataSource.queryCount).eql(3);
        should(docs[0].children.length).eql(1);
        should(docs[1].children.length).eql(1);
        done();
      }).catch(function(err){
        done(err);
      });
    });
    it('should filter field fields via filterPrivateFields option', function (done){
      var data = {
        user: [
          {_id: '1', name: 'Alison', password: 'Abc'},
          {_id: '2', name: 'Gina', password: '123'},
        ]
      };
      var dataSource = new MockDataSource(data);
      
      var repo = new Repo({
        name: 'user',
        schema: {password: {$type: String, $filter: {private: true}}}
      });
      repo.dataSource = dataSource;
      
      repo.find({}, {filterPrivate: true}).then(function(docs){
        should(docs[0].name).eql('Alison');
        should(docs[0].password).eql(undefined);
        should(docs[1].name).eql('Gina');
        should(docs[1].password).eql(undefined);
        done();
      }).catch(function(err){
        done(err);
      });
    });
    it('should not filter fields byt default', function (done){
      var data = {
        user: [
          {_id: '1', name: 'Alison', password: 'Abc'}
        ]
      };
      var dataSource = new MockDataSource(data);
      
      var repo = new Repo({
        name: 'user',
        schema: {password: {$type: String, $filter: {private: true}}}
      });
      repo.dataSource = dataSource;
      
      repo.find({}).then(function(docs){
        should(docs[0].name).eql('Alison');
        should(docs[0].password).eql('Abc');
        done();
      }).catch(function(err){
        done(err);
      });
    });
  });
});
