import { Abstract, getPropertyDescriptors } from "./base2";
import { $isFunction } from "./util";
import { decorate } from "./decorate";
import "reflect-metadata";

/**
 * Provides an abstraction for meta-data management.
 * http://blog.wolksoftware.com/decorators-metadata-reflection-in-typescript-from-novice-to-expert-part-4
 * @class Metadata
 */
export const Metadata = Abstract.extend(null, {
    /**
     * Checks metadata on the prototype chain of an object or property.
     * @static
     * @method has
     * @param   {Any}     metadataKey  -  metadata key
     * @param   {Any}     target       -  originating target
     * @param   {Any}     [targetKey]  -  property key
     * @returns {boolean} true if found metadata for `metadataKey`. 
     */
    has(metadataKey, target, targetKey) {
        if (target) {
            return targetKey
                 ? Reflect.hasMetadata(metadataKey, target, targetKey)
                 : Reflect.hasMetadata(metadataKey, target);
        }
        return false;
    },
    /**
     * Checks metadata on the object or property.
     * @static
     * @method hasOwn
     * @param   {Any}     metadataKey  -  metadata key
     * @param   {Any}     target       -  originating target
     * @param   {Any}     [targetKey]  -  property key
     * @returns {boolean} true if owns metadata for `metadataKey`. 
     */
    hasOwn(metadataKey, target, targetKey) {
        if (target) {
            return targetKey
                 ? Reflect.hasOwnMetadata(metadataKey, target, targetKey)
                 : Reflect.hasOwnMetadata(metadataKey, target);
        }
        return false;
    },
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
        if (target) {
            return targetKey
                 ? Reflect.getMetadata(metadataKey, target, targetKey)
                 : Reflect.getMetadata(metadataKey, target);
        }
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
        if (target) {
            return targetKey
                 ? Reflect.getOwnMetadata(metadataKey, target, targetKey)
                 : Reflect.getOwnMetadata(metadataKey, target);
        }
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
            throw new TypeError("creator must be a function.");
        }
        let metadata = this.getOwn(metadataKey, target, targetKey);
        if (metadata === undefined) {
            metadata = creator(metadataKey, target, targetKey);
            this.define(metadataKey, metadata, target, targetKey);
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
        if (target) {
            return targetKey
                 ? Reflect.defineMetadata(metadataKey, metadata, target, targetKey)
                 : Reflect.defineMetadata(metadataKey, metadata, target);
        }
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
        if (target) {
            return targetKey
                 ? Reflect.deleteMetadata(metadataKey, target, targetKey)
                 : Reflect.deleteMetadata(metadataKey, target);
        }
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
            const metadata = this.getOwn(metadataKey, source, sourceKey);
            this.define(metadataKey, metadata, target, sourceKey);
        });
    },
    /**
     * Transfers all metadata from `source` onto `target`.
     * @static
     * @method copyOwn
     * @param   {Any}  target  -  recieves metadata
     * @param   {Any}  source  -  provides metadata
     */
    transferOwn(target, source) {
        this.transferOwnKey(target, source);
        Reflect.ownKeys(source).forEach(sourceKey => this.transferOwnKey(target, source, sourceKey));
    },    
    /**
     * Transfers all `sourceKey` metadata from `source` onto `target`.
     * @static
     * @method copyOwnKey
     * @param   {Any}  target     -  recieves metadata
     * @param   {Any}  source     -  provides metadata
     * @param   {Any}  sourceKey  -  source property to copy from
     */
    transferOwnKey(target, source, sourceKey) {
        const metadataKeys = Reflect.getOwnMetadataKeys(source, sourceKey);
        metadataKeys.forEach(metadataKey => {
            const metadata = this.getOwn(metadataKey, source, sourceKey);
            this.define(metadataKey, metadata, target, sourceKey);
            this.remove(metadataKey, source, sourceKey);
        });
    },    
    /**
     * Merges all metadata from `source` onto `target`.
     * @static
     * @method mergeOwn
     * @param   {Any}      target            -  recieves metadata
     * @param   {Any}      source            -  provides metadata
     * @param   {boolean}  removeFromSource  -  true to remove source metadata
     */    
    mergeOwn(target, source, removeFromSource) {
        this.mergeOwnKey(target, source, undefined, removeFromSource);
        Reflect.ownKeys(source).forEach(sourceKey => 
            this.mergeOwnKey(target, source, sourceKey, removeFromSource));
    },
    /**
     * Merges all `sourceKey` metadata from `source` onto `target`.
     * @static
     * @method mergeOwnKey
     * @param   {Any}      target            -  recieves metadata
     * @param   {Any}      source            -  provides metadata
     * @param   {Any}      sourceKey         -  source property to copy from
     * @param   {boolean}  removeFromSource  -  true to remove source metadata
     */    
    mergeOwnKey(target, source, sourceKey, removeFromSource) {
        const metadataKeys = Reflect.getOwnMetadataKeys(source, sourceKey);
        metadataKeys.forEach(metadataKey => {
            const targetMetadata = this.getOwn(metadataKey, target, sourceKey),
                  sourceMetadata = this.getOwn(metadataKey, source, sourceKey);
            if (targetMetadata && targetMetadata.merge) {
                targetMetadata.merge(sourceMetadata);
            } else {
                this.define(metadataKey, sourceMetadata, target, sourceKey);                
            }
            if (removeFromSource) {
                this.remove(metadataKey, source, sourceKey);
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
            throw new TypeError("collector must be a function.");
        }
        while (target) {
            const metadata = this.getOwn(metadataKey, target, targetKey);
            if (metadata && collector(metadata, metadataKey, target, targetKey)) {
                return true;
            }
            target = Object.getPrototypeOf(target);
        }
        return false;
    },
    /**
     * Builds a metadata decorator.
     * @static
     * @method decorator
     * @param  {Any}       metadataKey  -  metadata key
     * @param  {Function}  handler      -  handler function
     */    
    decorator(metadataKey, handler) {
        function decorator(...args) {
            return decorate(handler, args);
        }
        decorator.get         = _metadataGetter.bind(this, metadataKey, false);
        decorator.getOwn      = _metadataGetter.bind(this, metadataKey, true);
        decorator.getKeys     = _metadataKeyGetter.bind(this, metadataKey, false);
        decorator.getOwnKeys  = _metadataKeyGetter.bind(this, metadataKey, true);        
        decorator.collect     = _metadataCollector.bind(this, metadataKey);
        decorator.collectKeys = _metadataKeyCollector.bind(this, metadataKey);
        return decorator;
    }
});

function _metadataGetter(metadataKey, own, target, targetKey) {
    return own
         ? this.getOwn(metadataKey, target, targetKey)
         : this.get(metadataKey, target, targetKey);
}

function _metadataKeyGetter(metadataKey, own, target, callback) {
    let found = false;
    if (!$isFunction(callback)) return false;
    const keys = Reflect.ownKeys(own ? target : getPropertyDescriptors(target))
          .concat("constructor");
    keys.forEach(key => {
        const metadata = own
            ? this.getOwn(metadataKey, target, key)
            : this.get(metadataKey, target, key);
        if (metadata) {
            callback(metadata, key);
            found = true;
        }
    });
    return found;
}

function _metadataCollector(metadataKey, target, targetKey, callback) {
    if (!callback && $isFunction(targetKey)) {
        [targetKey, callback] = [null, targetKey];
    }
    if (!$isFunction(callback)) return;
    this.collect(metadataKey, target, targetKey, callback);
}

function _metadataKeyCollector(metadataKey, target, callback) {
    if (!$isFunction(callback)) return;
    const keys = Reflect.ownKeys(getPropertyDescriptors(target))
          .concat("constructor");
    keys.forEach(key => this.collect(metadataKey, target, key, callback));
}

