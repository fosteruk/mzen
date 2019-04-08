import should = require('should');
import MockDataSource from '../../../lib/data-source/mock';

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
    {_id: '3', name: 'OK Computer', artistId: '7', popular: 1},
    {_id: '4', name: 'Kid A', artistId: '7', popular: 1},

    {_id: '5', name: 'Amputechture', artistId: '14', popular: 1},
    {_id: '6', name: 'The Bedlam in Goliath', artistId: '14', popular: 1},
    {_id: '7', name: 'Octahedron', artistId: '14'},
    {_id: '8', name: 'Noctourniquet', artistId: '14'},
  ]
};

describe('Data Source', function(){
  describe('Mock', function(){
    describe('find()', function(){
      it('should return collection data array', async () => {
        var datasource = new MockDataSource(data);
        var result = await datasource.find('album');
        should(result).eql(data.album);
      });
      it('should filter collection data', async () => {
        var datasource = new MockDataSource(data);
        var result = await datasource.find('album', {popular: 1});
        should(result).eql([
          data.album[2],
          data.album[3],
          data.album[4],
          data.album[5],
        ]);
      });
      it('should filter collection data using $in', async () => {
        var datasource = new MockDataSource(data);
        var result = await datasource.find('album', {_id: {'$in': ['2', '4', '6']}});
        should(result).eql([
          data.album[1],
          data.album[3],
          data.album[5],
        ]);
      });
    });
    describe('findOne()', function(){
      it('should return collection data', async () => {
        var datasource = new MockDataSource(data);
        var result = await datasource.findOne('album');
        should(result).eql(data.album[0]);
      });
      it('should filter collection data', async () => {
        var datasource = new MockDataSource(data);
        var result = await datasource.findOne('album', {popular: 1});
        should(result).eql(data.album[2]);
      });
    });
    describe('count()', function(){
      it('should count collection data', async () => {
        var datasource = new MockDataSource(data);
        var result = await datasource.count('album');
        should(result).eql(8);
      });
      it('should count filtered collection data', async () => {
        var datasource = new MockDataSource(data);
        var result = await datasource.count('album', {popular: 1});
        should(result).eql(4);
      });
    });
  });
});
