import should = require('should');
import Repo from '../../../lib/repo';
import MockDataSource from '../../../lib/data-source/mock';

describe('Repo', function () {
  describe('findOne()', function () {
    it('should find queried data', async () => {
      var data = {
        user: [
          {_id: '1', name: 'Kevin Foster'}
        ]
      };

      var user = new Repo({
        name: 'user'
      });
      user.dataSource = new MockDataSource(data);

      var doc = await user.findOne();
      should(doc.name).eql('Kevin Foster');
    });
    it('should populate hasOne relation', async () => {
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
      user.repos.userTimezone = userTimezone;

      var doc = await user.findOne();
      should(doc.name).eql('Kevin Foster');
      should(doc.userTimezone.name).eql('Europe/London');
    });
    it('should populate belongsTo relation', async () => {
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
      user.repos.userTimezone = userTimezone;

      var doc = await user.findOne();
      should(doc.name).eql('Kevin Foster');
      should(doc.userTimezone.name).eql('Europe/London');
    });
    it('should populate hasMany relation', async () => {
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

      var doc = await artist.findOne();
      should(doc.albums[0].name).eql('Pablo Honey');
      should(doc.albums[1].name).eql('The Bends');
      should(doc.albums[2].name).eql('OK Computer');
      should(doc.albums[3].name).eql('Kid A');
    });
    it('should populate self relation with one level of recursion only', async () => {
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

      var doc = await user.findOne();
      should(doc.name).eql('Kevin');
      should(doc.referer).eql(undefined);
      should(doc.referred[0].name).eql('Tom');
      should(doc.referred[0].referer).eql(undefined);
      should(doc.referred[1].name).eql('Sarah');
      should(doc.referred[1].referer).eql(undefined);
    });
    it('should return entity objects if entity constructor specified in repo schema', async () => {
      var data = {
        user: [
          {_id: '1', name_first: 'Kevin', name_last: 'Foster'}
        ]
      };

      var User = class {
        name_first: string;
        name_last: string;
        getFullname(){
          return this.name_first + ' ' + this.name_last;
        }
      };

      var userRepo = new Repo({
        name: 'user',
        schema: {$construct: 'User'},
        constructors: [User]
      });
      userRepo.dataSource = new MockDataSource(data);

      var doc = await userRepo.findOne();
      should(doc.getFullname()).eql('Kevin Foster');
    });
    it('should return entity objects if entity constructor specified in relation repo schema', async () => {
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
        name: string;
        getName(){
          return this.name;
        }
      };

      var userTimezoneRepo = new Repo({
        name: 'userTimezone',
        schema: {$construct: 'Timezone'},
        constructors: [Timezone]
      });
      userTimezoneRepo.dataSource = dataSource;
      userRepo.repos.userTimezone = userTimezoneRepo;

      var doc = await userRepo.findOne();
      should(doc.userTimezone.getName).be.type('function');
      should(doc.userTimezone.getName()).eql('Europe/London');
    });

    it('should return embedded entity when embedded constructor specified in repo schema', async () => {
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
          }
        ]
      };

      var Contact = class {
        address: string;
        getAddress(){
          return this.address + ' (@)';
        }
      };

      var user = new Repo({
        name: 'user',
        schema: {
          contact: {$construct: 'Contact'}
        },
        constructors: [Contact]
      });
      user.dataSource = new MockDataSource(data);

      var doc = await user.findOne();
      should(doc.contact.getAddress).be.type('function');
      should(doc.contact.getAddress()).eql('123 Picton Road (@)');
    });
    it('should return deep embedded entity when embedded constructor specified in repo schema', async () => {
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
        address: string;
        getAddress(){
          return this.address + ' (@)';
        }
      };

      var website = new Repo({
        name: 'website',
        schema: {
          users: [{
            contact: {$construct: 'Contact'}
          }]
        },
        constructors: [Contact]
      });
      website.dataSource = new MockDataSource(data);

      var doc = await website.findOne();
      should(doc.users[0].contact.getAddress).be.type('function');
      should(doc.users[0].contact.getAddress()).eql('123 Picton Road (@)');
    });
    it('should allow relation to to be enabled via populate option', async () => {
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
            populate: false
          }
        }
      });
      userRepo.dataSource = dataSource;

      var userTimezoneRepo = new Repo({
        name: 'userTimezone'
      });
      userTimezoneRepo.dataSource = dataSource;
      userRepo.repos.userTimezone = userTimezoneRepo;

      var doc = await userRepo.findOne({}, {populate: {userTimezone: true}});
      should(doc.userTimezone.name).eql('Europe/London');
    });
    it('should allow relation to to be disabled via populate option', async () => {
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
      userRepo.repos.userTimezone = userTimezoneRepo;

      var doc = await userRepo.findOne({}, {populate: {userTimezone: false}});
      should(doc.userTimezone).be.type('undefined');
    });
    it('should allow nested relation to be disabled via populate option', async () => {
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
      userRepo.repos.userTimezone = userTimezoneRepo;

      var countryRepo = new Repo({
        name: 'country'
      });
      countryRepo.dataSource = dataSource;
      userTimezoneRepo.repos.country = countryRepo;
      userRepo.repos.country = countryRepo;

      var doc = await userRepo.findOne({}, {populate: {'userTimezone.country': true}});
      should(doc.userTimezone.country.name).eql('UK');
    });
    it('should allow nested relation to be disabled via populate option', async () => {
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
            populate: true // important - initialy the relation is configured not to populate
          }
        }
      });
      userTimezoneRepo.dataSource = dataSource;
      userRepo.repos.userTimezone = userTimezoneRepo;

      var countryRepo = new Repo({
        name: 'country'
      });
      countryRepo.dataSource = dataSource;
      userTimezoneRepo.repos.country = countryRepo;
      userRepo.repos.country = countryRepo;

      var doc = await userRepo.findOne({}, {populate: {'userTimezone.country': false}});
      should(doc.userTimezone.name).eql('Europe/London');
      should(doc.userTimezone.country).be.type('undefined');
    });
    it('should not recurse relations by default', async () => {
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
      childRepo.repos.mother = motherRepo;
      motherRepo.repos.child = childRepo;

      var doc = await motherRepo.findOne();
      should(doc.name).eql('Alison');
      should(doc.children[0].name).eql('Kevin');
      should(doc.children[0].mother.name).eql('Alison');
      should(doc.children[0].mother.children).be.type('undefined');
    });
    it('should recurse relation up to recursion config value 1', async () => {
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
      childRepo.repos.mother = motherRepo;
      motherRepo.repos.child = childRepo;

      var doc = await motherRepo.findOne();
      should(doc.name).eql('Alison');
      should(doc.children[0].name).eql('Kevin');
      should(doc.children[0].mother.name).eql('Alison');
      should(doc.children[0].mother.children[0].name).eql('Kevin');
      should(doc.children[0].mother.children[0].mother).be.type('undefined');
    });
    it('should load relation by performing one query per document if limit option was specified', async () => {
      var data = {
        mother: [
          {_id: '1', name: 'Alison'},
          {_id: '2', name: 'Gina'},
        ],
        child: [
          {_id: '1', motherId: '1', name: 'Kevin'},
          {_id: '2', motherId: '1', name: 'Lisa'},
          {_id: '3', motherId: '1', name: 'Claire'},
          {_id: '4', motherId: '2', name: 'Ian'},
          {_id: '5', motherId: '2', name: 'Brenda'},
          {_id: '6', motherId: '2', name: 'Alison'},
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
        name: 'child',
        relations: {
          mother: {
            type: 'belongsToOne',
            repo: 'mother',
            key: 'motherId',
            alias: 'mother',
            populate: false
          }
        }
      });
      childRepo.dataSource = dataSource;
      childRepo.repos.mother = motherRepo;
      motherRepo.repos.child = childRepo;

      var doc = await motherRepo.findOne();
      // Query count should be 2
      // - 1 for the initial find query and then 1 for populating relation
      should(dataSource.queryCount).eql(2);
      should(doc.children.length).eql(1);
      should(doc.children.length).eql(1);
    });
    it('should filter private fields via filterPrivate option', async () => {
      var data = {
        user: [
          {_id: '1', name: 'Alison', password: 'Abc'},
          {_id: '2', name: 'Gina', password: '123'},
        ]
      };
      var dataSource = new MockDataSource(data);

      var repo = new Repo({
        name: 'user',
        schema: {
          password: {
            $type: String,
            $filter: {private: true}
          }
        }
      });
      repo.dataSource = dataSource;

      var doc = await repo.findOne({}, {filterPrivate: true});
      should(doc.name).eql('Alison');
      should(doc.password).eql(undefined);
    });
    it('should not filter private fields byt default', async () => {
      var data = {
        user: [
          {_id: '1', name: 'Alison', password: 'Abc'}
        ]
      };
      var dataSource = new MockDataSource(data);

      var repo = new Repo({
        name: 'user',
        schema: {
          password: {
            $type: String,
            $filter: {private: true}
          }
        }
      });
      repo.dataSource = dataSource;

      var doc = await repo.findOne();
      should(doc.name).eql('Alison');
      should(doc.password).eql('Abc');
    });
  });
});
