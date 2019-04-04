'use strict'

var { ModelManager, Repo } = require('../lib/index');
var MockDataSource = require('../lib/data-source/mock').default;

var data = {
  person: [
    {_id: '63', name: 'Kevin', bestFriendId: '89', workPlaceId: '1'},
    {_id: '89', name: 'Tom', bestFriendId: '63', workPlaceId: '2'},
    {_id: '97', name: 'Sarah', bestFriendId: '63', workPlaceId: '1'},
    {_id: '165', name: 'Sam', bestFriendId: '63', workPlaceId: '2'},
    {_id: '192', name: 'Paula', bestFriendId: '63', workPlaceId: '1'},
  ],
  workPlace: [
    {_id: '1', name: 'Hotel', managerId: '89'},
    {_id: '2', name: 'Bar', managerId: '192'},
  ]
};

var modelManager = new ModelManager();
modelManager.addDataSource('db', new MockDataSource(data));

var personRepo = new Repo({
  name: 'person',
  dataSource: 'db',
  relations: {
    isConsideredBestFriendBy: {
      type: 'hasMany',
      repo: 'person',
      key: 'bestFriendId',
      populate: true
    },
    bestFriend: {
      type: 'belongsToOne',
      repo: 'person',
      key: 'bestFriendId',
      populate: true
    },
    workPlace: {
      type: 'belongsToOne',
      repo: 'workPlace',
      key: 'workPlaceId',
      populate: true
    }
  }
});
modelManager.addRepo(personRepo);

var workPlaceRepo = new Repo({
  name: 'workPlace',
  dataSource: 'db',
  relations: {
    manager: {
      type: 'belongsToOne',
      repo: 'person',
      key: 'managerId',
      populate: true
    }
  }
});
modelManager.addRepo(workPlaceRepo);

(async () => {
  try {
    await modelManager.init();

    var person = await personRepo.find({});
    console.log(JSON.stringify(person, null, 2));

    await modelManager.shutdown();
  } catch (e) {
    console.log(JSON.stringify(e, null, 2));
  }
})();
