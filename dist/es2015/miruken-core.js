"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

exports.typeOf = typeOf;
exports.assignID = assignID;
exports.format = format;
exports.csv = csv;
exports.bind = bind;
exports.delegate = delegate;
exports.$using = $using;
exports.Modifier = Modifier;
exports.$createModifier = $createModifier;
exports.$isClass = $isClass;
exports.$classOf = $classOf;
exports.$ancestorOf = $ancestorOf;
exports.$isString = $isString;
exports.$isFunction = $isFunction;
exports.$isObject = $isObject;
exports.$isArray = $isArray;
exports.$isPromise = $isPromise;
exports.$isNothing = $isNothing;
exports.$isSomething = $isSomething;
exports.$lift = $lift;
exports.$equals = $equals;
exports.$decorator = $decorator;
exports.$decorate = $decorate;
exports.$decorated = $decorated;
exports.$debounce = $debounce;

var _base = require("./base2");

Object.keys(_base).forEach(function (key) {
    if (key === "default") return;
    Object.defineProperty(exports, key, {
        enumerable: true,
        get: function () {
            return _base[key];
        }
    });
});
var Undefined = exports.Undefined = K(),
    Null = exports.Null = K(null),
    True = exports.True = K(true),
    False = exports.False = K(false);

var __prototyping = void 0,
    _counter = 1;

var _IGNORE = K(),
    _BASE = /\bbase\b/,
    _HIDDEN = ["constructor", "toString"],
    _slice = Array.prototype.slice;

_Function_forEach();

var _subclass = function _subclass(_instance, _static) {
    __prototyping = this.prototype;
    var _prototype = new this();
    if (_instance) _extend(_prototype, _instance);
    _prototype.base = function () {};
    __prototyping = undefined;

    var _constructor = _prototype.constructor;
    function _class() {
        if (!__prototyping) {
            if (this && (this.constructor == _class || this.__constructing)) {
                this.__constructing = true;
                var instance = _constructor.apply(this, arguments);
                delete this.__constructing;
                if (instance) return instance;
            } else {
                var target = arguments[0];
                if (target instanceof _class) return target;
                var cls = _class;
                do {
                    if (cls.coerce) {
                        var cast = cls.coerce.apply(_class, arguments);
                        if (cast) return cast;
                    }
                } while ((cls = cls.ancestor) && cls != Base);
                return _extend(target, _prototype);
            }
        }
        return this;
    };
    _prototype.constructor = _class;

    for (var i in Base) {
        _class[i] = this[i];
    }if (_static) _extend(_class, _static);
    _class.ancestor = this;
    _class.ancestorOf = Base.ancestorOf;
    _class.base = _prototype.base;
    _class.prototype = _prototype;
    if (_class.init) _class.init();

    return _class;
};

var Base = exports.Base = _subclass.call(Object, {
    constructor: function constructor() {
        if (arguments.length > 0) {
            this.extend(arguments[0]);
        }
    },

    extend: delegate(_extend),

    toString: function toString() {
        if (this.constructor.toString == Function.prototype.toString) {
            return "[object base2.Base]";
        } else {
            return "[object " + this.constructor.toString().slice(1, -1) + "]";
        }
    }
}, exports.Base = Base = {
    ancestorOf: function ancestorOf(klass) {
        return _ancestorOf(this, klass);
    },

    extend: _subclass,

    forEach: function forEach(object, block, context) {
        _Function_forEach(this, object, block, context);
    },

    implement: function implement(source) {
        if (typeof source == "function") {
            source = source.prototype;
        }

        _extend(this.prototype, source);
        return this;
    }
});

var Package = exports.Package = Base.extend({
    constructor: function constructor(_private, _public) {
        var pkg = this,
            openPkg;

        pkg.extend(_public);

        if (pkg.name && pkg.name != "base2") {
            if (_public.parent === undefined) pkg.parent = base2;
            openPkg = pkg.parent && pkg.parent[pkg.name];
            if (openPkg) {
                if (!(openPkg instanceof Package)) {
                    throw new Error(format("'%1' is reserved and cannot be used as a package name", pkg.name));
                }
                pkg.namespace = openPkg.namespace;
            } else {
                if (pkg.parent) {
                    pkg.version = pkg.version || pkg.parent.version;
                    pkg.parent.addName(pkg.name, pkg);
                }
                pkg.namespace = format("var %1=%2;", pkg.name, pkg.toString().slice(1, -1));
            }
        }

        if (_private) {
            _private.__package = this;
            _private.package = openPkg || this;

            var namespace = "var base2=(function(){return this.base2})(),_private=base2.toString;" + base2.namespace;
            var imports = csv(pkg.imports),
                name;
            for (var i = 0; name = imports[i]; i++) {
                var ns = lookup(name) || lookup("js." + name);
                if (!ns) throw new ReferenceError(format("Object not found: '%1'.", name));
                namespace += ns.namespace;
            }
            if (openPkg) namespace += openPkg.namespace;

            _private.init = function () {
                if (pkg.init) pkg.init();
            };
            _private.imports = namespace + lang.namespace + "this.init();";

            namespace = "";
            var nsPkg = openPkg || pkg;
            var exports = csv(pkg.exports);
            for (var i = 0; name = exports[i]; i++) {
                var fullName = pkg.name + "." + name;
                nsPkg.namespace += "var " + name + "=" + fullName + ";";
                namespace += "if(!" + fullName + ")" + fullName + "=" + name + ";";
            }
            _private.exported = function () {
                if (nsPkg.exported) nsPkg.exported(exports);
            };
            _private.exports = "if(!" + pkg.name + ")var " + pkg.name + "=this.__package;" + namespace + "this._label_" + pkg.name + "();this.exported();";

            var packageName = pkg.toString().slice(1, -1);
            _private["_label_" + pkg.name] = function () {
                for (var name in nsPkg) {
                    var object = nsPkg[name];
                    if (object && object.ancestorOf == Base.ancestorOf && name != "constructor") {
                        object.toString = K("[" + packageName + "." + name + "]");
                    }
                }
            };
        }

        if (openPkg) return openPkg;

        function lookup(names) {
            names = names.split(".");
            var value = base2,
                i = 0;
            while (value && names[i] != null) {
                value = value[names[i++]];
            }
            return value;
        };
    },

    exports: "",
    imports: "",
    name: "",
    namespace: "",
    parent: null,

    open: function open(_private, _public) {
        _public.name = this.name;
        _public.parent = this.parent;
        return new Package(_private, _public);
    },

    addName: function addName(name, value) {
        if (!this[name]) {
            this[name] = value;
            this.exports += "," + name;
            this.namespace += format("var %1=%2.%1;", name, this.name);
            if (value && value.ancestorOf == Base.ancestorOf && name != "constructor") {
                value.toString = K("[" + this.toString().slice(1, -1) + "." + name + "]");
            }
            if (this.exported) this.exported([name]);
        }
    },

    addPackage: function addPackage(name) {
        var pkg = new Package(null, { name: name, parent: this });
        this.addName(name, pkg);
        return pkg;
    },

    package: function _package(_private, _public) {
        _public.parent = this;
        return new Package(_private, _public);
    },

    toString: function toString() {
        return format("[%1]", this.parent ? this.parent.toString().slice(1, -1) + "." + this.name : this.name);
    }
});

var Abstract = exports.Abstract = Base.extend({
    constructor: function constructor() {
        throw new TypeError("Abstract class cannot be instantiated.");
    }
});

var _moduleCount = 0;

var Module = exports.Module = Abstract.extend(null, {
    namespace: "",

    extend: function extend(_interface, _static) {
        var module = this.base();
        var index = _moduleCount++;
        module.namespace = "";
        module.partial = this.partial;
        module.toString = K("[base2.Module[" + index + "]]");
        Module[index] = module;

        module.implement(this);

        if (_interface) module.implement(_interface);

        if (_static) {
            _extend(module, _static);
            if (module.init) module.init();
        }
        return module;
    },

    forEach: function forEach(block, context) {
        _Function_forEach(Module, this.prototype, function (method, name) {
            if (typeOf(method) == "function") {
                block.call(context, this[name], name, this);
            }
        }, this);
    },

    implement: function implement(_interface) {
        var module = this;
        var id = module.toString().slice(1, -1);
        if (typeof _interface == "function") {
            if (!_ancestorOf(_interface, module)) {
                this.base(_interface);
            }
            if (_ancestorOf(Module, _interface)) {
                for (var name in _interface) {
                    if (typeof module[name] == "undefined") {
                        var property = _interface[name];
                        if (typeof property == "function" && property.call && _interface.prototype[name]) {
                            property = _createStaticModuleMethod(_interface, name);
                        }
                        module[name] = property;
                    }
                }
                module.namespace += _interface.namespace.replace(/base2\.Module\[\d+\]/g, id);
            }
        } else {
            _extend(module, _interface);

            _extendModule(module, _interface);
        }
        return module;
    },

    partial: function partial() {
        var module = Module.extend();
        var id = module.toString().slice(1, -1);

        module.namespace = this.namespace.replace(/(\w+)=b[^\)]+\)/g, "$1=" + id + ".$1");
        this.forEach(function (method, name) {
            module[name] = _partial(bind(method, module));
        });
        return module;
    }
});

Module.prototype.base = Module.prototype.extend = _IGNORE;

function _extendModule(module, _interface) {
    var proto = module.prototype;
    var id = module.toString().slice(1, -1);
    for (var name in _interface) {
        var property = _interface[name],
            namespace = "";
        if (!proto[name]) {
            if (name == name.toUpperCase()) {
                namespace = "var " + name + "=" + id + "." + name + ";";
            } else if (typeof property == "function" && property.call) {
                namespace = "var " + name + "=base2.lang.bind('" + name + "'," + id + ");";
                proto[name] = _createModuleMethod(module, name);
            }
            if (module.namespace.indexOf(namespace) == -1) {
                module.namespace += namespace;
            }
        }
    }
};

function _createStaticModuleMethod(module, name) {
    return function () {
        return module[name].apply(module, arguments);
    };
};

function _createModuleMethod(module, name) {
    return function () {
        var args = _slice.call(arguments);
        args.unshift(this);
        return module[name].apply(module, args);
    };
};

function copy(object) {
    var copy = {};
    for (var i in object) {
        copy[i] = object[i];
    }
    return copy;
};

function pcopy(object) {
    _dummy.prototype = object;
    return new _dummy();
};

function _dummy() {};

function _extend(object, source) {
    if (object && source) {
        var useProto = __prototyping;
        if (arguments.length > 2) {
            var key = source;
            source = {};
            source[key] = arguments[2];
            useProto = true;
        }
        var proto = (typeof source == "function" ? Function : Object).prototype;

        if (useProto) {
            var i = _HIDDEN.length,
                key;
            while (key = _HIDDEN[--i]) {
                var desc = _getPropertyDescriptor(source, key);
                if (desc.value != proto[key]) {
                    desc = _override(object, key, desc);
                    if (desc) Object.defineProperty(object, key, desc);
                }
            }
        }

        for (key in source) {
            if (typeof proto[key] == "undefined" && key !== "base") {
                var desc = _getPropertyDescriptor(source, key);
                desc = _override(object, key, desc);
                if (desc) Object.defineProperty(object, key, desc);
            }
        }
    }
    return object;
}exports.extend = _extend;
;

function _ancestorOf(ancestor, fn) {
    while (fn) {
        if (!fn.ancestor) return false;
        fn = fn.ancestor;
        if (fn == ancestor) return true;
    }
    return false;
};

function _override(object, name, desc) {
    var value = desc.value;
    if (value === _IGNORE) return;
    if (typeof value !== "function" && "value" in desc) {
        return desc;
    }
    var ancestor = _getPropertyDescriptor(object, name);
    if (!ancestor) return desc;
    var superObject = __prototyping;
    if (superObject) {
        var sprop = _getPropertyDescriptor(superObject, name);
        if (sprop && (sprop.value != ancestor.value || sprop.get != ancestor.get || sprop.set != ancestor.set)) {
            superObject = null;
        }
    }
    if (value) {
        var avalue = ancestor.value;
        if (avalue && _BASE.test(value)) {
            desc.value = function () {
                var b = this.base;
                this.base = function () {
                    var b = this.base,
                        method = superObject && superObject[name] || avalue;
                    this.base = Undefined;
                    var ret = method.apply(this, arguments);
                    this.base = b;
                    return ret;
                };
                var ret = value.apply(this, arguments);
                this.base = b;
                return ret;
            };
        }
        return desc;
    }
    var get = desc.get,
        aget = ancestor.get;
    if (get) {
        if (aget && _BASE.test(get)) {
            desc.get = function () {
                var b = this.base;
                this.base = function () {
                    var b = this.base,
                        get = superObject && _getPropertyDescriptor(superObject, name).get || aget;
                    this.base = Undefined;
                    var ret = get.apply(this, arguments);
                    this.base = b;
                    return ret;
                };
                var ret = get.apply(this, arguments);
                this.base = b;
                return ret;
            };
        }
    } else if (superObject) {
        desc.get = function () {
            var get = _getPropertyDescriptor(superObject, name).get;
            return get.apply(this, arguments);
        };
    } else {
        desc.get = aget;
    }
    var set = desc.set,
        aset = ancestor.set;
    if (set) {
        if (aset && _BASE.test(set)) {
            desc.set = function () {
                var b = this.base;
                this.base = function () {
                    var b = this.base,
                        set = superObject && _getPropertyDescriptor(superObject, name).set || aset;
                    this.base = Undefined;
                    var ret = set.apply(this, arguments);
                    this.base = b;
                    return ret;
                };
                var ret = set.apply(this, arguments);
                this.base = b;
                return ret;
            };
        }
    } else if (superObject) {
        desc.set = function () {
            var set = _getPropertyDescriptor(superObject, name).set;
            return set.apply(this, arguments);
        };
    } else {
        desc.set = aset;
    }
    return desc;
};

function _getPropertyDescriptor(object, key) {
    var source = object,
        descriptor;
    while (source && !(descriptor = Object.getOwnPropertyDescriptor(source, key))) {
        source = Object.getPrototypeOf(source);
    }return descriptor;
}

function _Function_forEach(fn, object, block, context) {
    var Temp = function Temp() {
        this.i = 1;
    };
    Temp.prototype = { i: 1 };
    var count = 0;
    for (var i in new Temp()) {
        count++;
    }
    _Function_forEach = count > 1 ? function (fn, object, block, context) {
        var processed = {};
        for (var key in object) {
            if (!processed[key] && fn.prototype[key] === undefined) {
                processed[key] = true;
                block.call(context, object[key], key, object);
            }
        }
    } : function (fn, object, block, context) {
        for (var key in object) {
            if (typeof fn.prototype[key] == "undefined") {
                block.call(context, object[key], key, object);
            }
        }
    };

    _Function_forEach(fn, object, block, context);
};

function instanceOf(object, klass) {

    if (typeof klass != "function") {
        throw new TypeError("Invalid 'instanceOf' operand.");
    }

    if (object == null) return false;

    if (object.constructor == klass) return true;
    if (klass.ancestorOf) return klass.ancestorOf(object.constructor);

    if (object instanceof klass) return true;

    if (Base.ancestorOf == klass.ancestorOf) return false;

    if (Base.ancestorOf == object.constructor.ancestorOf) return klass == Object;

    switch (klass) {
        case Array:
            return _toString.call(object) == "[object Array]";
        case Date:
            return _toString.call(object) == "[object Date]";
        case RegExp:
            return _toString.call(object) == "[object RegExp]";
        case Function:
            return typeOf(object) == "function";
        case String:
        case Number:
        case Boolean:
            return typeOf(object) == _typeof(klass.prototype.valueOf());
        case Object:
            return true;
    }

    return false;
};

var _toString = Object.prototype.toString;

function typeOf(object) {
    var type = typeof object === "undefined" ? "undefined" : _typeof(object);
    switch (type) {
        case "object":
            return object == null ? "null" : typeof object.constructor == "function" && _toString.call(object) != "[object Date]" ? _typeof(object.constructor.prototype.valueOf()) : type;
        case "function":
            return typeof object.call == "function" ? type : "object";
        default:
            return type;
    }
};

function assignID(object, name) {
    if (!name) name = object.nodeType == 1 ? "uniqueID" : "base2ID";
    if (!object[name]) object[name] = "b2_" + _counter++;
    return object[name];
};

function format(string) {
    var args = arguments;
    var pattern = new RegExp("%([1-" + (arguments.length - 1) + "])", "g");
    return (string + "").replace(pattern, function (match, index) {
        return args[index];
    });
};

function csv(string) {
    return string ? (string + "").split(/\s*,\s*/) : [];
};

function bind(fn, context) {
    var lateBound = typeof fn != "function";
    if (arguments.length > 2) {
        var args = _slice.call(arguments, 2);
        return function () {
            return (lateBound ? context[fn] : fn).apply(context, args.concat.apply(args, arguments));
        };
    } else {
        return function () {
            return (lateBound ? context[fn] : fn).apply(context, arguments);
        };
    }
};

function _partial(fn) {
    var args = _slice.call(arguments, 1);
    return function () {
        var specialised = args.concat(),
            i = 0,
            j = 0;
        while (i < args.length && j < arguments.length) {
            if (specialised[i] === undefined) specialised[i] = arguments[j++];
            i++;
        }
        while (j < arguments.length) {
            specialised[i++] = arguments[j++];
        }
        if (Array2.contains(specialised, undefined)) {
            specialised.unshift(fn);
            return _partial.apply(null, specialised);
        }
        return fn.apply(this, specialised);
    };
}exports.partial = _partial;
;

function delegate(fn, context) {
    return function () {
        var args = _slice.call(arguments);
        args.unshift(this);
        return fn.apply(context, args);
    };
};

function K(k) {
    return function () {
        return k;
    };
};

var $eq = exports.$eq = $createModifier();
var $use = exports.$use = $createModifier();
var $copy = exports.$copy = $createModifier();
var $lazy = exports.$lazy = $createModifier();
var $eval = exports.$eval = $createModifier();
var $every = exports.$every = $createModifier();
var $child = exports.$child = $createModifier();
var $optional = exports.$optional = $createModifier();
var $promise = exports.$promise = $createModifier();
var $instant = exports.$instant = $createModifier();

var Enum = exports.Enum = Base.extend({
    constructor: function constructor(value, name, ordinal) {
        this.constructing(value, name);
        Object.defineProperties(this, {
            "value": {
                value: value,
                writable: false,
                configurable: false
            },
            "name": {
                value: name,
                writable: false,
                configurable: false
            },
            "ordinal": {
                value: ordinal,
                writable: false,
                configurable: false
            }

        });
    },
    toString: function toString() {
        return this.name;
    },
    constructing: function constructing(value, name) {
        if (!this.constructor.__defining) {
            throw new TypeError("Enums cannot be instantiated.");
        }
    }
}, {
    coerce: function coerce(choices, behavior) {
        if (this !== Enum && this !== Flags) {
            return;
        }
        var en = this.extend(behavior, {
            coerce: function coerce(value) {
                return this.fromValue(value);
            }
        });
        en.__defining = true;
        var items = [],
            ordinal = 0;
        en.names = Object.freeze(Object.keys(choices));
        for (var choice in choices) {
            var item = en[choice] = new en(choices[choice], choice, ordinal++);
            items.push(item);
        }
        en.items = Object.freeze(items);
        en.fromValue = this.fromValue;
        delete en.__defining;
        return Object.freeze(en);
    },
    fromValue: function fromValue(value) {
        var names = this.names;
        for (var i = 0; i < names.length; ++i) {
            var e = this[names[i]];
            if (e.value == value) {
                return e;
            }
        }
        throw new TypeError(format("%1 is not a valid value for this Enum.", value));
    }
});
Enum.prototype.valueOf = function () {
    var value = +this.value;
    return isNaN(value) ? this.ordinal : value;
};

var Flags = exports.Flags = Enum.extend({
    hasFlag: function hasFlag(flag) {
        flag = +flag;
        return (this & flag) === flag;
    },
    addFlag: function addFlag(flag) {
        return $isSomething(flag) ? this.constructor.fromValue(this | flag) : this;
    },
    removeFlag: function removeFlag(flag) {
        return $isSomething(flag) ? this.constructor.fromValue(this & ~flag) : this;
    },
    constructing: function constructing(value, name) {}
}, {
    fromValue: function fromValue(value) {
        value = +value;
        var name = void 0,
            names = this.names;
        for (var i = 0; i < names.length; ++i) {
            var flag = this[names[i]];
            if (flag.value === value) {
                return flag;
            }
            if ((value & flag.value) === flag.value) {
                name = name ? name + "," + flag.name : flag.name;
            }
        }
        return new this(value, name);
    }
});

var Variance = exports.Variance = Enum({
    Covariant: 1,

    Contravariant: 2,

    Invariant: 3
});

var Protocol = exports.Protocol = Base.extend({
    constructor: function constructor(delegate, strict) {
        if ($isNothing(delegate)) {
            delegate = new Delegate();
        } else if (delegate instanceof Delegate === false) {
            if ($isFunction(delegate.toDelegate)) {
                delegate = delegate.toDelegate();
                if (delegate instanceof Delegate === false) {
                    throw new TypeError(format("Invalid delegate: %1 is not a Delegate nor does it have a 'toDelegate' method that returned one.", delegate));
                }
            } else if ($isArray(delegate)) {
                delegate = new ArrayDelegate(delegate);
            } else {
                delegate = new ObjectDelegate(delegate);
            }
        }
        Object.defineProperty(this, 'delegate', { value: delegate });
        Object.defineProperty(this, 'strict', { value: !!strict });
    },
    __get: function __get(propertyName) {
        var delegate = this.delegate;
        return delegate && delegate.get(this.constructor, propertyName, this.strict);
    },
    __set: function __set(propertyName, propertyValue) {
        var delegate = this.delegate;
        return delegate && delegate.set(this.constructor, propertyName, propertyValue, this.strict);
    },
    __invoke: function __invoke(methodName, args) {
        var delegate = this.delegate;
        return delegate && delegate.invoke(this.constructor, methodName, args, this.strict);
    }
}, {
    conformsTo: False,
    isProtocol: function isProtocol(target) {
        return target && target.prototype instanceof Protocol;
    },
    adoptedBy: function adoptedBy(target) {
        return target && $isFunction(target.conformsTo) ? target.conformsTo(this) : false;
    },
    coerce: function coerce(object, strict) {
        return new this(object, strict);
    }
});

var MetaStep = exports.MetaStep = Enum({
    Subclass: 1,

    Implement: 2,

    Extend: 3
});

var MetaMacro = exports.MetaMacro = Base.extend({
    inflate: function inflate(step, metadata, target, definition, expand) {},
    execute: function execute(step, metadata, target, definition) {},
    protocolAdded: function protocolAdded(metadata, protocol) {},
    extractProperty: function extractProperty(property, target, source) {
        var value = source[property];
        if ($isFunction(value)) {
            value = value();
        }
        delete target[property];
        return value;
    },

    shouldInherit: False,

    isActive: False
}, {
    coerce: function coerce() {
        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }

        return Reflect.construct(this, args);
    }
});

var MetaBase = exports.MetaBase = MetaMacro.extend({
    constructor: function constructor(parent) {
        var _protocols = [],
            _descriptors = void 0;
        this.extend({
            getParent: function getParent() {
                return parent;
            },
            getProtocols: function getProtocols() {
                return _protocols.slice(0);
            },
            getAllProtocols: function getAllProtocols() {
                var protocols = this.getProtocols(),
                    inner = protocols.slice(0);
                for (var i = 0; i < inner.length; ++i) {
                    var innerProtocols = inner[i].$meta.getAllProtocols();
                    for (var ii = 0; ii < innerProtocols.length; ++ii) {
                        var protocol = innerProtocols[ii];
                        if (protocols.indexOf(protocol) < 0) {
                            protocols.push(protocol);
                        }
                    }
                }
                return protocols;
            },
            addProtocol: function addProtocol(protocols) {
                if ($isNothing(protocols)) {
                    return;
                }
                if (!$isArray(protocols)) {
                    protocols = Array.prototype.slice.call(arguments);
                }
                for (var i = 0; i < protocols.length; ++i) {
                    var protocol = protocols[i];
                    if (protocol.prototype instanceof Protocol && _protocols.indexOf(protocol) === -1) {
                        _protocols.push(protocol);
                        this.protocolAdded(this, protocol);
                    }
                }
            },
            protocolAdded: function protocolAdded(metadata, protocol) {
                if (parent) {
                    parent.protocolAdded(metadata, protocol);
                }
            },
            conformsTo: function conformsTo(protocol) {
                if (!(protocol && protocol.prototype instanceof Protocol)) {
                    return false;
                }
                for (var index = 0; index < _protocols.length; ++index) {
                    var proto = _protocols[index];
                    if (protocol === proto || proto.conformsTo(protocol)) {
                        return true;
                    }
                }
                return false;
            },
            inflate: function inflate(step, metadata, target, definition, expand) {
                if (parent) {
                    parent.inflate(step, metadata, target, definition, expand);
                } else if ($properties) {
                    $properties.shared.inflate(step, metadata, target, definition, expand);
                }
            },
            execute: function execute(step, metadata, target, definition) {
                if (parent) {
                    parent.execute(step, metadata, target, definition);
                } else if ($properties) {
                    $properties.shared.execute(step, metadata, target, definition);
                }
            },
            defineProperty: function defineProperty(target, name, spec, descriptor) {
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
            getDescriptor: function getDescriptor(filter) {
                var descriptors = void 0;
                if ($isNothing(filter)) {
                    if (parent) {
                        descriptors = parent.getDescriptor(filter);
                    }
                    if (_descriptors) {
                        descriptors = _extend(descriptors || {}, _descriptors);
                    }
                } else if ($isString(filter)) {
                    return _descriptors && _descriptors[filter] || parent && parent.getDescriptor(filter);
                } else {
                    if (parent) {
                        descriptors = parent.getDescriptor(filter);
                    }
                    for (var key in _descriptors) {
                        var descriptor = _descriptors[key];
                        if (this.matchDescriptor(descriptor, filter)) {
                            descriptors = _extend(descriptors || {}, key, descriptor);
                        }
                    }
                }
                return descriptors;
            },
            addDescriptor: function addDescriptor(name, descriptor) {
                _descriptors = _extend(_descriptors || {}, name, descriptor);
                return this;
            },
            matchDescriptor: function matchDescriptor(descriptor, filter) {
                if (typeOf(descriptor) !== 'object' || typeOf(filter) !== 'object') {
                    return false;
                }
                for (var key in filter) {
                    var match = filter[key];
                    if (match === undefined) {
                        if (!(key in descriptor)) {
                            return false;
                        }
                    } else {
                        var value = descriptor[key];
                        if ($isArray(match)) {
                            if (!$isArray(value)) {
                                return false;
                            }
                            for (var i = 0; i < match.length; ++i) {
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
            linkBase: function linkBase(method) {
                if (!this[method]) {
                    this.extend(method, function () {
                        var baseMethod = parent && parent[method];
                        if (baseMethod) {
                            return baseMethod.apply(parent, arguments);
                        }
                    });
                }
                return this;
            }
        });
    }
});

var ClassMeta = exports.ClassMeta = MetaBase.extend({
    constructor: function constructor(baseMeta, subClass, protocols, macros) {
        var _macros = macros && macros.slice(0),
            _isProtocol = subClass === Protocol || subClass.prototype instanceof Protocol;
        this.base(baseMeta);
        this.extend({
            getClass: function getClass() {
                return subClass;
            },
            isProtocol: function isProtocol() {
                return _isProtocol;
            },
            getAllProtocols: function getAllProtocols() {
                var protocols = this.base();
                if (!_isProtocol && baseMeta) {
                    var baseProtocols = baseMeta.getAllProtocols();
                    for (var i = 0; i < baseProtocols.length; ++i) {
                        var protocol = baseProtocols[i];
                        if (protocols.indexOf(protocol) < 0) {
                            protocols.push(protocol);
                        }
                    }
                }
                return protocols;
            },
            protocolAdded: function protocolAdded(metadata, protocol) {
                this.base(metadata, protocol);
                if (!_macros || _macros.length == 0) {
                    return;
                }
                for (var i = 0; i < _macros.length; ++i) {
                    var macro = _macros[i];
                    if ($isFunction(macro.protocolAdded)) {
                        macro.protocolAdded(metadata, protocol);
                    }
                }
            },
            conformsTo: function conformsTo(protocol) {
                if (!(protocol && protocol.prototype instanceof Protocol)) {
                    return false;
                } else if (protocol === subClass || subClass.prototype instanceof protocol) {
                    return true;
                }
                return this.base(protocol) || !!(baseMeta && baseMeta.conformsTo(protocol));
            },
            inflate: function inflate(step, metadata, target, definition, expand) {
                this.base(step, metadata, target, definition, expand);
                if (!_macros || _macros.length == 0) {
                    return;
                }
                var active = step !== MetaStep.Subclass;
                for (var i = 0; i < _macros.length; ++i) {
                    var macro = _macros[i];
                    if ($isFunction(macro.inflate) && (!active || macro.isActive()) && macro.shouldInherit()) {
                        macro.inflate(step, metadata, target, definition, expand);
                    }
                }
            },
            execute: function execute(step, metadata, target, definition) {
                this.base(step, metadata, target, definition);
                if (!_macros || _macros.length == 0) {
                    return;
                }
                var inherit = this !== metadata,
                    active = step !== MetaStep.Subclass;
                for (var i = 0; i < _macros.length; ++i) {
                    var macro = _macros[i];
                    if ((!active || macro.isActive()) && (!inherit || macro.shouldInherit())) {
                        macro.execute(step, metadata, target, definition);
                    }
                }
            },
            createSubclass: function createSubclass() {
                var args = Array.prototype.slice.call(arguments);
                var constraints = args,
                    protocols = void 0,
                    mixins = void 0,
                    macros = void 0;
                if (subClass.prototype instanceof Protocol) {
                    (protocols = []).push(subClass);
                }
                if (args.length > 0 && $isArray(args[0])) {
                    constraints = args.shift();
                }
                while (constraints.length > 0) {
                    var constraint = constraints[0];
                    if (!constraint) {
                        break;
                    } else if (constraint.prototype instanceof Protocol) {
                        (protocols || (protocols = [])).push(constraint);
                    } else if (constraint instanceof MetaMacro) {
                        (macros || (macros = [])).push(constraint);
                    } else if ($isFunction(constraint) && constraint.prototype instanceof MetaMacro) {
                        (macros || (macros = [])).push(new constraint());
                    } else if (constraint.prototype) {
                        (mixins || (mixins = [])).push(constraint);
                    } else {
                        break;
                    }
                    constraints.shift();
                }
                var instanceDef = args.shift() || {},
                    staticDef = args.shift() || {};
                this.inflate(MetaStep.Subclass, this, subClass.prototype, instanceDef, expand);
                if (macros) {
                    for (var i = 0; i < macros.length; ++i) {
                        macros[i].inflate(MetaStep.Subclass, this, subClass.prototype, instanceDef, expand);
                    }
                }
                instanceDef = expand.x || instanceDef;
                var derived = ClassMeta.baseExtend.call(subClass, instanceDef, staticDef),
                    metadata = new ClassMeta(this, derived, protocols, macros);
                Object.defineProperty(derived, '$meta', {
                    enumerable: false,
                    configurable: false,
                    writable: false,
                    value: metadata
                });
                Object.defineProperty(derived.prototype, '$meta', {
                    enumerable: false,
                    configurable: false,
                    get: ClassMeta.createInstanceMeta
                });
                derived.conformsTo = metadata.conformsTo.bind(metadata);
                metadata.execute(MetaStep.Subclass, metadata, derived.prototype, instanceDef);
                if (mixins) {
                    mixins.forEach(function (mixin) {
                        return derived.implement(mixin);
                    });
                }
                function expand() {
                    return expand.x || (expand.x = Object.create(instanceDef));
                }
                return derived;
            },
            embellishClass: function embellishClass(source) {
                var _this2 = this;

                if ($isFunction(source)) {
                    source = source.prototype;
                }
                if ($isSomething(source)) {
                    (function () {
                        var expand = function expand() {
                            return expand.x || (expand.x = Object.create(source));
                        };

                        _this2.inflate(MetaStep.Implement, _this2, subClass.prototype, source, expand);
                        source = expand.x || source;
                        ClassMeta.baseImplement.call(subClass, source);
                        _this2.execute(MetaStep.Implement, _this2, subClass.prototype, source);
                        ;
                    })();
                }
                return subClass;
            }
        });
        this.addProtocol(protocols);
    }
}, {
    init: function init() {
        this.baseExtend = Base.extend;
        this.baseImplement = Base.implement;
        Base.$meta = new this(undefined, Base);
        Abstract.$meta = new this(Base.$meta, Abstract);
        Base.extend = Abstract.extend = function () {
            return this.$meta.createSubclass.apply(this.$meta, arguments);
        };
        Base.implement = Abstract.implement = function () {
            return this.$meta.embellishClass.apply(this.$meta, arguments);
        };
        Base.prototype.conformsTo = function (protocol) {
            return this.constructor.$meta.conformsTo(protocol);
        };
    },
    createInstanceMeta: function createInstanceMeta(parent) {
        var metadata = new InstanceMeta(parent || this.constructor.$meta);
        Object.defineProperty(this, '$meta', {
            enumerable: false,
            configurable: true,
            writable: false,
            value: metadata
        });
        return metadata;
    }
});

var InstanceMeta = exports.InstanceMeta = MetaBase.extend({
    constructor: function constructor(classMeta) {
        this.base(classMeta);
        this.extend({
            getClass: function getClass() {
                return classMeta.getClass();
            },
            isProtocol: function isProtocol() {
                return classMeta.isProtocol();
            }
        });
    }
}, {
    init: function init() {
        var baseExtend = Base.prototype.extend;
        Base.prototype.extend = function (key, value) {
            var _this3 = this;

            var numArgs = arguments.length,
                definition = numArgs === 1 ? key : {};
            if (numArgs >= 2) {
                definition[key] = value;
            } else if (numArgs === 0) {
                return this;
            }
            var metadata = this.$meta;
            if (metadata) {
                (function () {
                    var expand = function expand() {
                        return expand.x || (expand.x = Object.create(definition));
                    };

                    metadata.inflate(MetaStep.Extend, metadata, _this3, definition, expand);
                    definition = expand.x || definition;
                    ;
                })();
            }
            baseExtend.call(this, definition);
            if (metadata) {
                metadata.execute(MetaStep.Extend, metadata, this, definition);
            }
            return this;
        };
    }
});

Enum.$meta = new ClassMeta(Base.$meta, Enum);
Enum.extend = Base.extend;
Enum.implement = Base.implement;

var $proxyProtocol = exports.$proxyProtocol = MetaMacro.extend({
    inflate: function inflate(step, metadata, target, definition, expand) {
        var protocolProto = Protocol.prototype,
            expanded = void 0;

        var _loop = function _loop(key) {
            if (key in protocolProto) {
                return "continue";
            }
            expanded = expanded || expand();
            var member = _getPropertyDescriptor(definition, key);
            if ($isFunction(member.value)) {
                (function (method) {
                    member.value = function () {
                        var args = Array.prototype.slice.call(arguments);
                        return this.__invoke(method, args);
                    };
                })(key);
            } else if (member.get || member.set) {
                if (member.get) {
                    (function (get) {
                        member.get = function () {
                            return this.__get(get);
                        };
                    })(key);
                }
                if (member.set) {
                    (function (set) {
                        member.set = function (value) {
                            return this.__set(set, value);
                        };
                    })(key);
                }
            } else {
                return "continue";
            }
            Object.defineProperty(expanded, key, member);
        };

        for (var key in definition) {
            var _ret3 = _loop(key);

            if (_ret3 === "continue") continue;
        }
    },
    execute: function execute(step, metadata, target, definition) {
        if (step === MetaStep.Subclass) {
            var clazz = metadata.getClass();
            clazz.adoptedBy = Protocol.adoptedBy;
        }
    },
    protocolAdded: function protocolAdded(metadata, protocol) {
        var source = protocol.prototype,
            target = metadata.getClass().prototype,
            protocolProto = Protocol.prototype;
        for (var key in source) {
            if (!(key in protocolProto && key in this)) {
                var descriptor = _getPropertyDescriptor(source, key);
                Object.defineProperty(target, key, descriptor);
            }
        }
    },

    shouldInherit: True,

    isActive: True
});
Protocol.extend = Base.extend;
Protocol.implement = Base.implement;
Protocol.$meta = new ClassMeta(Base.$meta, Protocol, null, [new $proxyProtocol()]);

var StrictProtocol = exports.StrictProtocol = Protocol.extend({
    constructor: function constructor(proxy, strict) {
        this.base(proxy, strict === undefined || strict);
    }
});

var GETTER_CONVENTIONS = ['get', 'is'];

var $properties = exports.$properties = MetaMacro.extend({
    constructor: function constructor(tag) {
        if ($isNothing(tag)) {
            throw new Error("$properties requires a tag name");
        }
        Object.defineProperty(this, 'tag', { value: tag });
    },
    execute: function execute(step, metadata, target, definition) {
        var properties = this.extractProperty(this.tag, target, definition);
        if (!properties) {
            return;
        }
        var expanded = {},
            source = void 0;
        for (var name in properties) {
            source = expanded;
            var property = properties[name],
                spec = {
                configurable: true,
                enumerable: true
            };
            if ($isNothing(property) || $isString(property) || typeOf(property.length) == "number" || typeOf(property) !== 'object') {
                property = { value: property };
            }
            if (name in definition) {
                source = null;
            } else if (property.get || property.set) {
                    spec.get = property.get;
                    spec.set = property.set;
                } else if (target instanceof Protocol) {
                    spec.get = spec.set = Undefined;
                } else if ("auto" in property) {
                    (function () {
                        var field = property.auto;
                        if (!(field && $isString(field))) {
                            field = "_" + name;
                        }
                        spec.get = function () {
                            return this[field];
                        };
                        spec.set = function (value) {
                            this[field] = value;
                        };
                    })();
                } else {
                    spec.writable = true;
                    spec.value = property.value;
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
    defineProperty: function defineProperty(metadata, target, name, spec, descriptor) {
        metadata.defineProperty(target, name, spec, descriptor);
    },

    shouldInherit: True,

    isActive: True
}, {
    init: function init() {
        Object.defineProperty(this, 'shared', {
            enumerable: false,
            configurable: false,
            writable: false,
            value: Object.freeze(new this("$properties"))
        });
    }
});

var $inferProperties = exports.$inferProperties = MetaMacro.extend({
    inflate: function inflate(step, metadata, target, definition, expand) {
        var expanded = void 0;
        for (var key in definition) {
            var _member = _getPropertyDescriptor(definition, key);
            if ($isFunction(_member.value)) {
                var spec = { configurable: true, enumerable: true },
                    name = this.inferProperty(key, _member.value, definition, spec);
                if (name) {
                    expanded = expanded || expand();
                    Object.defineProperty(expanded, name, spec);
                }
            }
        }
    },
    inferProperty: function inferProperty(key, method, definition, spec) {
        for (var i = 0; i < GETTER_CONVENTIONS.length; ++i) {
            var prefix = GETTER_CONVENTIONS[i];
            if (key.lastIndexOf(prefix, 0) == 0) {
                if (method.length === 0) {
                    spec.get = method;
                    var name = key.substring(prefix.length),
                        setter = definition['set' + name];
                    if ($isFunction(setter)) {
                        spec.set = setter;
                    }
                    return name.charAt(0).toLowerCase() + name.slice(1);
                }
            }
        }
        if (key.lastIndexOf('set', 0) == 0) {
            if (method.length === 1) {
                spec.set = method;
                var _name = key.substring(3),
                    getter = definition['get' + _name];
                if ($isFunction(getter)) {
                    spec.get = getter;
                }
                return _name.charAt(0).toLowerCase() + _name.slice(1);
            }
        }
    },

    shouldInherit: True,

    isActive: True
});

function _cleanDescriptor(descriptor) {
    delete descriptor.writable;
    delete descriptor.value;
    delete descriptor.get;
    delete descriptor.set;
}

var $inheritStatic = exports.$inheritStatic = MetaMacro.extend({
    constructor: function constructor() {
        var spec = {
            value: Array.prototype.slice.call(arguments)
        };
        Object.defineProperty(this, 'members', spec);
        delete spec.value;
    },
    execute: function execute(step, metadata, target) {
        if (step === MetaStep.Subclass) {
            var members = this.members,
                clazz = metadata.getClass(),
                ancestor = $ancestorOf(clazz);
            if (members.length > 0) {
                for (var i = 0; i < members.length; ++i) {
                    var _member2 = members[i];
                    if (!(_member2 in clazz)) {
                        clazz[_member2] = ancestor[_member2];
                    }
                }
            } else if (ancestor !== Base && ancestor !== Object) {
                for (var key in ancestor) {
                    if (ancestor.hasOwnProperty(key) && !(key in clazz)) {
                        clazz[key] = ancestor[key];
                    }
                }
            }
        }
    },

    shouldInherit: True
});

var Delegate = exports.Delegate = Base.extend({
    get: function get(protocol, propertyName, strict) {},
    set: function set(protocol, propertyName, propertyValue, strict) {},
    invoke: function invoke(protocol, methodName, args, strict) {}
});

var ObjectDelegate = exports.ObjectDelegate = Delegate.extend({
    constructor: function constructor(object) {
        Object.defineProperty(this, 'object', { value: object });
    },
    get: function get(protocol, propertyName, strict) {
        var object = this.object;
        if (object && (!strict || protocol.adoptedBy(object))) {
            return object[propertyName];
        }
    },
    set: function set(protocol, propertyName, propertyValue, strict) {
        var object = this.object;
        if (object && (!strict || protocol.adoptedBy(object))) {
            return object[propertyName] = propertyValue;
        }
    },
    invoke: function invoke(protocol, methodName, args, strict) {
        var object = this.object;
        if (object && (!strict || protocol.adoptedBy(object))) {
            var method = object[methodName];
            return method && method.apply(object, args);
        }
    }
});

var ArrayDelegate = exports.ArrayDelegate = Delegate.extend({
    constructor: function constructor(array) {
        Object.defineProperty(this, 'array', { value: array });
    },
    get: function get(protocol, propertyName, strict) {
        var array = this.array;
        return array && array.reduce(function (result, object) {
            return !strict || protocol.adoptedBy(object) ? object[propertyName] : result;
        }, undefined);
    },
    set: function set(protocol, propertyName, propertyValue, strict) {
        var array = this.array;
        return array && array.reduce(function (result, object) {
            return !strict || protocol.adoptedBy(object) ? object[propertyName] = propertyValue : result;
        }, undefined);
    },
    invoke: function invoke(protocol, methodName, args, strict) {
        var array = this.array;
        return array && array.reduce(function (result, object) {
            var method = object[methodName];
            return method && (!strict || protocol.adoptedBy(object)) ? method.apply(object, args) : result;
        }, undefined);
    }
});

var Miruken = exports.Miruken = Base.extend(null, {
    coerce: function coerce() {
        for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
            args[_key2] = arguments[_key2];
        }

        return Reflect.construct(this, args);
    }
});

var Initializing = exports.Initializing = Protocol.extend({
    initialize: function initialize() {}
});

var Disposing = exports.Disposing = Protocol.extend({
    dispose: function dispose() {}
});

var DisposingMixin = exports.DisposingMixin = Module.extend({
    dispose: function dispose(object) {
        if ($isFunction(object._dispose)) {
            var result = object._dispose();
            object.dispose = Undefined;
            return result;
        }
    }
});

var Resolving = exports.Resolving = Protocol.extend();

var Invoking = exports.Invoking = StrictProtocol.extend({
    invoke: function invoke(fn, dependencies, ctx) {}
});

var Parenting = exports.Parenting = Protocol.extend({
    newChild: function newChild() {}
});

var Starting = exports.Starting = Protocol.extend({
    start: function start() {}
});

var Startup = exports.Startup = Base.extend(Starting, {
    start: function start() {}
});

function $using(disposing, action, context) {
    if (disposing && $isFunction(disposing.dispose)) {
        if (!$isPromise(action)) {
            var result = void 0;
            try {
                result = $isFunction(action) ? action.call(context, disposing) : action;
                if (!$isPromise(result)) {
                    return result;
                }
            } finally {
                if ($isPromise(result)) {
                    action = result;
                } else {
                    var dresult = disposing.dispose();
                    if (dresult !== undefined) {
                        return dresult;
                    }
                }
            }
        }
        return action.then(function (res) {
            var dres = disposing.dispose();
            return dres !== undefined ? dres : res;
        }, function (err) {
            var dres = disposing.dispose();
            return dres !== undefined ? dres : Promise.reject(err);
        });
    }
}

function Modifier() {}
Modifier.isModified = function (source) {
    return source instanceof Modifier;
};
Modifier.unwrap = function (source) {
    return source instanceof Modifier ? Modifier.unwrap(source.getSource()) : source;
};
function $createModifier() {
    var allowNew = void 0;
    function modifier(source) {
        if (!new.target) {
            if (modifier.test(source)) {
                return source;
            }
            allowNew = true;
            var wrapped = new modifier(source);
            allowNew = false;
            return wrapped;
        } else {
            if (!allowNew) {
                throw new Error("Modifiers should not be called with the new operator.");
            }
            this.getSource = function () {
                return source;
            };
        }
    }
    modifier.prototype = new Modifier();
    modifier.test = function (source) {
        if (source instanceof modifier) {
            return true;
        } else if (source instanceof Modifier) {
            return modifier.test(source.getSource());
        }
        return false;
    };
    return modifier;
}

var ArrayManager = exports.ArrayManager = Base.extend({
    constructor: function constructor(items) {
        var _items = [];
        this.extend({
            getItems: function getItems() {
                return _items;
            },
            getIndex: function getIndex(index) {
                if (_items.length > index) {
                    return _items[index];
                }
            },
            setIndex: function setIndex(index, item) {
                if (_items.length <= index || _items[index] === undefined) {
                    _items[index] = this.mapItem(item);
                }
                return this;
            },
            insertIndex: function insertIndex(index, item) {
                _items.splice(index, 0, this.mapItem(item));
                return this;
            },
            replaceIndex: function replaceIndex(index, item) {
                _items[index] = this.mapItem(item);
                return this;
            },
            removeIndex: function removeIndex(index) {
                if (_items.length > index) {
                    _items.splice(index, 1);
                }
                return this;
            },
            append: function append() {
                var newItems = void 0;
                if (arguments.length === 1 && $isArray(arguments[0])) {
                    newItems = arguments[0];
                } else if (arguments.length > 0) {
                    newItems = arguments;
                }
                if (newItems) {
                    for (var i = 0; i < newItems.length; ++i) {
                        _items.push(this.mapItem(newItems[i]));
                    }
                }
                return this;
            },
            merge: function merge(items) {
                for (var index = 0; index < items.length; ++index) {
                    var item = items[index];
                    if (item !== undefined) {
                        this.setIndex(index, item);
                    }
                }
                return this;
            }
        });
        if (items) {
            this.append(items);
        }
    },
    mapItem: function mapItem(item) {
        return item;
    }
});

var IndexedList = exports.IndexedList = Base.extend({
    constructor: function constructor(order) {
        var _index = {};
        this.extend({
            isEmpty: function isEmpty() {
                return !this.head;
            },
            getIndex: function getIndex(index) {
                return index && _index[index];
            },
            insert: function insert(node, index) {
                var indexedNode = this.getIndex(index);
                var insert = indexedNode;
                if (index) {
                    insert = insert || this.head;
                    while (insert && order(node, insert) >= 0) {
                        insert = insert.next;
                    }
                }
                if (insert) {
                    var prev = insert.prev;
                    node.next = insert;
                    node.prev = prev;
                    insert.prev = node;
                    if (prev) {
                        prev.next = node;
                    }
                    if (this.head === insert) {
                        this.head = node;
                    }
                } else {
                    delete node.next;
                    var tail = this.tail;
                    if (tail) {
                        node.prev = tail;
                        tail.next = node;
                    } else {
                        this.head = node;
                        delete node.prev;
                    }
                    this.tail = node;
                }
                if (index) {
                    node.index = index;
                    if (!indexedNode) {
                        _index[index] = node;
                    }
                }
            },
            remove: function remove(node) {
                var prev = node.prev,
                    next = node.next;
                if (prev) {
                    if (next) {
                        prev.next = next;
                        next.prev = prev;
                    } else {
                        this.tail = prev;
                        delete prev.next;
                    }
                } else if (next) {
                    this.head = next;
                    delete next.prev;
                } else {
                    delete this.head;
                    delete this.tail;
                }
                var index = node.index;
                if (this.getIndex(index) === node) {
                    if (next && next.index === index) {
                        _index[index] = next;
                    } else {
                        delete _index[index];
                    }
                }
            }
        });
    }
});

var Facet = exports.Facet = Object.freeze({
    Parameters: 'parameters',

    Interceptors: 'interceptors',

    InterceptorSelectors: 'interceptorSelectors',

    Delegate: 'delegate'
});

var Interceptor = exports.Interceptor = Base.extend({
    intercept: function intercept(invocation) {
        return invocation.proceed();
    }
});

var InterceptorSelector = exports.InterceptorSelector = Base.extend({
    selectInterceptors: function selectInterceptors(type, method, interceptors) {
        return interceptors;
    }
});

var ProxyBuilder = exports.ProxyBuilder = Base.extend({
    buildProxy: function buildProxy(types, options) {
        if (!$isArray(types)) {
            throw new TypeError("ProxyBuilder requires an array of types to proxy.");
        }
        var classes = types.filter($isClass),
            protocols = types.filter($isProtocol);
        return _buildProxy(classes, protocols, options || {});
    }
});

function _buildProxy(classes, protocols, options) {
    var base = options.baseType || classes.shift() || Base,
        proxy = base.extend(classes.concat(protocols), {
        constructor: function constructor(facets) {
            var spec = {};
            spec.value = facets[Facet.InterceptorSelectors];
            if (spec.value && spec.value.length > 0) {
                Object.defineProperty(this, "selectors", spec);
            }
            spec.value = facets[Facet.Interceptors];
            if (spec.value && spec.value.length > 0) {
                Object.defineProperty(this, "interceptors", spec);
            }
            spec.value = facets[Facet.Delegate];
            if (spec.value) {
                spec.writable = true;
                Object.defineProperty(this, "delegate", spec);
            }
            var ctor = _proxyMethod("constructor", this.base, base);
            ctor.apply(this, facets[Facet.Parameters]);
            delete spec.writable;
            delete spec.value;
        },
        getInterceptors: function getInterceptors(source, method) {
            var selectors = this.selectors;
            return selectors ? selectors.reduce(function (interceptors, selector) {
                return selector.selectInterceptors(source, method, interceptors);
            }, this.interceptors) : this.interceptors;
        },

        extend: _extendProxy
    }, {
        shouldProxy: options.shouldProxy
    });
    _proxyClass(proxy, protocols);
    proxy.extend = proxy.implement = _throwProxiesSealedExeception;
    return proxy;
}

function _throwProxiesSealedExeception() {
    throw new TypeError("Proxy classes are sealed and cannot be extended from.");
}

function _proxyClass(proxy, protocols) {
    var sources = [proxy].concat(protocols),
        proxyProto = proxy.prototype,
        proxied = {};
    for (var i = 0; i < sources.length; ++i) {
        var source = sources[i],
            sourceProto = source.prototype,
            isProtocol = $isProtocol(source);
        for (var key in sourceProto) {
            if (!(key in proxied || key in _noProxyMethods) && (!proxy.shouldProxy || proxy.shouldProxy(key, source))) {
                var descriptor = _getPropertyDescriptor(sourceProto, key);
                if ('value' in descriptor) {
                    var _member3 = isProtocol ? undefined : descriptor.value;
                    if ($isNothing(_member3) || $isFunction(_member3)) {
                        proxyProto[key] = _proxyMethod(key, _member3, proxy);
                    }
                    proxied[key] = true;
                } else if (isProtocol) {
                    var cname = key.charAt(0).toUpperCase() + key.slice(1),
                        get = 'get' + cname,
                        set = 'set' + cname,
                        spec = _proxyClass.spec || (_proxyClass.spec = {
                        enumerable: true
                    });
                    spec.get = function (get) {
                        var proxyGet = void 0;
                        return function () {
                            if (get in this) {
                                return this[get].call(this);
                            }
                            if (!proxyGet) {
                                proxyGet = _proxyMethod(get, undefined, proxy);
                            }
                            return proxyGet.call(this);
                        };
                    }(get);
                    spec.set = function (set) {
                        var proxySet = void 0;
                        return function (value) {
                            if (set in this) {
                                return this[set].call(this, value);
                            }
                            if (!proxySet) {
                                proxySet = _proxyMethod(set, undefined, proxy);
                            }
                            return proxySet.call(this, value);
                        };
                    }(set);
                    Object.defineProperty(proxy.prototype, key, spec);
                    proxied[key] = true;
                }
            }
        }
    }
}

function _proxyMethod(key, method, source) {
    var interceptors = void 0;
    var spec = _proxyMethod.spec || (_proxyMethod.spec = {});
    function methodProxy() {
        var _this = this;
        var delegate = this.delegate,
            idx = -1;
        if (!interceptors) {
            interceptors = this.getInterceptors(source, key);
        }
        var invocation = {
            args: Array.prototype.slice.call(arguments),
            useDelegate: function useDelegate(value) {
                delegate = value;
            },
            replaceDelegate: function replaceDelegate(value) {
                _this.delegate = delegate = value;
            },
            proceed: function proceed() {
                ++idx;
                if (interceptors && idx < interceptors.length) {
                    var interceptor = interceptors[idx];
                    return interceptor.intercept(invocation);
                }
                if (delegate) {
                    var delegateMethod = delegate[key];
                    if ($isFunction(delegateMethod)) {
                        return delegateMethod.apply(delegate, this.args);
                    }
                } else if (method) {
                    return method.apply(_this, this.args);
                }
                throw new Error(format("Interceptor cannot proceed without a class or delegate method '%1'.", key));
            }
        };
        spec.value = key;
        Object.defineProperty(invocation, 'method', spec);
        spec.value = source;
        Object.defineProperty(invocation, 'source', spec);
        delete spec.value;
        spec.get = function () {
            if (interceptors && idx + 1 < interceptors.length) {
                return true;
            }
            if (delegate) {
                return $isFunction(delegate(key));
            }
            return !!method;
        };
        Object.defineProperty(invocation, 'canProceed', spec);
        delete spec.get;
        return invocation.proceed();
    }
    methodProxy.baseMethod = method;
    return methodProxy;
}

function _extendProxy() {
    var proxy = this.constructor,
        clazz = proxy.prototype,
        overrides = arguments.length === 1 ? arguments[0] : {};
    if (arguments.length >= 2) {
        overrides[arguments[0]] = arguments[1];
    }
    for (var methodName in overrides) {
        if (!(methodName in _noProxyMethods) && (!proxy.shouldProxy || proxy.shouldProxy(methodName, clazz))) {
            var method = this[methodName];
            if (method && method.baseMethod) {
                this[methodName] = method.baseMethod;
            }
            this.base(methodName, overrides[methodName]);
            this[methodName] = _proxyMethod(methodName, this[methodName], clazz);
        }
    }
    return this;
}

var _noProxyMethods = {
    base: true, extend: true, constructor: true, conformsTo: true,
    getInterceptors: true, getDelegate: true, setDelegate: true
};

Package.implement({
    export: function _export(name, member) {
        this.addName(name, member);
    },
    getProtocols: function getProtocols() {
        _listContents(this, arguments, $isProtocol);
    },
    getClasses: function getClasses() {
        _listContents(this, arguments, function (member, memberName) {
            return $isClass(member) && memberName != "constructor";
        });
    },
    getPackages: function getPackages() {
        _listContents(this, arguments, function (member, memberName) {
            return member instanceof Package && memberName != "parent";
        });
    }
});

function _listContents(pkg, args, filter) {
    var cb = Array.prototype.pop.call(args);
    if ($isFunction(cb)) {
        var names = Array.prototype.pop.call(args) || Object.keys(pkg);
        for (var i = 0; i < names.length; ++i) {
            var name = names[i],
                _member4 = pkg[name];
            if (_member4 && (!filter || filter(_member4, name))) {
                cb({ member: _member4, name: name });
            }
        }
    }
}

var $isProtocol = exports.$isProtocol = Protocol.isProtocol;

function $isClass(clazz) {
    return clazz && clazz.prototype instanceof Base && !$isProtocol(clazz);
}

function $classOf(instance) {
    return instance && instance.constructor;
}

function $ancestorOf(clazz) {
    return clazz && clazz.ancestor;
}

function $isString(str) {
    return typeOf(str) === 'string';
}

function $isFunction(fn) {
    return fn instanceof Function;
}

function $isObject(obj) {
    return obj === Object(obj);
}

function $isArray(obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
};

function $isPromise(promise) {
    return promise && $isFunction(promise.then);
}

function $isNothing(value) {
    return value == null;
}

function $isSomething(value) {
    return value != null;
}

function $lift(value) {
    return function () {
        return value;
    };
}

function $equals(obj1, obj2) {
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

function $decorator(decorations) {
    return function (decoratee) {
        if ($isNothing(decoratee)) {
            throw new TypeError("No decoratee specified.");
        }
        var decorator = Object.create(decoratee),
            spec = $decorator.spec || ($decorator.spec = {});
        spec.value = decoratee;
        Object.defineProperty(decorator, 'decoratee', spec);
        ClassMeta.createInstanceMeta.call(decorator, decoratee.$meta);
        if (decorations) {
            decorator.extend(decorations);
        }
        delete spec.value;
        return decorator;
    };
}

function $decorate(decoratee, decorations) {
    return $decorator(decorations)(decoratee);
}

function $decorated(decorator, deepest) {
    var decoratee = void 0;
    while (decorator && (decoratee = decorator.decoratee)) {
        if (!deepest) {
            return decoratee;
        }
        decorator = decoratee;
    }
    return decorator;
}

function $debounce(fn, wait, immediate, defaultReturnValue) {
    var timeout = void 0;
    return function () {
        var context = this,
            args = arguments;
        var later = function later() {
            timeout = null;
            if (!immediate) {
                return fn.apply(context, args);
            }
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) {
            return fn.apply(context, args);
        }
        return defaultReturnValue;
    };
};

function _getPropertyDescriptor(object, key, own) {
    var source = object,
        descriptor = void 0;
    while (source && !(descriptor = Object.getOwnPropertyDescriptor(source, key))) {
        source = own ? null : Object.getPrototypeOf(source);
    }return descriptor;
}

if (Promise.prototype.finally === undefined) Promise.prototype.finally = function (callback) {
    var p = this.constructor;
    return this.then(function (value) {
        return p.resolve(callback()).then(function () {
            return value;
        });
    }, function (reason) {
        return p.resolve(callback()).then(function () {
            throw reason;
        });
    });
};