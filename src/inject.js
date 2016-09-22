import Metadata from "./metadata";
import { $flatten } from "./util";

const injectMetadataKey = Symbol();

/**
 * Specifies dependencies on properties and methods.
 * @method inject
 * @param  {Array}  ...dependencies  -  property/method dependencies
 */
export const inject = Metadata.decorator(injectMetadataKey,
    (target, key, descriptor, dependencies) => {
        if (!descriptor) {
            dependencies = key;
            target       = target.prototype        
            key          = "constructor"
        }
        dependencies = $flatten(dependencies);
        if (dependencies.length > 0) {
            Metadata.define(injectMetadataKey, dependencies, target, key);
        }
    });

export default inject;
