"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mzen_schema_1 = require("mzen-schema");
class ArtistSchema extends mzen_schema_1.default {
    constructor(spec, options) {
        super(spec, options);
        this.setName('artist');
        this.setSpec({
            firstAlbum: { $schema: 'album' }
        });
    }
}
exports.default = ArtistSchema;
