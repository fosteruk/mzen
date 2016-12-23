'use strict'

var MockDataSource = require('mzen/lib/data-source/mock');
var Repo = require('mzen/lib/repo');

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
userRepo.repos['userTimezone'] = userTimezoneRepo;

var countryRepo = new Repo({
  name: 'country'
});
countryRepo.dataSource = dataSource;
userTimezoneRepo.repos['country'] = countryRepo;
userRepo.repos['country'] = countryRepo;

userRepo.find({}, {populate: {'userTimezone.country': false}}).then(function(docs){
  console.log(JSON.stringify(docs[0].userTimezone.country, null, 2));
}).catch(function(err){
  console.log(err.stack);
});
