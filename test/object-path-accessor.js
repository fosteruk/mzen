var should = require('should');
var ObjectPathAccessor = require('../lib/object-path-accessor');

describe('ObjectPathAccessor', function () {
  describe('getPath()', function () {
    it('should return value at given path', function () {
      var data = {
        planet: 'Earth'
      };
      
      var result = ObjectPathAccessor.getPath('planet', data);
      
      should(result).eql('Earth');
    });
    it('should return value at given deep path', function () {
      var data = {
        planet: {
          name: 'Earth',
          continent: {
            name: 'Europe',
            country: {
              name: 'UK',
              city: {
                name: 'London',
              }
            }
          }
        }
      };
      
      var result = ObjectPathAccessor.getPath('planet.continent.country', data);
      
      should(result).eql({name: 'UK', city: {name: 'London'}});
    });
    it('should return value at given array index', function () {
      var data = [
        'Earth',
        'Mars',
        'Venus'
      ];
      
      var result = ObjectPathAccessor.getPath('1', data);
      
      should(result).eql('Mars');
    });
    it('should return value at given deep array index', function () {
      var data = [
        ['Earth', 'Mars',],
        ['Venus']
      ];
      
      var result = ObjectPathAccessor.getPath('0.1', data);
      
      should(result).eql('Mars');
    });
    it('should return value at given array path', function () {
      var data = [
          {
          planet: {
            name: 'Earth',
            continent: {
              name: 'Europe',
              country: {
                name: 'UK',
                city: {
                  name: 'London',
                }
              }
            }
          }
        }
      ];
      
      var result = ObjectPathAccessor.getPath('0.planet.continent.country', data);
      
      should(result).eql({name: 'UK', city: {name: 'London'}});
    });
    it('should return array of values for wildcard path', function () {
      var data = {
          planet: {
            one: {name: 'Earth'},
            two: {name: 'Mars'},
            other: {name: 'Venus'}
          }
      };
      
      var result = ObjectPathAccessor.getPath('planet.*', data);
      
      should(result).eql([
        {name: 'Earth'},
        {name: 'Mars'},
        {name: 'Venus'}
      ]);
    });
    it('should return array of values for multiple wildcard path', function () {
      var data = {
          planet: {
            a: {one: {name: 'Earth'}},
            b: {two: {name: 'Mars'}},
            c: {three: {name: 'Venus'}}
          }
      };
      
      var result = ObjectPathAccessor.getPath('planet.*.*', data);
      
      should(result).eql([
        {name: 'Earth'},
        {name: 'Mars'},
        {name: 'Venus'}
      ]);
    });
  });
  describe('setPath()', function () {
    it('should set value at given path', function () {
      var data = {
        planet: 'Earth'
      };
      
      var result = ObjectPathAccessor.setPath('planet', 'Mars', data);
      
      should(result).eql('Mars');
      should(data.planet).eql('Mars');
    });
    it('should set value at given deep path', function () {
      var data = {
        planet: {
          name: 'Earth',
          continent: {
            name: 'Europe',
            country: {
              name: 'UK',
              city: {
                name: 'London',
              }
            }
          }
        }
      };
      
      var result = ObjectPathAccessor.setPath('planet.continent.country.city', {name: 'Liverpool'}, data);
      
      should(result).eql({name: 'Liverpool'});
      should(data.planet.continent.country.city).eql({name: 'Liverpool'});
    });
    it('should set value at given array index', function () {
      var data = [
        'Earth',
        'Mars',
        'Venus'
      ];
      
      var result = ObjectPathAccessor.setPath('1', 'neptune', data);
      
      should(result).eql('neptune');
      should(data[1]).eql('neptune');
    });
    it('should set value at given deep array index', function () {
      var data = [
        ['Earth', 'Mars'],
        ['Venus']
      ];
      
      var result = ObjectPathAccessor.setPath('0.1', 'neptune', data);
      
      should(result).eql('neptune');
      should(data[0][1]).eql('neptune');
    });
    it('should set value at given array path', function () {
      var data = [
          {
          planet: {
            name: 'Earth',
            continent: {
              name: 'Europe',
              country: {
                name: 'UK',
                city: {
                  name: 'London',
                }
              }
            }
          }
        }
      ];
      
      var result = ObjectPathAccessor.setPath('0.planet.continent.country.city', {name: 'Liverpool'}, data);
      
      should(result).eql({name: 'Liverpool'});
      should(data[0].planet.continent.country.city).eql({name: 'Liverpool'});
    });
    it('should set value to array for wildcard path', function () {
      var data = {
          planet: {
            one: {name: 'Earth'},
            two: {name: 'Mars'},
            other: {name: 'Venus'}
          }
      };
      
      var result = ObjectPathAccessor.setPath('planet.*', {name: 'Pluto'}, data);
      
      should(result).eql([
        {name: 'Pluto'},
        {name: 'Pluto'},
        {name: 'Pluto'}
      ]);
      should(data.planet.one).eql({name: 'Pluto'});
      should(data.planet.two).eql({name: 'Pluto'});
      should(data.planet.other).eql({name: 'Pluto'});
    });
    it('should set value to array for multiple wildcard path', function () {
      var data = {
          planet: {
            a: {one: {name: 'Earth'}},
            b: {two: {name: 'Mars'}},
            c: {three: {name: 'Venus'}}
          }
      };
      
      var result = ObjectPathAccessor.setPath('planet.*.*', {name: 'Pluto'}, data);
      
      should(result).eql([
        {name: 'Pluto'},
        {name: 'Pluto'},
        {name: 'Pluto'}
      ]);
      should(data.planet.a.one).eql({name: 'Pluto'});
      should(data.planet.b.two).eql({name: 'Pluto'});
      should(data.planet.c.three).eql({name: 'Pluto'});
    });
  });
  describe('mutatePath()', function () {
    it('should mutate value at given path', function () {
      var data = {
        planet: 'Earth'
      };
      
      var result = ObjectPathAccessor.mutatePath('planet', data, function(value){ 
        return value + ' X'
      });
      
      should(result).eql('Earth X');
      should(data.planet).eql('Earth X');
    });
    it('should mutate value at given deep path', function () {
      var data = {
        planet: {
          name: 'Earth',
          continent: {
            name: 'Europe',
            country: {
              name: 'UK',
              city: {
                name: 'London',
              }
            }
          }
        }
      };
      
      var result = ObjectPathAccessor.mutatePath('planet.continent.country.city', data, function(value){ 
        value.name = value.name + ' X';
        return value;
      });
      
      should(result).eql({name: 'London X'});
      should(data.planet.continent.country.city).eql({name: 'London X'});
    });
    it('should mutate value at given array index', function () {
      var data = [
        'Earth',
        'Mars',
        'Venus'
      ];
      
      var result = ObjectPathAccessor.mutatePath('1', data, function(value){ 
        value = value + ' X';
        return value;
      });
      
      should(result).eql('Mars X');
      should(data[1]).eql('Mars X');
    });
    it('should mutate value at given deep array index', function () {
      var data = [
        ['Earth', 'Mars'],
        ['Venus']
      ];
      
      var result = ObjectPathAccessor.mutatePath('0.1', data, function(value){ 
        value = value + ' X';
        return value;
      });
      
      should(result).eql('Mars X');
      should(data[0][1]).eql('Mars X');
    });
    it('should mutate value at given array path', function () {
      var data = [
          {
          planet: {
            name: 'Earth',
            continent: {
              name: 'Europe',
              country: {
                name: 'UK',
                city: {
                  name: 'London',
                }
              }
            }
          }
        }
      ];
      
      var result = ObjectPathAccessor.mutatePath('0.planet.continent.country.city', data, function(value){ 
        value.name = value.name + ' X';
        return value;
      });
      
      should(result).eql({name: 'London X'});
      should(data[0].planet.continent.country.city).eql({name: 'London X'});
    });
    it('should mutate array for wildcard path', function () {
      var data = {
          planet: {
            one: {name: 'Earth'},
            two: {name: 'Mars'},
            other: {name: 'Venus'}
          }
      };
      
      var result = ObjectPathAccessor.mutatePath('planet.*', data, function(value){ 
        value.name = value.name + ' X';
        return value;
      });
      
      should(result).eql([
        {name: 'Earth X'},
        {name: 'Mars X'},
        {name: 'Venus X'}
      ]);
      should(data.planet.one).eql({name: 'Earth X'});
      should(data.planet.two).eql({name: 'Mars X'});
      should(data.planet.other).eql({name: 'Venus X'});
    });
    it('should mutate array for multiple wildcard path', function () {
      var data = {
          planet: {
            a: {one: {name: 'Earth'}},
            b: {two: {name: 'Mars'}},
            c: {three: {name: 'Venus'}}
          }
      };
      
      var result = ObjectPathAccessor.mutatePath('planet.*.*', data, function(value){ 
        value.name = value.name + ' X';
        return value;
      });
      
      should(result).eql([
        {name: 'Earth X'},
        {name: 'Mars X'},
        {name: 'Venus X'}
      ]);
      should(data.planet.a.one).eql({name: 'Earth X'});
      should(data.planet.b.two).eql({name: 'Mars X'});
      should(data.planet.c.three).eql({name: 'Venus X'});
    });
  });
});
