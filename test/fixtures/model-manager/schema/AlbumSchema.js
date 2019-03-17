"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mzen_schema_1 = require("mzen-schema");
class AlbumSchema extends mzen_schema_1.default {
    constructor(spec, options) {
        super(spec, options);
        this.setName('album');
        this.setSpec({
            name: String,
            releaseDate: Date
        });
    }
}
exports.default = AlbumSchema;
