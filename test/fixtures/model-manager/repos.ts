import Repo from '../../../lib/repo';

// repos file allows you to full in repos from other packages

var TestImportedRepo = new Repo({name: 'testImportedRepo'});

var repos = [
  TestImportedRepo
];

export default repos;
