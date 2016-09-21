import { Abstract, getPropertyDescriptors } from "./base2";
import { $isFunction } from "./util";
import "reflect-metadata";

/**
 * Provides an abstraction for meta-data management.
 * @class Metadata
 */
export const Metadata = Abstract.extend(null, {
    /**
     * Gets metadata on the prototype chain of an object or property.
     * @static
     * @method get
     * @param   {Any}  metadataKey  -  metadata key
     * @param   {Any}  target       -  originating target
     * @param   {Any}  [targetKey]  -  property key
     * @returns {Any} the metadata for the `metadataKey`. 
     */
    get(metadataKey, target, targetKey) {
        return target && Reflect.getMetadata(metadataKey, target, targetKey);
    },
    /**
     * Gets owning metadata of an object or property.
     * @static
     * @method getOwn
     * @param   {Any}  metadataKey  -  metadata key
     * @param   {Any}  target       -  owning target
     * @param   {Any}  [targetKey]  -  property key
     * @returns {Any} the metadata for the `metadataKey`. 
     */
    getOwn(metadataKey, target, targetKey) {
        return target && Reflect.getOwnMetadata(metadataKey, target, targetKey);
    },
    /**
     * Gets owning metadata of an object or property or lazily creates it.
     * @static
     * @method getOrCreateOwn
     * @param   {Any}       metadataKey  -  metadata key
     * @param   {Any}       target       -  owning target
     * @param   {Any}       [targetKey]  -  property key
     * @param   {Function}  creator      -  creates metadata if missing
     * @returns {Any} the metadata for the `metadataKey`. 
     */
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
    /**
     * Defines metadata on an object or property.
     * @static
     * @method define
     * @param   {Any}  metadataKey  -  metadata key
     * @param   {Any}  metadata     -  metadata value
     * @param   {Any}  target       -  owning target
     * @param   {Any}  [targetKey]  -  property key
     */
    define(metadataKey, metadata, target, targetKey) {
        Reflect.defineMetadata(metadataKey, metadata, target, targetKey);
    },
    /**
     * Removes metadata from an object or property.
     * @static
     * @method remove
     * @param   {Any}  metadataKey  -  metadata key
     * @param   {Any}  target       -  owning target
     * @param   {Any}  [targetKey]  -  property key
     */
    remove(metadataKey, target, targetKey) {
        Reflect.deleteMetadata(metadataKey, target, targetKey);
    },
    /**
     * Copies or replaces all metadata from `source` onto `target`.
     * @static
     * @method copyOwn
     * @param   {Any}  target  -  recieves metadata
     * @param   {Any}  source  -  provides metadata
     */
    copyOwn(target, source) {
        this.copyOwnKey(target, source);
        Reflect.ownKeys(source).forEach(sourceKey => this.copyOwnKey(target, source, sourceKey));
    },
    /**
     * Copies or replaces all `sourceKey` metadata from `source` onto `target`.
     * @static
     * @method copyOwnKey
     * @param   {Any}  target     -  recieves metadata
     * @param   {Any}  source     -  provides metadata
     * @param   {Any}  sourceKey  -  source property to copy from
     */
    copyOwnKey(target, source, sourceKey) {
        const metadataKeys = Reflect.getOwnMetadataKeys(source, sourceKey);
        metadataKeys.forEach(metadataKey => {
            const metadata = Reflect.getOwnMetadata(metadataKey, source, sourceKey);
            Reflect.defineMetadata(metadataKey, metadata, target, sourceKey);
        });
    },
    /**
     * Merges all metadata from `source` onto `target`.
     * @static
     * @method mergeOwn
     * @param   {Any}  target  -  recieves metadata
     * @param   {Any}  source  -  provides metadata
     */    
    mergeOwn(target, source) {
        this.mergeOwnKey(target, source);
        Reflect.ownKeys(source).forEach(sourceKey => this.mergeOwnKey(target, source, sourceKey));
    },
    /**
     * Merges all `sourceKey` metadata from `source` onto `target`.
     * @static
     * @method copyOwnKey
     * @param   {Any}  target     -  recieves metadata
     * @param   {Any}  source     -  provides metadata
     * @param   {Any}  sourceKey  -  source property to copy from
     */    
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
    /**
     * Collects metadata on the prototype chain of an object or property.
     * @static
     * @method collect
     * @param   {Any}       metadataKey  -  metadata key
     * @param   {Any}       target       -  originating target
     * @param   {Any}       [targetKey]  -  property key
     * @param   {Function}  collector    -  receives metadata.
     *                                      stops collecting if true is returned.
     * @returns {boolean} true if any `collector` returned true, false otherwise.
     */    
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
                return true;
            }
            target = Object.getPrototypeOf(target);
        }
        return false;
    },
    /**
     * Builds a metadata accessor for `metadataKey`.
     * @static
     * @method getter
     * @param   {Any}      metadataKey  -  metadata key
     * @param   {boolean}  [own]        -  restrict to owning properties
     * @returns {Function} metadata accessor bound to `metadataKey`.
     */
    getter(metadataKey, own) {
        return (target, targetKey, callback) => {
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
        };
    },
    /**
     * Builds a metadata collector for `metadataKey`.
     * @static
     * @method collector
     * @param   {Any}      metadataKey  -  metadata key
     * @returns {Function} metadata collector bound to `metadataKey`.
     */    
    collector(metadataKey) {
        return (target, targetKey, callback) => {
            if (!callback && $isFunction(targetKey)) {
                [targetKey, callback] = [null, targetKey];
            }
            if (!$isFunction(callback)) return;
            const targetKeys = targetKey ? [targetKey]
                : Reflect.ownKeys(getPropertyDescriptors(target)).concat("constructor");
            targetKeys.forEach(key => this.collect(metadataKey, target, key, callback))            
        };
    }
});

export default Metadata;
