import {
    Base, Module, Undefined,
    typeOf, getPropertyDescriptors
} from './base2';

import {
    Delegate, ObjectDelegate, ArrayDelegate
} from './delegate';

import { decorate } from './decorate';

import {
    $isSomething, $isNothing, $isString,
    $isFunction, $isObject, $isSymbol,
    $flatten, $merge, $match
} from './util';

const baseExtend      = Base.extend,
      baseImplement   = Base.implement,
      baseProtoExtend = Base.prototype.extend,
      metadataMap     = new WeakMap();

const { defineProperty, getOwnPropertyDescriptor } = Object,
      { ownKeys } = Reflect;

/**
 * Declares methods and properties independent of a class.
 * <pre>
 *    var Auditing = Protocol.extend({
 *        get level() {},
 *        record(activity) {}
 *    })
 * </pre>
 * @class Protocol
 * @constructor
 * @param   {Delegate}  delegate        -  delegate
 * @param   {boolean}   [strict=false]  -  true if strict, false otherwise
 * @extends Base
 */
const ProtocolGet      = Symbol(),
      ProtocolSet      = Symbol(),
      ProtocolInvoke   = Symbol(),
      ProtocolDelegate = Symbol(),
      ProtocolStrict   = Symbol();

export const Protocol = Base.extend({
    constructor(delegate, strict) {
        if ($isNothing(delegate)) {
            delegate = new Delegate();
        } else if ((delegate instanceof Delegate) === false) {
            if ($isFunction(delegate.toDelegate)) {
                delegate = delegate.toDelegate();
                if ((delegate instanceof Delegate) === false) {
                    throw new TypeError("'toDelegate' method did not return a Delegate.");
                }
            } else if (Array.isArray(delegate)) {
                delegate = new ArrayDelegate(delegate);
            } else {
                delegate = new ObjectDelegate(delegate);
            }
        }
        Object.defineProperties(this, {
            [ProtocolDelegate]: { value: delegate, writable: false },            
            [ProtocolStrict]:   { value: !!strict, writable: false }
        });
    },
    [ProtocolGet](key) {
        const delegate = this[ProtocolDelegate];
        return delegate && delegate.get(this.constructor, key, this[ProtocolStrict]);
    },
    [ProtocolSet](key, value) {
        const delegate = this[ProtocolDelegate];            
        return delegate && delegate.set(this.constructor, key, value, this[ProtocolStrict]);
    },
    [ProtocolInvoke](methodName, args) {
        const delegate = this[ProtocolDelegate];                        
        return delegate && delegate.invoke(this.constructor, methodName, args, this[ProtocolStrict]);
    }
}, {
    /**
     * Determines if `target` is a {{#crossLink "Protocol"}}{{/crossLink}}.
     * @static
     * @method isProtocol
     * @param   {Any}      target    -  target to test
     * @returns {boolean}  true if the target is a Protocol.
     */
    isProtocol(target) {
        return target && (target.prototype instanceof Protocol);
    },
    /**
     * Determines if `target` conforms to this protocol.
     * @static
     * @method isAdoptedBy
     * @param   {Any}      target    -  target to test
     * @returns {boolean}  true if the target conforms to this protocol.
     */
    isAdoptedBy(target) {
        if (this === target || (target && target.prototype instanceof this)) {
            return true;
        }
        const meta = $meta(target);
        return !!(meta && meta.conformsTo(this));
    },
    /**
     * Marks `target` as conforming to this protocol.
     * @static
     * @method adoptBy
     * @param   {Any}      target  -  conforming target
     * @returns {boolean}  true if the this protocol could be adopted.
     */    
    adoptBy(target) {
        const meta = $meta(target);        
        if (!(meta && meta.adoptProtocol(this))) {
            return false;
        }
        if ($isFunction(target.protocolAdopted)) {
            target.protocolAdopted(this);
        }
        return true;
    },
    /**
     * Notifies the `protocol` has been adopted.
     * @statics protocolAdopted
     * @method 
     * @param   {Protocol} protocol  -  protocol adopted
     */    
    protocolAdopted(protocol) {
        const prototype     = this.prototype,
              protocolProto = Protocol.prototype,
              props         = getPropertyDescriptors(protocol.prototype);
        ownKeys(props).forEach(key => {
            if (getPropertyDescriptors(protocolProto, key) ||
                getPropertyDescriptors(prototype, key)) return;
            defineProperty(prototype, key, props[key]);            
        });        
    },
    /**
     * Creates a protocol binding over the object.
     * @static
     * @method coerce
     * @param   {Object} object  -  object delegate
     * @returns {Object} protocol instance delegating to object. 
     */
    coerce(object, strict) { return new this(object, strict); }
});

/**
 * Determines if `protocol` is a protocol.
 * @method $isProtocol
 * @param    {Any}     protocol  - target to test
 * @returns  {boolean} true if a protocol.
 * @for miruken-core.$
 */
export const $isProtocol = Protocol.isProtocol;

function _protocol(target) {
    if ($isFunction(target)) {
        target = target.prototype;
    }
    ownKeys(target).forEach(key => {
        if (key === 'constructor') return;
        const descriptor = getOwnPropertyDescriptor(target, key);
        if (!descriptor.enumerable) return;
        if ($isFunction(descriptor.value)) {
            descriptor.value = function (...args) {
                return this[ProtocolInvoke](key, args);
            };
        } else {
            const isSimple = descriptor.hasOwnProperty('value')
                          || descriptor.hasOwnProperty('initializer');
            if (isSimple) {
                delete descriptor.value;
                delete descriptor.writable;
            }
            if (descriptor.get || isSimple) {
                descriptor.get = function () {
                    return this[ProtocolGet](key);
                };
            }
            if (descriptor.set || isSimple) {
                descriptor.set = function (value) {
                    return this[ProtocolSet](key, value);
                }
            }
        }
        defineProperty(target, key, descriptor);                
    });
}

/**
 * Marks a class as a {{#crossLink "Protocol"}}{{/crossLink}}.
 * @method protocol
 * @param  {Array}  args  -  protocol args
 */
export function protocol(...args) {
    if (args.length === 0) {
        return function () {
            return _protocol.apply(null, arguments);
        };
    }
    return _protocol(...args);
}

/**
 * Marks a class or protocol as conforming to one or more
 * {{#crossLink "Protocol"}}{{/crossLink}}s.
 * @method conformsTo
 * @param    {Array}    protocols  -  conforming protocols
 * @returns  {Function} the conformsTo decorator.
 */
export function conformsTo(...protocols) {
    protocols = $flatten(protocols, true);
    if (!protocols.every($isProtocol)) {
        throw new TypeError("Only Protocols can be conformed to");
    }
    return protocols.length === 0 ? Undefined : adopt;
    function adopt(target) {
        protocols.forEach(protocol => protocol.adoptBy(target));
    }
}

/**
 * Decorates a class with behaviors to mix in.
 * @method mixin
 * @param    {Array}    ...behaviors  -  behaviors
 * @returns  {Function} the mixin decorator.
 */
export function mixin(...behaviors) {
    behaviors = $flatten(behaviors, true);
    return function (target) {
        if (behaviors.length > 0 && $isFunction(target.implement)) {
            behaviors.forEach(b => target.implement(b));
        }
    };
}

/**
 * Base class for all metadata.
 * @class Metadata
 * @constructor
 * @param  {Metadata}  [parent]  - parent metadata
 * @extends Base
 */
export const Metadata = Base.extend({
    constructor(parent)  {
        let _parent = parent,
            _protocols, _metadata, _extensions;
        this.extend({
            /**
             * Gets/sets the parent metadata.
             * @property {Metadata} parent
             */
            get parent() { return _parent; },
            set parent(value) { _parent = value; },
            /**
             * Gets the own protocols.
             * @property {Array} ownProtocols
             */
            get ownProtocols() {
                return _protocols ? _protocols.slice() : [];
            },
            /**
             * Gets all conforming protocools.
             * @property {Array} protocols
             */
            get protocols() {
                const protocols = this.ownProtocols,
                      declared  = protocols.slice();
                if (_parent) {
                    _parent.protocols.forEach(addProtocol);
                }
                declared.forEach(p => $meta(p).protocols.forEach(addProtocol));
                if (_extensions) {
                    _extensions.forEach(ext => ext.protocols.forEach(addProtocol));
                }
                function addProtocol(protocol) {
                    if (protocols.indexOf(protocol) < 0) {
                        protocols.push(protocol);
                    }
                }
                return protocols;
            },
            /**
             * Marks the metadata as conforming to the `protocol`.
             * @method adoptProtocol
             * @param  {Protocol}  protocol  -  protocol to adopt
             * @returns  {boolean} true if not already adopted.
             */
            adoptProtocol(protocol) {
                if (!$isProtocol(protocol) ||
                    (_protocols && _protocols.indexOf(protocol) >= 0)) {
                    return false;
                }
                (_protocols || (_protocols = [])).push(protocol);
                return true;                    
            },
            /**
             * Determines if the metadata conforms to the `protocol`.
             * @method conformsTo
             * @param   {Protocol} protocol -  protocols to test
             * @returns {boolean}  true if the metadata includes the protocol.
             */
            conformsTo(protocol) {
                return $isProtocol(protocol)
                    && ((_protocols && _protocols.some(p => protocol.isAdoptedBy(p)))
                    ||  (_extensions && _extensions.some(e => e.conformsTo(protocol)))
                    ||  !!(_parent && _parent.conformsTo(protocol)));
                
            },
            /**
             * Extends the instance represented by this metadata.
             * @method extendInstance
             * @param   {Object}           object   -  instance
             * @param   {string | Object}  key      -  key or object literal
             * @param   {Any}              [value]  -  key value if key is string
             * @returns {Object} the instance.
             */
            extendInstance(object, key, value) {
                if (!key) return object;
                const numArgs = arguments.length;
                if ( numArgs === 2) {
                    if (object instanceof Protocol) {
                        key = protocol(key) || key;
                    }
                    this.addExtension($meta(key));
                    return baseProtoExtend.call(object, key);
                }
                return baseProtoExtend.call(object, key, value);
            },
            /**
             * Traverses the metadata from top to bottom.
             * @method traverseTopDown
             * @param  {Function}  visitor  -  receives metadata
             */            
            traverseTopDown(visitor) {
                if (!visitor) return;
                if (_extensions) {
                    let i = _extensions.length;
                    while (--i >= 0) {
                        if (visitor(_extensions[i])) return;
                    }
                }
                if (visitor(this)) return;
                if (_protocols) {
                    let i = _protocols.length;
                    while (--i >= 0) {
                        if (visitor($meta(_protocols[i]))) return;
                    }                    
                }
                if (_parent) {
                    _parent.traverseTopDown(visitor);
                }
            },
            /**
             * Traverses the metadata from bottom to top.
             * @method traverseBottomUp
             * @param  {Function}  visitor  -  receives metadata
             */                        
            traverseBottomUp(visitor) {
                if (!visitor) return;
                if (_parent) {
                    _parent.traverseTopDown(visitor);
                }
                if (_protocols) {
                    let i = _protocols.length;
                    while (--i >= 0) {
                        if (visitor($meta(_protocols[i]))) return;
                    }                    
                }                
                if (visitor(this)) return;                
                if (_extensions) {
                    let i = _extensions.length;
                    while (--i >= 0) {
                        if (visitor(_extensions[i])) return;
                    }
                }
            },
            /**
             * Gets the own metadata for `key` and `criteria`.
             * @method getOwnMetadata
             * @param    {Any}     [key]     -  key selector
             * @param    {Object}  criteria  -  metadata criteria
             * @returns  {Object}  matching metadata.
             */
            getOwnMetadata(key, criteria) {
                let metadata,
                    protocols = this.ownProtocols;
                if ($isObject(key)) {
                    [key, criteria] = [undefined, key];
                } else {
                    key = Metadata.getInternalKey(key);
                }
                if (protocols) {
                    metadata = protocols.reduce((result, p) => {
                        const keyMeta = this.getProtocolMetadata(p, key, criteria);
                        return keyMeta ? $merge(result || {}, keyMeta) : result;
                    }, metadata);
                }
                if (_metadata) {
                    const addKey = !key,
                          keys   = key ? [key] : ownKeys(_metadata);
                    keys.forEach(key => {
                        let keyMeta = _metadata[key];
                        if (keyMeta) {
                            if (criteria) {
                                if (!$match(keyMeta, criteria, m => keyMeta = m)) {
                                    return;
                                }
                            }
                            if (addKey) {
                                keyMeta = { [key]: keyMeta };
                            }
                            metadata = $merge(metadata || {}, keyMeta);
                        }
                    });
                }                
                if (_extensions) {
                    metadata = _extensions.reduce((result, ext) => {
                        const keyMeta = ext.getMetadata(key, criteria);
                        return keyMeta ? $merge(result || {}, keyMeta) : result;
                    }, metadata);  
                }
                return metadata;                
            },
            /**
             * Gets the metadata for `key` and `criteria`.
             * @method getMetadata
             * @param    {Any}     [key]     -  key selector
             * @param    {Object}  criteria  -  metadata criteria
             * @returns  {Object}  matching metadata.
             */
            getMetadata(key, criteria) {
                const parent = _parent && _parent.getMetadata(key, criteria),
                      own    = this.getOwnMetadata(key, criteria);
                return parent ? $merge(parent, own) : own;
            },
            getProtocolMetadata(protocol, key, criteria) {
                const protoMeta = $meta(protocol.prototype);
                return protoMeta.getMetadata(key, criteria);
            },
            /**
             * Defines metadata to a property `key`.
             * @method defineMetadata
             * @param    {Any}      [key]       -  property key
             * @param    {Object}   [metadata]  -  metadata
             * @param    {boolean}  [replace]   -  true if replace
             * @returns  {Metadata} current metadata.
             * @chainable
             */
            defineMetadata(key, metadata, replace) {
                if ($isObject(key)) {
                    metadata = key;
                    replace  = metadata;
                    key      = null;
                }
                if (metadata) {
                    if (key) {
                        defineKey(key, metadata, replace);
                    } else {
                        ownKeys(metadata).forEach(
                            k => defineKey(k, metadata[k], replace));
                    }
                }
                function defineKey(key, metadata, replace)
                {
                    key = Metadata.getInternalKey(key);
                    const meta = _metadata || (_metadata = {});
                    if (replace) {
                        Object.assign(meta, {
                            [key]: Object.assign(meta[key] || {}, metadata)
                        });
                    } else {
                        $merge(meta, { [key]: metadata });
                    }                    
                }
                return this;
            },
            /**
             * Adds the `extension` to the metadata.
             * @method addExtension
             * @param  {Metadata}  extension  -  extension
             * @returns  {Metadata} current metadata.
             * @chainable
             */
            addExtension(extension) {
                if (extension) {
                    (_extensions || (_extensions = [])).push(extension);
                }
                return this;
            }
        });
    }
}, {
    constructorKey: Symbol(),
    getInternalKey(key) {
        return key === 'constructor' ? this.constructorKey : key;
    },
    getExternalKey(key) {
        return key === this.constructorKey ? 'constructor' : key;
    }
});

/**
 * Class level metadata.
 * @class ClassMetadata
 * @constructor
 * @param  {Function}  type  - class type
 * @extends Metadata
 */
export const ClassMetadata = Metadata.extend({
    constructor(type) {
        if (!$isFunction(type)) {
            throw new TypeError("ClassMetadata can only be created for classes");
        }
        const superType = Object.getPrototypeOf(type);
        this.base($meta(superType));
        this.extend({
            /**
             * Gets the associated type.
             * @property {Function} type
             */
            get type() { return type; },
            get superType() { return superType; },
            get ownProtocols() {
                return $meta(type.prototype).ownProtocols;
            },
            get protocols() {
                return $meta(type.prototype).protocols;
            },
            adoptProtocol(protocol) {
                $meta(type.prototype).adoptProtocol(protocol);
                return this;
            },
            conformsTo(protocol) {
                return $meta(type.prototype).conformsTo(protocol);                
            },
            getProtocolMetadata(protocol, key, criteria) {
                // Protocol metadata is for instances
            },
            /**
             * Creates a sub-class of the represented class.
             * @method extendClass
             * @param   {Array}    args  -  constraints
             * @returns {Function} the newly created sub-class.
             */                                                                
            extendClass(...args) {
                let constraints = args, decorators = [];
                if (type === Protocol) {
                    decorators.push(protocol);
                } if ($isProtocol(type)) {
                    decorators.push(protocol, conformsTo(type));
                }
                if (args.length > 0 && Array.isArray(args[0])) {
                    constraints = args.shift();
                }
                while (constraints.length > 0) {
                    const constraint = constraints[0];
                    if (!constraint) {
                        break;
                    } else if ($isProtocol(constraint)) {
                        decorators.push(conformsTo(constraint));
                    } else if (constraint.prototype instanceof Base ||
                               constraint.prototype instanceof Module) {
                        decorators.push(mixin(constraint));
                    } else if ($isFunction(constraint)) {
                        decorators.push(constraint);
                    }
                    else {
                        break;
                    }
                    constraints.shift();
                }
                let members      = args.shift() || {},
                    classMembers = args.shift() || {},
                    derived      = baseExtend.call(type, members, classMembers),
                    derivedProto = derived.prototype,
                    parentMeta   = $meta(Object.getPrototypeOf(derivedProto)),
                    derivedMeta  = $meta(members);
                derivedMeta.parent = parentMeta;
                defineMetadata(derivedProto, derivedMeta);
                if (decorators.length > 0) {
                    decorators.forEach(d => derived = d(derived) || derived);
                }                
                return derived;                    
            },
            /**
             * Enhances the class represented by this metadata.
             * @method enhanceClass
             * @param   {Any} source  -  class function or object literal
             * @returns {Function} the class.
             */
            enhanceClass(source) {
                if (source) {
                    if ($isProtocol(type) && $isObject(source)) {
                        source = protocol(source) || source;
                    }
                    $meta(type.prototype).addExtension($meta(source));
                }
                return baseImplement.call(type, source);
            }            
        });
    }
});

const SUPPRESS_METADATA = [ Object, Function, Array ];

Base.extend = function () {
    const meta = $meta(this);
    return meta? meta.extendClass(...arguments)
         : baseExtend.apply(this, arguments);
};

Base.implement = function () {
    const meta = $meta(this);
    return meta ? meta.enhanceClass(...arguments)
         : baseImplement.apply(this, arguments);
}

Base.prototype.extend = function () {
    const meta = $meta(this);
    return meta ? meta.extendInstance(this, ...arguments)
         : baseProtoExtend.apply(this, arguments);
}

/**
 * Protocol base requiring conformance to match methods.
 * @class StrictProtocol
 * @constructor
 * @param   {Delegate}  delegate       -  delegate
 * @param   {boolean}   [strict=true]  -  true ifstrict, false otherwise
 * @extends miruekn.Protocol     
 */
export const StrictProtocol = Protocol.extend({
    constructor(proxy, strict) {
        this.base(proxy, (strict === undefined) || strict);
    }
});

/**
 * Gets the metadata associated with `target`.
 * @method
 * @param   {Function | Object}  target  -  target
 * @erturns {Metadata} target metadata.
 */
export function $meta(target) {
    if (target == null) return;
    const metadata = metadataMap.get(target);
    if (metadata) return metadata;
    if (target === Metadata || target instanceof Metadata ||
        target.prototype instanceof Metadata) return;    
    let i = SUPPRESS_METADATA.length;
    while (i--) {
        const ignore = SUPPRESS_METADATA[i];
        if (target === ignore || target === ignore.prototype) {
            return;
        }
    }
    let meta;    
    if ($isFunction(target)) {
        meta = new ClassMetadata(target);
    } else if ($isObject(target)) {
        const parent = Object.getPrototypeOf(target);
        meta = new Metadata($meta(parent));
    }
    if (meta) {
        defineMetadata(target, meta);
        return meta;
    }
}

function defineMetadata(target, metadata) {
    metadataMap.set(target, metadata);
}

/**
 * Determines if `clazz` is a class.
 * @method $isClass
 * @param    {Any}     clazz  - class to test
 * @returns  {boolean} true if a class (and not a protocol).
 */
export function $isClass(clazz) {
    if (!clazz || $isProtocol(clazz)) return false;    
    if (clazz.prototype instanceof Base) return true;
    const name = clazz.name;  // use Capital name convention
    return name && $isFunction(clazz) && isUpperCase(name.charAt(0));
}

/**
 * Gets the class `instance` belongs to.
 * @method $classOf
 * @param    {Object}  instance  - object
 * @returns  {Function} class of instance. 
 */
export function $classOf(instance) {
    return instance && instance.constructor;
}

function isUpperCase(char) {
    return char.toUpperCase() === char;
}
