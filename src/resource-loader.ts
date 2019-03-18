import path = require('path');
import fs = require('fs');

export class ResourceLoader
{
  constructor() {
  }
  /**
   * Load Resources
   *
   * Loads all files in each of dirPaths via require().
   * If subdirectory is specified we will only look in subdirectory of each dirPaths.
   * By default only loads files with extension '.js' unless fileExt is specified.
   */
  getResources(dirPaths, subdirectory?, fileExt?, fileNamesExclude?, fileNamesLimit?)
  {
    var fileExt = fileExt ? fileExt : '.js';
    var resources = {};

    dirPaths.forEach(function(dirPath){
      const dir = subdirectory ? dirPath + '/' + subdirectory : dirPath;
      if (!dir) return;
      try {
        fs.accessSync(dir, fs.constants.R_OK); // This throws if any accessibility checks fail, and does nothing otherwise.
        const filenames = fs.readdirSync(dir);

        filenames.forEach(function(fileName, y){
          const extStartOffset = fileName.length - fileExt.length;
          const realExt = filenames[y].substring(extStartOffset);
          if (
            realExt === fileExt &&
            (!Array.isArray(fileNamesExclude) || fileNamesExclude.indexOf(fileName) === -1) && // file not excluded
            (!Array.isArray(fileNamesLimit) || fileNamesLimit.indexOf(fileName) !== -1)  // file is in the limit list
          ) {
            const filePath = path.resolve(dir + '/' + fileName);
            try {
              let loadedModule = require(filePath);
              resources[filePath] = loadedModule && loadedModule.__esModule ? loadedModule.default : loadedModule;
            } catch (err) {
              console.error(err.stack);
            }
          }
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
  getResourceConfig(resourcePath, resourceExt?, configExt?)
  {
    resourceExt = resourceExt ? resourceExt : '.js';
    configExt = configExt ? configExt : '.json';
    var configPath = resourcePath.substring(0, resourcePath.length - resourceExt.length) + configExt;

    var configExists = true;
    try {
      fs.accessSync(configPath, fs.constants.R_OK);
    } catch (err) {
      configExists = false;
    }
    try {
      var config = configExists ? require(configPath) : {};
    } catch (err) {
      console.error(err.stack);
    }
    return config;
  }

  static resourcePathToName(resourcePath, ext)
  {
    ext = ext ? ext : '.js';
    let result = path.basename(resourcePath, ext);
    if (typeof result === 'string') result = result.charAt(0).toLowerCase() + result.slice(1);
    return result;
  }
}

export default ResourceLoader;
