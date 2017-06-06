var should = require('should');
var RepoPopulate = require('../../lib/repo-populate');
var Repo = require('../../lib/repo');
var MockDataSource = require('../../lib/data-source/mock');

describe('RepoPopulate.embeddedHasOne', function () {
  describe('embeddedHasOne()', function () {
    it('should populate', function (done) {
      var data = {
        docs: [
          {
            userTimezone: [
              {_id: '1', userId: '9', name: 'Europe/London'}
            ],
            user: [
              {_id: '9', name: 'Kevin Foster'}
            ]
          }
        ]
      };

      var doc = new Repo({
        name: 'docs'
      });
      doc.dataSource = new MockDataSource(data);
      var repoPopulate = new RepoPopulate(doc);

      // See RepoPopulate.normalizeOptions() comments for descrption of relation options
      repoPopulate.embeddedHasOne(data.docs, {
        documentPath: 'user.*',
        documentPathRelated: 'userTimezone.*',
        key: 'userId',
        alias: 'timezone'
      }).then(function(docs){
        should(docs[0].user[0].timezone.name).eql('Europe/London');
        done();
      }).catch(function(err){
        done(err);
      });
    });
  });
});
