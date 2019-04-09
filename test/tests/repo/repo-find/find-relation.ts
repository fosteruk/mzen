import should = require('should');
import Repo from '../../../../lib/repo';
import MockDataSource from '../../../../lib/data-source/mock';

describe('relation', function(){
  it('should auto-populate hasOne relation', async () => {
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
          autoPopulate: true
        }
      }
    });
    user.dataSource = dataSource;

    var userTimezone = new Repo({
      name: 'userTimezone'
    });
    userTimezone.dataSource = dataSource;
    user.repos.userTimezone = userTimezone;

    var docs = await user.find();
    should(docs[0].name).eql('Kevin Foster');
    should(docs[0].userTimezone.name).eql('Europe/London');
  });
  it('should auto-populate belongsTo relation', async () => {
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
          autoPopulate: true
        }
      }
    });
    user.dataSource = dataSource;

    var userTimezone = new Repo({
      name: 'userTimezone'
    });
    userTimezone.dataSource = dataSource;
    user.repos.userTimezone = userTimezone;

    var docs = await user.find();
    should(docs[0].name).eql('Kevin Foster');
    should(docs[0].userTimezone.name).eql('Europe/London');
  });
  it('should auto-populate hasMany relation', async () => {
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
          autoPopulate: true
        }
      }
    });
    artist.dataSource = dataSource;

    var album = new Repo({
      name: 'album'
    });
    album.dataSource = dataSource;
    artist.repos.album = album;

    var docs = await artist.find();
    should(docs[0].albums[0].name).eql('Pablo Honey');
    should(docs[0].albums[1].name).eql('The Bends');
    should(docs[0].albums[2].name).eql('OK Computer');
    should(docs[0].albums[3].name).eql('Kid A');
  });
  it('should auto-populate hasOne relation with query option', async () => {
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
          autoPopulate: true
        }
      }
    });
    userRepo.dataSource = dataSource;

    var userTimezoneRepo = new Repo({
      name: 'userTimezone'
    });
    userTimezoneRepo.dataSource = dataSource;
    userRepo.repos.userTimezone = userTimezoneRepo;

    var docs = await userRepo.find();
    should(docs[0].name).eql('Kevin Foster');
    should(docs[0].userTimezone.name).eql('Europe/London');
    should(docs[0].userTimezone.deleted).eql(0);
  });
  it('should auto-populate hasMany relation with query option', async () => {
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
          autoPopulate: true
        }
      }
    });
    artist.dataSource = dataSource;

    var album = new Repo({
      name: 'album'
    });
    album.dataSource = dataSource;
    artist.repos.album = album;

    var docs = await artist.find();
    should(docs[0].albums[0].name).eql('Pablo Honey');
    //should(docs[0].albums[1].name).eql('The Bends'); // this wont appear because doesnt match query option
    should(docs[0].albums[1].name).eql('OK Computer');
    should(docs[0].albums[2].name).eql('Kid A');
  });
  it('should auto-populate self relation with one level of recursion only', async () => {
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
          autoPopulate: true
        },
        referred: {
          type: 'hasMany',
          repo: 'user',
          key: 'referredByUserId',
          autoPopulate: true
        },
      }
    });
    user.dataSource = new MockDataSource(data);
    user.repos.user = user;

    var docs = await user.find();
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
          autoPopulate: true
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
          autoPopulate: true
        }
      }
    });
    childRepo.dataSource = dataSource;
    childRepo.repos.mother = motherRepo;
    motherRepo.repos.child = childRepo;

    var docs = await motherRepo.find();
    should(docs[0].name).eql('Alison');
    should(docs[0].children[0].name).eql('Kevin');
    should(docs[0].children[0].mother.name).eql('Alison');
    should(docs[0].children[0].mother.children).be.type('undefined');
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
          autoPopulate: true,
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
          autoPopulate: true
        }
      }
    });
    childRepo.dataSource = dataSource;
    childRepo.repos.mother = motherRepo;
    motherRepo.repos.child = childRepo;

    var docs = await motherRepo.find();
    should(docs[0].name).eql('Alison');
    should(docs[0].children[0].name).eql('Kevin');
    should(docs[0].children[0].mother.name).eql('Alison');
    should(docs[0].children[0].mother.children[0].name).eql('Kevin');
    should(docs[0].children[0].mother.children[0].mother).be.type('undefined');
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
          autoPopulate: true
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
    // Query count should be 3
    // - 1 for the initial find query and then 2 for populating relations
    should(dataSource.queryCount).eql(3);
    should(docs[0].children.length).eql(1);
    should(docs[1].children.length).eql(1);
  });
  it('should allow relation to be enabled via populate option', async () => {
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
          autoPopulate: false // important - initialy the relation is configured not to populate
        }
      }
    });
    userRepo.dataSource = dataSource;

    var userTimezoneRepo = new Repo({
      name: 'userTimezone'
    });
    userTimezoneRepo.dataSource = dataSource;
    userRepo.repos.userTimezone = userTimezoneRepo;

    var docs = await userRepo.find({}, {populate: {userTimezone: true}});
    should(docs[0].userTimezone.name).eql('Europe/London');
  });
  it('should allow relation to be disabled via populate option', async () => {
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
          autoPopulate: true
        }
      }
    });
    userRepo.dataSource = dataSource;

    var userTimezoneRepo = new Repo({
      name: 'userTimezone'
    });
    userTimezoneRepo.dataSource = dataSource;
    userRepo.repos.userTimezone = userTimezoneRepo;

    var docs = await userRepo.find({}, {populate: {userTimezone: false}});
    should(docs[0].userTimezone).be.type('undefined');
  });
  it('should allow nested relation to be enabled via populate option', async () => {
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
          autoPopulate: true
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
          autoPopulate: false // important - initialy the relation is configured not to populate
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

    var docs = await userRepo.find({}, {populate: {'userTimezone.country': true}});
    should(docs[0].userTimezone.name).eql('Europe/London');
    should(docs[0].userTimezone.country.name).eql('UK');
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
          autoPopulate: true
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
          autoPopulate: true // important - initialy the relation is configured to populate
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

    var docs = await userRepo.find({}, {populate: {'userTimezone.country': false}});
    should(docs[0].userTimezone.name).eql('Europe/London');
    should(docs[0].userTimezone.country).be.type('undefined');
  });
});