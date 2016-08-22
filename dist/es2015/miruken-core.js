'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _Base$extend;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

exports.Modifier = Modifier;
exports.$createModifier = $createModifier;
exports.decorate = decorate;
exports.isDescriptor = isDescriptor;
exports.pcopy = pcopy;
exports.getPropertyDescriptors = getPropertyDescriptors;
exports.instanceOf = instanceOf;
exports.typeOf = typeOf;
exports.assignID = assignID;
exports.format = format;
exports.csv = csv;
exports.bind = bind;
exports.delegate = delegate;
exports.copy = copy;
exports.$isString = $isString;
exports.$isSymbol = $isSymbol;
exports.$isFunction = $isFunction;
exports.$isObject = $isObject;
exports.$isPromise = $isPromise;
exports.$isNothing = $isNothing;
exports.$isSomething = $isSomething;
exports.$lift = $lift;
exports.$decorator = $decorator;
exports.$decorate = $decorate;
exports.$decorated = $decorated;
exports.$flatten = $flatten;
exports.$merge = $merge;
exports.$match = $match;
exports.$equals = $equals;
exports.$debounce = $debounce;
exports.protocol = protocol;
exports.conformsTo = conformsTo;
exports.mixin = mixin;
exports.$meta = $meta;
exports.$isClass = $isClass;
exports.$classOf = $classOf;
exports.$using = $using;
exports.inject = inject;
exports.metadata = metadata;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

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

if (Promise.delay === undefined) Promise.delay = function (ms) {
    return new Promise(function (resolve) {
        return setTimeout(resolve, ms);
    });
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

function decorate(decorator, args) {
    if (isDescriptor(args[args.length - 1])) {
        return decorator.apply(undefined, _toConsumableArray(args).concat([[]]));
    }
    return function () {
        return decorator.apply(undefined, Array.prototype.slice.call(arguments).concat([args]));
    };
}

function isDescriptor(desc) {
    if (!desc || !desc.hasOwnProperty) {
        return false;
    }

    var keys = ['value', 'initializer', 'get', 'set'];

    for (var i = 0, l = keys.length; i < l; i++) {
        if (desc.hasOwnProperty(keys[i])) {
            return true;
        }
    }

    return false;
}

var Undefined = exports.Undefined = K(),
    Null = exports.Null = K(null),
    True = exports.True = K(true),
    False = exports.False = K(false);

var __prototyping,
    _counter = 1;

var _IGNORE = K(),
    _BASE = /\bbase\b/,
    _HIDDEN = ["constructor", "toString"],
    _slice = Array.prototype.slice;

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

    Object.setPrototypeOf(_class, this);
    if (_static) _extend(_class, _static);
    _class.ancestor = this;
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
                var desc = getPropertyDescriptors(source, key);
                if (!desc || desc.enumerable && desc.value != proto[key]) {
                    desc = _override(object, key, desc);
                    if (desc) Object.defineProperty(object, key, desc);
                }
            }
        }

        var props = getPropertyDescriptors(source);
        Reflect.ownKeys(props).forEach(function (key) {
            if (typeof proto[key] == "undefined" && key !== "base") {
                var desc = props[key];
                if (desc.enumerable) {
                    desc = _override(object, key, desc);
                    if (desc) Object.defineProperty(object, key, desc);
                }
            }
        });
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

function _override(object, key, desc) {
    var value = desc.value;
    if (value === _IGNORE) return;
    if (typeof value !== "function" && "value" in desc) {
        return desc;
    }
    var ancestor = getPropertyDescriptors(object, key);
    if (!ancestor) return desc;
    var superObject = __prototyping;
    if (superObject) {
        var sprop = getPropertyDescriptors(superObject, key);
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
                        method = superObject && superObject[key] || avalue;
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
                        get = superObject && getPropertyDescriptors(superObject, key).get || aget;
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
            var get = getPropertyDescriptors(superObject, key).get;
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
                        set = superObject && getPropertyDescriptors(superObject, key).set || aset;
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
            var set = getPropertyDescriptors(superObject, key).set;
            return set.apply(this, arguments);
        };
    } else {
        desc.set = aset;
    }
    return desc;
};

function getPropertyDescriptors(obj, key) {
    var props = key ? null : {},
        own = false,
        prop;
    do {
        if (key) {
            prop = Reflect.getOwnPropertyDescriptor(obj, key);
            if (prop) return prop.own = own, prop;
        } else {
            Reflect.ownKeys(obj).forEach(function (key) {
                if (!Reflect.has(props, key)) {
                    prop = Reflect.getOwnPropertyDescriptor(obj, key);
                    if (prop) props[key] = (prop.own = own, prop);
                }
            });
        }
    } while ((own = false, obj = Object.getPrototypeOf(obj)));
    return props;
}

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
    var type = typeof object === 'undefined' ? 'undefined' : _typeof(object);
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
    if (!object.hasOwnProperty(name)) object[name] = "b2_" + _counter++;
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

function copy() {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
    }

    return decorate(_copy, args);
}

exports.default = copy;


function _copy(target, key, descriptor) {
    var get = descriptor.get;
    var set = descriptor.set;
    var value = descriptor.value;

    if ($isFunction(value)) {
        descriptor.value = function () {
            return _copyOf(value.apply(this, arguments));
        };
    }
    if ($isFunction(get)) {
        descriptor.get = function () {
            return _copyOf(get.apply(this));
        };
    }
    if ($isFunction(set)) {
        descriptor.set = function (value) {
            return set.call(this, _copyOf(value));
        };
    }
    return descriptor;
}

function _copyOf(value) {
    if (value != null && $isFunction(value.copy)) {
        value = value.copy();
    }
    return value;
}

var Delegate = exports.Delegate = Base.extend({
    get: function get(protocol, key, strict) {},
    set: function set(protocol, key, value, strict) {},
    invoke: function invoke(protocol, methodName, args, strict) {}
});

var ObjectDelegate = exports.ObjectDelegate = Delegate.extend({
    constructor: function constructor(object) {
        Object.defineProperty(this, 'object', { value: object });
    },
    get: function get(protocol, key, strict) {
        var object = this.object;
        if (object && (!strict || protocol.adoptedBy(object))) {
            return object[key];
        }
    },
    set: function set(protocol, key, value, strict) {
        var object = this.object;
        if (object && (!strict || protocol.adoptedBy(object))) {
            return object[key] = value;
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
    get: function get(protocol, key, strict) {
        var array = this.array;
        return array && array.reduce(function (result, object) {
            return !strict || protocol.adoptedBy(object) ? object[key] : result;
        }, undefined);
    },
    set: function set(protocol, key, value, strict) {
        var array = this.array;
        return array && array.reduce(function (result, object) {
            return !strict || protocol.adoptedBy(object) ? object[key] = value : result;
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

var Defining = Symbol();

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
        if (!this.constructor[Defining]) {
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
        en[Defining] = true;
        var names = Object.freeze(Object.keys(choices));
        var items = Object.keys(choices).map(function (name, ordinal) {
            return en[name] = new en(choices[name], name, ordinal);
        });
        en.names = Object.freeze(names);
        en.items = Object.freeze(items);
        en.fromValue = this.fromValue;
        delete en[Defining];
        return en;
    },
    fromValue: function fromValue(value) {
        var match = this.items.find(function (item) {
            return item.value == value;
        });
        if (!match) {
            throw new TypeError(value + ' is not a valid value for this Enum.');
        }
        return match;
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
                if (arguments.length === 1 && Array.isArray(arguments[0])) {
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

function $isString(str) {
    return typeOf(str) === 'string';
}

function $isSymbol(str) {
    return Object(str) instanceof Symbol;
}

function $isFunction(fn) {
    return fn instanceof Function;
}

function $isObject(obj) {
    return typeOf(obj) === 'object';
}

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

function $decorator(decorations) {
    return function (decoratee) {
        if ($isNothing(decoratee)) {
            throw new TypeError("No decoratee specified.");
        }
        var decorator = Object.create(decoratee);
        Object.defineProperty(decorator, 'decoratee', {
            configurable: false,
            value: decoratee
        });
        if (decorations && $isFunction(decorator.extend)) {
            decorator.extend(decorations);
        }
        return decorator;
    };
}

function $decorate(decoratee, decorations) {
    return $decorator(decorations)(decoratee);
}

function $decorated(decorator, deepest) {
    var decoratee = void 0;
    while (decorator && (decoratee = decorator.decoratee)) {
        if (!deepest) return decoratee;
        decorator = decoratee;
    }
    return decorator;
}

function $flatten(arr, prune) {
    var _ref;

    if (!Array.isArray(arr)) return arr;
    var items = arr.map(function (item) {
        return $flatten(item, prune);
    });
    if (prune) items = items.filter($isSomething);
    return (_ref = []).concat.apply(_ref, _toConsumableArray(items));
}

function $merge(target) {
    if (!$isObject(target) || Object.isFrozen(target)) {
        return target;
    }

    for (var _len2 = arguments.length, sources = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        sources[_key2 - 1] = arguments[_key2];
    }

    sources.forEach(function (source) {
        if (!$isObject(source)) return;
        var props = getPropertyDescriptors(source);
        Reflect.ownKeys(props).forEach(function (key) {
            if (!props[key].enumerable) return;
            var newValue = source[key],
                curValue = target[key];
            if ($isObject(curValue) && !Array.isArray(curValue)) {
                $merge(curValue, newValue);
            } else {
                target[key] = Array.isArray(newValue) ? newValue.slice(0) : newValue;
            }
        });
    });
    return target;
}

function $match(target, criteria, matched) {
    if (!$isObject(target) || !$isObject(criteria)) {
        return false;
    }
    var match = $isFunction(matched) ? {} : null,
        matches = Reflect.ownKeys(criteria).every(function (key) {
        if (!target.hasOwnProperty(key)) {
            return false;
        }
        var constraint = criteria[key],
            value = target[key];
        if (constraint === undefined) {
            if (match) {
                if (Array.isArray(value)) {
                    match[key] = value.slice(0);
                } else if ($isObject(value)) {
                    match[key] = $merge({}, value);
                } else {
                    match[key] = value;
                }
            }
            return true;
        }
        if ($isObject(value) && !Array.isArray(value)) {
            return $match(value, constraint, match ? function (m) {
                return match[key] = m;
            } : null);
        }
        if (value === constraint) {
            if (match) {
                match[key] = value;
            }
            return true;
        }
        return false;
    });
    if (matches && match) {
        matched(match);
    }
    return matches;
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

var baseExtend = Base.extend,
    baseImplement = Base.implement,
    baseProtoExtend = Base.prototype.extend,
    MetadataSymbol = Symbol.for('miruken.$meta');

var defineProperty = Object.defineProperty;
var getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
var isFrozen = Object.isFrozen;
var ownKeys = Reflect.ownKeys;

var ProtocolGet = Symbol(),
    ProtocolSet = Symbol(),
    ProtocolInvoke = Symbol(),
    ProtocolDelegate = Symbol(),
    ProtocolStrict = Symbol();

var Protocol = exports.Protocol = Base.extend((_Base$extend = {
    constructor: function constructor(delegate, strict) {
        var _Object$definePropert;

        if ($isNothing(delegate)) {
            delegate = new Delegate();
        } else if (delegate instanceof Delegate === false) {
            if ($isFunction(delegate.toDelegate)) {
                delegate = delegate.toDelegate();
                if (delegate instanceof Delegate === false) {
                    throw new TypeError("'toDelegate' method did not return a Delegate.");
                }
            } else if (Array.isArray(delegate)) {
                delegate = new ArrayDelegate(delegate);
            } else {
                delegate = new ObjectDelegate(delegate);
            }
        }
        Object.defineProperties(this, (_Object$definePropert = {}, _defineProperty(_Object$definePropert, ProtocolDelegate, { value: delegate, writable: false }), _defineProperty(_Object$definePropert, ProtocolStrict, { value: !!strict, writable: false }), _Object$definePropert));
    }
}, _defineProperty(_Base$extend, ProtocolGet, function (key) {
    var delegate = this[ProtocolDelegate];
    return delegate && delegate.get(this.constructor, key, this[ProtocolStrict]);
}), _defineProperty(_Base$extend, ProtocolSet, function (key, value) {
    var delegate = this[ProtocolDelegate];
    return delegate && delegate.set(this.constructor, key, value, this[ProtocolStrict]);
}), _defineProperty(_Base$extend, ProtocolInvoke, function (methodName, args) {
    var delegate = this[ProtocolDelegate];
    return delegate && delegate.invoke(this.constructor, methodName, args, this[ProtocolStrict]);
}), _Base$extend), {
    isProtocol: function isProtocol(target) {
        return target && target.prototype instanceof Protocol;
    },
    adoptedBy: function adoptedBy(target) {
        return $meta(target).conformsTo(this);
    },
    protocolAdopted: function protocolAdopted(protocol) {
        var prototype = this.prototype,
            protocolProto = Protocol.prototype,
            props = getPropertyDescriptors(protocol.prototype);
        ownKeys(props).forEach(function (key) {
            if (getPropertyDescriptors(protocolProto, key) || getPropertyDescriptors(prototype, key)) return;
            defineProperty(prototype, key, props[key]);
        });
    },
    coerce: function coerce(object, strict) {
        return new this(object, strict);
    }
});

function _protocol(target) {
    if ($isFunction(target)) {
        target = target.prototype;
    }
    ownKeys(target).forEach(function (key) {
        if (key === 'constructor') return;
        var descriptor = getOwnPropertyDescriptor(target, key);
        if (!descriptor.enumerable) return;
        if ($isFunction(descriptor.value)) {
            descriptor.value = function () {
                for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
                    args[_key3] = arguments[_key3];
                }

                return this[ProtocolInvoke](key, args);
            };
        } else {
            var isSimple = descriptor.hasOwnProperty('value');
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
                };
            }
        }
        defineProperty(target, key, descriptor);
    });
}

function protocol() {
    for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
        args[_key4] = arguments[_key4];
    }

    if (args.length === 0) {
        return function () {
            return _protocol.apply(null, arguments);
        };
    }
    return _protocol.apply(undefined, args);
}

function conformsTo() {
    for (var _len5 = arguments.length, protocols = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
        protocols[_key5] = arguments[_key5];
    }

    protocols = $flatten(protocols, true);
    if (protocols.length === 0) {
        return Undefined;
    }
    return function (target) {
        var meta = $meta(target);
        if (meta) {
            meta.adoptProtocol(protocols);
        }
    };
}

function mixin() {
    for (var _len6 = arguments.length, behaviors = Array(_len6), _key6 = 0; _key6 < _len6; _key6++) {
        behaviors[_key6] = arguments[_key6];
    }

    behaviors = $flatten(behaviors, true);
    return function (target) {
        if (behaviors.length > 0 && $isFunction(target.implement)) {
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = behaviors[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var behavior = _step.value;

                    target.implement(behavior);
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }
        }
    };
}

var Metadata = exports.Metadata = Base.extend({
    constructor: function constructor(parent) {
        var _parent = parent,
            _type = void 0,
            _protocols = void 0,
            _metadata = void 0,
            _extensions = void 0;
        this.extend({
            get parent() {
                return _parent;
            },

            get type() {
                return _type || _parent && _parent.type;
            },
            set type(value) {
                if (_type != value && $isFunction(value)) {
                    _type = value;
                    _parent = $meta(Object.getPrototypeOf(_type));
                }
            },

            get isProtocol() {
                return Protocol.isProtocol(_type);
            },

            get protocols() {
                return _protocols ? _protocols.slice(0) : [];
            },

            get allProtocols() {
                var protocols = this.protocols,
                    declared = protocols.slice(0);
                if (_parent) {
                    _parent.allProtocols.forEach(addProtocol);
                }
                var _iteratorNormalCompletion2 = true;
                var _didIteratorError2 = false;
                var _iteratorError2 = undefined;

                try {
                    for (var _iterator2 = declared[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                        var _protocol2 = _step2.value;

                        $meta(_protocol2).allProtocols.forEach(addProtocol);
                    }
                } catch (err) {
                    _didIteratorError2 = true;
                    _iteratorError2 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion2 && _iterator2.return) {
                            _iterator2.return();
                        }
                    } finally {
                        if (_didIteratorError2) {
                            throw _iteratorError2;
                        }
                    }
                }

                if (_extensions) {
                    var _iteratorNormalCompletion3 = true;
                    var _didIteratorError3 = false;
                    var _iteratorError3 = undefined;

                    try {
                        for (var _iterator3 = _extensions[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                            var extension = _step3.value;

                            extension.allProtocols.forEach(addProtocol);
                        }
                    } catch (err) {
                        _didIteratorError3 = true;
                        _iteratorError3 = err;
                    } finally {
                        try {
                            if (!_iteratorNormalCompletion3 && _iterator3.return) {
                                _iterator3.return();
                            }
                        } finally {
                            if (_didIteratorError3) {
                                throw _iteratorError3;
                            }
                        }
                    }
                }
                function addProtocol(protocol) {
                    if (protocols.indexOf(protocol) < 0) {
                        protocols.push(protocol);
                    }
                }
                return protocols;
            },
            adoptProtocol: function adoptProtocol() {
                for (var _len7 = arguments.length, protocols = Array(_len7), _key7 = 0; _key7 < _len7; _key7++) {
                    protocols[_key7] = arguments[_key7];
                }

                protocols = $flatten(protocols, true);
                if (!protocols || protocols.length == 0) {
                    return this;
                }
                var type = this.type,
                    notifyType = type && $isFunction(type.protocolAdopted);
                _protocols = _protocols || [];
                var _iteratorNormalCompletion4 = true;
                var _didIteratorError4 = false;
                var _iteratorError4 = undefined;

                try {
                    for (var _iterator4 = protocols[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                        var _protocol3 = _step4.value;

                        if (_protocol3.prototype instanceof Protocol && _protocols.indexOf(_protocol3) < 0) {
                            _protocols.push(_protocol3);
                            if (notifyType) {
                                type.protocolAdopted(_protocol3);
                            }
                        }
                    }
                } catch (err) {
                    _didIteratorError4 = true;
                    _iteratorError4 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion4 && _iterator4.return) {
                            _iterator4.return();
                        }
                    } finally {
                        if (_didIteratorError4) {
                            throw _iteratorError4;
                        }
                    }
                }

                return this;
            },
            conformsTo: function conformsTo(protocol) {
                if (!(protocol && protocol.prototype instanceof Protocol)) {
                    return false;
                }
                var type = this.type;
                return type && (protocol === type || type.prototype instanceof protocol) || _protocols && _protocols.some(function (p) {
                    return protocol === p || p.conformsTo(protocol);
                }) || _extensions && _extensions.some(function (e) {
                    return e.conformsTo(protocol);
                }) || !!(_parent && _parent.conformsTo(protocol));
            },
            subClass: function subClass() {
                var type = this.type;

                for (var _len8 = arguments.length, args = Array(_len8), _key8 = 0; _key8 < _len8; _key8++) {
                    args[_key8] = arguments[_key8];
                }

                var constraints = args,
                    decorators = [];
                if (type === Protocol) {
                    decorators.push(protocol);
                }if (this.isProtocol) {
                    decorators.push(protocol, conformsTo(type));
                }
                if (args.length > 0 && Array.isArray(args[0])) {
                    constraints = args.shift();
                }
                while (constraints.length > 0) {
                    var constraint = constraints[0];
                    if (!constraint) {
                        break;
                    } else if (constraint.prototype instanceof Protocol) {
                        decorators.push(conformsTo(constraint));
                    } else if (constraint.prototype instanceof Base || constraint.prototype instanceof Module) {
                        decorators.push(mixin(constraint));
                    } else if ($isFunction(constraint)) {
                        decorators.push(constraint);
                    } else {
                        break;
                    }
                    constraints.shift();
                }
                var members = args.shift() || {},
                    classMembers = args.shift() || {},
                    derived = baseExtend.call(type, members, classMembers),
                    derivedMeta = $meta(members);
                derivedMeta.type = derived;
                defineMetadata(derived.prototype, derivedMeta);
                if (decorators.length > 0) {
                    var _iteratorNormalCompletion5 = true;
                    var _didIteratorError5 = false;
                    var _iteratorError5 = undefined;

                    try {
                        for (var _iterator5 = decorators[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                            var decorator = _step5.value;

                            derived = decorator(derived) || derived;
                        }
                    } catch (err) {
                        _didIteratorError5 = true;
                        _iteratorError5 = err;
                    } finally {
                        try {
                            if (!_iteratorNormalCompletion5 && _iterator5.return) {
                                _iterator5.return();
                            }
                        } finally {
                            if (_didIteratorError5) {
                                throw _iteratorError5;
                            }
                        }
                    }
                }
                return derived;
            },
            extendClass: function extendClass(source) {
                var type = this.type;
                if (!type) return;
                if (source) {
                    if (this.isProtocol && !(source instanceof Base)) {
                        source = protocol(source) || source;
                    }
                    var extension = $meta(source);
                    if (extension) {
                        (_extensions || (_extensions = [])).push(extension);
                    }
                }
                return baseImplement.call(type, source);
            },
            extendInstance: function extendInstance(object, key, value) {
                if (!key) return object;
                var numArgs = arguments.length;
                if (numArgs === 2) {
                    if (object instanceof Protocol) {
                        key = protocol(key) || key;
                    }
                    var extension = $meta(key);
                    if (extension) {
                        (_extensions || (_extensions = [])).push(extension);
                    }
                    return baseProtoExtend.call(object, key);
                }
                return baseProtoExtend.call(object, key, value);
            },
            traverseTopDown: function traverseTopDown(visitor) {
                if (!visitor) return;
                if (_extensions) {
                    var i = _extensions.length;
                    while (--i >= 0) {
                        if (visitor(_extensions[i])) return;
                    }
                }
                if (visitor(this)) return;
                if (_parent) {
                    _parent.traverseTopDown(visitor);
                }
            },
            traverseBottomUp: function traverseBottomUp(visitor) {
                if (!visitor) return;
                if (_parent) {
                    _parent.traverseTopDown(visitor);
                }
                if (visitor(this)) return;
                if (_extensions) {
                    var i = _extensions.length;
                    while (--i >= 0) {
                        if (visitor(_extensions[i])) return;
                    }
                }
            },
            getMetadata: function getMetadata(key, criteria) {
                var metadata = void 0;
                if ($isObject(key)) {
                    var _ref2 = [null, key];
                    key = _ref2[0];
                    criteria = _ref2[1];
                }
                if (_parent) {
                    metadata = _parent.getMetadata(key, criteria);
                }
                if (_metadata) {
                    (function () {
                        var addKey = !key,
                            keys = key ? [key] : ownKeys(_metadata);
                        keys.forEach(function (key) {
                            var keyMeta = _metadata[key];
                            if (keyMeta) {
                                if (criteria) {
                                    if (!$match(keyMeta, criteria, function (m) {
                                        return keyMeta = m;
                                    })) {
                                        return;
                                    }
                                }
                                if (addKey) {
                                    keyMeta = _defineProperty({}, key, keyMeta);
                                }
                                metadata = $merge(metadata || {}, keyMeta);
                            }
                        });
                    })();
                }
                if (_extensions) {
                    metadata = _extensions.reduce(function (result, ext) {
                        var keyMeta = ext.getMetadata(key, criteria);
                        return keyMeta ? $merge(result || {}, keyMeta) : result;
                    }, metadata);
                }
                return metadata;
            },
            addMetadata: function addMetadata(key, metadata, replace) {
                if (key && metadata) {
                    var meta = _metadata || (_metadata = {});
                    if (replace) {
                        Object.assign(meta, _defineProperty({}, key, Object.assign(meta[key] || {}, metadata)));
                    } else {
                        $merge(meta, _defineProperty({}, key, metadata));
                    }
                }
                return this;
            }
        });
    }
});

var SUPPRESS_METADATA = [Object, Function, Array];

Base.extend = function () {
    var meta = $meta(this);
    return meta ? meta.subClass.apply(meta, arguments) : baseExtend.apply(this, arguments);
};

Base.implement = function () {
    var meta = $meta(this);
    return meta ? meta.extendClass.apply(meta, arguments) : baseImplement.apply(this, arguments);
};

Base.conformsTo = Base.prototype.conformsTo = function (protocol) {
    return $meta(this).conformsTo(protocol);
};

Base.prototype.extend = function () {
    var meta = $meta(this);
    return meta ? meta.extendInstance.apply(meta, [this].concat(Array.prototype.slice.call(arguments))) : baseProtoExtend.apply(this, arguments);
};

var StrictProtocol = exports.StrictProtocol = Protocol.extend({
    constructor: function constructor(proxy, strict) {
        this.base(proxy, strict === undefined || strict);
    }
});

function $meta(target) {
    if (target == null) return;
    if (target.hasOwnProperty(MetadataSymbol)) {
        return target[MetadataSymbol];
    }
    if (isFrozen(target)) return;
    if (target === Metadata || target instanceof Metadata || target.prototype instanceof Metadata) return;
    var i = SUPPRESS_METADATA.length;
    while (i--) {
        var ignore = SUPPRESS_METADATA[i];
        if (target === ignore || target === ignore.prototype) {
            return;
        }
    }
    var meta = void 0;
    if ($isFunction(target)) {
        meta = $meta(target.prototype);
        if (meta) meta.type = target;
    } else if ($isObject(target)) {
        var parent = Object.getPrototypeOf(target);
        meta = new Metadata($meta(parent));
    }
    if (meta) {
        defineMetadata(target, meta);
        return meta;
    }
}

function defineMetadata(target, metadata) {
    defineProperty(target, MetadataSymbol, {
        enumerable: false,
        configurable: false,
        writable: false,
        value: metadata
    });
}

var $isProtocol = exports.$isProtocol = Protocol.isProtocol;

function $isClass(clazz) {
    if (!clazz || $isProtocol(clazz)) return false;
    if (clazz.prototype instanceof Base) return true;
    var name = clazz.name;
    return name && $isFunction(clazz) && isUpperCase(name.charAt(0));
}

function isUpperCase(char) {
    return char.toUpperCase() === char;
}

function $classOf(instance) {
    return instance && instance.constructor;
}

var MethodType = exports.MethodType = Enum({
    Get: 1,

    Set: 2,

    Invoke: 3
});

var Variance = exports.Variance = Enum({
    Covariant: 1,

    Contravariant: 2,

    Invariant: 3
});

var Initializing = exports.Initializing = Protocol.extend({
    initialize: function initialize() {}
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

var TraversingAxis = exports.TraversingAxis = Enum({
    Self: 1,

    Root: 2,

    Child: 3,

    Sibling: 4,

    Ancestor: 5,

    Descendant: 6,

    DescendantReverse: 7,

    ChildOrSelf: 8,

    SiblingOrSelf: 9,

    AncestorOrSelf: 10,

    DescendantOrSelf: 11,

    DescendantOrSelfReverse: 12,

    AncestorSiblingOrSelf: 13
});

var Traversing = exports.Traversing = Protocol.extend({
    traverse: function traverse(axis, visitor, context) {}
});

var TraversingMixin = exports.TraversingMixin = Module.extend({
    traverse: function traverse(object, axis, visitor, context) {
        if ($isFunction(axis)) {
            context = visitor;
            visitor = axis;
            axis = TraversingAxis.Child;
        }
        if (!$isFunction(visitor)) return;
        switch (axis) {
            case TraversingAxis.Self:
                traverseSelf.call(object, visitor, context);
                break;

            case TraversingAxis.Root:
                traverseRoot.call(object, visitor, context);
                break;

            case TraversingAxis.Child:
                traverseChildren.call(object, visitor, false, context);
                break;

            case TraversingAxis.Sibling:
                traverseAncestorSiblingOrSelf.call(object, visitor, false, false, context);
                break;

            case TraversingAxis.ChildOrSelf:
                traverseChildren.call(object, visitor, true, context);
                break;

            case TraversingAxis.SiblingOrSelf:
                traverseAncestorSiblingOrSelf.call(object, visitor, true, false, context);
                break;

            case TraversingAxis.Ancestor:
                traverseAncestors.call(object, visitor, false, context);
                break;

            case TraversingAxis.AncestorOrSelf:
                traverseAncestors.call(object, visitor, true, context);
                break;

            case TraversingAxis.Descendant:
                traverseDescendants.call(object, visitor, false, context);
                break;

            case TraversingAxis.DescendantReverse:
                traverseDescendantsReverse.call(object, visitor, false, context);
                break;

            case TraversingAxis.DescendantOrSelf:
                traverseDescendants.call(object, visitor, true, context);
                break;

            case TraversingAxis.DescendantOrSelfReverse:
                traverseDescendantsReverse.call(object, visitor, true, context);
                break;

            case TraversingAxis.AncestorSiblingOrSelf:
                traverseAncestorSiblingOrSelf.call(object, visitor, true, true, context);
                break;

            default:
                throw new Error('Unrecognized TraversingAxis ' + axis + '.');
        }
    }
});

function checkCircularity(visited, node) {
    if (visited.indexOf(node) !== -1) {
        throw new Error('Circularity detected for node ' + node);
    }
    visited.push(node);
    return node;
}

function traverseSelf(visitor, context) {
    visitor.call(context, this);
}

function traverseRoot(visitor, context) {
    var parent = void 0,
        root = this,
        visited = [this];
    while (parent = root.parent) {
        checkCircularity(visited, parent);
        root = parent;
    }
    visitor.call(context, root);
}

function traverseChildren(visitor, withSelf, context) {
    if (withSelf && visitor.call(context, this)) {
        return;
    }
    var _iteratorNormalCompletion6 = true;
    var _didIteratorError6 = false;
    var _iteratorError6 = undefined;

    try {
        for (var _iterator6 = this.children[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
            var child = _step6.value;

            if (visitor.call(context, child)) {
                return;
            }
        }
    } catch (err) {
        _didIteratorError6 = true;
        _iteratorError6 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion6 && _iterator6.return) {
                _iterator6.return();
            }
        } finally {
            if (_didIteratorError6) {
                throw _iteratorError6;
            }
        }
    }
}

function traverseAncestors(visitor, withSelf, context) {
    var parent = this,
        visited = [this];
    if (withSelf && visitor.call(context, this)) {
        return;
    }
    while ((parent = parent.parent) && !visitor.call(context, parent)) {
        checkCircularity(visited, parent);
    }
}

function traverseDescendants(visitor, withSelf, context) {
    var _this2 = this;

    if (withSelf) {
        Traversal.levelOrder(this, visitor, context);
    } else {
        Traversal.levelOrder(this, function (node) {
            return !$equals(_this2, node) && visitor.call(context, node);
        }, context);
    }
}

function traverseDescendantsReverse(visitor, withSelf, context) {
    var _this3 = this;

    if (withSelf) {
        Traversal.reverseLevelOrder(this, visitor, context);
    } else {
        Traversal.reverseLevelOrder(this, function (node) {
            return !$equals(_this3, node) && visitor.call(context, node);
        }, context);
    }
}

function traverseAncestorSiblingOrSelf(visitor, withSelf, withAncestor, context) {
    if (withSelf && visitor.call(context, this)) {
        return;
    }
    var parent = this.parent;
    if (parent) {
        var _iteratorNormalCompletion7 = true;
        var _didIteratorError7 = false;
        var _iteratorError7 = undefined;

        try {
            for (var _iterator7 = parent.children[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
                var sibling = _step7.value;

                if (!$equals(this, sibling) && visitor.call(context, sibling)) {
                    return;
                }
            }
        } catch (err) {
            _didIteratorError7 = true;
            _iteratorError7 = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion7 && _iterator7.return) {
                    _iterator7.return();
                }
            } finally {
                if (_didIteratorError7) {
                    throw _iteratorError7;
                }
            }
        }

        if (withAncestor) {
            traverseAncestors.call(parent, visitor, true, context);
        }
    }
}

var Traversal = exports.Traversal = Abstract.extend({}, {
    preOrder: function preOrder(node, visitor, context) {
        return _preOrder(node, visitor, context);
    },
    postOrder: function postOrder(node, visitor, context) {
        return _postOrder(node, visitor, context);
    },
    levelOrder: function levelOrder(node, visitor, context) {
        return _levelOrder(node, visitor, context);
    },
    reverseLevelOrder: function reverseLevelOrder(node, visitor, context) {
        return _reverseLevelOrder(node, visitor, context);
    }
});

function _preOrder(node, visitor, context) {
    var visited = arguments.length <= 3 || arguments[3] === undefined ? [] : arguments[3];

    checkCircularity(visited, node);
    if (!node || !$isFunction(visitor) || visitor.call(context, node)) {
        return true;
    }
    if ($isFunction(node.traverse)) node.traverse(function (child) {
        return _preOrder(child, visitor, context, visited);
    });
    return false;
}

function _postOrder(node, visitor, context) {
    var visited = arguments.length <= 3 || arguments[3] === undefined ? [] : arguments[3];

    checkCircularity(visited, node);
    if (!node || !$isFunction(visitor)) {
        return true;
    }
    if ($isFunction(node.traverse)) node.traverse(function (child) {
        return _postOrder(child, visitor, context, visited);
    });
    return visitor.call(context, node);
}

function _levelOrder(node, visitor, context) {
    var visited = arguments.length <= 3 || arguments[3] === undefined ? [] : arguments[3];

    if (!node || !$isFunction(visitor)) {
        return;
    }
    var queue = [node];
    while (queue.length > 0) {
        var next = queue.shift();
        checkCircularity(visited, next);
        if (visitor.call(context, next)) {
            return;
        }
        if ($isFunction(next.traverse)) next.traverse(function (child) {
            if (child) queue.push(child);
        });
    }
}

function _reverseLevelOrder(node, visitor, context) {
    var visited = arguments.length <= 3 || arguments[3] === undefined ? [] : arguments[3];

    if (!node || !$isFunction(visitor)) {
        return;
    }
    var queue = [node],
        stack = [];

    var _loop = function _loop() {
        var next = queue.shift();
        checkCircularity(visited, next);
        stack.push(next);
        var level = [];
        if ($isFunction(next.traverse)) next.traverse(function (child) {
            if (child) level.unshift(child);
        });
        queue.push.apply(queue, level);
    };

    while (queue.length > 0) {
        _loop();
    }
    while (stack.length > 0) {
        if (visitor.call(context, stack.pop())) {
            return;
        }
    }
}

var injectKey = Symbol(),
    injectCriteria = _defineProperty({}, injectKey, undefined);

function inject() {
    for (var _len9 = arguments.length, dependencies = Array(_len9), _key9 = 0; _key9 < _len9; _key9++) {
        dependencies[_key9] = arguments[_key9];
    }

    return decorate(_inject, dependencies);
}
inject.get = function (source, key) {
    var meta = $meta(source);
    if (meta) {
        var match = meta.getMetadata(key, injectCriteria);
        if (match) {
            return match[injectKey];
        }
    }
};

function _inject(target, key, descriptor, dependencies) {
    dependencies = $flatten(dependencies);
    if (dependencies.length > 0) {
        var meta = $meta(target);
        if (meta) {
            meta.addMetadata(key, _defineProperty({}, injectKey, dependencies));
        }
    }
}

exports.default = inject;
function metadata() {
    for (var _len10 = arguments.length, args = Array(_len10), _key10 = 0; _key10 < _len10; _key10++) {
        args[_key10] = arguments[_key10];
    }

    return decorate(_metadata, args);
}

function _metadata(target, key, descriptor, _ref3) {
    var _ref4 = _slicedToArray(_ref3, 1);

    var keyMetadata = _ref4[0];

    if (keyMetadata) {
        var meta = $meta(target);
        if (meta) {
            meta.addMetadata(key, keyMetadata);
        }
    }
}

exports.default = metadata;
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
        if (!Array.isArray(types)) {
            throw new TypeError("ProxyBuilder requires an array of types to proxy.");
        }
        var classes = types.filter($isClass),
            protocols = types.filter($isProtocol);
        return _buildProxy(classes, protocols, options || {});
    }
});

function _buildProxy(classes, protocols, options) {
    var base = options.baseType || classes.shift() || Base,
        proxy = base.extend.apply(base, _toConsumableArray(classes.concat(protocols)).concat([{
        constructor: function constructor(facets) {
            var spec = {};
            spec.value = facets[Facet.InterceptorSelectors];
            if (spec.value && spec.value.length > 0) {
                Object.defineProperty(this, 'selectors', spec);
            }
            spec.value = facets[Facet.Interceptors];
            if (spec.value && spec.value.length > 0) {
                Object.defineProperty(this, 'interceptors', spec);
            }
            spec.value = facets[Facet.Delegate];
            if (spec.value) {
                spec.writable = true;
                Object.defineProperty(this, 'delegate', spec);
            }
            var ctor = proxyMethod('constructor', this.base, base);
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

        extend: extendProxyInstance
    }, {
        shouldProxy: options.shouldProxy
    }]));
    proxyClass(proxy, protocols);
    proxy.extend = proxy.implement = throwProxiesSealedExeception;
    return proxy;
}

function throwProxiesSealedExeception() {
    throw new TypeError("Proxy classes are sealed and cannot be extended from.");
}

var noProxyMethods = {
    base: true, extend: true, constructor: true, conformsTo: true,
    getInterceptors: true, getDelegate: true, setDelegate: true
};

function proxyClass(proxy, protocols) {
    var sources = [proxy].concat($meta(proxy).allProtocols, protocols),
        proxied = {};

    var _loop2 = function _loop2(i) {
        var source = sources[i],
            isProtocol = $isProtocol(source),
            props = getPropertyDescriptors(source.prototype);
        Reflect.ownKeys(props).forEach(function (key) {
            if (proxied.hasOwnProperty(key) || key in noProxyMethods) return;
            if (proxy.shouldProxy && !proxy.shouldProxy(key, source)) return;
            var descriptor = props[key];
            if (!descriptor.enumerable) return;
            var value = descriptor.value;
            var get = descriptor.get;
            var set = descriptor.set;

            if ($isFunction(value)) {
                if (isProtocol) value = null;
                descriptor.value = proxyMethod(key, value, proxy);
            } else {
                if (descriptor.hasOwnProperty('value')) {
                    (function () {
                        var field = Symbol();
                        get = function get() {
                            return this[field];
                        }, set = function set(value) {
                            this[field] = value;
                        };
                        delete descriptor.value;
                        delete descriptor.writable;
                    })();
                }
                if (get) {
                    if (isProtocol) get = null;
                    descriptor.get = proxyMethod(key, get, proxy, MethodType.Get);
                }
                if (set) {
                    if (isProtocol) set = null;
                    descriptor.set = proxyMethod(key, set, proxy, MethodType.Set);
                }
            }
            Object.defineProperty(proxy.prototype, key, descriptor);
            proxied[key] = true;
        });
    };

    for (var i = 0; i < sources.length; ++i) {
        _loop2(i);
    }
}

function proxyMethod(key, method, source, type) {
    var interceptors = void 0;
    function methodProxy() {
        for (var _len11 = arguments.length, args = Array(_len11), _key11 = 0; _key11 < _len11; _key11++) {
            args[_key11] = arguments[_key11];
        }

        var _this = this;
        var delegate = this.delegate,
            idx = -1;
        if (!interceptors) {
            interceptors = this.getInterceptors(source, key);
        }
        type = type || MethodType.Invoke;
        var invocation = {
            method: key,
            methodType: type,
            source: source,
            args: args,
            useDelegate: function useDelegate(value) {
                delegate = value;
            },
            replaceDelegate: function replaceDelegate(value) {
                _this.delegate = delegate = value;
            },

            get canProceed() {
                if (interceptors && idx + 1 < interceptors.length) {
                    return true;
                }
                if (delegate) {
                    return $isFunction(delegate[key]);
                }
                return !!method;
            },
            proceed: function proceed() {
                ++idx;
                if (interceptors && idx < interceptors.length) {
                    var interceptor = interceptors[idx];
                    return interceptor.intercept(invocation);
                }
                if (delegate) {
                    switch (type) {
                        case MethodType.Get:
                            return delegate[key];
                        case MethodType.Set:
                            delegate[key] = args[0];
                            break;
                        case MethodType.Invoke:
                            var invoke = delegate[key];
                            if ($isFunction(invoke)) {
                                return invoke.apply(delegate, this.args);
                            }
                            break;
                    }
                } else if (method) {
                    return method.apply(_this, this.args);
                }
                throw new Error('Interceptor cannot proceed without a class or delegate method \'' + key + '\'.');
            }
        };
        return invocation.proceed();
    }
    methodProxy.baseMethod = method;
    return methodProxy;
}

function extendProxyInstance(key, value) {
    var _this4 = this;

    var proxy = this.constructor,
        overrides = arguments.length === 1 ? key : _defineProperty({}, key, value),
        props = getPropertyDescriptors(overrides);
    Reflect.ownKeys(props).forEach(function (key) {
        var descriptor = props[key];
        if (!descriptor.enumerable) return;
        var value = descriptor.value;
        var get = descriptor.get;
        var set = descriptor.set;
        var baseDescriptor = getPropertyDescriptors(_this4, key);
        if (!baseDescriptor) return;
        if (value) {
            if ($isFunction(value)) {
                var baseValue = baseDescriptor.value;
                if ($isFunction(value) && value.baseMethod) {
                    baseDescriptor.value = value.baseMethod;
                }
            }
        } else if (get) {
            var baseGet = baseDescriptor.get;
            if (baseGet && get.baseMethod) {
                baseDescriptor.get = get.baseMethod;
            }
        } else if (set) {
            var baseSet = baseDescriptor.set;
            if (baseSet && set.baseMethod) {
                baseDescriptor.set = set.baseMethod;
            }
        }
        Object.defineProperty(_this4, key, baseDescriptor);
    });
    this.base(overrides);
    Reflect.ownKeys(props).forEach(function (key) {
        if (key in noProxyMethods) return;
        if (proxy.shouldProxy && !proxy.shouldProxy(key, proxy)) return;
        var descriptor = props[key];
        if (!descriptor.enumerable) return;
        var value = descriptor.value;
        var get = descriptor.get;
        var set = descriptor.set;

        if ($isFunction(value)) {
            descriptor.value = proxyMethod(key, value, proxy);
        } else if (!(get || set)) {
            return;
        } else {
            if (get) {
                descriptor.get = proxyMethod(key, get, proxy, MethodType.Get);
            }
            if (set) {
                descriptor.set = proxyMethod(key, set, proxy, MethodType.Set);
            }
        }
        Object.defineProperty(_this4, key, descriptor);
    });
    return this;
}