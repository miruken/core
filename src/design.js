import { $isFunction } from "./base2";
import { isDescriptor } from "./decorate";
import { TypeInfo, TypeFlags } from "./type-info";
import Metadata from "./metadata";

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
        let meta = this.base(metadataKey, target, targetKey);
        if (!meta && metadataKey === designMetadataKey &&
            !this.hasOwn(metadataKey, target, targetKey)) {
            if ($isFunction(target) && !targetKey) {
                meta = this.getOwn(metadataKey, target.prototype, "constructor")
            }
            if (!meta) {
                meta = buildFromTypescriptDesign(target, targetKey);
            }  
        }
        return meta;
    },
    getOwn(metadataKey, target, targetKey) {
        let meta = this.base(metadataKey, target, targetKey);
        if (!meta && metadataKey === designMetadataKey) {
            if ($isFunction(target) && !targetKey) {
                meta = this.getOwn(metadataKey, target.prototype, "constructor")
            }
            if (!meta) {
                meta = buildFromTypescriptDesign(target, targetKey);
            } 
        }
        return meta;   
    }
});

function buildFromTypescriptDesign(target, targetKey) {
    let meta;
    const args = Metadata.getOwn(paramTypesKey, target, targetKey);
    if (args) {
        meta = { args: buildTypeInfo(args) };
        const returnType = Metadata.getOwn(returnTypeKey, target, targetKey);
        if (returnType) {
            meta.returnType = new TypeInfo(returnType); 
        }
    } else {
        const propertyType = Metadata.getOwn(propertyTypeKey, target, targetKey);
        if (propertyType) {
            meta = { propertyType: new TypeInfo(propertyType) };
        } else {
            const returnType = Metadata.getOwn(returnTypeKey, target, targetKey);
            if (returnType) {
                meta = { returnType: new TypeInfo(returnType) };
            }
        }
    }
    Metadata.define(designMetadataKey, meta, target, targetKey);
    return meta;
}

/**
 * Attaches argument/property metadata compatible with Typescript.
 * @method design
 */
export const design = DesignMetadata.decorator(designMetadataKey,
    (target, key, descriptor, types) => {
        if (!isDescriptor(descriptor)) {     
            const args     = buildTypeInfo(key),
                  rawTypes = args.map(t => t.type),
                  meta     = Metadata.getOrCreateOwn(
                    designMetadataKey, target, () => ({}));
            meta.args = args;
            DesignMetadata.define(paramTypesKey, rawTypes, target);
            return;
        }
        const { value } = descriptor;
        if ($isFunction(value)) {
            const args     = buildTypeInfo(types),
                  rawTypes = args.map(t => t.type),
                  meta     = Metadata.getOrCreateOwn(
                    designMetadataKey, target, key, () => ({}));
            meta.args = args;            
            DesignMetadata.define(paramTypesKey, rawTypes, target, key); 
        } else if (types.length !== 1) {
            throw new SyntaxError(`@design for property '${key}' expects a single property type.`);
        } else if (DesignMetadata.has(propertyTypeKey, target, key)) {
            throw new SyntaxError(`@design for property '${key}' should only be specified on getter or setter.`);
        } else {
            const args = buildTypeInfo(types),
                  meta = Metadata.getOrCreateOwn(
                    designMetadataKey, target, key, () => ({}));
            meta.propertyType = args[0];
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
            if (args.length != 1 || args[0] == null) {
                throw new SyntaxError(
                    `@returns for method '${key}' expects a single return type.`);
            }
            const returnType = new TypeInfo(args[0]),
                  meta       = DesignMetadata.getOrCreateOwn(
                    designMetadataKey, target, key, () => ({}));
            meta.returnType = returnType;
            DesignMetadata.define(returnTypeKey, returnType.type, target, key); 
        } else {
            throw new SyntaxError(`@returns ('${key}') cannot be applied to properties.`);
        }
    }); 

function buildTypeInfo(types) {
    return types.map(t => t == null ? t : new TypeInfo(t));   
}
