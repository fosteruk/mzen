'use strict'
var should = require('should');
var Service = require('../lib/service');
var Repo = require('../lib/repo');
var MockDataSource = require('../lib/data-source/mock');

/*
describe('Service', function () {
  describe('getName()', function () {
    it('should return configured name', function () {
      var checkoutService = new Service({name: 'CheckoutService'});
      should(checkoutService.getName()).eql('CheckoutService');
    });
    it('should return constructor name if name not configured', function () {
      class CheckoutService extends Service {};
      var checkoutService = new CheckoutService();
      should(checkoutService.getName()).eql('CheckoutService');
      
      class NewCheckoutService extends CheckoutService {};
      var newCheckoutService = new NewCheckoutService();
      should(newCheckoutService.getName()).eql('NewCheckoutService');
    });
    it('should throw an exception if service name is not configured when using the default constructor', function() {
      var aService = new Service();
      (function(){
        aService.getName()
      }).should.throw(/Service name not configured/);
    });
  });
  describe('execute()', function () {
    it('should execute action with given name', function (done) {
      class CheckoutService extends Service {
        selectShippingMethodAct(request)
        {
          return 'success';
        }
      };
      var checkoutService = new CheckoutService();
      checkoutService.execute('selectShippingMethod').then(function(result){
        should(result).eql('success');
        done()
      }).catch(function(err){
        done(err);
      });
    });
    it('should pass request argument to executed method', function (done) {
      class CheckoutService extends Service {
        returnOptsAct(request)
        {
          return request;
        }
      };
      var checkoutService = new CheckoutService();
      checkoutService.execute('returnOpts', {x: 765}).then(function(result){
        should(result).eql({x: 765});
        done()
      }).catch(function(err){
        done(err);
      });
    });
    it('should typecast according to request schema', function (done) {
      class PeopleService extends Service {
        addAct(request)
        {
          return this.prepRequest(request, 'add').then(function(request){
            return request; 
          });
        }
      };
      
      var config = {
        action: {
          add: {
            schema: {
              _id: {$type: Number},
              name: {$type: String},
              age: {$type: Number},
            }
          }
        }
      };
      var peopleService = new PeopleService(config);
      
      peopleService.execute('add', {_id: '3', name: 'Kevin Foster', age: '35'}).then(function(result){
        should(result['_id']).eql(3);
        should(result['_id'].constructor).eql(Number);
        should(result['age']).eql(35);
        should(result['age'].constructor).eql(Number);
        done()
      }).catch(function(err){
        done(err);
      });
    });
    it('should typecast according to request schema array', function (done) {
      class PeopleService extends Service {
        addAct(request)
        {
          return this.prepRequest(request, 'add').then(function(request){
            return request; 
          });
        }
      };
      
      var config = {
        action: {
          add: {
            schema: {
              people: [
                {_id: {$type: Number}, name: {$type: String}, age: {$type: Number}}
              ]
            }
          }
        }
      };
      var peopleService = new PeopleService(config);
      
      var requestData =  {
        people: [
          {_id: '3', name: 'Kevin Foster', 'age': '35'},
          {_id: '4', name: 'Andy Tan', 'age': '27'}
        ]
      };
      
      peopleService.execute('add', requestData).then(function(result){
        should(result.people[0]['_id']).eql(3);
        should(result.people[0]['_id'].constructor).eql(Number);
        should(result.people[0]['age']).eql(35);
        should(result.people[0]['age'].constructor).eql(Number);
        done()
      }).catch(function(err){
        done(err);
      });
    });
    it('should typecast according to referenced repo schema', function (done) {
      var repoConfig = {
        name: 'people',
        schema: {_id: {$type: Number}, name: {$type: String}, age: {$type: Number}}
      };
      var personRepo = new Repo(repoConfig);
      
      class PeopleService extends Service {
        addAct(request)
        {
          return this.prepRequest(request, 'add').then(function(request){
            return request; 
          });
        }
      };
      
      var config = {
        action: {
          add: {
            schema: {$repo: 'people'}
          }
        }
      };
      var peopleService = new PeopleService(config);
      peopleService.repos['people'] = personRepo;
      peopleService.init(); // Copies repo schema to service schema
      
      peopleService.execute('add', {_id: '3', name: 'Kevin Foster', age: '35'}).then(function(result){
        should(result['_id']).eql(3);
        should(result['_id'].constructor).eql(Number);
        should(result['age']).eql(35);
        should(result['age'].constructor).eql(Number);
        done()
      }).catch(function(err){
        done(err);
      });
    });
    it('should typecast according to referenced repo schema path', function (done) {
      var repoConfig = {
        name: 'people',
        schema: {
          father: {_id: {$type: Number}, name: {$type: String}, age: {$type: Number}}
        }
      };
      var personRepo = new Repo(repoConfig);
      
      class PeopleService extends Service {
        addAct(request)
        {
          return this.prepRequest(request, 'add').then(function(request){
            return request; 
          });
        }
      };
      
      var config = {
        action: {
          add: {
            schema: {$repo: {name: 'people', path: 'father'}}
          }
        }
      };
      var peopleService = new PeopleService(config);
      peopleService.repos['people'] = personRepo;
      peopleService.init(); // Copies repo schema to service schema
      
      peopleService.execute('add', {_id: '3', name: 'Kevin Foster', age: '35'}).then(function(result){
        should(result['_id']).eql(3);
        should(result['_id'].constructor).eql(Number);
        should(result['age']).eql(35);
        should(result['age'].constructor).eql(Number);
        done()
      }).catch(function(err){
        done(err);
      });
    });
    it('should autoload configured request entities', function (done) {
      var data = {
        basket: [
          {_id: '3'}
        ],
      };
      
      var basketRepo = new Repo({name: 'basket'});
      basketRepo.dataSource = new MockDataSource(data);
      
      class CheckoutService extends Service {
        checkoutAct(request)
        {
          return this.prepRequest(request, 'checkout').then(function(request){
            return request; 
          });
        }
      };
      
      var config = {
        action: {
          checkout: {
            autoload: {
              // This config indicates to the service that it should expect the parameter 'basket' 
              // - to be either a an instance of a Basket entity or a basket pkey key value
              // - If the value is a pkey value the service will lookup the entity and replace
              // - the pkey value with the an entity instance
              basket: {repo: 'basket'}
            }
          }
        }
      };
      var checkoutService = new CheckoutService(config);
      checkoutService.repos['basket'] = basketRepo;
      
      checkoutService.execute('checkout', {basket: '3'}).then(function(result){
        should(result).eql({basket: data.basket[0]});
        done()
      }).catch(function(err){
        done(err);
      });
    });
    it('should autoload configured request entities with configureable key', function (done) {
      var data = {
        basket: [
          {_id: '3', name: 'x'}
        ],
      };
      
      var basketRepo = new Repo({name: 'basket'});
      basketRepo.dataSource = new MockDataSource(data);
      
      class CheckoutService extends Service {
        checkoutAct(request)
        {
          return this.prepRequest(request, 'checkout').then(function(request){
            return request; 
          });
        }
      };
      
      var config = {
        action: {
          checkout: {
            autoload: {
              // This config indicates to the service that it should expect the parameter 'basket' 
              // - to be either a an instance of a Basket entity or a basket pkey key value
              // - If the value is a pkey value the service will lookup the entity and replace
              // - the pkey value with the an entity instance
              basket: {repo: 'basket', key: 'name'}
            }
          }
        }
      };
      var checkoutService = new CheckoutService(config);
      checkoutService.repos['basket'] = basketRepo;
      
      checkoutService.execute('checkout', {basket: 'x'}).then(function(result){
        should(result).eql({basket: data.basket[0]});
        done()
      }).catch(function(err){
        done(err);
      });
    });
    it('should autoload configured request entities array', function (done) {
      var data = {
        basket: [
          {_id: '3'},
          {_id: '5'},
        ],
      };
      
      var basketRepo = new Repo({name: 'basket'});
      basketRepo.dataSource = new MockDataSource(data);
      
      class CheckoutService extends Service {
        checkoutAct(request)
        {
          return this.prepRequest(request, 'checkout').then(function(request){
            return request; 
          });
        }
      };
      
      var config = {
        action: {
          checkout: {
            autoload: {
              basket: {repo: 'basket', isArray: true}
            }
          }
        }
      };
      var checkoutService = new CheckoutService(config);
      checkoutService.repos['basket'] = basketRepo;
      
      checkoutService.execute('checkout', {basket: ['3', '5']}).then(function(result){
        should(result).eql({basket: data.basket});
        done()
      }).catch(function(err){
        done(err);
      });
    });
  });
  describe('getActionMethod()', function () {
    it('should return named action method', function () {
      class CheckoutService extends Service {
        selectShippingMethodAct(options)
        {
          return 'success';
        }
      };
      var checkoutService = new CheckoutService();
      should(checkoutService.getActionMethod('selectShippingMethod')).eql(checkoutService.selectShippingMethodAct);
    });
    it('should return undefined if method not defined', function () {
      class CheckoutService extends Service {
      };
      var checkoutService = new CheckoutService();
      should(checkoutService.getActionMethod('selectShippingMethod')).be.undefined();
    });
  });
  describe('getActionMethods()', function () {
    it('should return an array of action method functions', function () {
      class CheckoutService extends Service {
        firstAct(options){
          return 1;
        }
        secondAct(options){
          return 1;
        }
        otherAct(options){
          return 1;
        }
      };
      var checkoutService = new CheckoutService();
      var result = checkoutService.getActionMethods();
      should(result).eql([
        checkoutService.firstAct,
        checkoutService.secondAct,
        checkoutService.otherAct
      ]);
    });
  });
  describe('getActionNames()', function () {
    it('should return an array of action names', function () {
      class CheckoutService extends Service {
        firstAct(options){
          return 1;
        }
        secondAct(options){
          return 1;
        }
        otherAct(options){
          return 1;
        }
      };
      var checkoutService = new CheckoutService();
      var result = checkoutService.getActionNames();
      should(result).eql(['first','second','other']);
    });
  });
});
*/
