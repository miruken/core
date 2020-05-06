import { 
    Base, Module, typeOf, getPropertyDescriptors
} from "./base2";

import {
    Delegate, ObjectDelegate, ArrayDelegate
} from "./delegate";

import { Metadata }from "./metadata";
import { isDescriptor } from "./decorate";
import createKey from "./privates";
import "reflect-metadata";

const baseExtend      = Base.extend,
      baseImplement   = Base.implement,
      baseProtoExtend = Base.prototype.extend;

export const emptyArray = Object.freeze([]),
             nothing    = undefined;

/**
 * Defines an enumeration.
 * <pre>
 *    const Color = Enum({
 *        red:   1,
 *        green: 2,
 *        blue:  3
 *    })
 * </pre>
 * @class Enum
 * @constructor
 * @param  {Any}     value    -  enum value
 * @param  {string}  name     -  enum name
 * @param  {number}  ordinal  -  enum position
 */
const Defining = Symbol();

export const Enum = Base.extend({
    constructor(value, name, ordinal) {
        this.constructing(value, name);
        Object.defineProperties(this, {
            "value": {
                value:        value,
                writable:     false,
                configurable: false
            },
            "name": {
                value:        name,
                writable:     false,
                configurable: false
            },
            "ordinal": {
                value:        ordinal,
                writable:     false,
                configurable: false
            },
        });
    },
    toString() { return this.name; },
    toJSON() {
        const value = this.value;
        return value != null && $isFunction(value.toJSON)
            ? value.toJSON()
            : value;
    },    
    get description() {
        const name = this.name;
        return name == null ? "undefined"
            : this.name.match(/[A-Z][a-z]+|[0-9]+/g).join(" ");
    },    
    constructing(value, name) {
        if (!this.constructor[Defining]) {
            throw new TypeError("Enums cannot be instantiated.");
        }            
    }
}, {
    coerce(choices, behavior) {
        if (this !== Enum && this !== Flags) {
            return;
        }
        let en = this.extend(behavior, {
            coerce(value) {
                return this.fromValue(value);
            }
        });
        en[Defining] = true;
        const names  = Object.keys(choices);
        let   items  = Object.keys(choices).map(
            (name, ordinal) => en[name] = new en(choices[name], name, ordinal));
        Object.defineProperties(en, {
            "names": {
                value:        Object.freeze(names),
                writable:     false,
                configurable: false
            },
            "items": {
                value:        Object.freeze(items),
                writable:     false,
                configurable: false
            }           
        });
        en.fromValue = this.fromValue;
        delete en[Defining]
        return en;
    },
    fromValue(value) {
        const match = this.items.find(item => item.value == value);
        if (!match) {
            throw new TypeError(`${value} is not a valid value for this Enum.`);
        }
        return match;
    }
});
Enum.prototype.valueOf = function () {
    const value = +this.value;
    return isNaN(value) ? this.ordinal : value;
}

/**
 * Defines a flags enumeration.
 * <pre>
 *    const DayOfWeek = Flags({
 *        Monday:     1 << 0,
 *        Tuesday:    1 << 1,
 *        Wednesday:  1 << 2,
 *        Thursday:   1 << 3,
 *        Friday:     1 << 4,
 *        Saturday:   1 << 5,
 *        Sunday:     1 << 6
 *    })
 * </pre>
 * @class Enum
 * @constructor
 * @param  {Any} value     -  flag value
 * @param  {string} value  -  flag name
 */    
export const Flags = Enum.extend({
    hasFlag(flag) {
        flag = +flag;
        return (this & flag) === flag;
    },
    addFlag(flag) {
        return $isSomething(flag)
             ? this.constructor.fromValue(this | flag)
             : this;
    },
    removeFlag(flag) {
        return $isSomething(flag)
             ? this.constructor.fromValue(this & (~flag))
             : this;
    },
    constructing(value, name) {}        
}, {
    fromValue(value) {
        value = +value;
        let name, names = this.names;
        for (let i = 0; i < names.length; ++i) {
            const flag = this[names[i]];
            if (flag.value === value) {
                return flag;
            }
            if ((value & flag.value) === flag.value) {
                name = name ? (name + "," + flag.name) : flag.name;
            }
        }
        return new this(value, name);
    }
});

/**
 * Type of property method.
 * @class PropertyType
 * @extends Enum
 */
export const MethodType = Enum({
    /**
     * Getter property method
     * @property {number} Get
     */
    Get: 1,
    /**
     * Setter property method
     * @property {number} Set
     */    
    Set: 2,
    /**
     * Method invocation
     * @property {number} Invoke
     */        
    Invoke: 3
});

/**
 * Variance enum
 * @class Variance
 * @extends Enum
 */
export const Variance = Enum({
    /**
     * Matches a more specific type than originally specified.
     * @property {number} Covariant
     */
    Covariant: 1,
    /**
     * Matches a more generic (less derived) type than originally specified.
     * @property {number} Contravariant
     */        
    Contravariant: 2,
    /**
     * Matches only the type originally specified.
     * @property {number} Invariant
     */        
    Invariant: 3
});

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
 * @param   {Delegate}  delegate  -  delegate
 * @extends Base
 */
const protocolGet         = Symbol(),
      protocolSet         = Symbol(),
      protocolInvoke      = Symbol(),
      protocolDelegate    = Symbol(),
      protocolMetadataKey = Symbol();

export const Protocol = Base.extend({
    constructor(delegate) {
        if ($isNothing(delegate)) {
            delegate = new Delegate();
        } else if ($isFunction(delegate.toDelegate)) {
            delegate = delegate.toDelegate();
            if (!(delegate instanceof Delegate)) {
                throw new TypeError("'toDelegate' method did not return a Delegate.");
            }
        }
        else if (!(delegate instanceof Delegate)) {
            if (Array.isArray(delegate)) {
                delegate = new ArrayDelegate(delegate);
            } else {
                delegate = new ObjectDelegate(delegate);
            }
        }
        Object.defineProperty(this, protocolDelegate, {
            value:     delegate,
            writable: false
        });
    },
    [protocolGet](key) {
        const delegate = this[protocolDelegate];
        return delegate && delegate.get(this.constructor, key);
    },
    [protocolSet](key, value) {
        const delegate = this[protocolDelegate];            
        return delegate && delegate.set(this.constructor, key, value);
    },
    [protocolInvoke](methodName, args) {
        const delegate = this[protocolDelegate];                        
        return delegate && delegate.invoke(this.constructor, methodName, args);
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
     * Determines if `target` conforms to this protocol and is toplevel.
     * @static
     * @method isToplevel
     * @param   {Any}      target    -  target to test
     * @returns {boolean}  true if the target conforms to this toplevel protocol.
     */    
    isToplevel(target) {
        const protocols = $protocols(target);
        return protocols.indexOf(this) >= 0 &&
            protocols.every(p => p === this || !this.isAdoptedBy(p));
    },
    /**
     * Creates a protocol binding over the object.
     * @static
     * @method coerce
     * @param   {Object} object  -  object delegate
     * @returns {Object} protocol instance delegating to object. 
     */
    coerce(object) { return new this(object); }
});

/**
 * Protocol base requiring exact conformance (toplevel).
 * @class StrictProtocol
 * @constructor
 * @param   {Delegate}  delegate  -  delegate
 * @extends Protocol     
 */
export const StrictProtocol = Protocol.extend();

/**
 * Protocol base requiring no conformance.
 * @class DuckTyping
 * @constructor
 * @param   {Delegate}  delegate  -  delegate
 * @extends Protocol     
 */
export const DuckTyping = Protocol.extend();

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
        throw new TypeError("Only Protocols can be conformed to.");
    }
    return protocols.length === 0 ? Undefined : adopt;
    function adopt(target, key, descriptor) {
        if (isDescriptor(descriptor)) {
            throw new SyntaxError("@conformsTo can only be applied to classes.");
        }
        protocols.forEach(protocol => protocol.adoptBy(target));
    }
}

Base.extend = function (...args) {
    let constraints = args, decorators = [];
    if (this === Protocol) {
        decorators.push(protocol);
    } if ($isProtocol(this)) {
        decorators.push(protocol, conformsTo(this));
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
        } else {
            break;
        }
        constraints.shift();
    }
    let members      = args.shift() || {},
        classMembers = args.shift() || {},
        derived      = baseExtend.call(this, members, classMembers);
    Metadata.transferOwn(derived, classMembers);
    Metadata.transferOwn(derived.prototype, members);
    if (decorators.length > 0) {
        derived = Reflect.decorate(decorators, derived);
    }
    return derived;                    
};

Base.implement = function (source) {
    if (source && $isProtocol(this) && $isObject(source)) {
        source = protocol(source) || source;
    }
    var type = baseImplement.call(this, source);
    Metadata.mergeOwn(type.prototype, source, true);
    return type;
}

Base.prototype.extend = function (key, value) {
    if (!key) return this;
    const numArgs = arguments.length;
    if (numArgs === 1) {
        if (this instanceof Protocol) {
            key = protocol(key) || key;
        }
        const instance = baseProtoExtend.call(this, key);
        Metadata.mergeOwn(instance, key, true);            
        return instance;
    }
    return baseProtoExtend.call(this, key, value);
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
 * Protocol for targets that manage initialization.
 * @class Initializing
 * @extends Protocol
 */
export const Initializing = Protocol.extend({
    /**
     * Perform any initialization after construction..
     */
    initialize() {}
});

/**
 * Protocol marking resolve semantics.
 * @class ResolvingProtocol
 * @extends Protocol
 */
export const ResolvingProtocol = Protocol.extend();

/**
 * Protocol for targets that can execute functions.
 * @class Invoking
 * @extends StrictProtocol
 */
export const Invoking = StrictProtocol.extend({
    /**
     * Invokes the `fn` with `dependencies`.
     * @method invoke
     * @param    {Function} fn           - function to invoke
     * @param    {Array}    dependencies - function dependencies
     * @param    {Object}   [ctx]        - function context
     * @returns  {Any}      result of the function.
     */
    invoke(fn, dependencies, ctx) {}
});

/**
 * Protocol for targets that have parent/child relationships.
 * @class Parenting
 * @extends Protocol
 */
export const Parenting = Protocol.extend({
    /**
     * Creates a new child of the parent.
     * @method newChild
     * @returns {Object} the new child.
     */
    newChild() {}
});

/**
 * Protocol for targets that can be started.
 * @class Starting
 * @extends Protocol
 */
export const Starting = Protocol.extend({
    /**
     * Starts the reciever.
     * @method start
     */
    start() {}
});

/**
 * Base class for startable targets.
 * @class Startup
 * @uses Starting
 * @extends Base
 */
export const Startup = Base.extend(Starting, {
    start() {}
});

/**
 * Determines if `str` is a string.
 * @method $isString
 * @param    {Any}     str  -  string to test
 * @returns  {boolean} true if a string.
 */
export function $isString(str) {
    return typeOf(str) === "string";
}

/**
 * Determines if `sym` is a symbol.
 * @method $isSymbol
 * @param    {Symbole} sym  -  symbol to test
 * @returns  {boolean} true if a symbol.
 */
export function $isSymbol(str) {
    return Object(str) instanceof Symbol;
}

/**
 * Determines if `fn` is a function.
 * @method $isFunction
 * @param    {Any}     fn  -  function to test
 * @returns  {boolean} true if a function.
 */
export function $isFunction(fn) {
    return fn instanceof Function;
}

/**
 * Determines if `obj` is an object.
 * @method $isObject
 * @param    {Any}     obj  - object to test
 * @returns  {boolean} true if an object.
 */
export function $isObject(obj) {
    return typeOf(obj) === "object";
}

/**
 * Determines if `obj` is a plain object or literal.
 * @method $isPlainObject
 * @param    {Any}     obj  -  object to test
 * @returns  {boolean} true if a plain object.
 */
export function $isPlainObject(obj) {
    return $isObject(obj) && obj.constructor === Object;
}

/**
 * Determines if `promise` is a promise.
 * @method $isPromise
 * @param    {Any}     promise  -  promise to test
 * @returns  {boolean} true if a promise. 
 */
export function $isPromise(promise) {
    return promise && $isFunction(promise.then);
}

/**
 * Determines if `value` is null or undefined.
 * @method $isNothing
 * @param    {Any}     value  -  value to test
 * @returns  {boolean} true if value null or undefined.
 */
export function $isNothing(value) {
    return value == null;
}

/**
 * Determines if `value` is not null or undefined.
 * @method $isSomething
 * @param    {Any}     value  -  value to test
 * @returns  {boolean} true if value not null or undefined.
 */
export function $isSomething(value) {
    return value != null;
}

/**
 * Determines if `target` is a class.
 * @method $isClass
 * @param    {Any}     target  - target to test
 * @returns  {boolean} true if a class (and not a protocol).
 */
export function $isClass(target) {
    if (!target || $isProtocol(target)) return false;    
    if (target.prototype instanceof Base) return true;
    const name = target.name;  // use Capital name convention
    return name && $isFunction(target) && isUpperCase(name.charAt(0));
}

/**
 * Gets the class `instance` is a member of.
 * @method $classOf
 * @param    {Object}  instance  - object
 * @returns  {Function} instance class. 
 */
export function $classOf(instance) {
    return instance == null ? undefined : instance.constructor;
}

/**
 * Returns a function that returns `value`.
 * @method $lift
 * @param    {Any}      value  -  any value
 * @returns  {Function} function that returns value.
 */
export function $lift(value) {
    return function() { return value; };
}

/**
 * Recursively flattens and optionally prune an array.
 * @method $flatten
 * @param    {Array}   arr    -  array to flatten
 * @param    {boolean} prune  -  true if prune null items
 * @returns  {Array}   flattend/pruned array or `arr`
 */
export function $flatten(arr, prune) {
    if (!Array.isArray(arr)) return arr;
    let items = arr.map(item => $flatten(item, prune));
    if (prune) items = items.filter($isSomething);
    return [].concat(...items);
}

/**
 * Determines whether `obj1` and `obj2` are considered equal.
 * <p>
 * Objects are considered equal if the objects are strictly equal (===) or
 * either object has an equals method accepting other object that returns true.
 * </p>
 * @method $equals
 * @param    {Any}     obj1  -  first object
 * @param    {Any}     obj2  -  second object
 * @returns  {boolean} true if the obejcts are considered equal, false otherwise.
 */
export function $equals(obj1, obj2) {
    if (obj1 === obj2) {
        return true;
    }
    if (obj1 && $isFunction(obj1.equals)) {
        return obj1.equals(obj2);
    } else if (obj2 && $isFunction(obj2.equals)) {
        return obj2.equals(obj1);
    }
    return false;
}

/**
 * Creates a decorator builder.<br/>
 * See [Decorator Pattern](http://en.wikipedia.org/wiki/Decorator_pattern)
 * @method
 * @param   {Object}   decorations  -  object defining decorations
 * @erturns {Function} function to build decorators.
 */
export function $decorator(decorations) {
    return function (decoratee) {
        if ($isNothing(decoratee)) {
            throw new TypeError("No decoratee specified.");
        }
        const decorator = Object.create(decoratee);
        Object.defineProperty(decorator, "getDecoratee", {
            configurable: false,
            value:        () => decoratee
        });
        if (decorations && $isFunction(decorator.extend)) {
            decorator.extend(decorations);
        }
        return decorator;
    }
}

/**
 * Decorates an instance using the 
 * [Decorator Pattern](http://en.wikipedia.org/wiki/Decorator_pattern).
 * @method
 * @param   {Object}   decoratee    -  decoratee
 * @param   {Object}   decorations  -  object defining decorations
 * @erturns {Function} function to build decorators.
 */
export function $decorate(decoratee, decorations) {
    return $decorator(decorations)(decoratee);
}

/**
 * Gets the decoratee used in the  
 * [Decorator Pattern](http://en.wikipedia.org/wiki/Decorator_pattern).
 * @method
 * @param   {Object}   decorator  -  possible decorator
 * @param   {boolean}  deepest    -  true if deepest decoratee, false if nearest.
 * @erturns {Object}   decoratee if present, otherwise decorator.
 */
export function $decorated(decorator, deepest) {
    let getDecoratee, decoratee;
    while (decorator &&
           (getDecoratee = decorator.getDecoratee) &&
           $isFunction(getDecoratee) &&
           (decoratee = getDecoratee())) {
        if (!deepest) return decoratee;
        decorator = decoratee;
    }
    return decorator;
}

/**
 * Factory to create a values provider for a key
 * that uses the full decorator chain, or self,
 * as the effective key.
 * @param {Function} findDecorator  function to
 * retrieve a decorated instance.  It must conform
 * to the {{#crossLink "$decorated "}}{{/crossLink}}
 * function.
 */
function createKeyChainProvider(findDecorator) {
    return function (key, storeGet) {
        const decoratee = findDecorator(key);
        return decoratee === key
             ? Object.create(null)
             : Object.create(storeGet(decoratee));
    }
}

const $decoratedKeyChain = createKey(createKeyChainProvider($decorated));

export function createKeyChain(findDecorator) {
    if ($isNothing(findDecorator)) {
        return $decoratedKeyChain;
    }
    if (!$isFunction(findDecorator)) {
        throw TypeError("findDecorator must be a function that accepts an object and optional boolean");
    }
    createKey(createKeyChainProvider(findDecorator));
}

/**
 * Factory to create a values provider for a key
 * that uses the deepest decoratee, or self, as
 * the effective key.
 * @param {Function} findDecorator  function to
 * retrieve a decorated instance.  It must conform
 * to the {{#crossLink "$decorated "}}{{/crossLink}}
 * function.
 */
function createKeyInstanceProvider(findDecorator) {
    return function (key, storeGet) {
        const decoratee = findDecorator(key, true);
        return decoratee === key
             ? Object.create(null)
             : storeGet(decoratee);
    }
}

const $decoratedKeyInstance = createKey(createKeyInstanceProvider($decorated));

export function createKeyInstance(findDecorator) {
    if ($isNothing(findDecorator)) {
        return $decoratedKeyInstance;
    }
    if (!$isFunction(findDecorator)) {
        throw TypeError("findDecorator must be a function that accepts an object and optional boolean");
    }    
    return createKey(createKeyInstanceProvider(findDecorator));
}

function isUpperCase(char) {
    return char.toUpperCase() === char;
}
