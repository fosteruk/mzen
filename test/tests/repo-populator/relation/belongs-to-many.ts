import should = require('should');
import { RelationBelongsToMany } from '../../../../lib/repo-populator/relation/belongs-to-many';
import Repo from '../../../../lib/repo';
import MockDataSource from '../../../../lib/data-source/mock';

describe('RelationBelongsToMany', function(){
  it('should populate', async () => {
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

    var repoPopulator = new RelationBelongsToMany;
    var docs = await repoPopulator.populate(color, {
      key: 'favouriteColorIds',
      alias: 'favouriteColors'
    }, data.person);

    should(docs[0].favouriteColors[0].name).eql('Red');
    should(docs[0].favouriteColors[1].name).eql('Green');
  });
  it('should populate embeded', async () => {
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

    var repoPopulator = new RelationBelongsToMany;
    var docs = await repoPopulator.populate(color, {
      docPath: 'about.trivia',
      key: 'favouriteColorIds',
      alias: 'favouriteColors'
    }, data.person);
    
    should(docs[0].about.trivia.favouriteColors[0].name).eql('Red');
    should(docs[0].about.trivia.favouriteColors[1].name).eql('Green');
  });
  it('should populate embeded array', async () => {
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
    
    var repoPopulator = new RelationBelongsToMany;
    var docs = await repoPopulator.populate(color, {
      docPath: 'about.trivia.*',
      key: 'favouriteColorIds',
      alias: 'favouriteColors'
    }, data.person);

    should(docs[0].about.trivia[0].favouriteColors[0].name).eql('Red');
    should(docs[0].about.trivia[0].favouriteColors[1].name).eql('Green');
    should(docs[0].about.trivia[1].favouriteColors[0].name).eql('Orange');
    should(docs[0].about.trivia[1].favouriteColors[1].name).eql('Blue');
  });
  it('should populate embeded wildcard path', async () => {
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
    
    var repoPopulator = new RelationBelongsToMany;
    var docs = await repoPopulator.populate(color, {
      docPath: 'about.*.*.trivia',
      key: 'favouriteColorIds',
      alias: 'favouriteColors'
    }, data.person);
    
    should(docs[0].about.unknown.path.trivia.favouriteColors[0].name).eql('Red');
    should(docs[0].about.unknown.path.trivia.favouriteColors[1].name).eql('Green');
  });
});