import should = require('should');
import RepoPopulate from '../../../lib/repo-populate';
import Repo from '../../../lib/repo';
import MockDataSource from '../../../lib/data-source/mock';

describe('embeddedHasOne()', function(){
  it('should populate', async () => {
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
    var docs = await repoPopulate.embeddedHasOne(data.docs, {
      docPath: 'user.*',
      docPathRelated: 'userTimezone.*',
      key: 'userId',
      alias: 'timezone'
    });
    
    should(docs[0].user[0].timezone.name).eql('Europe/London');
  });
  it('should populate array of docs', async () => {
    var data = {
      docs: [
        {
          userTimezone: [
            {_id: '1', userId: '9', name: 'Europe/London'}
          ],
          user: [
            {_id: '9', name: 'Kevin Foster'}
          ]
        },
        {
          userTimezone: [
            {_id: '2', userId: '29', name: 'Asia/Kuala_Lumpur'}
          ],
          user: [
            {_id: '29', name: 'Andy Jovan'}
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
    var docs = await repoPopulate.embeddedHasOne(data.docs, {
      docPath: 'user.*',
      docPathRelated: 'userTimezone.*',
      key: 'userId',
      alias: 'timezone'
    });
    
    should(docs[0].user[0].timezone.name).eql('Europe/London');
    should(docs[1].user[0].timezone.name).eql('Asia/Kuala_Lumpur');
  });
});