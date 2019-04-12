import should = require('should');
import { RelationHasOne } from '../../../lib/repo-populator/relation-has-one';
import Repo from '../../../lib/repo';
import MockDataSource from '../../../lib/data-source/mock';

describe('hasOne()', function () {
  it('should populate', async () => {
    var data = {
      userTimezone: [
        {_id: '1', userId: '9', name: 'Europe/London'}
      ],
      user: [
        {_id: '9', name: 'Kevin Foster'}
      ]
    };

    var userTimezone = new Repo({
      name: 'userTimezone'
    });
    userTimezone.dataSource = new MockDataSource(data);

    var repoPopulator = new RelationHasOne;
    var docs = await repoPopulator.populate(userTimezone, {
      key: 'userId',
      alias: 'timezone'
    }, data.user);

    should(docs[0].timezone.name).eql('Europe/London');
  });
  it('should populate embedded', async () => {
    var data = {
      forum: [
        {_id: 'ref12380', detail: {topPoster:
            {_id: '9', name: 'Kevin Foster'}
        }}
      ],
      userTimezone: [
        {_id: '5', userId: '9', name: 'Europe/London'}
      ],
    };

    var userTimezone = new Repo({
      name: 'userTimezone'
    });
    userTimezone.dataSource = new MockDataSource(data);

    var repoPopulator = new RelationHasOne;
    var docs = await repoPopulator.populate(userTimezone, {
      docPath: 'detail.topPoster',
      key: 'userId',
      alias: 'timezone'
    }, data.forum);

    should(docs[0].detail.topPoster.timezone.name).eql('Europe/London');
  });
  it('should populate embedded array', async () => {
    var data = {
      forum: [
        {_id: 'ref12380', detail: {topPosters: [
            {_id: '9', name: 'Kevin Foster'},
            {_id: '12', name: 'Tom Murphy'},
        ]}}
      ],
      userTimezone: [
        {_id: '5', userId: '9', name: 'Europe/London'},
        {_id: '6', userId: '12', name: 'America/Toronto'},
      ],
    };

    var userTimezone = new Repo({
      name: 'userTimezone'
    });
    userTimezone.dataSource = new MockDataSource(data);

    var repoPopulator = new RelationHasOne;
    var docs = await repoPopulator.populate(userTimezone, {
      docPath: 'detail.topPosters.*',
      key: 'userId',
      alias: 'timezone'
    }, data.forum);
    
    should(docs[0].detail.topPosters[0].timezone.name).eql('Europe/London');
    should(docs[0].detail.topPosters[1].timezone.name).eql('America/Toronto');
  });
  it('should populate embedded wildcard path', async () => {
    var data = {
      forum: [
        {some: {unknown: {path: {_id: 'ref12380', detail: {topPoster:
            {_id: '9', name: 'Kevin Foster'}
        }}}}}
      ],
      userTimezone: [
        {_id: '5', userId: '9', name: 'Europe/London'}
      ],
    };

    var userTimezone = new Repo({
      name: 'userTimezone'
    });
    userTimezone.dataSource = new MockDataSource(data);

    var repoPopulator = new RelationHasOne;
    var docs = await repoPopulator.populate(userTimezone, {
      docPath: '*.*.*.detail.topPoster',
      key: 'userId',
      alias: 'timezone'
    }, data.forum);

    should(docs[0].some.unknown.path.detail.topPoster.timezone.name).eql('Europe/London');
  });
});
