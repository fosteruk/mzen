import should = require('should');
import { RelationHasMany } from '../../../../lib/repo-populator/relation/has-many';
import Repo from '../../../../lib/repo';
import MockDataSource from '../../../../lib/data-source/mock';

describe('RelationHasMany', function(){
  it('should populate', async () => {
    var data = {
      artist: [
        {_id: '1', name: 'Radiohead'}
      ],
      album: [
        {_id: '1', name: 'Pablo Honey', artistId: '1'},
        {_id: '2', name: 'The Bends', artistId: '1'},
        {_id: '3', name: 'OK Computer', artistId: '1'},
        {_id: '4', name: 'Kid A', artistId: '1'}
      ]
    };

    var album = new Repo({
      name: 'album'
    });
    album.dataSource = new MockDataSource(data);

    var repoPopulator = new RelationHasMany;
    var docs = await repoPopulator.populate(album, {
      key: 'artistId',
      alias: 'albums'
    }, data.artist);
    
    should(docs[0].albums[0].name).eql('Pablo Honey');
    should(docs[0].albums[1].name).eql('The Bends');
    should(docs[0].albums[2].name).eql('OK Computer');
    should(docs[0].albums[3].name).eql('Kid A');
  });
  it('should populate embedded', async () => {
    var data = {
      recordCompanies: [
        {_id: 'r234', name: 'EMI', detail: { topArtist:
          {_id: '7', name: 'Radiohead'}
        }}
      ],
      album: [
        {_id: '1', name: 'Pablo Honey', artistId: '7'},
        {_id: '2', name: 'The Bends', artistId: '7'},
        {_id: '3', name: 'OK Computer', artistId: '7'},
        {_id: '4', name: 'Kid A', artistId: '7'}
      ]
    };

    var album = new Repo({
      name: 'album'
    });
    album.dataSource = new MockDataSource(data);

    var repoPopulator = new RelationHasMany;
    var docs = await repoPopulator.populate(album, {
      docPath: 'detail.topArtist',
      key: 'artistId',
      alias: 'albums'
    }, data.recordCompanies);

    should(docs[0].detail.topArtist.albums[0].name).eql('Pablo Honey');
    should(docs[0].detail.topArtist.albums[1].name).eql('The Bends');
    should(docs[0].detail.topArtist.albums[2].name).eql('OK Computer');
    should(docs[0].detail.topArtist.albums[3].name).eql('Kid A');
  });
  it('should populate embedded array', async () => {
    var data = {
      recordCompanies: [
        {_id: 'r234', name: 'EMI', detail: { topArtists: [
          {_id: '7', name: 'Radiohead'},
          {_id: '14', name: 'The Mars Volta'},
        ]}}
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

    var album = new Repo({
      name: 'album'
    });
    album.dataSource = new MockDataSource(data);

    var repoPopulator = new RelationHasMany;
    var docs = await repoPopulator.populate(album, {
      docPath: 'detail.topArtists.*',
      key: 'artistId',
      alias: 'albums'
    }, data.recordCompanies);
    
    should(docs[0].detail.topArtists[0].albums[0].name).eql('Pablo Honey');
    should(docs[0].detail.topArtists[0].albums[1].name).eql('The Bends');
    should(docs[0].detail.topArtists[0].albums[2].name).eql('OK Computer');
    should(docs[0].detail.topArtists[0].albums[3].name).eql('Kid A');

    should(docs[0].detail.topArtists[1].albums[0].name).eql('Amputechture');
    should(docs[0].detail.topArtists[1].albums[1].name).eql('The Bedlam in Goliath');
    should(docs[0].detail.topArtists[1].albums[2].name).eql('Octahedron');
    should(docs[0].detail.topArtists[1].albums[3].name).eql('Noctourniquet');
  });
  it('should populate embedded wildcard path', async () => {
    var data = {
      recordCompanies: [
        {some: {unknown: {path: {_id: 'r234', name: 'EMI', detail: { topArtist:
          {_id: '7', name: 'Radiohead'}
        }}}}}
      ],
      album: [
        {_id: '1', name: 'Pablo Honey', artistId: '7'},
        {_id: '2', name: 'The Bends', artistId: '7'},
        {_id: '3', name: 'OK Computer', artistId: '7'},
        {_id: '4', name: 'Kid A', artistId: '7'}
      ]
    };

    var album = new Repo({
      name: 'album'
    });
    album.dataSource = new MockDataSource(data);

    var repoPopulator = new RelationHasMany;
    var docs = await repoPopulator.populate(album, {
      docPath: '*.*.*.detail.topArtist',
      key: 'artistId',
      alias: 'albums'
    }, data.recordCompanies);

    should(docs[0].some.unknown.path.detail.topArtist.albums[0].name).eql('Pablo Honey');
    should(docs[0].some.unknown.path.detail.topArtist.albums[1].name).eql('The Bends');
    should(docs[0].some.unknown.path.detail.topArtist.albums[2].name).eql('OK Computer');
    should(docs[0].some.unknown.path.detail.topArtist.albums[3].name).eql('Kid A');
  });
});
