import should = require('should');
import Repo from '../../../lib/repo';
import MockDataSource from '../../../lib/data-source/mock';

describe('update()', function(){
  it('should return type casted documents', async () => {
    var updateData = {
      $set: {
        number: '123',
        string: '543'
      }
    };

    var user = new Repo({
      name: 'user',
      schema: {
        number: {$type: Number},
        string: {$type: String},
      }
    });
    user.dataSource = new MockDataSource({});

    await user.update({}, updateData, {filterPrivate: true});
    should(user.dataSource.dataUpdate[0]['$set'].number).eql(123);
    should(user.dataSource.dataUpdate[0]['$set'].string).eql('543');
  });
  it('should filter private fields', async () => {
    var updateData = {
      $set: {
        name: 'Kevin',
        cannotInsertThisValue: '123'
      }
    };

    var user = new Repo({
      name: 'user',
      schema: {
        name: String,
        cannotInsertThisValue: {$type: String, $filter: {private: true}}
      }
    });
    user.dataSource = new MockDataSource({});

    await user.update({}, updateData, {filterPrivate: true});
    should(user.dataSource.dataUpdate[0]['$set'].name).eql('Kevin');
    should(user.dataSource.dataUpdate[0]['$set'].cannotInsertThisValue).eql(undefined);
  });
  it('should filter private "write" fields', async () => {
    var updateData = {
      $set: {
        name: 'Kevin',
        cannotInsertThisValue: '123'
      }
    };

    var user = new Repo({
      name: 'user',
      schema: {
        name: String,
        cannotInsertThisValue: {$type: String, $filter: {private: 'write'}}
      }
    });
    user.dataSource = new MockDataSource({});

    await user.update({}, updateData, {filterPrivate: true});
    should(user.dataSource.dataUpdate[0]['$set'].name).eql('Kevin');
    should(user.dataSource.dataUpdate[0]['$set'].cannotInsertThisValue).eql(undefined);
  });
  it('should not filter private "read" fields', async () => {
    var updateData = {
      $set: {
        name: 'Kevin',
        canUpdateThisValue: '123'
      }
    };

    var user = new Repo({
      name: 'user',
      schema: {
        name: String,
        canUpdateThisValue: {$type: String, $filter: {private: 'read'}}
      }
    });
    user.dataSource = new MockDataSource({});

    await user.update({}, updateData, {filterPrivate: true});
    should(user.dataSource.dataUpdate[0]['$set'].name).eql('Kevin');
    should(user.dataSource.dataUpdate[0]['$set'].canUpdateThisValue).eql('123');
  });
  it('should not filter private fields by default', async () => {
    var updateData = {
      $set: {
        name: 'Kevin',
        canUpdateThisValue: '123'
      }
    };

    var user = new Repo({
      name: 'user',
      schema: {
        name: String,
        canUpdateThisValue: {$type: String, $filter: {private: true}}
      }
    });
    user.dataSource = new MockDataSource({});

    await user.update({}, updateData);
    should(user.dataSource.dataUpdate[0]['$set'].name).eql('Kevin');
    should(user.dataSource.dataUpdate[0]['$set'].canUpdateThisValue).eql('123');
  });
});
