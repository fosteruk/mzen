'use strict'

var MockDataSource = require('../lib/data-source/mock').default;
var { ModelManager, Repo } = require('../lib/index');

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

(async () => {
  try {
    var docs = await userRepo.find({}, {populate: {'userTimezone.country': true}});
    console.log(JSON.stringify(docs, null, 2));
  } catch (e) {
    console.log(JSON.stringify(e, null, 2));
  }
})();
