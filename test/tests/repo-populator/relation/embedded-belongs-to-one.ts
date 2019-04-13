import should = require('should');
import { RelationEmbeddedBelongsToOne } from '../../../../lib/repo-populator/relation/embedded-belongs-to-one';
import Repo from '../../../../lib/repo';
import MockDataSource from '../../../../lib/data-source/mock';

describe('RelationEmbeddedBelongsToOne', function(){
  it('should populate', async () => {
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

    var repoPopulator = new RelationEmbeddedBelongsToOne;
    // See RepoPopulateRelation.normalizeOptions() comments for descrption of relation options
    var docs = await repoPopulator.populate(recordCompany, {
      docPath: 'artists.*',
      docPathRelated: 'albums.*',
      key: 'topAlbumId',
      alias: 'topAlbum'
    }, data.recordCompany);

    should(docs[0].artists[0].topAlbum.name).eql('OK Computer');
  });
  it('should populate array of docs', async () => {
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

    var repoPopulator = new RelationEmbeddedBelongsToOne;
    // See RepoPopulateRelation.normalizeOptions() comments for descrption of relation options
    var docs = await repoPopulator.populate(recordCompany, {
      docPath: 'artists.*',
      docPathRelated: 'albums.*',
      key: 'topAlbumId',
      alias: 'topAlbum'
    }, data.recordCompany);

    should(docs[0].artists[0].topAlbum.name).eql('OK Computer');
    should(docs[1].artists[0].topAlbum.name).eql('Amputechture');
  });
});