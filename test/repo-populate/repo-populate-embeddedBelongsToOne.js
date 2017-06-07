var should = require('should');
var RepoPopulate = require('../../lib/repo-populate');
var Repo = require('../../lib/repo');
var MockDataSource = require('../../lib/data-source/mock');

describe('RepoPopulate.embeddedBelongsToOne', function () {
  describe('embeddedBelongsToOne()', function () {
    it('should populate', function (done) {
      var data = {
        recordCompany: [{
          artists: [
            {
              _id: '1', 
              name: 'Radiohead',
              topAlbumId: '3'
            }
          ],
          albums: [
            {_id: '1', name: 'Pablo Honey'},
            {_id: '2', name: 'The Bends'},
            {_id: '3', name: 'OK Computer'},
            {_id: '4', name: 'Kid A'}
          ]
        }]
      };

      var recordCompany = new Repo({
        name: 'recordCompany'
      });
      recordCompany.dataSource = new MockDataSource(data);
      var repoPopulate = new RepoPopulate(recordCompany);

      // See RepoPopulate.normalizeOptions() comments for descrption of relation options
      repoPopulate.embeddedBelongsToOne(data.recordCompany, {
        docPath: 'artists.*',
        docPathRelated: 'albums.*',
        key: 'topAlbumId',
        alias: 'topAlbum'
      }).then(function(docs){
        should(docs[0].artists[0].topAlbum.name).eql('OK Computer');
        done();
      }).catch(function(err){
        done(err);
      });
    });
    it('should populate array of docs', function (done) {
      var data = {
        recordCompany: 
        [
          {
            artists: [
              {
                _id: '1', 
                name: 'Radiohead',
                topAlbumId: '3'
              }
            ],
            albums: [
              {_id: '1', name: 'Pablo Honey'},
              {_id: '2', name: 'The Bends'},
              {_id: '3', name: 'OK Computer'},
              {_id: '4', name: 'Kid A'}
            ]
          },
          {
            artists: [
              {
                _id: '200', 
                name: 'The Mars Volta',
                topAlbumId: '23'
              }
            ],
            albums: [
              {_id: '21', name: 'De-Loused in the Comatorium'},
              {_id: '22', name: 'Frances the Mute'},
              {_id: '23', name: 'Amputechture'},
              {_id: '24', name: 'The Bedlam in Goliath'}
            ]
          },
        ]
      };

      var recordCompany = new Repo({
        name: 'recordCompany'
      });
      recordCompany.dataSource = new MockDataSource(data);
      var repoPopulate = new RepoPopulate(recordCompany);

      // See RepoPopulate.normalizeOptions() comments for descrption of relation options
      repoPopulate.embeddedBelongsToOne(data.recordCompany, {
        docPath: 'artists.*',
        docPathRelated: 'albums.*',
        key: 'topAlbumId',
        alias: 'topAlbum'
      }).then(function(docs){
        should(docs[0].artists[0].topAlbum.name).eql('OK Computer');
        should(docs[1].artists[0].topAlbum.name).eql('Amputechture');
        done();
      }).catch(function(err){
        done(err);
      });
    });
  });
});
