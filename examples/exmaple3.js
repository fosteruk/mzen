'use strict'

var ModelManager = require('mzen/lib/model-manager');
var Repo = require('mzen/lib/repo');

var data = {
  person: [
    {
      _id: '63', 
      name: 'Kevin', 
      bestFriendId: '89', 
      workPlaceId: '1',
      contact: {
        address: '123 Picton Road',
        tel: '123 456 789'
      },
      created: new Date()
    },
    {
      _id: '89', 
      name: 'Tom', 
      bestFriendId: '63', 
      workPlaceId: '2',
      contact: {
        address: '5 Marina Tower',
        tel: '133 436 109'
      }
    },
    {
      _id: '97', 
      name: 'Sarah', 
      bestFriendId: '63', 
      workPlaceId: '1',
      contact: {
        address: '93 Alderson Road',
        tel: '093 238 2349'
      }
    },
    {
      _id: '165', 
      name: 'Sam', 
      bestFriendId: '63', 
      workPlaceId: '2',
      contact: {
        address: '502 Tanjung Bungha',
        tel: '078 131 1847'
      }
    },
    {
      _id: '192', 
      name: 'Paula', 
      bestFriendId: '63', 
      workPlaceId: '1',
      contact: {
        address: '101 King Street',
        tel: '555 555 5555'
      }
    },
  ],
  workPlace: [
    {_id: '1', name: 'Hotel', managerId: '89'},
    {_id: '2', name: 'Bar', managerId: '192'},
  ]
};

var modelManager = new ModelManager({
  dataSources: [{
     name: 'db', type: 'mongodb', url: 'mongodb://localhost:27017/domain-model-example'
  }]
});

class Person {
  getName()
  {
    return this.name + ' (' + this._id + ')';
  }
};

class PersonContact {
  getAddress()
  {
    return this.address + ' (@)';
  }
};

var personRepo = new Repo({
  name: 'person',
  dataSource: 'db',
  entityConstructor: Person,
  embeddedConstructors: {
    'contact': PersonContact
  },
  strict: false,
  schema: {
    _id: Number,
    bestFriendId: Number,
    workPlaceId: Number,
    created: Date,
    contact: {
      address: String,
      tel: String
    }
  },
  indexes: {
    bestFriendId: {spec: {bestFriendId: 1}},
    workPlaceId: {spec: {workPlaceId: 1}}
  },
  autoIndex: true,
  relations: {
    isConsideredBestFriendBy: {
      type: 'hasMany',
      repo: 'person',
      key: 'bestFriendId',
      sort: ['name', 'asc'],
      populate: true,
      recursion: 0
    },
    isConsideredBestFriendByCount: {
      type: 'hasManyCount',
      repo: 'person',
      key: 'bestFriendId',
      sort: ['name', 'asc'],
      populate: true,
      recursion: 0
    },
    bestFriend: {
      type: 'belongsToOne',
      repo: 'person',
      key: 'bestFriendId',
      populate: true,
      recursion: 0
    },
    workPlace: {
      type: 'belongsToOne',
      repo: 'workPlace',
      key: 'workPlaceId',
      populate: true,
      recursion: 0
    },
  }
});
modelManager.addRepo(personRepo);

var workPlaceRepo = new Repo({
  name: 'workPlace',
  dataSource: 'db',
  schema: {
    _id: Number,
    managerId: Number
  },
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

modelManager
.init()
.then(function(){
  console.log('** Connected **');
}).then(function(){
  return personRepo.deleteMany();
}).then(function(){
  return workPlaceRepo.deleteMany();
}).then(function(){
  return personRepo.insertMany(data.person);
}).then(function(savedData){
  return workPlaceRepo.insertOne(data.workPlace[0]);
}).then(function(savedData){
  return personRepo.updateMany({'workPlaceId': 1}, {$set: {'contact.address': '123 Updated Street'}});
}).then(function(savedData){
  return personRepo.find({}, {sort: [['name', 'asc']]});
}).then(function(objects){
  console.log(JSON.stringify(objects, null, 2));
}).then(function(){
  return modelManager.shutdown();
}).then(function(){
  console.log('** Disconnected **');
}).catch(function(err) {
  console.log(err.stack);
});
