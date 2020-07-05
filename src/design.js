import { 
    emptyArray, $isNothing, $isFunction
} from "./base2";
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
        meta = { args: mergeTypeInfo(args) };
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
        if ($isNothing(descriptor)) {     
            const meta  = design.getOrCreateOwn(target, "constructor", () => ({})),
                  metap = design.getOrCreateOwn(target.prototype, "constructor", () => ({})),
                  args  = mergeTypeInfo(types, meta ? meta.args : null);
            meta.args = metap.args = args;
            return;
        }
        const { value } = descriptor;
        if ($isFunction(value)) {
            const meta = design.getOrCreateOwn(target, key, () => ({})),
                  args = mergeTypeInfo(types, meta ? meta.args : null);
            meta.args = args;            
        } else if (types.length !== 1) {
            throw new SyntaxError(`@design for property '${key}' expects a single property type.`);
        } else if (DesignMetadata.has(designMetadataKey, target, key)) {
            throw new SyntaxError(`@design for property '${key}' should only be specified on getter or setter.`);
        } else {
            const meta = design.getOrCreateOwn(target, key, () => ({})),
                  args = mergeTypeInfo(types, meta ? meta.args : null);
            meta.propertyType = args[0];
        }
    });

/**
 * Attaches method return metadata compatible with Typescript.
 * @method returns
 */
export const returns = DesignMetadata.decorator(designMetadataKey,
    (target, key, descriptor, args) => {
        if ($isNothing(descriptor)) {
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

export const type     = createTypeInfoFlagsDecorator();
export const all      = createTypeInfoFlagsDecorator(TypeFlags.Array);
export const exact    = createTypeInfoFlagsDecorator(TypeFlags.Invariant);
export const lazy     = createTypeInfoFlagsDecorator(TypeFlags.Lazy);
export const optional = createTypeInfoFlagsDecorator(TypeFlags.Optional);

function createTypeInfoFlagsDecorator(typeFlags) {
    return createTypeInfoDecorator((key, typeInfo, [type, flags]) => {
        if (type) {
            typeInfo.merge(TypeInfo.parse(type));
        }
        if (typeFlags) {
            typeInfo.flags = typeInfo.flags.addFlag(typeFlags);
        }
        if (flags) {
            typeInfo.flags = typeInfo.flags.addFlag(flags);
        }
    });
}

export function createTypeInfoDecorator(configure) {
    if (!$isFunction(configure)) {
        throw new TypeError("The configure argument must be a function.");
    }
    return function (target, key, parameterIndex) {
        if (typeof key == "string" && typeof parameterIndex == "number") {
            return decorator(target, key, parameterIndex, emptyArray);
        }
        const args = [...arguments];
        return function () {
            return decorator(...arguments, args);
        }
    };
    function decorator(target, key, parameterIndex, configArgs) {
        const signature = design.getOrCreateOwn(target, key, () => ({})),
              args      = signature.args || [],
              typeInfo  = args[parameterIndex] || (args[parameterIndex] = new TypeInfo());      

        configure(key, typeInfo, configArgs);

        if (!signature.args) {
            signature.args = args;
        }
    };
}

function mergeTypeInfo(types, args) {
    const result = types.map((type, index) => {
        let otherInfo;
        if (args) otherInfo = args[index];
        if (type == null) return otherInfo;
        const typeInfo = TypeInfo.parse(type);
        return otherInfo == null ? typeInfo : otherInfo.merge(typeInfo);
    });
    if (args && args.length > types.length) {
        for (let i = types.length; i < args.length; ++i) {
            result.push(args[i]);
        }
    }
    return result;
}

export default design;
