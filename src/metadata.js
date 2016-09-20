import { Base, getPropertyDescriptors } from "./base2";
import { $isFunction } from "./util";
import "reflect-metadata";

export const Metadata = Base.extend(null, {
    get(metadataKey, target, targetKey) {
        return target && Reflect.getMetadata(metadataKey, target, targetKey);
    },
    getOwn(metadataKey, target, targetKey) {
        return target && Reflect.getOwnMetadata(metadataKey, target, targetKey);
    },    
    getOrCreateOwn(metadataKey, target, targetKey, creator) {
        if (arguments.length === 3) {
            creator   = targetKey;
            targetKey = undefined;
        }        
        if (!$isFunction(creator)) {
            throw new TypeError("creator must be a function");
        }
        let metadata = Reflect.getOwnMetadata(metadataKey, target, targetKey);
        if (metadata === undefined) {
            metadata = creator(metadataKey, target, targetKey);
            Reflect.defineMetadata(metadataKey, metadata, target, targetKey);
        }
        return metadata;
    },
    define(metadataKey, metadata, target, targetKey) {
        Reflect.defineMetadata(metadataKey, metadata, target, targetKey);
    },
    remove(metadataKey, target, targetKey) {
        Reflect.deleteMetadata(metadataKey, target, targetKey);
    },    
    copyOwn(target, source) {
        this.copyOwnKey(target, source);
        Reflect.ownKeys(source).forEach(sourceKey => this.copyOwnKey(target, source, sourceKey));
    },
    copyOwnKey(target, source, sourceKey) {
        const metadataKeys = Reflect.getOwnMetadataKeys(source, sourceKey);
        metadataKeys.forEach(metadataKey => {
            const metadata = Reflect.getOwnMetadata(metadataKey, source, sourceKey);
            Reflect.defineMetadata(metadataKey, metadata, target, sourceKey);
        });
    },
    mergeOwn(target, source) {
        this.mergeOwnKey(target, source);
        Reflect.ownKeys(source).forEach(sourceKey => this.mergeOwnKey(target, source, sourceKey));
    },
    mergeOwnKey(target, source, sourceKey) {
        const metadataKeys = Reflect.getOwnMetadataKeys(source, sourceKey);
        metadataKeys.forEach(metadataKey => {
            const targetMetadata = Reflect.getOwnMetadata(metadataKey, target, sourceKey),
                  sourceMetadata = Reflect.getOwnMetadata(metadataKey, source, sourceKey);
            if (targetMetadata && targetMetadata.merge) {
                targetMetadata.merge(sourceMetadata);x
            } else {
                Reflect.defineMetadata(metadataKey, sourceMetadata, target, sourceKey);                
            }
        });
    },    
    match(metadataKey, target, targetKey, matcher) {
        if (arguments.length === 3) {
            matcher   = targetKey;
            targetKey = undefined;
        }
        if (!$isFunction(matcher)) {
            throw new TypeError("matcher must be a function");
        }
        while (target) {
            const metadata = Reflect.getOwnMetadata(metadataKey, target, targetKey);
            if (metadata && matcher(metadata, metadataKey, target, targetKey)) {
                return true;
            }
            target = Object.getPrototypeOf(target);
        }
        return false;
    },
    collect(metadataKey, target, targetKey, collector) {
        if (arguments.length === 3) {
            collector = targetKey;
            targetKey = undefined;
        }
        if (!$isFunction(collector)) {
            throw new TypeError("collector must be a function");
        }
        while (target) {
            const metadata = Reflect.getOwnMetadata(metadataKey, target, targetKey);
            if (metadata && collector(metadata, metadataKey, target, targetKey)) {
                return;
            }
            target = Object.getPrototypeOf(target);
        }
    },
    getter(metadataKey, own) {
        return function (target, targetKey, callback) {
            if (!callback && $isFunction(targetKey)) {
                [targetKey, callback] = [null, targetKey];
            }
            if (!$isFunction(callback)) return;
            const targetKeys = targetKey ? [targetKey]
                : Reflect.ownKeys(own ? target : getPropertyDescriptors(target))
                         .concat("constructor");
            targetKeys.forEach(key => {
                const metadata = own
                    ? Reflect.getOwnMetadata(metadataKey, target, key)
                    : Reflect.getMetadata(metadataKey, target, key);
                if (metadata) {
                    callback(metadata, key);
                }                
            });
        }
    }
});

export default Metadata;
