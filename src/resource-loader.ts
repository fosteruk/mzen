import path = require('path');
import fs = require('fs');

interface ResourceLoaderConfig
{
  dirPaths?: Array<string>;
  subdir?: string;
  fileExt?: string;
  fileNamesExclude?: Array<string> 
  fileNamesLimit?: Array<string>;
}

export class ResourceLoader
{
  options: {
    dirPaths?: Array<string>,
    subdir?: string,
    fileExt?: string,
    fileNamesExclude?: Array<string>,
    fileNamesLimit?: Array<string>
  };

  constructor(options?: ResourceLoaderConfig)
  {
    this.options = this.configNormalise(options);
  }

  configNormalise(options?: ResourceLoaderConfig)
  {
    // If a given option is not specified use the object scope value or the default value

    var normalised = options ? options : {...options};

    this.options = this.options ? this.options : {};

    normalised.dirPaths = options && options.dirPaths !== undefined ? options.dirPaths : (
      this.options.dirPaths !== undefined ? this.options.dirPaths : []
    );
    normalised.subdir = options && options.dirPaths !== undefined ? options.subdir : (
      this.options.subdir !== undefined ? this.options.subdir : null
    );
    normalised.fileExt = options && options.fileExt !== undefined ? options.fileExt : (
      this.options.fileExt !== undefined ? this.options.fileExt : null
    );
    normalised.fileNamesExclude = options && options.fileNamesExclude !== undefined ? options.fileNamesExclude : (
      this.options.fileNamesExclude !== undefined ? this.options.fileNamesExclude : null
    );
    normalised.fileNamesLimit = options && options.fileNamesLimit !== undefined ? options.fileNamesLimit : (
      this.options.fileNamesLimit !== undefined ? this.options.fileNamesLimit : null
    );

    return normalised;
  }

  /**
   * Load Resources
   *
   * Loads all files in each of dirPaths via require().
   * If subdir is specified we will only look in subdir of each dirPaths.
   * By default only loads files with extension '.js' unless fileExt is specified.
   */
  getResources(options?: ResourceLoaderConfig)
  {
    var resources = {};
    var resourcePaths = this.getResourcePaths(options);

    resourcePaths.forEach(filePath => {
      resources[filePath] = ResourceLoader.loadModule(filePath);
    });

    return resources;
  }

  getResourcePaths(options?: ResourceLoaderConfig)
  {
    const opts = this.configNormalise(options);

    var fileExt = opts.fileExt ? opts.fileExt : '.js';
    var resourcePaths = [];

    opts.dirPaths.forEach(dirPath => {
      const dir = opts.subdir ? dirPath + '/' + opts.subdir : dirPath;
      if (!dir) return;
      try {
        fs.accessSync(dir, fs.constants.R_OK); // This throws if any accessibility checks fail, and does nothing otherwise.
        const filenames = fs.readdirSync(dir);

        filenames.forEach(fileName => {
          const extStartOffset = fileName.length - fileExt.length;
          const realExt = fileName.substring(extStartOffset);
          if (
            realExt === fileExt &&
            (!Array.isArray(opts.fileNamesExclude) || opts.fileNamesExclude.indexOf(fileName) === -1) && // file not excluded
            (!Array.isArray(opts.fileNamesLimit) || opts.fileNamesLimit.indexOf(fileName) !== -1)  // file is in the limit list
          ) {
            const filePath = path.resolve(dir + '/' + fileName);
            resourcePaths.push(filePath);
          }
        });
      } catch (err) {
        // Config directory does not exist
      }
    });

    return resourcePaths;
  }

  /**
   * Get resource config
   *
   * Given a resource file path, returns the associated config object loaded from a config file with the same name.
   */
  getResourceConfig(resourcePath: string, resourceExt?: string, configExt?: string)
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
    if (configExists) {
      try {
        var configModule = require(configPath);
        var config = configModule && configModule.__esModule ? configModule.default : configModule;
      } catch (err) {
        console.error(err.stack);
      }
    }
    return config;
  }

  static loadModule(filePath: string)
  {
    let result = null;
    try {
      let loadedModule = require(filePath);
      result = loadedModule && loadedModule.__esModule ? loadedModule.default : loadedModule;
    } catch (err) {
      console.error(err.stack);
    }
    return result;
  }

  static resourcePathToName(resourcePath: string, ext?: string)
  {
    ext = ext ? ext : '.js';
    let result = path.basename(resourcePath, ext);
    if (typeof result === 'string') result = result.charAt(0).toLowerCase() + result.slice(1);
    return result;
  }
}

export default ResourceLoader;
