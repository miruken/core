import decorate from "./decorate";
import Metadata from "./metadata";
import { $flatten } from "./util";

const injectMetadataKey = Symbol();

/**
 * Specifies dependencies on properties and methods.
 * @method inject
 * @param  {Array}  ...dependencies  -  property/method dependencies
 */
export function inject(...dependencies) {
    return decorate(_inject, dependencies);
}

inject.getOwn = Metadata.getter(injectMetadataKey, true);
inject.get    = Metadata.getter(injectMetadataKey);

function _inject(target, key, descriptor, dependencies) {
    if (!descriptor) {
        dependencies = key;
        target       = target.prototype        
        key          = "constructor"
    }
    dependencies = $flatten(dependencies);
    if (dependencies.length > 0) {
        Metadata.define(injectMetadataKey, dependencies, target, key);
    }
}

export default inject;
