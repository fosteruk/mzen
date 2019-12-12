
import should = require('should');
import { RepoPopulator } from '../../lib/repo-populator';
import Repo from '../../lib/repo';
import MockDataSource from '../../lib/data-source/mock';

describe('RepoPopulator', function(){
  require('./repo-populator/relation/belongs-to-many');
  require('./repo-populator/relation/belongs-to-one');
  require('./repo-populator/relation/embedded-belongs-to-many');
  require('./repo-populator/relation/embedded-belongs-to-one');
  require('./repo-populator/relation/embedded-has-many');
  require('./repo-populator/relation/embedded-has-one');
  require('./repo-populator/relation/has-many');
  require('./repo-populator/relation/has-one');

  it('should populate multiple doc paths with the same alias', async () => {
    const data = {
      business: [
        {_id: '1', name: 'Google'},
        {_id: '2', name: 'Amazon'},
        {_id: '3', name: 'Microsoft'},
        {_id: '4', name: 'DigitalOcean'},
      ],
      user: [
        {
          _id: '1', 
          name: 'Kevin Foster', 
          businessCustomer: [
            {businessId: '1'},
            {businessId: '2'},
          ],
          businessSupplier: [
            {businessId: '3'},
            {businessId: '4'},
          ]
        }
      ]
    };

    const dataSource = new MockDataSource(data);
    const user = new Repo({
      name: 'user',
      relations: {
        businessCustomer: {
            alias: 'business',
            docPath: 'businessCustomer.*',
            type: 'belongsToOne',
            repo: 'business',
            key: 'businessId',
            autoPopulate: true,
            recursion: 1
        },
        businessSupplier: {
            alias: 'business',
            docPath: 'businessSupplier.*',
            type: 'belongsToOne',
            repo: 'business',
            key: 'businessId',
            autoPopulate: true,
            recursion: 1
        }
      }
    });
    user.dataSource = dataSource;
    
    const business = new Repo({
      name: 'business'
    });
    business.dataSource = dataSource;
    user.repos.business = business;

    const repoPopulator = new RepoPopulator();
    const docs = await repoPopulator.populateAll(user, data.user);
  
    should(docs[0].businessCustomer[0].business.name).eql('Google');
    should(docs[0].businessSupplier[0].business.name).eql('Microsoft');
  });

});


