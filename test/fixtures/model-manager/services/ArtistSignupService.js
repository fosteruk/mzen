'use strict'
var Service = require('../../../../lib/service');

class ArtistSignupService extends Service
{
  constructor(options) {
    super({name: 'artistSignup'});
  }
}

module.exports = ArtistSignupService;
