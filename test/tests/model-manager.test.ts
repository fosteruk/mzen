import should = require('should');
import ModelManager from '../../lib/model-manager';
import Repo from '../../lib/repo';
import Service from '../../lib/service';
import Schema from 'mzen-schema';

describe('ModelManager', function(){
  describe('init()', function(){
    describe('loadDataSources()', function(){
      it('should inject named datasource into each repo', async () => {
        var person = new Repo({name: 'person', dataSource: 'db'});
        should(person.dataSource).be.null();

        var modelManager = new ModelManager();
        var dataSource = {test: 1};
        modelManager.dataSources = {db: dataSource};
        modelManager.addRepo(person);
        await modelManager.init();

        should(person.dataSource).eql(dataSource);
      });
    });
    describe('loadResources()', function(){
      it('should load constructors from constructor directory of configured model directory', async () => {
        var modelManager = new ModelManager({modelDirs: [__dirname + '/../fixtures/model-manager']});
        should(modelManager.constructors.Artist).be.Undefined();
        should(modelManager.constructors.Album).be.Undefined();
        await modelManager.loadResources();
        should(modelManager.constructors.Artist).be.a.Function();
        should(modelManager.constructors.Album).be.a.Function();
      });
      it('should load constructors from constructors file of configured model directory', async () => {
        var modelManager = new ModelManager({modelDirs: [__dirname + '/../fixtures/model-manager']});
        should(modelManager.constructors.TestImportedConstructor).be.Undefined();
        await modelManager.loadResources();

        should(modelManager.constructors.TestImportedConstructor).be.a.Function();
      });
      it('should load schemas from schema directory of configured model directory', async () => {
        var modelManager = new ModelManager({modelDirs: [__dirname + '/../fixtures/model-manager']});
        should(modelManager.schemas.artist).be.Undefined();
        await modelManager.loadResources();
        should(modelManager.schemas.artist).be.a.Object();
      });
      it('should load schemas from schemas file of configured model directory', async () => {
        var modelManager = new ModelManager({modelDirs: [__dirname + '/../fixtures/model-manager']});
        should(modelManager.schemas.testImportedSchema).be.Undefined();
        await modelManager.loadResources();
        should(modelManager.schemas.testImportedSchema).be.a.Object();
      });
      it('should load repositorys from repo directory of configured model directory', async () => {
        var modelManager = new ModelManager({modelDirs: [__dirname + '/../fixtures/model-manager']});
        should(modelManager.repos.artist).be.Undefined();
        await modelManager.loadResources();
        should(modelManager.repos.artist).be.a.Object();
      });
      it('should load repos from schemas file of configured configured model directory', async () => {
        var modelManager = new ModelManager({modelDirs: [__dirname + '/../fixtures/model-manager']});
        should(modelManager.repos.testImportedRepo).be.Undefined();
        await modelManager.loadResources();
        should(modelManager.repos.testImportedRepo).be.a.Object();
      });
      it('should services from service directory of configured model directory', async () => {
        var modelManager = new ModelManager({modelDirs: [__dirname + '/../fixtures/model-manager']});
        should(modelManager.services.artistSignup).be.Undefined();
        await modelManager.loadResources();
        should(modelManager.services.artistSignup).be.a.Object();
      });
      it('should load service from services file of configured configured model directory', async () => {
        var modelManager = new ModelManager({modelDirs: [__dirname + '/../fixtures/model-manager']});
        should(modelManager.services.testImportedService).be.Undefined();
        await modelManager.loadResources();
        should(modelManager.services.testImportedService).be.a.Object();
      });
    });
    describe('initSchemas()', function(){
      it('should inject constructors into each schema', async () => {
        var Person = function() {};
        var Post = function() {};
        var userSchema = new Schema({$name: 'user'});

        should(userSchema.constructors.Person).be.undefined();
        should(userSchema.constructors.Post).be.undefined();

        var modelManager = new ModelManager();
        modelManager.addConstructor(Person);
        modelManager.addConstructor(Post);
        modelManager.addSchema(userSchema);
        await modelManager.init();

        should(userSchema.constructors.Person).eql(Person);
        should(userSchema.constructors.Post).eql(Post);
      });
      it('should inject schemas into each schema', async () => {
        var userSchema = new Schema({$name: 'user'});
        var orderSchema = new Schema({$name: 'order'});

        should(userSchema.schemas.user).be.undefined();
        should(userSchema.schemas.order).be.undefined();
        should(orderSchema.schemas.user).be.undefined();
        should(orderSchema.schemas.order).be.undefined();

        var modelManager = new ModelManager();
        modelManager.addSchema(userSchema);
        modelManager.addSchema(orderSchema);
        await modelManager.init();

        should(userSchema.schemas.user).eql(userSchema);
        should(userSchema.schemas.order).eql(orderSchema);
        should(orderSchema.schemas.user).eql(userSchema);
        should(orderSchema.schemas.order).eql(orderSchema);
      });
      it('should inject loaded constructors into schemas', async () => {
        var modelManager = new ModelManager({modelDirs: [__dirname + '/../fixtures/model-manager']});
        should(modelManager.schemas.artist).be.Undefined();
        await modelManager.init();

        should(modelManager.schemas.artist.constructors.Artist).eql(modelManager.constructors.Artist);
        should(modelManager.schemas.artist.constructors.Album).eql(modelManager.constructors.Album);
      });
      it('should inject loaded schemas into schemas', async () => {
        var modelManager = new ModelManager({modelDirs: [__dirname + '/../fixtures/model-manager']});
        should(modelManager.schemas.artist).be.Undefined();
        should(modelManager.schemas.album).be.Undefined();
        await modelManager.init();

        should(modelManager.schemas.artist.schemas.artist).eql(modelManager.schemas.artist);
        should(modelManager.schemas.artist.schemas.album).eql(modelManager.schemas.album);
      });
    });
    describe('initRepos()', function(){
      it('should inject constructors into each repo', async () => {
        var Order = function() {};
        var Post = function() {};
        var userRepo = new Repo({name: 'user'});

        should(userRepo.constructors.Order).be.undefined();
        should(userRepo.constructors.Post).be.undefined();

        var modelManager = new ModelManager();
        modelManager.addConstructor(Order);
        modelManager.addConstructor(Post);
        modelManager.addRepo(userRepo);
        await modelManager.init();

        should(userRepo.constructors.Order).eql(Order);
        should(userRepo.constructors.Post).eql(Post);
      });
      it('should inject schemas into each repo', async () => {
        var userSchema = new Schema({$name: 'user'});
        var orderSchema = new Schema({$name: 'order'});
        var userRepo = new Repo({name: 'user'});

        should(userRepo.schemas.user).be.undefined();
        should(userRepo.schemas.order).be.undefined();

        var modelManager = new ModelManager();
        modelManager.addSchema(userSchema);
        modelManager.addSchema(orderSchema);
        modelManager.addRepo(userRepo);
        await modelManager.init();

        should(userRepo.schemas.user).eql(userSchema);
        should(userRepo.schemas.order).eql(orderSchema);
      });
      it('should inject repos into each repo', async () => {
        var userRepo = new Repo({name: 'user'});
        var orderRepo = new Repo({name: 'order'});

        should(userRepo.repos.user).be.undefined();
        should(userRepo.repos.order).be.undefined();

        var modelManager = new ModelManager();
        modelManager.addRepo(userRepo);
        modelManager.addRepo(orderRepo);
        await modelManager.init();

        should(userRepo.repos.user).eql(userRepo);
        should(userRepo.repos.order).eql(orderRepo);
      });
      it('should inject services into each repo', async () => {
        var orderService = new Service({name: 'order'});
        var signupService = new Service({name: 'signup'});
        var userRepo = new Repo({name: 'user'});

        should(userRepo.services.order).be.undefined();
        should(userRepo.services.signup).be.undefined();

        var modelManager = new ModelManager();
        modelManager.addService(orderService);
        modelManager.addService(signupService);
        modelManager.addRepo(userRepo);
        await modelManager.init();

        should(userRepo.services.order).eql(orderService);
        should(userRepo.services.signup).eql(signupService);
      });
      it('should inject loaded constructors into repo', async () => {
        var modelManager = new ModelManager({modelDirs: [__dirname + '/../fixtures/model-manager']});
        should(modelManager.repos.artist).be.Undefined();
        await modelManager.init();

        should(modelManager.repos.artist.constructors.Album.name).eql('Album');
        should(modelManager.repos.artist.constructors.Artist.name).eql('Artist');
      });
      it('should inject loaded schemas into repo', async () => {
        var modelManager = new ModelManager({modelDirs: [__dirname + '/../fixtures/model-manager']});
        should(modelManager.repos.artist).be.Undefined();
        should(modelManager.repos.album).be.Undefined();
        await modelManager.init();

        should(modelManager.repos.artist.schemas.artist).eql(modelManager.schemas.artist);
        should(modelManager.repos.artist.schemas.album).eql(modelManager.schemas.album);
      });
      it('should inject loaded repos into each repo', async () => {
        var modelManager = new ModelManager({modelDirs: [__dirname + '/../fixtures/model-manager']});
        should(modelManager.repos.artist).be.Undefined();
        should(modelManager.repos.album).be.Undefined();
        await modelManager.init();
        
        should(modelManager.repos.artist.repos.album).eql(modelManager.repos.album);
      });
      it('should inject loaded services into each repo', async () => {
        var modelManager = new ModelManager({modelDirs: [__dirname + '/../fixtures/model-manager']});
        should(modelManager.repos.artist).be.Undefined();
        should(modelManager.services.artistSignup).be.Undefined();
        await modelManager.init();
        
        should(modelManager.repos.artist.services.artistSignup).eql(modelManager.services.artistSignup);
      });
    });
    describe('initServices()', function(){
      it('should inject repos into each service', async () => {
        var person = new Repo({name: 'person'});
        var post = new Repo({name: 'post'});
        var checkoutService = new Service({name: 'checkout'});

        should(checkoutService.repos.person).be.undefined();
        should(checkoutService.repos.post).be.undefined();

        var modelManager = new ModelManager();
        modelManager.addRepo(person);
        modelManager.addRepo(post);
        modelManager.addService(checkoutService);
        await modelManager.init();

        should(checkoutService.repos.person).eql(person);
        should(checkoutService.repos.post).eql(post);
      });
      it('should inject services into each service', async () => {
        var checkoutService = new Service({name: 'checkout'});
        var refundService = new Service({name: 'refund'});

        should(checkoutService.services.checkout).be.undefined();
        should(checkoutService.services.refund).be.undefined();
        should(refundService.services.checkout).be.undefined();
        should(refundService.services.refund).be.undefined();

        var modelManager = new ModelManager();
        modelManager.addService(checkoutService);
        modelManager.addService(refundService);
        await modelManager.init();

        should(checkoutService.services.checkout).eql(checkoutService);
        should(checkoutService.services.refund).eql(refundService);
        should(refundService.services.checkout).eql(checkoutService);
        should(refundService.services.refund).eql(refundService);
      });
      it('should inject loaded repos into each service', async () => {
        var modelManager = new ModelManager({modelDirs: [__dirname + '/../fixtures/model-manager']});
        should(modelManager.repos.artist).be.Undefined();
        should(modelManager.services.artistSignup).be.Undefined();
        await modelManager.init();

        should(modelManager.services.artistSignup.repos.artist).eql(modelManager.repos.artist);
      });
      it('should inject loaded services into each service', async () => {
        var modelManager = new ModelManager({modelDirs: [__dirname + '/../fixtures/model-manager']});
        should(modelManager.services.artistSignup).be.Undefined();
        await modelManager.init();
        
        should(modelManager.services.artistSignup.services.artistSignup).eql(modelManager.services.artistSignup);
      });
    });
  });
});
