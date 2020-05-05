import { Metadata } from "./metadata";
import { isDescriptor } from "./decorate";
import { $isFunction, $flatten } from "./core";

const injectMetadataKey = Symbol();

/**
 * Specifies dependencies on properties and methods.
 * @method inject
 * @param  {Array}  ...dependencies  -  property/method dependencies
 */
export const inject = Metadata.decorator(injectMetadataKey,
    (target, key, descriptor, dependencies) => {
        if (!isDescriptor(descriptor)) {
            dependencies = $flatten(key);
            Metadata.define(injectMetadataKey, dependencies, target.prototype, "constructor");
            return;
        }
        const { value } = descriptor;        
        dependencies = $flatten(dependencies);
        if ($isFunction(value)) {
            Metadata.define(injectMetadataKey, dependencies, target, key);
        } else if (dependencies.length !== 1) {
            throw new SyntaxError(`@inject for property '${key}' requires single key to be specified`);
        } else {
            Metadata.define(injectMetadataKey, dependencies[0], target, key);
        }
    });
