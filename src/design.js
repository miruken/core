import {isDescriptor } from "./decorate";
import { $isFunction } from "./util";
import { Metadata } from "./metadata";

const designMetadataKey = Symbol(),
      paramTypesKey     = "design:paramtypes",
      propertyTypeKey   = "design:type",
      returnTypeKey     = "design:returnType";

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
 * Custom Metadata to include return type.
 * @class DesignWithReturnMetadata
 */
const DesignWithReturnMetadata = DesignMetadata.extend(null, {
    get(metadataKey, target, targetKey) {
        const metadata = this.base(metadataKey, target, targetKey);
        if (metadataKey === designMetadataKey && Array.isArray(metadata)) {
            metadata.unshift(Metadata.get(returnTypeKey, target, targetKey));
        }
        return metadata;
    },
    getOwn(metadataKey, target, targetKey) {
        const metadata = this.base(metadataKey, target, targetKey);
        if (metadataKey === designMetadataKey && Array.isArray(metadata)) {
            metadata.unshift(Metadata.getOwn(returnTypeKey, target, targetKey));            
        }
        return metadata;
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
                    `@design for constructor expects at least ${target.length} parameters but only ${key.length} specified.`);
            }            
            _validateTypes(key, 'design');
            DesignMetadata.define(paramTypesKey, key, target.prototype, "constructor");
            return;
        }
        const { value } = descriptor;
        if ($isFunction(value)) {
            if (value.length > types.length) {
                throw new SyntaxError(
                    `@design for method '${key}' expects at least ${value.length} parameters but only ${types.length} specified.`);
            }
            _validateTypes(types, 'design');
            DesignMetadata.define(paramTypesKey, types, target, key);        
        } else if (types.length !== 1) {
            throw new SyntaxError(`@design for property '${key}' requires a single type to be specified.`);
        } else if (DesignMetadata.has(propertyTypeKey, target, key)) {
            throw new SyntaxError(`@design for property '${key}' should only be specified on getter or setter.`);
        } else {
            _validateTypes(types, 'design');
            DesignMetadata.define(propertyTypeKey, types[0], target, key);
        }
    });

/**
 * Attaches method design metadata compatible with Typescript.
 * @method designWithReturn
 */
export const designWithReturn = DesignWithReturnMetadata.decorator(designMetadataKey,
    (target, key, descriptor, [returnType, ...types]) => {
        if (!isDescriptor(descriptor)) {
            throw new SyntaxError(`@designWithReturn cannot be applied to constructors.`);
        }            
        const { value } = descriptor;
        if ($isFunction(value)) {
            if (!$isFunction(returnType)) {
                throw new SyntaxError(
                    `@designWithReturn for method '${key}' requires a valid return type.`);
            }
            if (value.length > types.length) {
                throw new SyntaxError(
                    `@designWithReturn for method '${key}' expects at least ${value.length} parameters but only ${types.length} specified.`);
            }
            _validateTypes(types, 'designWithReturn');
            DesignMetadata.define(returnTypeKey, returnType, target, key);                    
            DesignMetadata.define(paramTypesKey, types, target, key);
        } else {
            throw new SyntaxError(`@designWithReturn ('${key}') cannot be applied to properties.`);
        }
    });

function _validateTypes(types, decorator) {
    for (let i = 0; i < types.length; ++i) {
        let type = types[i];
        if (type == null) { return };
        if (Array.isArray(type)) {
            if (type.length !== 1) {
                throw new SyntaxError(`@${decorator} array specification at index ${i} expects a single type.`);
            }
            type = type[0];
        }
        if (!$isFunction(type)) {
            throw new SyntaxError(`@${decorator} expects basic types, classes or protocols.`);
        }
    }
}
