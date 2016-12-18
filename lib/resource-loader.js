'use strict'
var path = require('path');
var fs = require('fs');

class ResourceLoader
{
  constructor() {
  }
  /**
   * Load Resources
   *
   * Loads all files in each of dirPaths via require().
   * If subdirectory is specified will only look in subdirectory of each dirPaths.
   * By default only loads files with extension '.js' unless fileExt is specified.
   */
  getResources(dirPaths, subdirectory, fileExt)
  {
    var fileExt = fileExt ? fileExt : '.js';
    var resources = {};
    
    dirPaths.forEach(function(dirPath, x){
      var dir = subdirectory ? dirPaths[x] + '/' + subdirectory : dirPaths[x];
      if (!dir) return;

      try {
        fs.accessSync(dir, fs.constants.R_OK); // This throws if any accessibility checks fail, and does nothing otherwise.
        var filenames = fs.readdirSync(dir);

        filenames.forEach(function(fileName, y){
          var extStartOffset = fileName.length - fileExt.length;
          var realExt = filenames[y].substring(extStartOffset);
          if (realExt != fileExt) return;
          var filePath = path.resolve(dir + '/' + fileName);
          resources[filePath] = require(filePath);
        });
      } catch (err) {
        // Config directory does not exist
      }
    });

    return resources;
  }
  /**
   * Get resource config
   *
   * Given a resource file path, returns the associated config object loaded from a config file with the same name.
   */
  getResourceConfig(resourcePath, resourceExt, configExt)
  {
    resourceExt = resourceExt ? resourceExt : '.js';
    configExt = configExt ? configExt : '.json';
    var configPath = resourcePath.substring(0, resourcePath.length - resourceExt.length) + configExt;
    
    var configExists = true;
    try {
        fs.accessSync(configPath, fs.constants.R_OK);
    } catch (err) {
        var configExists = false;
    }
    var config = configExists ? require(configPath) : {};
    
    return config;
  }
}

module.exports = ResourceLoader;
