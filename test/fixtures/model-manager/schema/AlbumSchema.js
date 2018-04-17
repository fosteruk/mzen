'use strict'
var Schema = require('mzen-schema');

class AlbumSchema extends Schema
{
  constructor(spec, options)
  {
    super(spec, options);
    this.setName('album');
    this.setSpec({
      name: String,
      releaseDate: Date
    });
  }
}

module.exports = AlbumSchema;
