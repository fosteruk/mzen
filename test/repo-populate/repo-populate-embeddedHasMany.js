var should = require('should');
var RepoPopulate = require('../../lib/repo-populate');
var Repo = require('../../lib/repo');
var MockDataSource = require('../../lib/data-source/mock');

describe('RepoPopulate.embeddedHasMany', function () {
  describe('embeddedHasMany()', function () {
    it('should populate', function (done) {
      var data = {
        recordCompany: [{
          artists: [
            {
              _id: '100', 
              name: 'Radiohead'
            }
          ],
          albums: [
            {_id: '1', name: 'Pablo Honey', artistId: '100'},
            {_id: '2', name: 'The Bends', artistId: '100'},
            {_id: '3', name: 'OK Computer', artistId: '100'},
            {_id: '4', name: 'Kid A', artistId: '100'}
          ]
        }]
      };

      var recordCompany = new Repo({
        name: 'recordCompany'
      });
      recordCompany.dataSource = new MockDataSource(data);
      var repoPopulate = new RepoPopulate(recordCompany);

      // See RepoPopulate.normalizeOptions() comments for descrption of relation options
      repoPopulate.embeddedHasMany(data.recordCompany, {
        docPath: 'artists.*', 
        docPathRelated: 'albums.*', 
        key: 'artistId',
        alias: 'albums' 
      }).then(function(docs){
        should(docs[0].artists[0].albums[0].name).eql('Pablo Honey');
        should(docs[0].artists[0].albums[1].name).eql('The Bends');
        should(docs[0].artists[0].albums[2].name).eql('OK Computer');
        should(docs[0].artists[0].albums[3].name).eql('Kid A');
        done();
      }).catch(function(err){
        done(err);
      });
    });
  });
});
