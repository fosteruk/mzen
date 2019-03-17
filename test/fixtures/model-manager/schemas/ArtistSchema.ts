import Schema from 'mzen-schema';

class ArtistSchema extends Schema
{
  constructor(spec, options)
  {
    super(spec, options);
    this.setName('artist');
    this.setSpec({
      firstAlbum: {$schema: 'album'}
    });
  }
}

export default ArtistSchema;
