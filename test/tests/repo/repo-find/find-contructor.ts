import should = require('should');
import Repo from '../../../../lib/repo';
import MockDataSource from '../../../../lib/data-source/mock';

describe('constructor', function(){
  it('should return entity objects if constructor specified in repo schema', async () => {
    var data = {
      user: [
        {_id: '1', name_first: 'Kevin', name_last: 'Foster'},
        {_id: '2', name_first: 'Tom', name_last: 'Murphy'},
      ]
    };

    var User = class {
      name_first: string;
      name_last: string;
      getFullname(){
        return this.name_first + ' ' + this.name_last;
      }
    };

    var user = new Repo({
      name: 'user',
      schema: {$construct: 'User'},
      constructors: [User]
    });
    user.dataSource = new MockDataSource(data);

    var docs = await user.find();
    should(docs[0].getFullname).be.type('function');
    should(docs[0].getFullname()).eql('Kevin Foster');
    should(docs[1].getFullname()).eql('Tom Murphy');
  });
  it('should return entity objects if constructor specified in relation repo schema', async () => {
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
          autoPopulate: true
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

    var docs = await userRepo.find();
    should(docs[0].userTimezone.getName).be.type('function');
    should(docs[0].userTimezone.getName()).eql('Europe/London');
  });
  it('should return entity objects if constructor specified by relation of relation schema', async () => {
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
          autoPopulate: true
        }
      }
    });
    userRepo.dataSource = dataSource;

    var timezoneRepo = new Repo({
      name: 'timezone',
      relations: {
        country: {
          type: 'belongsTo',
          repo: 'country',
          key: 'countryId',
          alias: 'country',
          autoPopulate: true
        }
      }
    });
    timezoneRepo.dataSource = dataSource;
    userRepo.repos.timezone = timezoneRepo;

    var Country = class {
      name: string;
      getName(){
        return this.name + ' Country';
      }
    };
    var countryRepo = new Repo({
      name: 'country',
      schema: {$construct: 'Country'},
      constructors: [Country]
    });
    countryRepo.dataSource = dataSource;
    timezoneRepo.repos.country = countryRepo;
    userRepo.repos.country = countryRepo;

    var docs = await userRepo.find();
    should(docs[0].timezone.country.getName).be.type('function');
    should(docs[0].timezone.country.getName()).eql('United Kingdom Country');
  });
  it('should return embedded entity objects if embedded constructor specified in repo schema', async () => {
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

    var docs = await user.find();
    should(docs[0].contact.getAddress).be.type('function');
    should(docs[0].contact.getAddress()).eql('123 Picton Road (@)');
    should(docs[1].contact.getAddress()).eql('5 Marina Tower (@)');
  });
  it('should return deep embedded entity objects if embedded constructor specified in repo schema', async () => {
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
        users: [
          {
            contact: {$construct: 'Contact'}
          }
        ]
      },
      constructors: [Contact]
    });
    website.dataSource = new MockDataSource(data);

    var docs = await website.find();
    should(docs[0].users[0].contact.getAddress).be.type('function');
    should(docs[0].users[0].contact.getAddress()).eql('123 Picton Road (@)');
    should(docs[0].users[1].contact.getAddress()).eql('5 Marina Tower (@)');
  });
});