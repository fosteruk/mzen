var should = require('should');
var ModelManager = require('../lib/model-manager');
var Repo = require('../lib/repo');
var Service = require('../lib/service');
var Schema = require('mzen-schema');

describe('ModelManager', function () {
  describe('init()', function () {
    describe('loadDataSources()', function () {
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
    });
    describe('loadResources()', function () {
      it('should load constructors from configured model directory', function (done) {
          var modelManager = new ModelManager({modelDirs: [__dirname + '/fixtures/model-manager']});
          should(modelManager.constructors['Artist']).be.Undefined();
          should(modelManager.constructors['Album']).be.Undefined();
          modelManager.loadResources().then(function(){
            should(modelManager.constructors['Artist']).be.a.Function();
            should(modelManager.constructors['Album']).be.a.Function();
            done();
          }).catch(function(err){
            done(err);
          });
      });
      it('should load schemas from configured model directory', function (done) {
          var modelManager = new ModelManager({modelDirs: [__dirname + '/fixtures/model-manager']});
          should(modelManager.schemas['artist']).be.Undefined();
          modelManager.loadResources().then(function(){
            should(modelManager.schemas['artist']).be.a.Object();
            done();
          }).catch(function(err){
            done(err);
          });
      });
      it('should repositorys from configured model directory', function (done) {
          var modelManager = new ModelManager({modelDirs: [__dirname + '/fixtures/model-manager']});
          should(modelManager.repos['artist']).be.Undefined();
          modelManager.loadResources().then(function(){
            should(modelManager.repos['artist']).be.a.Object();
            done();
          }).catch(function(err){
            done(err);
          });
      });
      it('should services from configured model directory', function (done) {
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
    describe('initSchemas()', function () {
      it('should inject constructors into each schema', function (done) {
        var Person = function() {};
        var Post = function() {};
        var userSchema = new Schema({$name: 'user'});

        should(userSchema.constructors.Person).be.undefined();
        should(userSchema.constructors.Post).be.undefined();

        var modelManager = new ModelManager();
        modelManager.addConstructor(Person);
        modelManager.addConstructor(Post);
        modelManager.addSchema(userSchema);
        modelManager.init().then(function(){
          should(userSchema.constructors.Person).eql(Person);
          should(userSchema.constructors.Post).eql(Post);
          done();
        }).catch(function(err){
          done(err);
        });
      });
      it('should inject schemas into each schema', function (done) {
        var userSchema = new Schema({$name: 'user'});
        var orderSchema = new Schema({$name: 'order'});

        should(userSchema.schemas.user).be.undefined();
        should(userSchema.schemas.order).be.undefined();
        should(orderSchema.schemas.user).be.undefined();
        should(orderSchema.schemas.order).be.undefined();

        var modelManager = new ModelManager();
        modelManager.addSchema(userSchema);
        modelManager.addSchema(orderSchema);
        modelManager.init().then(function(){
          should(userSchema.schemas.user).eql(userSchema);
          should(userSchema.schemas.order).eql(orderSchema);
          should(orderSchema.schemas.user).eql(userSchema);
          should(orderSchema.schemas.order).eql(orderSchema);
          done();
        }).catch(function(err){
          done(err);
        });
      });
      it('should inject loaded constructors into schemas', function (done) {
        var modelManager = new ModelManager({modelDirs: [__dirname + '/fixtures/model-manager']});
        should(modelManager.schemas['artist']).be.Undefined();
        modelManager.init().then(function(){
          should(Object.keys(modelManager.schemas['artist'].constructors).length).eql(2);
          should(modelManager.schemas['artist'].constructors['artist']).eql(modelManager.constructors['artist']);
          should(modelManager.schemas['artist'].constructors['album']).eql(modelManager.constructors['album']);
          done();
        }).catch(function(err){
          done(err);
        });
      });
      it('should inject loaded schemas into schemas', function (done) {
        var modelManager = new ModelManager({modelDirs: [__dirname + '/fixtures/model-manager']});
        should(modelManager.schemas['artist']).be.Undefined();
        should(modelManager.schemas['album']).be.Undefined();
        modelManager.init().then(function(){
          should(modelManager.schemas['artist'].schemas['artist']).eql(modelManager.schemas['artist']);
          should(modelManager.schemas['artist'].schemas['album']).eql(modelManager.schemas['album']);
          done();
        }).catch(function(err){
          done(err);
        });
      });
    });
    describe('initRepos()', function () {
      it('should inject constructors into each repo', function (done) {
        var Order = function() {};
        var Post = function() {};
        var userRepo = new Repo({name: 'user'});

        should(userRepo.constructors.Order).be.undefined();
        should(userRepo.constructors.Post).be.undefined();

        var modelManager = new ModelManager();
        modelManager.addConstructor(Order);
        modelManager.addConstructor(Post);
        modelManager.addRepo(userRepo);
        modelManager.init().then(function(){
          should(userRepo.constructors.Order).eql(Order);
          should(userRepo.constructors.Post).eql(Post);
          done();
        }).catch(function(err){
          done(err);
        });
      });
      it('should inject schemas into each repo', function (done) {
        var userSchema = new Schema({$name: 'user'});
        var orderSchema = new Schema({$name: 'order'});
        var userRepo = new Repo({name: 'user'});

        should(userRepo.schemas.user).be.undefined();
        should(userRepo.schemas.order).be.undefined();

        var modelManager = new ModelManager();
        modelManager.addSchema(userSchema);
        modelManager.addSchema(orderSchema);
        modelManager.addRepo(userRepo);
        modelManager.init().then(function(){
          should(userRepo.schemas.user).eql(userSchema);
          should(userRepo.schemas.order).eql(orderSchema);
          done();
        }).catch(function(err){
          done(err);
        });
      });
      it('should inject repos into each repo', function (done) {
        var userRepo = new Repo({name: 'user'});
        var orderRepo = new Repo({name: 'order'});

        should(userRepo.repos.user).be.undefined();
        should(userRepo.repos.order).be.undefined();

        var modelManager = new ModelManager();
        modelManager.addRepo(userRepo);
        modelManager.addRepo(orderRepo);
        modelManager.init().then(function(){
          should(userRepo.repos.user).eql(userRepo);
          should(userRepo.repos.order).eql(orderRepo);
          done();
        }).catch(function(err){
          done(err);
        });
      });
      it('should inject services into each repo', function (done) {
        var orderService = new Service({name: 'order'});
        var signupService = new Service({name: 'signup'});
        var userRepo = new Repo({name: 'user'});

        should(userRepo.services.order).be.undefined();
        should(userRepo.services.signup).be.undefined();

        var modelManager = new ModelManager();
        modelManager.addService(orderService);
        modelManager.addService(signupService);
        modelManager.addRepo(userRepo);
        modelManager.init().then(function(){
          should(userRepo.services.order).eql(orderService);
          should(userRepo.services.signup).eql(signupService);
          done();
        }).catch(function(err){
          done(err);
        });
      });
      it('should inject loaded constructors into repo', function (done) {
        var modelManager = new ModelManager({modelDirs: [__dirname + '/fixtures/model-manager']});
        should(modelManager.repos['artist']).be.Undefined();
        modelManager.init().then(function(){
          should(Object.keys(modelManager.repos['artist'].constructors).length).eql(2);
          done();
        }).catch(function(err){
          done(err);
        });
      });
      it('should inject loaded schemas into repo', function (done) {
        var modelManager = new ModelManager({modelDirs: [__dirname + '/fixtures/model-manager']});
        should(modelManager.repos['artist']).be.Undefined();
        should(modelManager.repos['album']).be.Undefined();
        modelManager.init().then(function(){
          should(modelManager.repos['artist'].schemas['artist']).eql(modelManager.schemas['artist']);
          should(modelManager.repos['artist'].schemas['album']).eql(modelManager.schemas['album']);
          done();
        }).catch(function(err){
          done(err);
        });
      });
      it('should inject loaded repos into each repo', function (done) {
        var modelManager = new ModelManager({modelDirs: [__dirname + '/fixtures/model-manager']});
        should(modelManager.repos['artist']).be.Undefined();
        should(modelManager.repos['album']).be.Undefined();
        modelManager.init().then(function(){
          should(modelManager.repos['artist'].repos['album']).eql(modelManager.repos['album']);
          done();
        }).catch(function(err){
          done(err);
        });
      });
      it('should inject loaded services into each repo', function (done) {
        var modelManager = new ModelManager({modelDirs: [__dirname + '/fixtures/model-manager']});
        should(modelManager.repos['artist']).be.Undefined();
        should(modelManager.services['artistSignup']).be.Undefined();
        modelManager.init().then(function(){
          should(modelManager.repos['artist'].services['artistSignup']).eql(modelManager.services['artistSignup']);
          done();
        }).catch(function(err){
          done(err);
        });
      });
    });
    describe('initServices()', function () {
      it('should inject repos into each service', function (done) {
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
      it('should inject services into each service', function (done) {
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
      it('should inject loaded repos into each service', function (done) {
        var modelManager = new ModelManager({modelDirs: [__dirname + '/fixtures/model-manager']});
        should(modelManager.repos['artist']).be.Undefined();
        should(modelManager.services['artistSignup']).be.Undefined();
        modelManager.init().then(function(){
          should(modelManager.services['artistSignup'].repos['artist']).eql(modelManager.repos['artist']);
          done();
        }).catch(function(err){
          done(err);
        });
      });
      it('should inject loaded services into each service', function (done) {
        var modelManager = new ModelManager({modelDirs: [__dirname + '/fixtures/model-manager']});
        should(modelManager.services['artistSignup']).be.Undefined();
        modelManager.init().then(function(){
          should(modelManager.services['artistSignup'].services['artistSignup']).eql(modelManager.services['artistSignup']);
          done();
        }).catch(function(err){
          done(err);
        });
      });
    });
  });
});
