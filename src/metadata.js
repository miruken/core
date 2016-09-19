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
    getOrCreateOwn(metadataKey, metadataType, target, targetKey) {
        let metadata = Reflect.getOwnMetadata(metadataKey, target, targetKey);
        if (metadata === undefined) {
            metadata = new metadataType();
            Reflect.defineMetadata(metadataKey, metadata, target, targetKey);
        }
        return metadata;
    },
    define(metadataKey, metadata, target, targetKey) {
        Reflect.defineMetadata(metadataKey, metadata, target, targetKey);
    },
    copy(source, target) {
        this.copyKey(source, target);
        Reflect.ownKeys(source).forEach(targetKey => this.copyKey(source, target, targetKey));
    },
    copyKey(source, target, targetKey) {
        const metadataKeys = Reflect.getOwnMetadataKeys(source, targetKey);
        metadataKeys.forEach(metadataKey => {
            const metadata = Reflect.getOwnMetadata(metadataKey, source, targetKey);
            Reflect.defineMetadata(metadataKey, metadata, target, targetKey);
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
