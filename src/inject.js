import Metadata from "./metadata";
import { isDescriptor } from "./decorate";
import { $flatten } from "./util";

const injectMetadataKey = Symbol();

/**
 * Specifies dependencies on properties and methods.
 * @method inject
 * @param  {Array}  ...dependencies  -  property/method dependencies
 */
export const inject = Metadata.decorator(injectMetadataKey,
    (target, key, descriptor, dependencies) => {
        if (!isDescriptor(descriptor)) {
            dependencies = key;
            target       = target.prototype        
            key          = "constructor"
        }
        dependencies = $flatten(dependencies);
        Metadata.define(injectMetadataKey, dependencies, target, key);
    });

export default inject;
