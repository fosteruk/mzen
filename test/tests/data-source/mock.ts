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

describe('Data Source', function () {
  describe('Mock', function () {
    describe('find()', function () {
      it('should return collection data array', function (done) {
        var datasource = new MockDataSource(data);
        datasource.find('album').then(function(result){
          should(result).eql(data.album);
          done();
        }).catch(function(err){
          done(err);
        });
      });
      it('should filter collection data', function (done) {
        var datasource = new MockDataSource(data);
        datasource.find('album', {popular: 1}).then(function(result){
          should(result).eql([
            data.album[2],
            data.album[3],
            data.album[4],
            data.album[5],
          ]);
          done();
        }).catch(function (err) {
          done(err); // should throwed assertion
        });
      });
      it('should filter collection data using $in', function (done) {
        var datasource = new MockDataSource(data);
        datasource.find('album', {_id: {'$in': ['2', '4', '6']}}).then(function(result){
          should(result).eql([
            data.album[1],
            data.album[3],
            data.album[5],
          ]);
          done();
        }).catch(function (err) {
          done(err); // should throwed assertion
        });
      });
    });
    describe('findOne()', function () {
      it('should return collection data', function (done) {
        var datasource = new MockDataSource(data);
        datasource.findOne('album').then(function(result){
          should(result).eql(data.album[0]);
          done();
        }).catch(function (err) {
          done(err); // should throwed assertion
        });
      });
      it('should filter collection data', function (done) {
        var datasource = new MockDataSource(data);
        datasource.findOne('album', {popular: 1}).then(function(result){
          should(result).eql(data.album[2]);
          done();
        }).catch(function (err) {
          done(err); // should throwed assertion
        });
      });
    });
    describe('count()', function () {
      it('should count collection data', function (done) {
        var datasource = new MockDataSource(data);
        datasource.count('album').then(function(result){
          should(result).eql(8);
          done();
        }).catch(function (err) {
          done(err); // should throwed assertion
        });
      });
      it('should count filtered collection data', function (done) {
        var datasource = new MockDataSource(data);
        datasource.count('album', {popular: 1}).then(function(result){
          should(result).eql(4);
          done();
        }).catch(function (err) {
          done(err); // should throwed assertion
        });
      });
    });
  });
});
