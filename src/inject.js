import decorate from './decorate';
import metadata from './metadata';
import { $flatten } from './util';
import { $meta } from './meta';
import { emptyArray } from './core';

const injectKey      = Symbol(),
      injectCriteria = { [injectKey]: undefined };

/**
 * Specifies dependencies on properties and methods.
 * @method inject
 * @param  {Array}  ...dependencies  -  property/method dependencies
 */
export function inject(...dependencies) {
    return decorate(_inject, dependencies);
}

inject.getOwn = function () {
    return metadata.getOwn(injectKey, injectCriteria, ...arguments)
        || emptyArray;
}

inject.get = function () {
    return metadata.get(injectKey, injectCriteria, ...arguments)
        || emptyArray;
}

function _inject(target, key, descriptor, dependencies) {
    dependencies = $flatten(dependencies);
    if (dependencies.length > 0) {
        const meta = $meta(target);
        if (meta) {
            meta.defineMetadata(key, { [injectKey]: dependencies });
        }
    }
}

export default inject;
