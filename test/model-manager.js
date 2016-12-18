var should = require('should');
var ModelManager = require('../lib/model-manager');
var Repo = require('../lib/repo');
var Service = require('../lib/service');

describe('ModelManager', function () {
  describe('loadResources()', function () {
    it('should load named entity constructors from configured model directory', function (done) {
        var modelManager = new ModelManager({modelDirs: [__dirname + '/fixtures/model-manager']});
        should(modelManager.entityConstructors['Artist']).be.Undefined();
        should(modelManager.entityConstructors['Album']).be.Undefined();
        modelManager.loadResources().then(function(){
            should(modelManager.entityConstructors['Artist']).be.a.Function();
            should(modelManager.entityConstructors['Album']).be.a.Function();
            done();
        }).catch(function(err){
          done(err);
        });
    });
    it('should inject named constructors into repo config', function (done) {
        var modelManager = new ModelManager({modelDirs: [__dirname + '/fixtures/model-manager']});
        should(modelManager.repos['artist']).be.Undefined();
        modelManager.loadResources().then(function(){
            should(modelManager.repos['artist'].config.entityConstructor).be.a.Function();
            should(modelManager.repos['artist'].config.embeddedConstructors['bestSellingAlbums.*']).be.a.Function();
            done();
        }).catch(function(err){
          done(err);
        });
    });
    it('should load repository instances from configured model directory', function (done) {
        var modelManager = new ModelManager({modelDirs: [__dirname + '/fixtures/model-manager']});
        should(modelManager.repos['artist']).be.Undefined();
        modelManager.loadResources().then(function(){
            should(modelManager.repos['artist']).be.a.Object();
            done();
        }).catch(function(err){
          done(err);
        });
    });
    it('should load service instances from configured model directory', function (done) {
        var modelManager = new ModelManager({modelDirs: [__dirname + '/fixtures/model-manager']});
        should(modelManager.services['artistSignup']).be.Undefined();
        modelManager.loadResources().then(function(){
          should(modelManager.services['artistSignup']).be.a.Object();
          done();
      }).catch(function(err){
        done(err);
      });
    });
  });
  describe('init()', function () {
    it('should inject named datasource into each repo', function (done) {
      var person = new Repo({name: 'person', dataSource: 'db'});
      should(person.dataSource).be.null();

      var modelManager = new ModelManager();
      var dataSource = {test: 1};
      modelManager.dataSources = {db: dataSource};
      modelManager.addRepo(person);
      modelManager.init().then(function(){
        should(person.dataSource).eql(dataSource);
        done();
      }).catch(function(err){
        done(err);
      });
    });
    it('should inject repos hash into each repo', function (done) {
      var person = new Repo({name: 'person'});
      var post = new Repo({name: 'post'});
      should(person.repos.person).be.undefined();
      should(person.repos.post).be.undefined();
      should(post.repos.person).be.undefined();
      should(post.repos.post).be.undefined();

      var modelManager = new ModelManager();
      modelManager.addRepo(person);
      modelManager.addRepo(post);
      modelManager.init().then(function(){
        should(person.repos.person).eql(person);
        should(person.repos.post).eql(post);
        should(post.repos.person).eql(person);
        should(post.repos.post).eql(post);
        done();
      }).catch(function(err){
        done(err);
      });
    });
    it('should inject repos hash into each service', function (done) {
      var person = new Repo({name: 'person'});
      var post = new Repo({name: 'post'});
      var checkoutService = new Service({name: 'checkout'});

      should(checkoutService.repos.person).be.undefined();
      should(checkoutService.repos.post).be.undefined();

      var modelManager = new ModelManager();
      modelManager.addRepo(person);
      modelManager.addRepo(post);
      modelManager.addService(checkoutService);
      modelManager.init().then(function(){
        should(checkoutService.repos.person).eql(person);
        should(checkoutService.repos.post).eql(post);
        done();
      }).catch(function(err){
        done(err);
      });
    });
    it('should inject services hash into each service', function (done) {
      var checkoutService = new Service({name: 'checkout'});
      var refundService = new Service({name: 'refund'});

      should(checkoutService.services.checkout).be.undefined();
      should(checkoutService.services.refund).be.undefined();
      should(refundService.services.checkout).be.undefined();
      should(refundService.services.refund).be.undefined();

      var modelManager = new ModelManager();
      modelManager.addService(checkoutService);
      modelManager.addService(refundService);
      modelManager.init().then(function(){
        should(checkoutService.services.checkout).eql(checkoutService);
        should(checkoutService.services.refund).eql(refundService);
        should(refundService.services.checkout).eql(checkoutService);
        should(refundService.services.refund).eql(refundService);
        done();
      }).catch(function(err){
        done(err);
      });
    });
  });
});
