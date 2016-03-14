"use strict";

System.register([], function (_export2, _context) {
    var _typeof, Promise;

    return {
        setters: [],
        execute: function () {
            _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
                return typeof obj;
            } : function (obj) {
                return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj;
            };


            base2 = {
                name: "base2",
                version: "1.1 (alpha1)",
                exports: "Base,Package,Abstract,Module,Enumerable," + "Undefined,Null,This,True,False,assignID,global",
                namespace: ""
            };

            new function (_no_shrink_) {

                var Undefined = K(),
                    Null = K(null),
                    True = K(true),
                    False = K(false),
                    This = function This() {
                    return this;
                };

                var global = This(),
                    base2 = global.base2;

                var _IGNORE = K(),
                    _FORMAT = /%([1-9])/g,
                    _LTRIM = /^\s\s*/,
                    _RTRIM = /\s\s*$/,
                    _RESCAPE = /([\/()[\]{}|*+-.,^$?\\])/g,
                    _BASE = /\bbase\b/,
                    _HIDDEN = ["constructor", "toString"],
                    _counter = 1,
                    _slice = Array.prototype.slice;

                _Function_forEach();

                function assignID(object, name) {
                    if (!name) name = object.nodeType == 1 ? "uniqueID" : "base2ID";
                    if (!object[name]) object[name] = "b2_" + _counter++;
                    return object[name];
                };

                var _subclass = function _subclass(_instance, _static) {
                    base2.__prototyping = this.prototype;
                    var _prototype = new this();
                    if (_instance) extend(_prototype, _instance);
                    _prototype.base = function () {};
                    delete base2.__prototyping;

                    var _constructor = _prototype.constructor;
                    function _class() {
                        if (!base2.__prototyping) {
                            if (this.constructor == _class || this.__constructing) {
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
                                return extend(target, _prototype);
                            }
                        }
                        return this;
                    };
                    _prototype.constructor = _class;

                    for (var i in Base) {
                        _class[i] = this[i];
                    }if (_static) extend(_class, _static);
                    _class.ancestor = this;
                    _class.ancestorOf = Base.ancestorOf;
                    _class.base = _prototype.base;
                    _class.prototype = _prototype;
                    if (_class.init) _class.init();

                    ;;;_class["#implements"] = [];
                    ;;;_class["#implemented_by"] = [];

                    return _class;
                };

                var Base = _subclass.call(Object, {
                    constructor: function constructor() {
                        if (arguments.length > 0) {
                            this.extend(arguments[0]);
                        }
                    },

                    extend: delegate(extend),

                    toString: function toString() {
                        if (this.constructor.toString == Function.prototype.toString) {
                            return "[object base2.Base]";
                        } else {
                            return "[object " + String2.slice(this.constructor, 1, -1) + "]";
                        }
                    }
                }, Base = {
                    ancestorOf: function ancestorOf(klass) {
                        return _ancestorOf(this, klass);
                    },

                    extend: _subclass,

                    forEach: function forEach(object, block, context) {
                        _Function_forEach(this, object, block, context);
                    },

                    implement: function implement(source) {
                        if (typeof source == "function") {
                            ;;;if (_ancestorOf(Base, source)) {
                                ;;;this["#implements"].push(source);
                                ;;;source["#implemented_by"].push(this);
                                ;;;
                            }
                            source = source.prototype;
                        }

                        extend(this.prototype, source);
                        return this;
                    }
                });

                var Package = Base.extend({
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
                                pkg.namespace = format("var %1=%2;", pkg.name, String2.slice(pkg, 1, -1));
                            }
                        }

                        if (_private) {
                            _private.__package = this;
                            _private.package = openPkg || this;

                            var jsNamespace = base2.js ? base2.js.namespace : "";

                            var namespace = "var base2=(function(){return this.base2})(),_private=base2.toString;" + base2.namespace + jsNamespace;
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

                            var packageName = String2.slice(pkg, 1, -1);
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
                                value.toString = K("[" + String2.slice(this, 1, -1) + "." + name + "]");
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
                        return format("[%1]", this.parent ? String2.slice(this.parent, 1, -1) + "." + this.name : this.name);
                    }
                });

                var Abstract = Base.extend({
                    constructor: function constructor() {
                        throw new TypeError("Abstract class cannot be instantiated.");
                    }
                });

                var _moduleCount = 0;

                var Module = Abstract.extend(null, {
                    namespace: "",

                    extend: function (_extend) {
                        function extend(_x, _x2) {
                            return _extend.apply(this, arguments);
                        }

                        extend.toString = function () {
                            return _extend.toString();
                        };

                        return extend;
                    }(function (_interface, _static) {
                        var module = this.base();
                        var index = _moduleCount++;
                        module.namespace = "";
                        module.partial = this.partial;
                        module.toString = K("[base2.Module[" + index + "]]");
                        Module[index] = module;

                        module.implement(this);

                        if (_interface) module.implement(_interface);

                        if (_static) {
                            extend(module, _static);
                            if (module.init) module.init();
                        }
                        return module;
                    }),

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
                            extend(module, _interface);

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
                                ;;;proto[name]._module = module;
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

                var Enumerable = Module.extend({
                    every: function every(object, test, context) {
                        var result = true;
                        try {
                            forEach(object, function (value, key) {
                                result = test.call(context, value, key, object);
                                if (!result) throw StopIteration;
                            });
                        } catch (error) {
                            if (error != StopIteration) throw error;
                        }
                        return !!result;
                    },

                    filter: function filter(object, test, context) {
                        var i = 0;
                        return this.reduce(object, function (result, value, key) {
                            if (test.call(context, value, key, object)) {
                                result[i++] = value;
                            }
                            return result;
                        }, []);
                    },

                    invoke: function invoke(object, method) {
                        var args = _slice.call(arguments, 2);
                        return this.map(object, typeof method == "function" ? function (item) {
                            return item == null ? undefined : method.apply(item, args);
                        } : function (item) {
                            return item == null ? undefined : item[method].apply(item, args);
                        });
                    },

                    map: function map(object, block, context) {
                        var result = [],
                            i = 0;
                        forEach(object, function (value, key) {
                            result[i++] = block.call(context, value, key, object);
                        });
                        return result;
                    },

                    pluck: function pluck(object, key) {
                        return this.map(object, function (item) {
                            return item == null ? undefined : item[key];
                        });
                    },

                    reduce: function reduce(object, block, result, context) {
                        var initialised = arguments.length > 2;
                        forEach(object, function (value, key) {
                            if (initialised) {
                                result = block.call(context, result, value, key, object);
                            } else {
                                result = value;
                                initialised = true;
                            }
                        });
                        return result;
                    },

                    some: function some(object, test, context) {
                        return !this.every(object, not(test), context);
                    }
                });

                var lang = {
                    name: "lang",
                    version: base2.version,
                    exports: "assert,assertArity,assertType,bind,copy,extend,forEach,format,instanceOf,match,pcopy,rescape,trim,typeOf",
                    namespace: "" };

                function assert(condition, message, ErrorClass) {
                    if (!condition) {
                        throw new (ErrorClass || Error)(message || "Assertion failed.");
                    }
                };

                function assertArity(args, arity, message) {
                    if (arity == null) arity = args.callee.length;
                    if (args.length < arity) {
                        throw new SyntaxError(message || "Not enough arguments.");
                    }
                };

                function assertType(object, type, message) {
                    if (type && (typeof type == "function" ? !instanceOf(object, type) : typeOf(object) != type)) {
                        throw new TypeError(message || "Invalid type.");
                    }
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

                function extend(object, source) {
                    if (object && source) {
                        var useProto = base2.__prototyping;
                        if (arguments.length > 2) {
                            var key = source;
                            source = {};
                            source[key] = arguments[2];
                            useProto = true;
                        }

                        var proto = global[typeof source == "function" ? "Function" : "Object"].prototype;

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
                };

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
                    var superObject = base2.__prototyping;
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

                if (typeof StopIteration == "undefined") {
                    StopIteration = new Error("StopIteration");
                }

                function forEach(object, block, context, fn) {
                    if (object == null) return;
                    if (!fn) {
                        if (typeof object == "function" && object.call) {
                            fn = Function;
                        } else if (typeof object.forEach == "function" && object.forEach != forEach) {
                            object.forEach(block, context);
                            return;
                        } else if (typeof object.length == "number") {
                            _Array_forEach(object, block, context);
                            return;
                        }
                    }
                    _Function_forEach(fn || Object, object, block, context);
                };

                forEach.csv = function (string, block, context) {
                    forEach(csv(string), block, context);
                };

                function _Array_forEach(array, block, context) {
                    if (array == null) array = global;
                    var length = array.length || 0,
                        i;
                    if (typeof array == "string") {
                        for (i = 0; i < length; i++) {
                            block.call(context, array.charAt(i), i, array);
                        }
                    } else {
                        for (i = 0; i < length; i++) {
                            if (i in array) block.call(context, array[i], i, array);
                        }
                    }
                };

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

                var js = {
                    name: "js",
                    version: base2.version,
                    exports: "Array2,Date2,Function2,String2",
                    namespace: "",

                    bind: function bind(host) {
                        var top = global;
                        global = host;
                        forEach.csv(this.exports, function (name2) {
                            var name = name2.slice(0, -1);
                            extend(host[name], this[name2]);
                            this[name2](host[name].prototype);
                        }, this);
                        global = top;
                        return host;
                    }
                };

                function _createObject2(Native, constructor, generics, extensions) {
                    var INative = Module.extend();
                    var id = INative.toString().slice(1, -1);

                    forEach.csv(generics, function (name) {
                        INative[name] = unbind(Native.prototype[name]);
                        INative.namespace += format("var %1=%2.%1;", name, id);
                    });
                    forEach(_slice.call(arguments, 3), INative.implement, INative);

                    var Native2 = function Native2() {
                        return INative(this.constructor == INative ? constructor.apply(null, arguments) : arguments[0]);
                    };
                    Native2.prototype = INative.prototype;

                    for (var name in INative) {
                        var method = Native[name];
                        if (method && name != "prototype" && name != "toString" && method != Function.prototype[name]) {
                            INative[name] = method;
                            delete INative.prototype[name];
                        }
                        Native2[name] = INative[name];
                    }
                    Native2.ancestor = Object;
                    delete Native2.extend;

                    Native2.namespace = Native2.namespace.replace(/(var (\w+)=)[^,;]+,([^\)]+)\)/g, "$1$3.$2");

                    return Native2;
                };

                if (new Date().getYear() > 1900) {
                    Date.prototype.getYear = function () {
                        return this.getFullYear() - 1900;
                    };
                    Date.prototype.setYear = function (year) {
                        return this.setFullYear(year + 1900);
                    };
                }

                var _testDate = new Date(Date.UTC(2006, 1, 20));
                _testDate.setUTCDate(15);
                if (_testDate.getUTCHours() != 0) {
                    forEach.csv("FullYear,Month,Date,Hours,Minutes,Seconds,Milliseconds", function (type) {
                        extend(Date.prototype, "setUTC" + type, function () {
                            var value = this.base.apply(this, arguments);
                            if (value >= 57722401000) {
                                value -= 3600000;
                                this.setTime(value);
                            }
                            return value;
                        });
                    });
                }

                Function.prototype.prototype = {};

                if ("".replace(/^/, K("$$")) == "$") {
                    extend(String.prototype, "replace", function (expression, replacement) {
                        if (typeof replacement == "function") {
                            var fn = replacement;
                            replacement = function replacement() {
                                return String(fn.apply(null, arguments)).split("$").join("$$");
                            };
                        }
                        return this.base(expression, replacement);
                    });
                }

                var Array2 = _createObject2(Array, Array, "concat,join,pop,push,reverse,shift,slice,sort,splice,unshift", Enumerable, {
                    batch: function batch(array, block, timeout, oncomplete, context) {
                        var index = 0,
                            length = array.length;
                        var batch = function batch() {
                            var now = Date2.now(),
                                start = now,
                                k = 0;
                            while (index < length && now - start < timeout) {
                                block.call(context, array[index], index++, array);
                                if (k++ < 5 || k % 50 == 0) now = Date2.now();
                            }
                            if (index < length) {
                                setTimeout(batch, 10);
                            } else {
                                if (oncomplete) oncomplete.call(context);
                            }
                        };
                        setTimeout(batch, 1);
                    },

                    combine: function combine(keys, values) {
                        if (!values) values = keys;
                        return Array2.reduce(keys, function (hash, key, index) {
                            hash[key] = values[index];
                            return hash;
                        }, {});
                    },

                    contains: function contains(array, item) {
                        return Array2.indexOf(array, item) != -1;
                    },

                    copy: function copy(array) {
                        var copy = _slice.call(array);
                        if (!copy.swap) Array2(copy);
                        return copy;
                    },

                    flatten: function flatten(array) {
                        var i = 0;
                        var flatten = function flatten(result, item) {
                            if (Array2.like(item)) {
                                Array2.reduce(item, flatten, result);
                            } else {
                                result[i++] = item;
                            }
                            return result;
                        };
                        return Array2.reduce(array, flatten, []);
                    },

                    forEach: _Array_forEach,

                    indexOf: function indexOf(array, item, fromIndex) {
                        var length = array.length;
                        if (fromIndex == null) {
                            fromIndex = 0;
                        } else if (fromIndex < 0) {
                            fromIndex = Math.max(0, length + fromIndex);
                        }
                        for (var i = fromIndex; i < length; i++) {
                            if (array[i] === item) return i;
                        }
                        return -1;
                    },

                    insertAt: function insertAt(array, index, item) {
                        Array2.splice(array, index, 0, item);
                    },

                    item: function item(array, index) {
                        if (index < 0) index += array.length;
                        return array[index];
                    },

                    lastIndexOf: function lastIndexOf(array, item, fromIndex) {
                        var length = array.length;
                        if (fromIndex == null) {
                            fromIndex = length - 1;
                        } else if (fromIndex < 0) {
                            fromIndex = Math.max(0, length + fromIndex);
                        }
                        for (var i = fromIndex; i >= 0; i--) {
                            if (array[i] === item) return i;
                        }
                        return -1;
                    },

                    map: function map(array, block, context) {
                        var result = [];
                        _Array_forEach(array, function (item, index) {
                            result[index] = block.call(context, item, index, array);
                        });
                        return result;
                    },

                    remove: function remove(array, item) {
                        var index = Array2.indexOf(array, item);
                        if (index != -1) Array2.removeAt(array, index);
                    },

                    removeAt: function removeAt(array, index) {
                        Array2.splice(array, index, 1);
                    },

                    swap: function swap(array, index1, index2) {
                        if (index1 < 0) index1 += array.length;
                        if (index2 < 0) index2 += array.length;
                        var temp = array[index1];
                        array[index1] = array[index2];
                        array[index2] = temp;
                        return array;
                    }
                });

                Array2.forEach = _Array_forEach;
                Array2.reduce = Enumerable.reduce;

                Array2.like = function (object) {
                    return typeOf(object) == "object" && typeof object.length == "number";
                };

                ;;;Enumerable["#implemented_by"].pop();
                ;;;Enumerable["#implemented_by"].push(Array2);

                var _DATE_PATTERN = /^((-\d+|\d{4,})(-(\d{2})(-(\d{2}))?)?)?T((\d{2})(:(\d{2})(:(\d{2})(\.(\d{1,3})(\d)?\d*)?)?)?)?(([+-])(\d{2})(:(\d{2}))?|Z)?$/;
                var _DATE_PARTS = {
                    FullYear: 2,
                    Month: 4,
                    Date: 6,
                    Hours: 8,
                    Minutes: 10,
                    Seconds: 12,
                    Milliseconds: 14
                };
                var _TIMEZONE_PARTS = {
                    Hectomicroseconds: 15,
                    UTC: 16,
                    Sign: 17,
                    Hours: 18,
                    Minutes: 20
                };

                var Date2 = _createObject2(Date, function (yy, mm, dd, h, m, s, ms) {
                    switch (arguments.length) {
                        case 0:
                            return new Date();
                        case 1:
                            return typeof yy == "string" ? new Date(Date2.parse(yy)) : new Date(yy.valueOf());
                        default:
                            return new Date(yy, mm, arguments.length == 2 ? 1 : dd, h || 0, m || 0, s || 0, ms || 0);
                    }
                }, "", {
                    toISOString: function toISOString(date) {
                        var string = "####-##-##T##:##:##.###";
                        for (var part in _DATE_PARTS) {
                            string = string.replace(/#+/, function (digits) {
                                var value = date["getUTC" + part]();
                                if (part == "Month") value++;
                                return ("000" + value).slice(-digits.length);
                            });
                        }

                        return string + "Z";
                    }
                });

                delete Date2.forEach;

                Date2.now = function () {
                    return new Date().valueOf();
                };

                Date2.parse = function (string, defaultDate) {
                    if (arguments.length > 1) {
                        assertType(defaultDate, "number", "Default date should be of type 'number'.");
                    }

                    var parts = match(string, _DATE_PATTERN);
                    if (parts.length) {
                        var month = parts[_DATE_PARTS.Month];
                        if (month) parts[_DATE_PARTS.Month] = String(month - 1);
                        if (parts[_TIMEZONE_PARTS.Hectomicroseconds] >= 5) parts[_DATE_PARTS.Milliseconds]++;
                        var utc = parts[_TIMEZONE_PARTS.UTC] || parts[_TIMEZONE_PARTS.Hours] ? "UTC" : "";
                        var date = new Date(defaultDate || 0);
                        if (parts[_DATE_PARTS.Date]) date["set" + utc + "Date"](14);
                        for (var part in _DATE_PARTS) {
                            var value = parts[_DATE_PARTS[part]];
                            if (value) {
                                date["set" + utc + part](value);

                                if (date["get" + utc + part]() != parts[_DATE_PARTS[part]]) {
                                    return NaN;
                                }
                            }
                        }

                        if (parts[_TIMEZONE_PARTS.Hours]) {
                            var hours = Number(parts[_TIMEZONE_PARTS.Sign] + parts[_TIMEZONE_PARTS.Hours]);
                            var minutes = Number(parts[_TIMEZONE_PARTS.Sign] + (parts[_TIMEZONE_PARTS.Minutes] || 0));
                            date.setUTCMinutes(date.getUTCMinutes() + hours * 60 + minutes);
                        }
                        return date.valueOf();
                    } else {
                        return Date.parse(string);
                    }
                };

                var String2 = _createObject2(String, function (string) {
                    return new String(arguments.length == 0 ? "" : string);
                }, "charAt,charCodeAt,concat,indexOf,lastIndexOf,match,replace,search,slice,split,substr,substring,toLowerCase,toUpperCase", {
                    csv: csv,
                    format: format,
                    rescape: rescape,
                    trim: trim
                });

                delete String2.forEach;

                function trim(string) {
                    return String(string).replace(_LTRIM, "").replace(_RTRIM, "");
                };

                function csv(string) {
                    return string ? (string + "").split(/\s*,\s*/) : [];
                };

                function format(string) {
                    var args = arguments;
                    var pattern = new RegExp("%([1-" + (arguments.length - 1) + "])", "g");
                    return (string + "").replace(pattern, function (match, index) {
                        return args[index];
                    });
                };

                function match(string, expression) {
                    return (string + "").match(expression) || [];
                };

                function rescape(string) {
                    return (string + "").replace(_RESCAPE, "\\$1");
                };

                var Function2 = _createObject2(Function, Function, "", {
                    I: I,
                    II: II,
                    K: K,
                    bind: bind,
                    compose: compose,
                    delegate: delegate,
                    flip: flip,
                    not: not,
                    partial: _partial,
                    unbind: unbind
                });

                function I(i) {
                    return i;
                };

                function II(i, ii) {
                    return ii;
                };

                function K(k) {
                    return function () {
                        return k;
                    };
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

                function compose() {
                    var fns = _slice.call(arguments);
                    return function () {
                        var i = fns.length,
                            result = fns[--i].apply(this, arguments);
                        while (i--) {
                            result = fns[i].call(this, result);
                        }return result;
                    };
                };

                function delegate(fn, context) {
                    return function () {
                        var args = _slice.call(arguments);
                        args.unshift(this);
                        return fn.apply(context, args);
                    };
                };

                function flip(fn) {
                    return function () {
                        return fn.apply(this, Array2.swap(arguments, 0, 1));
                    };
                };

                function not(fn) {
                    return function () {
                        return !fn.apply(this, arguments);
                    };
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
                };

                function unbind(fn) {
                    return function (context) {
                        return fn.apply(context, _slice.call(arguments, 1));
                    };
                };

                base2 = global.base2 = new Package(this, base2);
                base2.toString = K("[base2]");

                var _exports = this.exports;

                lang = new Package(this, lang);
                _exports += this.exports;

                js = new Package(this, js);
                eval(_exports + this.exports);

                lang.extend = extend;

                base2.JavaScript = pcopy(js);
                base2.JavaScript.namespace += "var JavaScript=js;";

                if (typeof exports !== 'undefined') {
                    if (typeof module !== 'undefined' && module.exports) {
                        exports = module.exports = base2;
                    }
                    exports.base2 = base2;
                }
            }();

            require('./base2.js');
            Promise = require('bluebird');


            new function () {
                base2.package(this, {
                    name: "miruken",
                    version: "0.0.84",
                    exports: "Enum,Flags,Variance,Protocol,StrictProtocol,Delegate,Miruken,MetaStep,MetaMacro," + "Initializing,Disposing,DisposingMixin,Resolving,Invoking,Parenting,Starting,Startup," + "Facet,Interceptor,InterceptorSelector,ProxyBuilder,Modifier,ArrayManager,IndexedList," + "$isProtocol,$isClass,$classOf,$ancestorOf,$isString,$isFunction,$isObject,$isArray," + "$isPromise,$isNothing,$isSomething,$using,$lift,$equals,$decorator,$decorate,$decorated," + "$debounce,$eq,$use,$copy,$lazy,$eval,$every,$child,$optional,$promise,$instant," + "$createModifier,$properties,$inferProperties,$inheritStatic"
                });

                eval(this.imports);

                var $eq = $createModifier();

                var $use = $createModifier();

                var $copy = $createModifier();

                var $lazy = $createModifier();

                var $eval = $createModifier();

                var $every = $createModifier();

                var $child = $createModifier();

                var $optional = $createModifier();

                var $promise = $createModifier();

                var $instant = $createModifier();

                var Enum = Base.extend({
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
                    coerce: function _(choices, behavior) {
                        if (this !== Enum && this !== Flags) {
                            return;
                        }
                        var en = this.extend(behavior, {
                            coerce: function _(value) {
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

                var Flags = Enum.extend({
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
                        var name,
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

                var Variance = Enum({
                    Covariant: 1,

                    Contravariant: 2,

                    Invariant: 3
                });

                var Protocol = Base.extend({
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

                var MetaStep = Enum({
                    Subclass: 1,

                    Implement: 2,

                    Extend: 3
                });

                var MetaMacro = Base.extend({
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
                        return this.new.apply(this, arguments);
                    }
                });

                var MetaBase = MetaMacro.extend({
                    constructor: function constructor(parent) {
                        var _protocols = [],
                            _descriptors;
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
                                    descriptor = copy(descriptor);
                                }
                                if (target) {
                                    Object.defineProperty(target, name, spec);
                                }
                                if (descriptor) {
                                    this.addDescriptor(name, descriptor);
                                }
                            },

                            getDescriptor: function getDescriptor(filter) {
                                var descriptors;
                                if ($isNothing(filter)) {
                                    if (parent) {
                                        descriptors = parent.getDescriptor(filter);
                                    }
                                    if (_descriptors) {
                                        descriptors = extend(descriptors || {}, _descriptors);
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
                                            descriptors = extend(descriptors || {}, key, descriptor);
                                        }
                                    }
                                }
                                return descriptors;
                            },

                            addDescriptor: function addDescriptor(name, descriptor) {
                                _descriptors = extend(_descriptors || {}, name, descriptor);
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

                var ClassMeta = MetaBase.extend({
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
                                    macro = _macros[i];
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

                            createSubclass: function _() {
                                var args = Array.prototype.slice.call(arguments),
                                    constraints = args,
                                    protocols,
                                    mixins,
                                    macros;
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
                                var empty = _.u || (_.u = {}),
                                    classSpec = _.cm || (_.cm = {
                                    enumerable: false,
                                    configurable: false,
                                    writable: false
                                }),
                                    instanceSpec = _.im || (_.im = {
                                    enumerable: false,
                                    configurable: false,
                                    get: ClassMeta.createInstanceMeta
                                }),
                                    instanceDef = args.shift() || empty,
                                    staticDef = args.shift() || empty;
                                this.inflate(MetaStep.Subclass, this, subClass.prototype, instanceDef, expand);
                                if (macros) {
                                    for (var i = 0; i < macros.length; ++i) {
                                        macros[i].inflate(MetaStep.Subclass, this, subClass.prototype, instanceDef, expand);
                                    }
                                }
                                instanceDef = expand.x || instanceDef;
                                var derived = ClassMeta.baseExtend.call(subClass, instanceDef, staticDef),
                                    metadata = new ClassMeta(this, derived, protocols, macros);
                                classSpec.value = metadata;
                                Object.defineProperty(derived, '$meta', classSpec);
                                Object.defineProperty(derived.prototype, '$meta', instanceSpec);
                                delete classSpec.value;
                                derived.conformsTo = metadata.conformsTo.bind(metadata);
                                metadata.execute(MetaStep.Subclass, metadata, derived.prototype, instanceDef);
                                if (mixins) {
                                    Array2.forEach(mixins, derived.implement, derived);
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
                    createInstanceMeta: function _(parent) {
                        var spec = _.spec || (_.spec = {
                            enumerable: false,
                            configurable: true,
                            writable: false
                        });
                        var metadata = new InstanceMeta(parent || this.constructor.$meta);
                        spec.value = metadata;
                        Object.defineProperty(this, '$meta', spec);
                        delete spec.value;
                        return metadata;
                    }
                });

                var InstanceMeta = MetaBase.extend({
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

                var $proxyProtocol = MetaMacro.extend({
                    inflate: function inflate(step, metadata, target, definition, expand) {
                        var protocolProto = Protocol.prototype,
                            expanded;
                        for (var key in definition) {
                            if (key in protocolProto) {
                                continue;
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
                                continue;
                            }
                            Object.defineProperty(expanded, key, member);
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

                var StrictProtocol = Protocol.extend({
                    constructor: function constructor(proxy, strict) {
                        this.base(proxy, strict === undefined || strict);
                    }
                });

                var GETTER_CONVENTIONS = ['get', 'is'];

                var $properties = MetaMacro.extend({
                    constructor: function _(tag) {
                        if ($isNothing(tag)) {
                            throw new Error("$properties requires a tag name");
                        }
                        Object.defineProperty(this, 'tag', { value: tag });
                    },
                    execute: function _(step, metadata, target, definition) {
                        var properties = this.extractProperty(this.tag, target, definition);
                        if (!properties) {
                            return;
                        }
                        var expanded = {},
                            source;
                        for (var name in properties) {
                            source = expanded;
                            var property = properties[name],
                                spec = _.spec || (_.spec = {
                                configurable: true,
                                enumerable: true
                            });
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
                                } else {
                                    spec.writable = true;
                                    spec.value = property.value;
                                }
                            _cleanDescriptor(property);
                            this.defineProperty(metadata, source, name, spec, property);
                            _cleanDescriptor(spec);
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

                var $inferProperties = MetaMacro.extend({
                    inflate: function _(step, metadata, target, definition, expand) {
                        var expanded;
                        for (var key in definition) {
                            var member = _getPropertyDescriptor(definition, key);
                            if ($isFunction(member.value)) {
                                var spec = _.spec || (_.spec = {
                                    configurable: true,
                                    enumerable: true
                                });
                                var name = this.inferProperty(key, member.value, definition, spec);
                                if (name) {
                                    expanded = expanded || expand();
                                    Object.defineProperty(expanded, name, spec);
                                    _cleanDescriptor(spec);
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
                                var name = key.substring(3),
                                    getter = definition['get' + name];
                                if ($isFunction(getter)) {
                                    spec.get = getter;
                                }
                                return name.charAt(0).toLowerCase() + name.slice(1);
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

                var $inheritStatic = MetaMacro.extend({
                    constructor: function _() {
                        var spec = _.spec || (_.spec = {});
                        spec.value = Array.prototype.slice.call(arguments);
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
                                    var member = members[i];
                                    if (!(member in clazz)) {
                                        clazz[member] = ancestor[member];
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

                var Delegate = Base.extend({
                    get: function get(protocol, propertyName, strict) {},

                    set: function set(protocol, propertyName, propertyValue, strict) {},

                    invoke: function invoke(protocol, methodName, args, strict) {}
                });

                var ObjectDelegate = Delegate.extend({
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
                            method = object[methodName];
                            return method && method.apply(object, args);
                        }
                    }
                });

                var ArrayDelegate = Delegate.extend({
                    constructor: function constructor(array) {
                        Object.defineProperty(this, 'array', { value: array });
                    },
                    get: function get(protocol, propertyName, strict) {
                        var array = this.array;
                        return array && Array2.reduce(array, function (result, object) {
                            return !strict || protocol.adoptedBy(object) ? object[propertyName] : result;
                        }, undefined);
                    },
                    set: function set(protocol, propertyName, propertyValue, strict) {
                        var array = this.array;
                        return array && Array2.reduce(array, function (result, object) {
                            return !strict || protocol.adoptedBy(object) ? object[propertyName] = propertyValue : result;
                        }, undefined);
                    },
                    invoke: function invoke(protocol, methodName, args, strict) {
                        var array = this.array;
                        return array && Array2.reduce(array, function (result, object) {
                            var method = object[methodName];
                            return method && (!strict || protocol.adoptedBy(object)) ? method.apply(object, args) : result;
                        }, undefined);
                    }
                });

                var Miruken = Base.extend(null, {
                    coerce: function coerce() {
                        return this.new.apply(this, arguments);
                    }
                });

                var Initializing = Protocol.extend({
                    initialize: function initialize() {}
                });

                var Disposing = Protocol.extend({
                    dispose: function dispose() {}
                });

                var DisposingMixin = Module.extend({
                    dispose: function dispose(object) {
                        if ($isFunction(object._dispose)) {
                            var result = object._dispose();
                            object.dispose = Undefined;
                            return result;
                        }
                    }
                });

                var Resolving = Protocol.extend();

                var Invoking = StrictProtocol.extend({
                    invoke: function invoke(fn, dependencies, ctx) {}
                });

                var Parenting = Protocol.extend({
                    newChild: function newChild() {}
                });

                var Starting = Protocol.extend({
                    start: function start() {}
                });

                var Startup = Base.extend(Starting, {
                    start: function start() {}
                });

                function $using(disposing, action, context) {
                    if (disposing && $isFunction(disposing.dispose)) {
                        if (!$isPromise(action)) {
                            var result;
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
                    var allowNew;
                    function modifier(source) {
                        if (this === global) {
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

                var ArrayManager = Base.extend({
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
                                var newItems;
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

                var IndexedList = Base.extend({
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
                                var indexedNode = this.getIndex(index),
                                    insert = indexedNode;
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

                var Facet = Object.freeze({
                    Parameters: 'parameters',

                    Interceptors: 'interceptors',

                    InterceptorSelectors: 'interceptorSelectors',

                    Delegate: 'delegate'
                });

                var Interceptor = Base.extend({
                    intercept: function intercept(invocation) {
                        return invocation.proceed();
                    }
                });

                var InterceptorSelector = Base.extend({
                    selectInterceptors: function selectInterceptors(type, method, interceptors) {
                        return interceptors;
                    }
                });

                var ProxyBuilder = Base.extend({
                    buildProxy: function buildProxy(types, options) {
                        if (!$isArray(types)) {
                            throw new TypeError("ProxyBuilder requires an array of types to proxy.");
                        }
                        var classes = Array2.filter(types, $isClass),
                            protocols = Array2.filter(types, $isProtocol);
                        return _buildProxy(classes, protocols, options || {});
                    }
                });

                function _buildProxy(classes, protocols, options) {
                    var base = options.baseType || classes.shift() || Base,
                        proxy = base.extend(classes.concat(protocols), {
                        constructor: function _(facets) {
                            var spec = _.spec || (_.spec = {});
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
                            ctor = _proxyMethod("constructor", this.base, base);
                            ctor.apply(this, facets[Facet.Parameters]);
                            delete spec.writable;
                            delete spec.value;
                        },
                        getInterceptors: function getInterceptors(source, method) {
                            var selectors = this.selectors;
                            return selectors ? Array2.reduce(selectors, function (interceptors, selector) {
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
                        for (key in sourceProto) {
                            if (!(key in proxied || key in _noProxyMethods) && (!proxy.shouldProxy || proxy.shouldProxy(key, source))) {
                                var descriptor = _getPropertyDescriptor(sourceProto, key);
                                if ('value' in descriptor) {
                                    var member = isProtocol ? undefined : descriptor.value;
                                    if ($isNothing(member) || $isFunction(member)) {
                                        proxyProto[key] = _proxyMethod(key, member, proxy);
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
                                        var proxyGet;
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
                                        var proxySet;
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
                    var spec = _proxyMethod.spec || (_proxyMethod.spec = {}),
                        interceptors;
                    function methodProxy() {
                        var _this = this,
                            delegate = this.delegate,
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
                    for (methodName in overrides) {
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
                                member = pkg[name];
                            if (member && (!filter || filter(member, name))) {
                                cb({ member: member, name: name });
                            }
                        }
                    }
                }

                var $isProtocol = Protocol.isProtocol;

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
                    var decoratee;
                    while (decorator && (decoratee = decorator.decoratee)) {
                        if (!deepest) {
                            return decoratee;
                        }
                        decorator = decoratee;
                    }
                    return decorator;
                }

                function $debounce(func, wait, immediate, defaultReturnValue) {
                    var timeout;
                    return function () {
                        var context = this,
                            args = arguments;
                        var later = function later() {
                            timeout = null;
                            if (!immediate) {
                                return func.apply(context, args);
                            }
                        };
                        var callNow = immediate && !timeout;
                        clearTimeout(timeout);
                        timeout = setTimeout(later, wait);
                        if (callNow) {
                            return func.apply(context, args);
                        }
                        return defaultReturnValue;
                    };
                };

                function _getPropertyDescriptor(object, key, own) {
                    var source = object,
                        descriptor;
                    while (source && !(descriptor = Object.getOwnPropertyDescriptor(source, key))) {
                        source = own ? null : Object.getPrototypeOf(source);
                    }return descriptor;
                }

                if (Function.prototype.new === undefined) Function.prototype.new = function () {
                    var args = arguments,
                        constructor = this;
                    function Wrapper() {
                        constructor.apply(this, args);
                    }
                    Wrapper.prototype = constructor.prototype;
                    return new Wrapper();
                };

                if (typeof module !== 'undefined' && module.exports) {
                    module.exports = exports = this.package;
                }

                global.miruken = this.package;
                global.Miruken = Miruken;

                eval(this.exports);
            }();
        }
    };
});