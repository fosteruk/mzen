import should = require('should');
import Service from '../../lib/service';

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
      should.throws(function(){
        aService.getName()
      }, /Service name not configured/);
    });
  });
});
