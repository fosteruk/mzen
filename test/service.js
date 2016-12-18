'use strict'
var should = require('should');
var Service = require('../lib/service');
var Repo = require('../lib/repo');
var MockDataSource = require('../lib/data-source/mock');

describe('Service', function (){
  describe('getName()', function (){
    it('should return configured name', function (){
      var checkoutService = new Service({name: 'CheckoutService'});
      should(checkoutService.getName()).eql('CheckoutService');
    });
    it('should return constructor name if name not configured', function (){
      class CheckoutService extends Service {};
      var checkoutService = new CheckoutService();
      should(checkoutService.getName()).eql('CheckoutService');
      
      class NewCheckoutService extends CheckoutService {};
      var newCheckoutService = new NewCheckoutService();
      should(newCheckoutService.getName()).eql('NewCheckoutService');
    });
    it('should throw an exception if service name is not configured when using the default constructor', function(){
      var aService = new Service();
      (function(){
        aService.getName()
      }).should.throw(/Service name not configured/);
    });
  });
});
