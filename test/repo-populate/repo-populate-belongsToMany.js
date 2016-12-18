var should = require('should');
var RepoPopulate = require('../../lib/repo-populate');
var Repo = require('../../lib/repo');
var MockDataSource = require('../../lib/data-source/mock');

describe('RepoPopulate.belongsToMany', function () {
  describe('belongsToMany()', function () {
    it('should populate', function (done) {
      var data = {
        person: [
          {_id: '1', name: 'Kevin Foster', favouriteColorIds: ['1', '5']}
        ],
        color: [
          {_id: '1', name: 'Red'},
          {_id: '2', name: 'Orange'},
          {_id: '3', name: 'Yellow'},
          {_id: '5', name: 'Green'},
          {_id: '6', name: 'Blue'}
        ]
      };

      var color = new Repo({
        name: 'color'
      });
      color.dataSource = new MockDataSource(data);
      var repoPopulate = new RepoPopulate(color);

      repoPopulate.belongsToMany(data.person, {
        key: 'favouriteColorIds',
        alias: 'favouriteColors'
      }).then(function(docs){
        should(docs[0].favouriteColors[0].name).eql('Red');
        should(docs[0].favouriteColors[1].name).eql('Green');
        done();
      }).catch(function(err){
        done(err);
      });
    });
    it('should populate embeded', function (done) {
      var data = {
        person: [
          {_id: '1', name: 'Kevin Foster', about: {trivia: {favouriteColorIds: ['1', '5']}}}
        ],
        color: [
          {_id: '1', name: 'Red'},
          {_id: '2', name: 'Orange'},
          {_id: '3', name: 'Yellow'},
          {_id: '5', name: 'Green'},
          {_id: '6', name: 'Blue'}
        ]
      };

      var color = new Repo({
        name: 'color'
      });
      color.dataSource = new MockDataSource(data);

      var repoPopulate = new RepoPopulate(color);

      repoPopulate.belongsToMany(data.person, {
        documentPath: 'about.trivia',
        key: 'favouriteColorIds',
        alias: 'favouriteColors'
      }).then(function(docs){
        should(docs[0].about.trivia.favouriteColors[0].name).eql('Red');
        should(docs[0].about.trivia.favouriteColors[1].name).eql('Green');
        done();
      }).catch(function(err){
        done(err);
      });
    });
    it('should populate embeded array', function (done) {
      var data = {
        person: [
          {_id: '1', name: 'Kevin Foster', about: {trivia: [
            {favouriteColorIds: ['1', '5']},
            {favouriteColorIds: ['2', '6']},
          ]}}
        ],
        color: [
          {_id: '1', name: 'Red'},
          {_id: '2', name: 'Orange'},
          {_id: '3', name: 'Yellow'},
          {_id: '5', name: 'Green'},
          {_id: '6', name: 'Blue'}
        ]
      };

      var color = new Repo({
        name: 'color'
      });
      color.dataSource = new MockDataSource(data);
      
      var repoPopulate = new RepoPopulate(color);

      repoPopulate.belongsToMany(data.person, {
        documentPath: 'about.trivia.*',
        key: 'favouriteColorIds',
        alias: 'favouriteColors'
      }).then(function(docs){
        should(docs[0].about.trivia[0].favouriteColors[0].name).eql('Red');
        should(docs[0].about.trivia[0].favouriteColors[1].name).eql('Green');
        should(docs[0].about.trivia[1].favouriteColors[0].name).eql('Orange');
        should(docs[0].about.trivia[1].favouriteColors[1].name).eql('Blue');
        done();
      }).catch(function(err){
        done(err);
      });
    });
    it('should populate embeded wildcard path', function (done) {
      var data = {
        person: [
          {_id: '1', name: 'Kevin Foster', about: {unknown: {path: {trivia: {favouriteColorIds: ['1', '5']}}}}}
        ],
        color: [
          {_id: '1', name: 'Red'},
          {_id: '2', name: 'Orange'},
          {_id: '3', name: 'Yellow'},
          {_id: '5', name: 'Green'},
          {_id: '6', name: 'Blue'}
        ]
      };

      var color = new Repo({
        name: 'color'
      });
      color.dataSource = new MockDataSource(data);
      
      var repoPopulate = new RepoPopulate(color);

      repoPopulate.belongsToMany(data.person, {
        documentPath: 'about.*.*.trivia',
        key: 'favouriteColorIds',
        alias: 'favouriteColors'
      }).then(function(docs){
        should(docs[0].about.unknown.path.trivia.favouriteColors[0].name).eql('Red');
        should(docs[0].about.unknown.path.trivia.favouriteColors[1].name).eql('Green');
        done();
      }).catch(function(err){
        done(err);
      });
    });
  });
});
