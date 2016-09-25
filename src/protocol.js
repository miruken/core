import {
    Base, Undefined, getPropertyDescriptors
} from "./base2";

import {
    $isNothing, $isFunction, $flatten
} from "./util";

import {
    Delegate, ObjectDelegate, ArrayDelegate
} from "./delegate";

import { isDescriptor } from "./decorate";
import Metadata from "./metadata";

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
const protocolGet         = Symbol(),
      protocolSet         = Symbol(),
      protocolInvoke      = Symbol(),
      protocolDelegate    = Symbol(),
      protocolStrict      = Symbol(),
      protocolMetadataKey = Symbol();

export const Protocol = Base.extend({
    constructor(delegate, strict) {
        if ($isNothing(delegate)) {
            delegate = new Delegate();
        } else if (!(delegate instanceof Delegate)) {
            if ($isFunction(delegate.toDelegate)) {
                delegate = delegate.toDelegate();
                if (!(delegate instanceof Delegate)) {
                    throw new TypeError("'toDelegate' method did not return a Delegate.");
                }
            } else if (Array.isArray(delegate)) {
                delegate = new ArrayDelegate(delegate);
            } else {
                delegate = new ObjectDelegate(delegate);
            }
        }
        Object.defineProperties(this, {
            [protocolDelegate]: { value: delegate, writable: false },            
            [protocolStrict]:   { value: !!strict, writable: false }
        });
    },
    [protocolGet](key) {
        const delegate = this[protocolDelegate];
        return delegate && delegate.get(this.constructor, key, this[protocolStrict]);
    },
    [protocolSet](key, value) {
        const delegate = this[protocolDelegate];            
        return delegate && delegate.set(this.constructor, key, value, this[protocolStrict]);
    },
    [protocolInvoke](methodName, args) {
        const delegate = this[protocolDelegate];                        
        return delegate && delegate.invoke(this.constructor, methodName, args, this[protocolStrict]);
    }
}, {
    /**
     * Determines if `target` is a {{#crossLink "Protocol"}}{{/crossLink}}.
     * @static
     * @method isProtocol
     * @param   {Any}      target  -  target to test
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
        if (!target) return false;
        if (this === target || (target && target.prototype instanceof this)) {
            return true;
        }
        const metaTarget = $isFunction(target) ? target.prototype : target;        
        return Metadata.collect(protocolMetadataKey, metaTarget,
                                protocols => protocols.has(this) ||
                                [...protocols].some(p => this.isAdoptedBy(p)));
    },
    /**
     * Marks `target` as conforming to this protocol.
     * @static
     * @method adoptBy
     * @param   {Any}      target  -  conforming target
     * @returns {boolean}  true if the this protocol could be adopted.
     */    
    adoptBy(target) {
        if (!target) return;
        const metaTarget = $isFunction(target) ? target.prototype : target;
        if (Metadata.collect(protocolMetadataKey, metaTarget, p => p.has(this))) {
            return false;
        }
        const protocols = Metadata.getOrCreateOwn(protocolMetadataKey, metaTarget, () => new Set());
        protocols.add(this);
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
        Reflect.ownKeys(props).forEach(key => {
            if (getPropertyDescriptors(protocolProto, key) ||
                getPropertyDescriptors(prototype, key)) return;
            Object.defineProperty(prototype, key, props[key]);            
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
 * Determines if `protocol` is a protocol.
 * @method $isProtocol
 * @param    {Any}     protocol  - target to test
 * @returns  {boolean} true if a protocol.
 */
export const $isProtocol = Protocol.isProtocol;

/**
 * Gets all the `target` protocols.
 * @method $protocols
 * @param    {Any}     target  -  target
 * @param    {boolean} own     -  true if own protocols
 * @returns  {Array} conforming protocols.
 */
export function $protocols(target, own) {
    if (!target) return [];
    if ($isFunction(target)) {
        target = target.prototype;
    }
    const protocols = !own ? new Set()
        : Metadata.getOwn(protocolMetadataKey, target);
    if (!own) {
        const add = protocols.add.bind(protocols);
        Metadata.collect(protocolMetadataKey, target,
          ps => ps.forEach(p => [p,...$protocols(p)].forEach(add)));
    }
    return (protocols && [...protocols]) || [];
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

function _protocol(target) {
    if ($isFunction(target)) {
        target = target.prototype;
    }
    Reflect.ownKeys(target).forEach(key => {
        if (key === "constructor") return;
        const descriptor = Object.getOwnPropertyDescriptor(target, key);
        if (!descriptor.enumerable) return;
        if ($isFunction(descriptor.value)) {
            descriptor.value = function (...args) {
                return this[protocolInvoke](key, args);
            };
        } else {
            const isSimple = descriptor.hasOwnProperty("value")
                          || descriptor.hasOwnProperty("initializer");
            if (isSimple) {
                delete descriptor.value;
                delete descriptor.writable;
            }
            if (descriptor.get || isSimple) {
                descriptor.get = function () {
                    return this[protocolGet](key);
                };
            }
            if (descriptor.set || isSimple) {
                descriptor.set = function (value) {
                    return this[protocolSet](key, value);
                }
            }
        }
        Object.defineProperty(target, key, descriptor);                
    });
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
    function adopt(target, key, descriptor) {
        if (isDescriptor(descriptor)) {
            throw new SyntaxError("@conformsTo can only be applied to classes");
        }
        protocols.forEach(protocol => protocol.adoptBy(target));
    }
}

export default Protocol;
