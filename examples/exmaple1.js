'use strict'

var ModelManager = require('mzen/lib/model-manager');
var Repo= require('mzen/lib/repo');
var MockDataSource = require('mzen/lib/data-source/mock');

var data = {
  recordCompany: [
    {_id: '63', name: 'EMI'},
    {_id: '89', name: 'Warner Bros.'}
  ],
  artist: [
    {_id: '7', name: 'Radiohead', recordCompanyId: '63'},
    {_id: '14', name: 'The Mars Volta', recordCompanyId: '89'}
  ],
  album: [
    {_id: '1', name: 'Pablo Honey', artistId: '7'},
    {_id: '2', name: 'The Bends', artistId: '7'},
    {_id: '3', name: 'OK Computer', artistId: '7'},
    {_id: '4', name: 'Kid A', artistId: '7'},

    {_id: '5', name: 'Amputechture', artistId: '14'},
    {_id: '6', name: 'The Bedlam in Goliath', artistId: '14'},
    {_id: '7', name: 'Octahedron', artistId: '14'},
    {_id: '8', name: 'Noctourniquet', artistId: '14'},
  ]
};

var modelManager = new ModelManager();
modelManager.addDataSource('db', new MockDataSource(data));

class RecordCompanyRepo extends Repo
{
  constructor(options) {
    super({
      name: 'recordCompany',
      dataSource: 'db',
      relations: {
        artists: {
          type: 'hasMany',
          repo: 'artist',
          key: 'recordCompanyId',
          populate: true
        }
      }
    });
  }
}

class ArtistRepo extends Repo
{
  constructor(options) {
    super({
      name: 'artist',
      dataSource: 'db',
      relations: {
        albums: {
          type: 'hasMany',
          repo: 'album',
          key: 'artistId',
          populate: true
        },
        recordCompany: {
          type: 'belongsToOne',
          repo: 'recordCompany',
          key: 'recordCompanyId',
          populate: true
        }
      }
    });
  }
}

class AlbumRepo extends Repo 
{
  constructor(options) {
    super({
      name: 'album',
      dataSource: 'db',
      relations: {}
    });
  }
}

var recordCompany = new RecordCompanyRepo();
modelManager.addRepo(recordCompany);

var artist = new ArtistRepo();
modelManager.addRepo(artist);

var album = new AlbumRepo();
modelManager.addRepo(album);

modelManager
.init()
.then(function(){
  return recordCompany.find({});
}).then(function(objects){
  console.log(JSON.stringify(objects, null, 2));
  return this;
}).then(function(){
  return artist.find({});
}).then(function(objects){
  console.log(JSON.stringify(objects, null, 2));
}).then(function(){
  modelManager.shutdown();
}).catch(function(err) {
  console.log(err.stack);
});
