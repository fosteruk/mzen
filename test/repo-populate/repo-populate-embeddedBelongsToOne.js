var should = require('should');
var RepoPopulate = require('../../lib/repo-populate');
var Repo = require('../../lib/repo');
var MockDataSource = require('../../lib/data-source/mock');

describe('RepoPopulate.embeddedBelongsToOne', function () {
  describe('embeddedBelongsToOne()', function () {
    // The docHasMany relation is a hasMany relation within a single document
    // - that is one elment of the document references another element of the document
    it('should populate', function (done) {
      var data = {
        recordCompany: {
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
        }
      };

      var recordCompany = new Repo({
        name: 'recordCompany'
      });
      recordCompany.dataSource = new MockDataSource(data);
      var repoPopulate = new RepoPopulate(recordCompany);

      // See RepoPopulate.normalizeOptions() comments for descrption of relation options
      repoPopulate.embeddedBelongsToOne(data.recordCompany, {
        documentPath: 'artists.*',
        documentPathRelated: 'albums',
        key: 'topAlbumId',
        alias: 'topAlbum'
      }).then(function(docs){
        //console.log(JSON.stringify(docs, null, 2));
        should(docs[0].artists[0].topAlbum.name).eql('OK Computer');
        done();
      }).catch(function(err){
        done(err);
      });
    });
  });
});
