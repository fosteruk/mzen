/**
 * Object Path Accessor
 *
 * Provides ability to access and modify object/array elements using a string representation of the
 * the property call path.
 *
 * A path is a string representation of an Object or Array property call path.
 * Object property names and array index values are separated with a dot '.' to form a string.
 *  For example: 'prop1.some_array.0.myVariable'.
 * An asterisks can be used to match any value:
 *  For example: 'prop1.some_array.*.myVariable'.
 */
export class ObjectPathAccessor
{
  /**
   * Get path
   *
   * Returns all elements matching 'path' in 'subject'.
   */
  static getPath(path, subject)
  {
    return ObjectPathAccessor.searchRescursive(path, subject);
  }
  /*
  * Set path
  *
  * Sets all elements matching 'path' in the given 'subject'.
  * Returns all matching elements with updated values.
  */
  static setPath(path, value, subject)
  {
    return ObjectPathAccessor.searchRescursive(path, subject, function(){
      return value;
    });
  }
  /*
  * Unset path
  *
  * Unsets all elements matching 'path' in the given 'subject'.
  */
  static unsetPath(path, subject)
  {
    return ObjectPathAccessor.searchRescursive(path, subject, function(){
      return undefined; // changing value to undefined causes the prop to be unset
    });
  }
  /*
  * Mutate path
  *
  * Mutates all elements matching 'path' in 'subject' using 'mutator' function.
  * Returns all matching elements with updated values.
  */
  static mutatePath(path, subject, mutator)
  {
    return ObjectPathAccessor.searchRescursive(path, subject, mutator);
  }
  /**
   * Search Recursive
   *
   * Search 'subject' for elements matching 'pattern'.
   * Matched values may be modifed using optional mutatorFunc.
   * Returns matched value(s).
   */
  static searchRescursive(pattern, subject, mutatorFunc?, options?)
  {
    options = options ? options : {};
    const currentPath = options.currentPath ? options.currentPath : null;
    const currentDepth = options.currentDepth ? options.currentDepth : 1;
    var matches = options.matches ? options.matches : [];


    const patternParts = pattern.split('.');
    const currentParts = patternParts.slice(0, currentDepth); // Pattern parts up to current depth
    const currentNode = currentParts[currentParts.length - 1]; // Current node value
    const depth = currentDepth + 1;

    if (currentDepth <= patternParts.length) {
      if (Array.isArray(subject)) {
        // @ts-ignore - 'element' is declared but its value is never read
        subject.forEach(function(element, x){
          processElement(x);
        });
      } else {
        for (let prop in subject) {
          if (!subject.hasOwnProperty(prop)) continue;
          processElement(prop);
        }
      }
    }

    function processElement(prop)
    {
      // Element path is the full path to the current element
      let elementPath = currentPath ? currentPath + '.' + prop : String(prop);

      if (ObjectPathAccessor.pathsMatch(pattern, elementPath)) {
        if (typeof mutatorFunc == 'function') subject[prop] = mutatorFunc(subject[prop]);
        if (subject[prop] == undefined) {
          delete subject[prop];
        } else {
          // Full pattern matches current element path so add it to the list of matches
          matches.push(subject[prop]);
        }
      }

      // Only recurse into objects - can be an array object but not a primitive
      if ((currentNode == '*' || prop == currentNode) && subject[prop] === Object(subject[prop])) {
        let nextOptions = Object.assign({}, options, {
          currentPath:  elementPath,
          currentDepth: depth,
          matches
        });
        ObjectPathAccessor.searchRescursive(pattern, subject[prop], mutatorFunc, nextOptions);
      }
    }

    // If the pattern contains a wild card the result should be an array. Otherwise it should be a single value
    return pattern.indexOf('*') !== -1 ? matches : matches[0];
  }

  /**
   * Compare two paths and return true if they match
   * The first path argument can contain wild cards '*'
   * - If you want to match a literal * you need to escape it with a backslash \*
   * The second path argument is assumed to be the real path and so wild cards are ignored
   * - the value '*' is treated a literal rather than a wild card
   */
  static pathsMatch(path, realPath)
  {
    var p1Parts = path.split('.');
    var p2Parts = realPath.split('.');
    var result = false;
    if (p1Parts.length == p2Parts.length) {
      result = true;
      for (var x = 0; x < p1Parts.length; x++) {
        if (p1Parts[x] == '*') continue;
        if (p1Parts[x] == '\*' && p2Parts[x] == '*') continue;
        if (p1Parts[x] != p2Parts[x]) {
          result = false;
          break;
        }
      }
    }
    return result;
  }

}

export default ObjectPathAccessor;
