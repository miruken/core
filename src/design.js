import {isDescriptor } from "./decorate";
import { $isFunction } from "./util";
import Metadata from "./metadata";

const designMetadataKey = Symbol(),
      paramTypesKey     = "design:paramtypes",
      propertyTypeKey   = "design:type";

/**
 * Custom Metadata to bridge Typescript annotations.
 * @class DesignMetadata
 */
const DesignMetadata = Metadata.extend(null, {
    get(metadataKey, target, targetKey) {
        if (metadataKey === designMetadataKey) {
            return this.base(paramTypesKey, target, targetKey)
                || this.base(propertyTypeKey, target, targetKey);
        }
        return this.base(metadataKey, target, targetKey);
    },
    getOwn(metadataKey, target, targetKey) {
        if (metadataKey === designMetadataKey) {
            return this.base(paramTypesKey, target, targetKey)
                || this.base(propertyTypeKey, target, targetKey);
        }
        return this.base(metadataKey, target, targetKey);        
    }
});

/**
 * Attaches design metadata compatible with Typescript.
 * @method design
 */
export const design = DesignMetadata.decorator(designMetadataKey,
    (target, key, descriptor, types) => {
        if (!isDescriptor(descriptor)) {
            if (target.length > key.length) {
                throw new SyntaxError(
                    `@design for constructor expects at least ${target.length} parameters but only ${key.length} specified`);
            }            
            _validateTypes(key);
            Metadata.define(paramTypesKey, key, target.prototype, "constructor");
            return;
        }
        const { value } = descriptor;
        if ($isFunction(value)) {
            if (value.length > types.length) {
                throw new SyntaxError(
                    `@design for method '${key}' expects at least ${value.length} parameters but only ${types.length} specified`);
            }
            _validateTypes(types);
            Metadata.define(paramTypesKey, types, target, key);        
        } else if (types.length !== 1) {
            throw new SyntaxError(`@design for property '${key}' requires a type to be specified`);
        } else {
            _validateTypes(types);            
            Metadata.define(propertyTypeKey, types[0], target, key);
        }
    });

function _validateTypes(types) {
    for (let i = 0; i < types.length; ++i) {
        const type = types[i];
        if (Array.isArray(type) && type.length !== 1) {
            throw new SyntaxError(`@design array specification at index ${i} expects a single type`);            
        }
    }
}

export default design;
