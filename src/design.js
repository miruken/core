import { $isFunction } from "./base2";
import { isDescriptor } from "./decorate";
import { TypeInfo, TypeFlags } from "./type-info";
import Metadata from "./metadata";

import "reflect-metadata";

const designMetadataKey = Symbol("design-metadata"),
      paramTypesKey     = "design:paramtypes",
      propertyTypeKey   = "design:type",
      returnTypeKey     = "design:returnType";

/**
 * Custom Metadata to bridge Typescript annotations.
 * @class DesignMetadata
 */
class DesignMetadata extends Metadata {
    static get(metadataKey, target, targetKey) {
        let meta = super.get(metadataKey, target, targetKey);
        if (!meta && metadataKey === designMetadataKey &&
            !this.hasOwn(metadataKey, target, targetKey)) {
            if ($isFunction(target) && !targetKey) {
                meta = this.getOwn(metadataKey, target.prototype, "constructor")
            }
            if (!meta) {
                meta = getDesignFromTypescript(target, targetKey);
            }  
        }
        return meta;
    }

    static getOwn(metadataKey, target, targetKey) {
        let meta = super.getOwn(metadataKey, target, targetKey);
        if (!meta && metadataKey === designMetadataKey) {
            if ($isFunction(target) && !targetKey) {
                meta = this.getOwn(metadataKey, target.prototype, "constructor")
            }
            if (!meta) {
                meta = getDesignFromTypescript(target, targetKey);
            } 
        }
        return meta;   
    }
}

function getDesignFromTypescript(target, targetKey) {
    let meta;
    const args = Reflect.getOwnMetadata(paramTypesKey, target, targetKey)
    if (args) {
        meta = { args: getTypeInfo(args) };
        const returnType = Reflect.getOwnMetadata(returnTypeKey, target, targetKey);
        if (returnType) {
            meta.returnType = TypeInfo.parse(returnType); 
        }
    } else {
        const propertyType = Reflect.getOwnMetadata(propertyTypeKey, target, targetKey);
        if (propertyType) {
            meta = { propertyType: TypeInfo.parse(propertyType) };
        } else {
            const returnType = Reflect.getOwnMetadata(returnTypeKey, target, targetKey);
            if (returnType) {
                meta = { returnType: TypeInfo.parse(returnType) };
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
            const meta     = design.getOrCreateOwn(target, "constructor", () => ({})),
                  metap    = design.getOrCreateOwn(target.prototype, "constructor", () => ({})),
                  args     = getTypeInfo(key, meta ? meta.args : null);
            meta.args = metap.args = args;
            return;
        }
        const { value } = descriptor;
        if ($isFunction(value)) {
            const meta     = design.getOrCreateOwn(target, key, () => ({})),
                  args     = getTypeInfo(types, meta ? meta.args : null);
            meta.args = args;            
        } else if (types.length !== 1) {
            throw new SyntaxError(`@design for property '${key}' expects a single property type.`);
        } else if (DesignMetadata.has(designMetadataKey, target, key)) {
            throw new SyntaxError(`@design for property '${key}' should only be specified on getter or setter.`);
        } else {
            const meta = design.getOrCreateOwn(target, key, () => ({})),
                  args = getTypeInfo(types, meta ? meta.args : null);
            meta.propertyType = args[0];
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
            const meta       = returns.getOrCreateOwn(target, key, () => ({})),
                  returnType = TypeInfo.parse(args[0]);
            meta.returnType = returnType;
        } else {
            throw new SyntaxError(`@returns ('${key}') cannot be applied to properties.`);
        }
    }); 

export const type     = createTypeInfoDecorator();
export const all      = createTypeInfoDecorator(TypeFlags.Array);
export const exact    = createTypeInfoDecorator(TypeFlags.Invariant);
export const lazy     = createTypeInfoDecorator(TypeFlags.Lazy);
export const optional = createTypeInfoDecorator(TypeFlags.Optional);

function createTypeInfoDecorator(flags) {
    return function (target, key, parameterIndex) {
        if (typeof key == "string" && typeof parameterIndex == "number") {
            return decorator(target, key, parameterIndex, null, flags);
        }
        return function () {
            const f = (flags || TypeFlags.None).addFlag(key || TypeFlags.None);
            return decorator(...arguments, target, f);
        }
    };
    function decorator(target, key, parameterIndex, type, flags) {
        const signature = design.getOrCreateOwn(target, key, () => ({})),
              typeInfo  = type ? TypeInfo.parse(type) : new TypeInfo(type, flags),
              args      = signature.args;

        if (type && flags) {
            typeInfo.flags = typeInfo.flags.addFlag(flags);
        }

        if (args) {
            const arg = args[parameterIndex];
            if (arg) {
                arg.merge(typeInfo);
            } else {
                args[parameterIndex] = typeInfo;
            }
        } else {
            signature.args = [];
            signature.args[parameterIndex] = typeInfo;
        }
    };
}

function getTypeInfo(types, args) {
    return types.map((type, index) => {
        let otherInfo;
        if (args) otherInfo = args[index];
        if (type == null) return otherInfo;
        const typeInfo = TypeInfo.parse(type);
        return otherInfo == null ? typeInfo
             : otherInfo.merge(typeInfo);
    });   
}

export default design;
