import { $isFunction } from "./base2";
import { isDescriptor } from "./decorate";
import Metadata from "./metadata";
import Argument, { ArgumentFlags } from "./argument";

const designMetadataKey = Symbol("design-metadata"),
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
            const args = this.base(paramTypesKey, target, targetKey);
            if (args) {
                const returnType = Metadata.get(returnTypeKey, target, targetKey);
                return { args, returnType };
            }
            const propertyType = this.base(propertyTypeKey, target, targetKey);
            if (propertyType) return { propertyType };
            const returnType = this.base(returnTypeKey, target, targetKey);
            if (returnType) return { returnType };
            return $isFunction(target) && !targetKey
                 ? this.get(metadataKey, target.prototype, "constructor")
                 : null;
        }
        return this.base(metadataKey, target, targetKey);
    },
    getOwn(metadataKey, target, targetKey) {
        if (metadataKey === designMetadataKey) {
            const args = this.base(paramTypesKey, target, targetKey);
            if (args) {
                const returnType = Metadata.get(returnTypeKey, target, targetKey);
                return { args, returnType };
            }
            const propertyType = this.base(propertyTypeKey, target, targetKey);
            if (propertyType) return { propertyType };
            const returnType = this.base(returnTypeKey, target, targetKey);
            if (returnType) return { returnType };
            return $isFunction(target) && !targetKey
                 ? this.getOwn(metadataKey, target.prototype, "constructor")
                 : null;
        }
        return this.base(metadataKey, target, targetKey);       
    }
});

/**
 * Attaches argument/property metadata compatible with Typescript.
 * @method design
 */
export const design = DesignMetadata.decorator(designMetadataKey,
    (target, key, descriptor, types) => {
        if (!isDescriptor(descriptor)) {     
            const args = buildArguments(key);
            DesignMetadata.define(paramTypesKey, args, target);
            return;
        }
        const { value } = descriptor;
        if ($isFunction(value)) {
            const args = buildArguments(types);
            DesignMetadata.define(paramTypesKey, args, target, key); 
        } else if (types.length !== 1) {
            throw new SyntaxError(`@design for property '${key}' requires a single type to be specified.`);
        } else if (DesignMetadata.has(propertyTypeKey, target, key)) {
            throw new SyntaxError(`@design for property '${key}' should only be specified on getter or setter.`);
        } else {
            const args = buildArguments(types);
            if (args[0].flags != ArgumentFlags.None) {
                throw new SyntaxError(`@design for property '${key}' expects no qualifiers.`);
            }
            DesignMetadata.define(propertyTypeKey, args[0].type, target, key);
        }
    });

/**
 * Attaches method return metadata compatible with Typescript.
 * @method returns
 */
export const returns = DesignMetadata.decorator(designMetadataKey,
    (target, key, descriptor, args) => {
        if (!isDescriptor(descriptor)) {
            throw new SyntaxError(`@returns cannot be applied to classes.`);
        }            
        const { value } = descriptor;
        if ($isFunction(value)) {
            if (key === "constructor") {
                throw new SyntaxError(`@returns cannot be applied to constructors.`);
            }
            if (args.length != 1) {
                throw new SyntaxError(
                    `@returns for method '${key}' requires a single return type.`);
            }
            const returnType = args[0];
            if (!$isFunction(returnType)) {
                throw new SyntaxError(
                    `@returns for method '${key}' requires a valid return type.`);
            }
            DesignMetadata.define(returnTypeKey, returnType, target, key); 
        } else {
            throw new SyntaxError(`@returns ('${key}') cannot be applied to properties.`);
        }
    });

function buildArguments(args) {
    return args.map(arg => arg == null ? arg : new Argument(arg));   
}
