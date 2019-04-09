import should = require('should');
import Repo from '../../../lib/repo';
import MockDataSource from '../../../lib/data-source/mock';


describe('find()', function(){
  it('should find queried data', async () => {
    var data = {
      user: [
        {_id: '1', name: 'Kevin Foster'},
        {_id: '1', name: 'Tom Murphy'}
      ]
    };

    var user = new Repo({
      name: 'user'
    });
    user.dataSource = new MockDataSource(data);

    var docs = await user.find();
    should(docs[0].name).eql('Kevin Foster');
    should(docs[1].name).eql('Tom Murphy');
  });
  it('should filter field fields via filterPrivateFields option', async () => {
    var data = {
      user: [
        {_id: '1', name: 'Alison', password: 'Abc'},
        {_id: '2', name: 'Gina', password: '123'},
      ]
    };
    var dataSource = new MockDataSource(data);

    var repo = new Repo({
      name: 'user',
      schema: {password: {$type: String, $filter: {private: true}}}
    });
    repo.dataSource = dataSource;

    var docs = await repo.find({}, {filterPrivate: true});
    should(docs[0].name).eql('Alison');
    should(docs[0].password).eql(undefined);
    should(docs[1].name).eql('Gina');
    should(docs[1].password).eql(undefined);
  });
  it('should not filter fields by default', async () => {
    var data = {
      user: [
        {_id: '1', name: 'Alison', password: 'Abc'}
      ]
    };
    var dataSource = new MockDataSource(data);

    var repo = new Repo({
      name: 'user',
      schema: {password: {$type: String, $filter: {private: true}}}
    });
    repo.dataSource = dataSource;

    var docs = await repo.find();
    should(docs[0].name).eql('Alison');
    should(docs[0].password).eql('Abc');
  });
  
  require('./repo-find/find-contructor');
  require('./repo-find/find-relation');
});