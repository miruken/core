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

const baseExtend        = Base.extend,
      baseImplement     = Base.implement,
      baseProtoExtend   = Base.prototype.extend,
      MetadataSymbol    = Symbol.for('miruken.$meta');

const { defineProperty, getOwnPropertyDescriptor, isFrozen } = Object,
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
     * @method adoptedBy
     * @param   {Any}      target    -  target to test
     * @returns {boolean}  true if the target conforms to this protocol.
     */
    adoptedBy(target) {
        return $meta(target).conformsTo(this);
    },
    /**
     * Notifies the `protocol` has been adopted.
     * @staticsisProto
     * @method adoptedBy
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
            const isSimple = descriptor.hasOwnProperty('value');
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
 * @param    {Array}    args  -  protocol args
 * @returns  {Function} the protocol decorator.
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
    if (protocols.length === 0) {
        return Undefined;
    }
    return function (target) {
        const meta = $meta(target);
        if (meta) {
            meta.adoptProtocol(protocols);
        }
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
            for (let behavior of behaviors) {
                target.implement(behavior);
            }
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
            _type, _protocols,
            _metadata, _extensions;
        this.extend({
            /**
             * Gets the parent metadata.
             * @property {Metadata} parent
             */
            get parent() { return _parent; },
            /**
             * Gets/sets the associated type.
             * @property {Function} type
             */
            get type() {
                return _type || (_parent && _parent.type);
            },
            set type(value) {
                if (_type != value && $isFunction(value)) {
                    _type   = value;
                    _parent = $meta(Object.getPrototypeOf(_type));
                }
            },
            /**
             * Returns true if this metadata represents a Protocol.
             * @property {boolean} isProtocol
             */
            get isProtocol() {
                return Protocol.isProtocol(_type);
            },
            /**
             * Gets the declared protocols.
             * @property {Array} protocols
             */
            get protocols() {
                return _protocols ? _protocols.slice() : [];
            },
            /**
             * Gets all conforming protocools.
             * @property {Array} allProtocols
             */
            get allProtocols() {
                const protocols = this.protocols,
                      declared  = protocols.slice();
                if (_parent) {
                    _parent.allProtocols.forEach(addProtocol);
                }                
                for (let protocol of declared) {
                    $meta(protocol).allProtocols.forEach(addProtocol);
                }
                if (_extensions) {
                    for (let extension of _extensions) {
                        extension.allProtocols.forEach(addProtocol);
                    }
                }
                function addProtocol(protocol) {
                    if (protocols.indexOf(protocol) < 0) {
                        protocols.push(protocol);
                    }
                }
                return protocols;
            },
            /**
             * Adopts one or more `protocols` by the metadata.
             * @method adoptProtocol
             * @param  {Array}  protocols  -  protocols to adopt
             * @returns  {Metadata} current metadata.
             * @chainable
             */
            adoptProtocol(...protocols) {
                protocols = $flatten(protocols, true);
                if (!protocols || protocols.length == 0) {
                    return this;
                }
                const type       = this.type,
                      notifyType = type && $isFunction(type.protocolAdopted);
                _protocols = _protocols || [];
                for (let protocol of protocols) {
                    if ((protocol.prototype instanceof Protocol) &&
                        (_protocols.indexOf(protocol) < 0)) {
                        _protocols.push(protocol);
                        if (notifyType) {
                            type.protocolAdopted(protocol);
                        }
                    }
                }
                return this;
            },
            /**
             * Determines if the metadata conforms to the `protocol`.
             * @method conformsTo
             * @param   {Protocol} protocol -  protocols to test
             * @returns {boolean}  true if the metadata includes the protocol.
             */
            conformsTo(protocol) {
                if (!(protocol && protocol.prototype instanceof Protocol)) {
                    return false;
                }
                const type = this.type;                
                return (type && ((protocol === type) || (type.prototype instanceof protocol)))
                    || (_protocols && _protocols.some(p => protocol === p || p.conformsTo(protocol)))
                    || (_extensions && _extensions.some(e => e.conformsTo(protocol)))
                    || !!(_parent && _parent.conformsTo(protocol));
                
            },
            /**
             * Creates a sub-class of the current class metadata.
             * @method subClass
             * @param   {Array}    args  -  constraints
             * @returns {Function} the newly created sub-class.
             */                                                                
            subClass(...args) {
                const type        = this.type;
                let   constraints = args, decorators = [];
                if (type === Protocol) {
                    decorators.push(protocol);
                } if (this.isProtocol) {
                    decorators.push(protocol, conformsTo(type));
                }
                if (args.length > 0 && Array.isArray(args[0])) {
                    constraints = args.shift();
                }
                while (constraints.length > 0) {
                    const constraint = constraints[0];
                    if (!constraint) {
                        break;
                    } else if (constraint.prototype instanceof Protocol) {
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
                    derivedMeta  = $meta(members);
                derivedMeta.type = derived;
                defineMetadata(derived.prototype, derivedMeta);
                if (decorators.length > 0) {
                    for (let decorator of decorators) {
                        derived = decorator(derived) || derived;
                    }                    
                }                
                return derived;                    
            },
            /**
             * Extends the class represented by this metadata.
             * @method extendClass
             * @param   {Any} source  -  class function or object literal
             * @returns {Function} the class.
             */
            extendClass(source) {
                const type = this.type;
                if (!type) return;
                if (source) {
                    if (this.isProtocol && !(source instanceof Base)) {
                        source = protocol(source) || source;
                    }
                    const extension = $meta(source);
                    if (extension) {
                        (_extensions || (_extensions = [])).push(extension);
                    }
                }
                return baseImplement.call(type, source);
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
                    const extension = $meta(key);
                    if (extension) {
                        (_extensions || (_extensions = [])).push(extension);
                    }
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
             * Gets the metadata for `key` and `criteria`.
             * @method getMetadata
             * @param    {Any}     [key]     -  key selector
             * @param    {Object}  criteria  -  metadata criteria
             * @returns  {Object}  matching metadata.
             */
            getMetadata(key, criteria) {
                let metadata;
                if ($isObject(key)) {
                    [key, criteria] = [null, key];
                }
                if (_parent) {
                    metadata = _parent.getMetadata(key, criteria);
                }
                if (_protocols) {
                    metadata = _protocols.reduce((result, protocol) => {
                        const protoMeta = $meta(protocol),
                              keyMeta   = protoMeta.getMetadata(key, criteria);
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
             * Adds metadata to a property `key`.
             * @method addMetadata
             * @param    {string | Symbol}  key       -  property key
             * @param    {Object}           metadata  -  metadata
             * @param    {boolean}          replace   -  true if replace
             * @returns  {Metadata} current metadata.
             * @chainable
             */
            addMetadata(key, metadata, replace) {
                if (key && metadata) {
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
        });
    }
});

const SUPPRESS_METADATA = [ Object, Function, Array ];

Base.extend = function () {
    const meta = $meta(this);
    return meta? meta.subClass(...arguments)
         : baseExtend.apply(this, arguments);
};

Base.implement = function () {
    const meta = $meta(this);
    return meta ? meta.extendClass(...arguments)
         : baseImplement.apply(this, arguments);
}

Base.conformsTo = Base.prototype.conformsTo = function (protocol) {
    return $meta(this).conformsTo(protocol);
};

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
    if (target.hasOwnProperty(MetadataSymbol)) {
        return target[MetadataSymbol];
    }
    if (isFrozen(target)) return;
    if (target === Metadata || target instanceof Metadata ||
        target.prototype instanceof Metadata)
        return;    
    let i = SUPPRESS_METADATA.length;
    while (i--) {
        const ignore = SUPPRESS_METADATA[i];
        if (target === ignore || target === ignore.prototype) {
            return;
        }
    }
    let meta;    
    if ($isFunction(target)) {
        meta = $meta(target.prototype);
        if (meta) meta.type = target;
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
    defineProperty(target, MetadataSymbol, {
        enumerable:   false,
        configurable: false,
        writable:     false,
        value:        metadata
    });
}

/**
 * Determines if `protocol` is a protocol.
 * @method $isProtocol
 * @param    {Any}     protocol  - target to test
 * @returns  {boolean} true if a protocol.
 * @for miruken-core.$
 */
export const $isProtocol = Protocol.isProtocol;

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

function isUpperCase(char) {
    return char.toUpperCase() === char;
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
