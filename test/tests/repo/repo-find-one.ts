import should = require('should');
import Repo from '../../../lib/repo';
import MockDataSource from '../../../lib/data-source/mock';

describe('findOne()', function(){
  it('should find queried data', async () => {
    var data = {
      user: [
        {_id: '1', name: 'Kevin Foster'}
      ]
    };

    var user = new Repo({
      name: 'user'
    });
    user.dataSource = new MockDataSource(data);

    var doc = await user.findOne();
    should(doc.name).eql('Kevin Foster');
  });
  it('should filter private fields via filterPrivate option', async () => {
    var data = {
      user: [
        {_id: '1', name: 'Alison', password: 'Abc'},
        {_id: '2', name: 'Gina', password: '123'},
      ]
    };
    var dataSource = new MockDataSource(data);

    var repo = new Repo({
      name: 'user',
      schema: {
        password: {
          $type: String,
          $filter: {private: true}
        }
      }
    });
    repo.dataSource = dataSource;

    var doc = await repo.findOne({}, {filterPrivate: true});
    should(doc.name).eql('Alison');
    should(doc.password).eql(undefined);
  });
  it('should not filter private fields byt default', async () => {
    var data = {
      user: [
        {_id: '1', name: 'Alison', password: 'Abc'}
      ]
    };
    var dataSource = new MockDataSource(data);

    var repo = new Repo({
      name: 'user',
      schema: {
        password: {
          $type: String,
          $filter: {private: true}
        }
      }
    });
    repo.dataSource = dataSource;

    var doc = await repo.findOne();
    should(doc.name).eql('Alison');
    should(doc.password).eql('Abc');
  });

  require('./repo-find-one/find-one-constructor');
  require('./repo-find-one/find-one-relation');
});
