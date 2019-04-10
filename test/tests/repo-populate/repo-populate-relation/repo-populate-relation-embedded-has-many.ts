import should = require('should');
import RepoPopulateRelation from '../../../../lib/repo-populate-relation';
import Repo from '../../../../lib/repo';
import MockDataSource from '../../../../lib/data-source/mock';

describe('embeddedHasMany()', function(){
  it('should populate', async () => {
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
    var repoPopulate = new RepoPopulateRelation(recordCompany);

    // See RepoPopulateRelation.normalizeOptions() comments for descrption of relation options
    var docs = await repoPopulate.embeddedHasMany({
      docPath: 'artists.*', 
      docPathRelated: 'albums.*', 
      key: 'artistId',
      alias: 'albums' 
    }, data.recordCompany);
    
    should(docs[0].artists[0].albums[0].name).eql('Pablo Honey');
    should(docs[0].artists[0].albums[1].name).eql('The Bends');
    should(docs[0].artists[0].albums[2].name).eql('OK Computer');
    should(docs[0].artists[0].albums[3].name).eql('Kid A');
  });
  it('should populate array of docs', async () => {
    var data = {
      recordCompany: [
        {
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
        },
        {
          artists: [
            {
              _id: '200', 
              name: 'The Mars Volta'
            }
          ],
          albums: [
            {_id: '21', name: 'De-Loused in the Comatorium', artistId: '200'},
            {_id: '22', name: 'Frances the Mute', artistId: '200'},
            {_id: '23', name: 'Amputechture', artistId: '200'},
            {_id: '24', name: 'The Bedlam in Goliath', artistId: '200'}
          ]
        },
      ]
    };

    var recordCompany = new Repo({
      name: 'recordCompany'
    });
    recordCompany.dataSource = new MockDataSource(data);
    var repoPopulate = new RepoPopulateRelation(recordCompany);

    // See RepoPopulateRelation.normalizeOptions() comments for descrption of relation options
    var docs = await repoPopulate.embeddedHasMany({
      docPath: 'artists.*', 
      docPathRelated: 'albums.*', 
      key: 'artistId',
      alias: 'albums' 
    }, data.recordCompany);
    
    should(docs[0].artists[0].albums.length).eql(4);
    should(docs[0].artists[0].albums[0].name).eql('Pablo Honey');
    should(docs[0].artists[0].albums[1].name).eql('The Bends');
    should(docs[0].artists[0].albums[2].name).eql('OK Computer');
    should(docs[0].artists[0].albums[3].name).eql('Kid A');
    should(docs[1].artists[0].albums.length).eql(4);
    should(docs[1].artists[0].albums[0].name).eql('De-Loused in the Comatorium');
    should(docs[1].artists[0].albums[1].name).eql('Frances the Mute');
    should(docs[1].artists[0].albums[2].name).eql('Amputechture');
    should(docs[1].artists[0].albums[3].name).eql('The Bedlam in Goliath');
  });
});
