var should = require('should');
var RepoPopulate = require('../../lib/repo-populate');
var Repo = require('../../lib/repo');
var MockDataSource = require('../../lib/data-source/mock');

describe('RepoPopulate.embeddedBelongsToMany', function () {
  describe('embeddedBelongsToMany()', function () {
    // The docHasMany relation is a hasMany relation within a single document
    // - that is one elment of the document references another element of the document
    it('should populate', function (done) {
      var data = {
        recordCompany: {
          artists: [
            {
              _id: '1', 
              name: 'Radiohead',
              albumIds: ['1', '2', '3', '4']
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
      repoPopulate.embeddedBelongsToMany(data.recordCompany, {
        docPath: 'artists.*',
        docPathRelated: 'albums',
        key: 'albumIds',
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
