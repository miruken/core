import {
    False, True, Undefined,  Base, Abstract,
    extend, typeOf, getPropertyDescriptors
} from './base2';

import { Enum } from './enum'

/**
 * Declares methods and properties independent of a class.
 * <pre>
 *    var Auditing = Protocol.extend({
 *        $properties: {
 *            level: undefined
 *        },
 *        record(activity) {}
 *    })
 * </pre>
 * @class Protocol
 * @constructor
 * @param   {miruken.Delegate}  delegate        -  delegate
 * @param   {boolean}           [strict=false]  -  true if strict, false otherwise
 * @extends Base
 */
const ProtocolGet    = Symbol(),
      ProtocolSet    = Symbol(),
      ProtocolInvoke = Symbol();

export const Protocol = Base.extend({
    constructor(delegate, strict) {
        if ($isNothing(delegate)) {
            delegate = new Delegate;
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
            'delegate': { value: delegate },            
            'strict':   { value: !!strict }
        });
    },
    [ProtocolGet](propertyName) {
        const delegate = this.delegate;
        return delegate && delegate.get(this.constructor, propertyName, this.strict);
    },
    [ProtocolSet](propertyName, propertyValue) {
        const delegate = this.delegate;            
        return delegate && delegate.set(this.constructor, propertyName, propertyValue, this.strict);
    },
    [ProtocolInvoke](methodName, args) {
        const delegate = this.delegate;                        
        return delegate && delegate.invoke(this.constructor, methodName, args, this.strict);
    }
}, {
    conformsTo: False,        
    /**
     * Determines if the target is a {{#crossLink "miruken.Protocol"}}{{/crossLink}}.
     * @static
     * @method isProtocol
     * @param   {Any}      target    -  target to test
     * @returns {boolean}  true if the target is a Protocol.
     */
    isProtocol(target) {
        return target && (target.prototype instanceof Protocol);
    },
    /**
     * Determines if the target conforms to this protocol.
     * @static
     * @method conformsTo
     * @param   {Any}      target    -  target to test
     * @returns {boolean}  true if the target conforms to this protocol.
     */
    adoptedBy(target) {
        return target && $isFunction(target.conformsTo)
            ? target.conformsTo(this)
            : false;
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
 * MetaStep enum
 * @class MetaStep
 * @extends Enum
 */
export const MetaStep = Enum({
    /**
     * Triggered when a new class is derived
     * @property {number} Subclass
     */
    Subclass: 1,
    /**
     * Triggered when an existing class is extended
     * @property {number} Implement
     */
    Implement: 2,
    /**
     * Triggered when an instance is extended
     * @property {number} Extend
     */
    Extend: 3
});

/**
 * Provides a method to modify a class definition at runtime.
 * @class MetaMacro
 * @extends Base
 */
export const MetaMacro = Base.extend({
    /**
     * Inflates the macro for the given `step`.
     * @method inflate
     * @param  {miruken.MetaStep}  step        -  meta step
     * @param  {miruken.MetaBase}  metadata    -  source metadata
     * @param  {Object}            target      -  target macro applied to
     * @param  {Object}            definition  -  updates to apply
     * @param  {Function}          expand      -  expanded definition
     */
    inflate(step, metadata, target, definition, expand) {},
    /**
     * Execite the macro for the given `step`.
     * @method execute
     * @param  {miruken.MetaStep}  step        -  meta step
     * @param  {miruken.MetaBase}  metadata    -  effective metadata
     * @param  {Object}            target      -  target macro applied to
     * @param  {Object}            definition  -  source to apply
     */
    execute(step, metadata, target, definition) {},
    /**
     * Triggered when `protocol` is added to `metadata`.
     * @method protocolAdded
     * @param {miruken.MetaBase}  metadata  -  effective metadata
     * @param {miruken.Protocol}  protocol  -  protocol added
     */
    protocolAdded(metadata, protocol) {},
    /**
     * Extracts the `property` and evaluate it if a function.
     * @method extractProperty
     * @param    {string}  property  -  property name
     * @param    {Object}  target    -  owning target
     * @param    {Object}  source    -  definition source
     * @returns  {Any} property value.
     */                
    extractProperty(property, target, source) {
        let value = source[property];
        if ($isFunction(value)) {
            value = value();
        }
        delete target[property];            
        return value;
    },        
    /**
     * Determines if the macro should be inherited
     * @method shouldInherit
     * @returns {boolean} false
     */
    shouldInherit: False,
    /**
     * Determines if the macro should be applied on extension.
     * @method isActive
     * @returns {boolean} false
     */
    isActive: False
}, {
    coerce(...args) { return Reflect.construct(this, args); }
});

/**
 * Base class for all metadata.
 * @class MetaBase
 * @constructor
 * @param  {miruken.MetaBase}  [parent]  - parent meta-data
 * @extends miruken.MetaMacro
 */
export const MetaBase = MetaMacro.extend({
    constructor(parent)  {
        let _protocols = [], _descriptors;
        this.extend({
            /**
             * Gets the parent metadata.
             * @method getParent
             * @returns {miruken.MetaBase} parent metadata if present.
             */
            getParent() { return parent; },
            /**
             * Gets the declared protocols.
             * @method getProtocols
             * @returns {Array} declared protocols.
             */
            getProtocols() { return _protocols.slice(0) },
            /**
             * Gets all conforming protocools.
             * @method getAllProtocols
             * @returns {Array} conforming protocols.
             */
            getAllProtocols() {
                const protocols = this.getProtocols(),
                      inner     = protocols.slice(0);
                for (let i = 0; i < inner.length; ++i) {
                    const innerProtocols = inner[i].$meta.getAllProtocols();
                    for (let ii = 0; ii < innerProtocols.length; ++ii) {
                        const protocol = innerProtocols[ii];
                        if (protocols.indexOf(protocol) < 0) {
                            protocols.push(protocol);
                        }
                    } 
                }
                return protocols;
            },
            /**
             * Adds one or more `protocols` to the metadata.
             * @method addProtocol
             * @param  {Array}  protocols  -  protocols to add
             */
            addProtocol(protocols) {
                if ($isNothing(protocols)) {
                    return;
                }
                if (!Array.isArray(protocols)) {
                    protocols = Array.from(arguments);
                }
                for (let i = 0; i < protocols.length; ++i) {
                    const protocol = protocols[i];
                    if ((protocol.prototype instanceof Protocol) 
                        &&  (_protocols.indexOf(protocol) === -1)) {
                        _protocols.push(protocol);
                        this.protocolAdded(this, protocol);
                    }
                }
            },
            protocolAdded(metadata, protocol) {
                if (parent) {
                    parent.protocolAdded(metadata, protocol);
                }
            },
            /**
             * Determines if the metadata conforms to the `protocol`.
             * @method conformsTo
             * @param  {miruken.Protocol}   protocol -  protocols to test
             * @returns {boolean}  true if the metadata includes the protocol.
             */
            conformsTo(protocol) {
                if (!(protocol && (protocol.prototype instanceof Protocol))) {
                    return false;
                }
                for (let index = 0; index < _protocols.length; ++index) {
                    const proto = _protocols[index];
                    if (protocol === proto || proto.conformsTo(protocol)) {
                        return true;
                    }
                }
                return false;
            },
            inflate(step, metadata, target, definition, expand) {
                if (parent) {
                    parent.inflate(step, metadata, target, definition, expand);
                } else if ($properties) {
                    $properties.shared.inflate(step, metadata, target, definition, expand)
                }
            },
            execute(step, metadata, target, definition) {
                if (parent) {
                    parent.execute(step, metadata, target, definition);
                } else if ($properties) {
                    $properties.shared.execute(step, metadata, target, definition);
                }
            },
            /**
             * Defines a property on the metadata.
             * @method defineProperty
             * @param  {Object}   target        -  target receiving property
             * @param  {string}   name          -  name of the property
             * @param  {Object}   spec          -  property specification
             * @param  {Object}   [descriptor]  -  property descriptor
             */
            defineProperty(target, name, spec, descriptor) {
                if (descriptor) {
                    descriptor = Object.assign({}, descriptor);
                }
                if (target) {
                    Object.defineProperty(target, name, spec);
                }
                if (descriptor) {
                    this.addDescriptor(name, descriptor);
                }
            },
            /**
             * Gets the descriptor for one or more properties.
             * @method getDescriptor
             * @param    {Object|string}  filter  -  property selector
             * @returns  {Object} aggregated property descriptor.
             */
            getDescriptor(filter) {
                let descriptors;
                if ($isNothing(filter)) {
                    if (parent) {
                        descriptors = parent.getDescriptor(filter);
                    }
                    if (_descriptors) {
                        descriptors = extend(descriptors || {}, _descriptors);
                    }
                } else if ($isString(filter)) {
                    return (_descriptors && _descriptors[filter])
                        || (parent && parent.getDescriptor(filter));
                } else {
                    if (parent) {
                        descriptors = parent.getDescriptor(filter);
                    }
                    for (let key in _descriptors) {
                        let descriptor = _descriptors[key];
                        if (this.matchDescriptor(descriptor, filter)) {
                            descriptors = extend(descriptors || {}, key, descriptor);
                        }
                    }
                }
                return descriptors;
            },
            /**
             * Sets the descriptor for a property.
             * @method addDescriptor
             * @param    {string}   name        -  property name
             * @param    {Object}   descriptor  -  property descriptor
             * @returns  {miruken.MetaBase} current metadata.
             * @chainable
             */
            addDescriptor(name, descriptor) {
                _descriptors = extend(_descriptors || {}, name, descriptor);
                return this;
            },
            /**
             * Determines if the property `descriptor` matches the `filter`.
             * @method matchDescriptor
             * @param    {Object}   descriptor  -  property descriptor
             * @param    {Object}   filter      -  matching filter
             * @returns  {boolean} true if the descriptor matches, false otherwise.
             */
            matchDescriptor(descriptor, filter) {
                if (typeOf(descriptor) !== 'object' || typeOf(filter) !== 'object') {
                    return false;
                }
                for (let key in filter) {
                    const match = filter[key];
                    if (match === undefined) {
                        if (!(key in descriptor)) {
                            return false;
                        }
                    } else {
                        const value = descriptor[key];
                        if (Array.isArray(match)) {
                            if (!(Array.isArray(value))) {
                                return false;
                            }
                            for (let i = 0; i < match.length; ++i) {
                                if (value.indexOf(match[i]) < 0) {
                                    return false;
                                }
                            }
                        } else if (!(value === match || this.matchDescriptor(value, match))) {
                            return false;
                        }
                    }
                }
                return true;
            },
            /**
             * Binds `method` to the parent if not present.
             * @method linkBase
             * @param    {Function}  method  -  method name
             * @returns  {miruken.MetaBase} current metadata.
             * @chainable
             */
            linkBase(method) {
                if (!this[method]) {
                    this.extend(method, function () {
                        return parent && parent[method](...arguments);
                    });
                }
                return this;
            }
        });
    }
});

/**
 * Represents metadata describing a class.
 * @class ClassMeta
 * @constructor
 * @param   {miruken.MetaBase}  baseMeta   -  base meta data
 * @param   {Function}          subClass   -  associated class
 * @param   {Array}             protocols  -  conforming protocols
 * @param   {Array}             macros     -  class macros
 * @extends miruken.MetaBase
 */
export const ClassMeta = MetaBase.extend({
    constructor(baseMeta, subClass, protocols, macros)  {
        let _macros     = macros && macros.slice(0),
            _isProtocol = (subClass === Protocol)
            || (subClass.prototype instanceof Protocol);
        this.base(baseMeta);
        this.extend({
            /**
             * Gets the associated class.
             * @method getClass
             * @returns  {Function} class.
             */                                
            getClass() { return subClass; },
            /**
             * Determines if the meta-data represents a protocol.
             * @method isProtocol
             * @returns  {boolean} true if a protocol, false otherwise.
             */                                
            isProtocol() { return _isProtocol; },
            getAllProtocols() {
                const protocols = this.base();
                if (!_isProtocol && baseMeta) {
                    const baseProtocols = baseMeta.getAllProtocols();
                    for (let i = 0; i < baseProtocols.length; ++i) {
                        const protocol = baseProtocols[i];
                        if (protocols.indexOf(protocol) < 0) {
                            protocols.push(protocol);
                        }
                    }
                }
                return protocols;
            },
            protocolAdded(metadata, protocol) {
                this.base(metadata, protocol);
                if (!_macros || _macros.length == 0) {
                    return;
                }
                for (let i = 0; i < _macros.length; ++i) {
                    const macro = _macros[i];
                    if ($isFunction(macro.protocolAdded)) {
                        macro.protocolAdded(metadata, protocol);
                    }
                }
            },
            conformsTo(protocol) {
                if (!(protocol && (protocol.prototype instanceof Protocol))) {
                    return false;
                } else if ((protocol === subClass) || (subClass.prototype instanceof protocol)) {
                    return true;
                }
                return this.base(protocol) ||
                    !!(baseMeta && baseMeta.conformsTo(protocol));
            },
            inflate(step, metadata, target, definition, expand) {
                this.base(step, metadata, target, definition, expand);
                if (!_macros || _macros.length == 0) {
                    return;
                }
                const  active = (step !== MetaStep.Subclass);
                for (let i = 0; i < _macros.length; ++i) {
                    const macro = _macros[i];
                    if ($isFunction(macro.inflate) &&
                        (!active || macro.isActive()) && macro.shouldInherit()) {
                        macro.inflate(step, metadata, target, definition, expand);
                    }
                }                    
            },
            execute(step, metadata, target, definition) {
                this.base(step, metadata, target, definition);
                if (!_macros || _macros.length == 0) {
                    return;
                }
                const inherit = (this !== metadata),
                      active  = (step !== MetaStep.Subclass);
                for (let i = 0; i < _macros.length; ++i) {
                    const macro = _macros[i];
                    if ((!active  || macro.isActive()) &&
                        (!inherit || macro.shouldInherit())) {
                        macro.execute(step, metadata, target, definition);
                    }
                }
            },
            /**
             * Creates a sub-class from the current class metadata.
             * @method createSubclass
             * @returns  {Function} the newly created class function.
             */                                                                
            createSubclass() {
                const args        = Array.from(arguments);
                let   constraints = args, protocols, mixins, macros;
                if (subClass.prototype instanceof Protocol) {
                    (protocols = []).push(subClass);
                }
                if (args.length > 0 && Array.isArray(args[0])) {
                    constraints = args.shift();
                }
                while (constraints.length > 0) {
                    const constraint = constraints[0];
                    if (!constraint) {
                        break;
                    } else if (constraint.prototype instanceof Protocol) {
                        (protocols || (protocols = [])).push(constraint);
                    } else if (constraint instanceof MetaMacro) {
                        (macros || (macros = [])).push(constraint);
                    } else if ($isFunction(constraint) && constraint.prototype instanceof MetaMacro) {
                        (macros || (macros = [])).push(new constraint);
                    } else if (constraint.prototype) {
                        (mixins || (mixins = [])).push(constraint);
                    } else {
                        break;
                    }
                    constraints.shift();
                }
                let instanceDef  = args.shift() || {},
                    staticDef    = args.shift() || {};
                this.inflate(MetaStep.Subclass, this, subClass.prototype, instanceDef, expand);
                if (macros) {
                    for (let i = 0; i < macros.length; ++i) {
                        macros[i].inflate(MetaStep.Subclass, this, subClass.prototype, instanceDef, expand);
                    }
                }
                instanceDef  = expand.x || instanceDef;
                const derived  = ClassMeta.baseExtend.call(subClass, instanceDef, staticDef),
                      metadata = new ClassMeta(this, derived, protocols, macros);
                Object.defineProperty(derived, '$meta', {
                    enumerable:   false,
                    configurable: false,
                    writable:     false,
                    value:        metadata
                });
                Object.defineProperty(derived.prototype, '$meta', {
                    enumerable:   false,
                    configurable: false,
                    get:          ClassMeta.createInstanceMeta
                });
                derived.conformsTo = metadata.conformsTo.bind(metadata);
                metadata.execute(MetaStep.Subclass, metadata, derived.prototype, instanceDef);
                if (mixins) {
                    mixins.forEach(mixin => derived.implement(mixin));
                }
                function expand() {
                    return expand.x || (expand.x = Object.create(instanceDef));
                }   
                return derived;                    
            },
            /**
             * Embellishes the class represented by this metadata.
             * @method embellishClass
             * @param   {Any} source  -  class function or object literal
             * @returns {Function} the underlying class.
             */
            embellishClass(source) {
                if ($isFunction(source)) {
                    source = source.prototype; 
                }
                if ($isSomething(source)) {
                    this.inflate(MetaStep.Implement, this, subClass.prototype, source, expand);
                    source = expand.x || source;
                    ClassMeta.baseImplement.call(subClass, source);
                    this.execute(MetaStep.Implement, this, subClass.prototype, source);
                    function expand() {
                        return expand.x || (expand.x = Object.create(source));
                    };                    
                }
                return subClass;
            }
        });
        this.addProtocol(protocols);
    }
}, {
    init() {
        this.baseExtend    = Base.extend;
        this.baseImplement = Base.implement;
        Base.$meta         = new this(undefined, Base);
        Abstract.$meta     = new this(Base.$meta, Abstract);            
        Base.extend = Abstract.extend = function () {
            return this.$meta.createSubclass(...arguments);
        };
        Base.implement = Abstract.implement = function () {
            return this.$meta.embellishClass(...arguments);                
        }
        Base.prototype.conformsTo = function (protocol) {
            return this.constructor.$meta.conformsTo(protocol);
        };
    },
    createInstanceMeta(parent) {
        const metadata = new InstanceMeta(parent || this.constructor.$meta);
        Object.defineProperty(this, '$meta', {
            enumerable:   false,
            configurable: true,
            writable:     false,
            value:        metadata
        });
        return metadata;            
    }
});

/**
 * Represents metadata describing an instance.
 * @class InstanceMeta
 * @constructor
 * @param   {miruken.ClassMeta}  classMeta  -  class meta-data
 * @extends miruken.MetaBase
 */
export const InstanceMeta = MetaBase.extend({
    constructor(classMeta) {
        this.base(classMeta);
        this.extend({
            /**
             * Gets the associated class.
             * @method getClass
             * @returns  {Function} class.
             */                                              
            getClass() { return classMeta.getClass(); },
            /**
             * Determines if the meta-data represents a protocol.
             * @method isProtocol
             * @returns  {boolean} true if a protocol, false otherwise.
             */                                                
            isProtocol() { return classMeta.isProtocol(); }
        });
    }
}, {
    init() {
        const baseExtend = Base.prototype.extend;
        Base.prototype.extend = function (key, value) {
            let numArgs    = arguments.length,
                definition = (numArgs === 1) ? key : {};
            if (numArgs >= 2) {
                definition[key] = value;
            } else if (numArgs === 0) {
                return this;
            }
            const metadata = this.$meta;
            if (metadata) {
                metadata.inflate(MetaStep.Extend, metadata, this, definition, expand);
                definition = expand.x || definition;
                function expand() {
                    return expand.x || (expand.x = Object.create(definition));
                };                    
            }
            baseExtend.call(this, definition);                
            if (metadata) {
                metadata.execute(MetaStep.Extend, metadata, this, definition);
            }
            return this;
        }
    }
});

Enum.$meta      = new ClassMeta(Base.$meta, Enum);
Enum.extend     = Base.extend
Enum.implement  = Base.implement;

/**
 * Metamacro to proxy protocol members through a delegate.<br/>
 * See {{#crossLink "miruken.Protocol"}}{{/crossLink}}
 * @class $proxyProtocol
 * @extends miruken.MetaMacro
 */
export const $proxyProtocol = MetaMacro.extend({
    inflate(step, metadata, target, definition, expand) {
        let protocolProto = Protocol.prototype, expanded;
        for (let key in definition) {
            if (key in protocolProto) {
                continue;
            }
            expanded = expanded || expand();
            const member = getPropertyDescriptors(definition, key);
            if ($isFunction(member.value)) {
                member.value = function () {
                    return this[ProtocolInvoke](key, Array.from(arguments));
                };
            } else if (member.get || member.set) {
                if (member.get) {
                    member.get = function () {
                        return this[ProtocolGet](key);
                    };
                }
                if (member.set) {
                    member.set = function (value) {
                        return this[ProtocolSet](key, value);
                    }
                }
            } else {
                continue;
            }
            Object.defineProperty(expanded, key, member);                
        }            
    },
    execute(step, metadata, target, definition) {
        if (step === MetaStep.Subclass) {
            const clazz = metadata.getClass();                
            clazz.adoptedBy = Protocol.adoptedBy;
        }
    },
    protocolAdded(metadata, protocol) {
        const source        = protocol.prototype,
              target        = metadata.getClass().prototype,
              protocolProto = Protocol.prototype;
        for (let key in source) {
            if (!((key in protocolProto) && (key in this))) {
                const descriptor = getPropertyDescriptors(source, key);
                Object.defineProperty(target, key, descriptor);
            }
        }
    },
    /**
     * Determines if the macro should be inherited
     * @method shouldInherit
     * @returns {boolean} true
     */        
    shouldInherit: True,
    /**
     * Determines if the macro should be applied on extension.
     * @method isActive
     * @returns {boolean} true
     */        
    isActive: True
});
Protocol.extend    = Base.extend
Protocol.implement = Base.implement;
Protocol.$meta     = new ClassMeta(Base.$meta, Protocol, null, [new $proxyProtocol]);

/**
 * Protocol base requiring conformance to match methods.
 * @class StrictProtocol
 * @constructor
 * @param   {miruken.Delegate}  delegate       -  delegate
 * @param   {boolean}           [strict=true]  -  true ifstrict, false otherwise
 * @extends miruekn.Protocol     
 */
export const StrictProtocol = Protocol.extend({
    constructor(proxy, strict) {
        this.base(proxy, (strict === undefined) || strict);
    }
});

const GETTER_CONVENTIONS = ['get', 'is'];

/**
 * Metamacro to define class properties.  This macro is automatically applied.
 * <pre>
 *    const Person = Base.extend({
 *        $properties: {
 *            firstName: '',
 *            lastNane:  '',
 *            fullName:  {
 *                get() {
 *                   return this.firstName + ' ' + this.lastName;
 *                },
 *                set(value) {
 *                    const parts = value.split(' ');
 *                    if (parts.length > 0) {
 *                        this.firstName = parts[0];
 *                    }
 *                    if (parts.length > 1) {
 *                        this.lastName = parts[1];
 *                    }
 *                }
 *            }
 *        }
 *    })
 * </pre>
 * would give the Person class a firstName and lastName property and a computed fullName.
 * @class $properties
 * @constructor
 * @param   {string}  [tag='$properties']  - properties tag
 * @extends miruken.MetaMacro
 */
export const $properties = MetaMacro.extend({
    constructor(tag) {
        if ($isNothing(tag)) {
            throw new Error("$properties requires a tag name");
        }
        Object.defineProperty(this, 'tag', { value: tag });
    },
    execute(step, metadata, target, definition) {
        const properties = this.extractProperty(this.tag, target, definition); 
        if (!properties) {
            return;
        }
        let expanded = {}, source;
        for (let name in properties) {
            source = expanded;
            let property = properties[name],
                spec     = {
                    configurable: true,
                    enumerable:   true
                };
            if ($isNothing(property) || $isString(property) ||
                typeOf(property.length) == "number" || typeOf(property) !== 'object') {
                property = { value: property };
            }
            if (name in definition) {
                source = null;  // don't replace standard property
            } else if (property.get || property.set) {
                spec.get = property.get;
                spec.set = property.set;
            } else if (target instanceof Protocol) {
                // $proxyProtocol will do the real work
                spec.get = spec.set = Undefined;
            } else if ("auto" in property) {
                let field = property.auto;
                if (!(field && $isString(field))) {
                    field = "_" + name;
                }
                spec.get = function () { return this[field]; };
                spec.set = function (value) { this[field] = value; };
            } else {
                spec.writable = true;
                spec.value    = property.value;
            }
            _cleanDescriptor(property);
            this.defineProperty(metadata, source, name, spec, property);
        }
        if (step == MetaStep.Extend) {
            target.extend(expanded);
        } else {
            metadata.getClass().implement(expanded);
        }
    },
    defineProperty(metadata, target, name, spec, descriptor) {
        metadata.defineProperty(target, name, spec, descriptor);
    },
    /**
     * Determines if the macro should be inherited
     * @method shouldInherit
     * @returns {boolean} true
     */                
    shouldInherit: True,
    /**
     * Determines if the macro should be applied on extension.
     * @method isActive
     * @returns {boolean} true
     */                
    isActive: True
}, {
    init() {
        Object.defineProperty(this, 'shared', {
            enumerable:   false,
            configurable: false,
            writable:     false,
            value:        Object.freeze(new this("$properties"))
        });
    }
});

/**
 * Metamacro to derive class properties from existng methods.
 * <p>Currently getFoo, isFoo and setFoo conventions are recognized.</p>
 * <pre>
 *    const Person = Base.extend(**$inferProperties**, {
 *        getName() { return this._name; },
 *        setName(value) { this._name = value; },
 *    })
 * </pre>
 * would create a Person.name property bound to getName and setName 
 * @class $inferProperties
 * @constructor
 * @extends miruken.MetaMacro
 */
export const $inferProperties = MetaMacro.extend({
    inflate(step, metadata, target, definition, expand) {
        let expanded;
        for (let key in definition) {
            const member = getPropertyDescriptors(definition, key);
            if ($isFunction(member.value)) {
                const spec = { configurable: true, enumerable: true },
                      name = this.inferProperty(key, member.value, definition, spec);
                if (name) {
                    expanded = expanded || expand();
                    Object.defineProperty(expanded, name, spec);
                }
            }
        }            
    },
    inferProperty(key, method, definition, spec) {
        for (let i = 0; i < GETTER_CONVENTIONS.length; ++i) {
            const prefix = GETTER_CONVENTIONS[i];
            if (key.lastIndexOf(prefix, 0) == 0) {
                if (method.length === 0) {  // no arguments
                    spec.get   = method;                        
                    const name   = key.substring(prefix.length),
                          setter = definition['set' + name];
                    if ($isFunction(setter)) {
                        spec.set = setter;
                    }
                    return name.charAt(0).toLowerCase() + name.slice(1);
                }
            }
        }
        if (key.lastIndexOf('set', 0) == 0) {
            if (method.length === 1) {  // 1 argument
                spec.set   = method;                    
                const name   = key.substring(3),
                      getter = definition['get' + name];
                if ($isFunction(getter)) {
                    spec.get = getter;
                }
                return name.charAt(0).toLowerCase() + name.slice(1);
            }
        }
    },
    /**
     * Determines if the macro should be inherited
     * @method shouldInherit
     * @returns {boolean} true
     */                
    shouldInherit: True,
    /**
     * Determines if the macro should be applied on extension.
     * @method isActive
     * @returns {boolean} true
     */               
    isActive: True
});

function _cleanDescriptor(descriptor) {
    delete descriptor.writable;
    delete descriptor.value;
    delete descriptor.get;
    delete descriptor.set;
}

/**
 * Metamacro to inherit static members in subclasses.
 * <pre>
 * const Math = Base.extend(
 *     **$inheritStatic**, null, {
 *         PI:  3.14159265359,
 *         add(a, b) {
 *             return a + b;
 *          }
 *     }),
 *     Geometry = Math.extend(null, {
 *         area(length, width) {
 *             return length * width;
 *         }
 *     });
 * </pre>
 * would make Math.PI and Math.add available on the Geometry class.
 * @class $inhertStatic
 * @constructor
 * @param  {string}  [...members]  -  members to inherit
 * @extends miruken.MetaMacro
 */
export const $inheritStatic = MetaMacro.extend({
    constructor(/*members*/) {
        const spec = {
            value: Array.from(arguments)
        };
        Object.defineProperty(this, 'members', spec);
        delete spec.value;
    },
    execute(step, metadata, target) {
        if (step === MetaStep.Subclass) {
            const members  = this.members,
                  clazz    = metadata.getClass(),
                  ancestor = $ancestorOf(clazz);
            if (members.length > 0) {
                for (let i = 0; i < members.length; ++i) {
                    const member = members[i];
                    if (!(member in clazz)) {
                        clazz[member] = ancestor[member];
                    }
                }
            } else if (ancestor !== Base && ancestor !== Object) {
                for (let key in ancestor) {
                    if (ancestor.hasOwnProperty(key) && !(key in clazz)) {
                        clazz[key] = ancestor[key];
                    }
                }
            }
        }
    },
    /**
     * Determines if the macro should be inherited
     * @method shouldInherit
     * @returns {boolean} true
     */                
    shouldInherit: True
});

/**
 * Delegates properties and methods to another object.<br/>
 * See {{#crossLink "miruken.Protocol"}}{{/crossLink}}
 * @class Delegate
 * @extends Base
 */
export const Delegate = Base.extend({
    /**
     * Delegates the property get on `protocol`.
     * @method get
     * @param   {miruken.Protocol} protocol      - receiving protocol
     * @param   {string}           propertyName  - name of the property
     * @param   {boolean}          strict        - true if target must adopt protocol
     * @returns {Any} result of the proxied get.
     */
    get(protocol, propertyName, strict) {},
    /**
     * Delegates the property set on `protocol`.
     * @method set
     * @param   {miruken.Protocol} protocol      - receiving protocol
     * @param   {string}           propertyName  - name of the property
     * @param   {Object}           propertyValue - value of the property
     * @param   {boolean}          strict        - true if target must adopt protocol
     */
    set(protocol, propertyName, propertyValue, strict) {},
    /**
     * Delegates the method invocation on `protocol`.
     * @method invoke
     * @param   {miruken.Protocol} protocol    - receiving protocol
     * @param   {string}           methodName  - name of the method
     * @param   {Array}            args        - method arguments
     * @param   {boolean}          strict      - true if target must adopt protocol
     * @returns {Any} result of the proxied invocation.
     */
    invoke(protocol, methodName, args, strict) {}
});

/**
 * Delegates properties and methods to an object.
 * @class ObjectDelegate
 * @constructor
 * @param   {Object}  object  - receiving object
 * @extends miruken.Delegate
 */
export const ObjectDelegate = Delegate.extend({
    constructor(object) {
        Object.defineProperty(this, 'object', { value: object });
    },
    get(protocol, propertyName, strict) {
        const object = this.object;
        if (object && (!strict || protocol.adoptedBy(object))) {
            return object[propertyName];
        }
    },
    set(protocol, propertyName, propertyValue, strict) {
        const object = this.object;
        if (object && (!strict || protocol.adoptedBy(object))) {
            return object[propertyName] = propertyValue;
        }
    },
    invoke(protocol, methodName, args, strict) {
        const object = this.object;
        if (object && (!strict || protocol.adoptedBy(object))) {
            const method = object[methodName];                
            return method && method.apply(object, args);
        }
    }
});

/**
 * Delegates properties and methods to an array.
 * @class ArrayDelegate
 * @constructor
 * @param   {Array}  array  - receiving array
 * @extends miruken.Delegate
 */
export const ArrayDelegate = Delegate.extend({
    constructor(array) {
        Object.defineProperty(this, 'array', { value: array });
    },
    get(protocol, propertyName, strict) {
        const array = this.array;
        return array && array.reduce((result, object) =>
            !strict || protocol.adoptedBy(object)
                ? object[propertyName]
                : result
        , undefined);  
    },
    set(protocol, propertyName, propertyValue, strict) {
        const array = this.array;
        return array && array.reduce((result, object) =>
            !strict || protocol.adoptedBy(object)
                ? object[propertyName] = propertyValue
                : result
        , undefined);  
    },
    invoke(protocol, methodName, args, strict) {
        const array = this.array;
        return array && array.reduce((result, object) => {
            const method = object[methodName];
            return method && (!strict || protocol.adoptedBy(object))
                ? method.apply(object, args)
                : result;
        }, undefined);
    }
});

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
        const decorator = Object.create(decoratee),
              spec      = $decorator.spec || ($decorator.spec = {});
        spec.value = decoratee;
        Object.defineProperty(decorator, 'decoratee', spec);
        ClassMeta.createInstanceMeta.call(decorator, decoratee.$meta);
        if (decorations) {
            decorator.extend(decorations);
        }
        delete spec.value;
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
    let decoratee;
    while (decorator && (decoratee = decorator.decoratee)) {
        if (!deepest) {
            return decoratee;
        }
        decorator = decoratee;
    }
    return decorator;
}

/**
 * Determines if `protocol` is a protocol.
 * @method $isProtocol
 * @param    {Any}     protocol  - target to test
 * @returns  {boolean} true if a protocol.
 * @for miruken.$
 */
export const $isProtocol = Protocol.isProtocol;

/**
 * Determines if `clazz` is a class.
 * @method $isClass
 * @param    {Any}     clazz  - class to test
 * @returns  {boolean} true if a class (and not a protocol).
 */
export function $isClass(clazz) {
    return clazz && (clazz.prototype instanceof Base) && !$isProtocol(clazz);
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

/**
 * Gets `clazz` superclass.
 * @method $ancestorOf
 * @param    {Function} clazz  - class
 * @returns  {Function} ancestor of class. 
 */
export function $ancestorOf(clazz) {
    return clazz && clazz.ancestor;
}

/**
 * Determines if `str` is a string.
 * @method $isString
 * @param    {Any}     str  - string to test
 * @returns  {boolean} true if a string.
 */
export function $isString(str) {
    return typeOf(str) === 'string';
}

/**
 * Determines if `fn` is a function.
 * @method $isFunction
 * @param    {Any}     fn  - function to test
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
    return obj === Object(obj);
}

/**
 * Determines if `promise` is a promise.
 * @method $isPromise
 * @param    {Any}     promise  - promise to test
 * @returns  {boolean} true if a promise. 
 */
export function $isPromise(promise) {
    return promise && $isFunction(promise.then);
}

/**
 * Determines if `value` is null or undefined.
 * @method $isNothing
 * @param    {Any}     value  - value to test
 * @returns  {boolean} true if value null or undefined.
 */
export function $isNothing(value) {
    return value == null;
}

/**
 * Determines if `value` is not null or undefined.
 * @method $isSomething
 * @param    {Any}     value  - value to test
 * @returns  {boolean} true if value not null or undefined.
 */
export function $isSomething(value) {
    return value != null;
}

/**
 * Returns a function that returns `value`.
 * @method $lift
 * @param    {Any}      value  - any value
 * @returns  {Function} function that returns value.
 */
export function $lift(value) {
    return function() { return value; };
}

/**
 * Determines whether `obj1` and `obj2` are considered equal.
 * <p>
 * Objects are considered equal if the objects are strictly equal (===) or
 * either object has an equals method accepting other object that returns true.
 * </p>
 * @method $equals
 * @param    {Any}     obj1  - first object
 * @param    {Any}     obj2  - second object
 * @returns  {boolean} true if the obejcts are considered equal, false otherwise.
 */
export function $equals(obj1, obj2) {
    if (obj1 === obj2) {
        return true;
    }
    if ($isFunction(obj1.equals)) {
        return obj1.equals(obj2);
    } else if ($isFunction(obj2.equals)) {
        return obj2.equals(obj1);
    }
    return false;
}
