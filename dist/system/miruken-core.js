"use strict";

System.register(["reflect-metadata"], function (_export, _context) {
    "use strict";

    var _Base$extend, _typeof, Undefined, __prototyping, _counter, _IGNORE, _BASE, _HIDDEN, _slice, _subclass, Base, Package, Abstract, _moduleCount, Module, _toString, ArrayManager, IndexedList, Delegate, ObjectDelegate, ArrayDelegate, Metadata, protocolGet, protocolSet, protocolInvoke, protocolDelegate, protocolStrict, protocolMetadataKey, Protocol, StrictProtocol, $isProtocol, Defining, Enum, Flags, baseExtend, baseImplement, baseProtoExtend, emptyArray, nothing, MethodType, Variance, Initializing, Resolving, Invoking, Parenting, Starting, Startup;

    function _defineProperty(obj, key, value) {
        if (key in obj) {
            Object.defineProperty(obj, key, {
                value: value,
                enumerable: true,
                configurable: true,
                writable: true
            });
        } else {
            obj[key] = value;
        }

        return obj;
    }

    function _toConsumableArray(arr) {
        if (Array.isArray(arr)) {
            for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) {
                arr2[i] = arr[i];
            }

            return arr2;
        } else {
            return Array.from(arr);
        }
    }

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
    }

    function _createStaticModuleMethod(module, name) {
        return function () {
            return module[name].apply(module, arguments);
        };
    }

    function _createModuleMethod(module, name) {
        return function () {
            var args = _slice.call(arguments);
            args.unshift(this);
            return module[name].apply(module, args);
        };
    }

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
    }

    function _ancestorOf(ancestor, fn) {
        while (fn) {
            if (!fn.ancestor) return false;
            fn = fn.ancestor;
            if (fn == ancestor) return true;
        }
        return false;
    }

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
    }

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
    }

    function format(string) {
        var args = arguments;
        var pattern = new RegExp("%([1-" + (arguments.length - 1) + "])", "g");
        return (string + "").replace(pattern, function (match, index) {
            return args[index];
        });
    }

    function csv(string) {
        return string ? (string + "").split(/\s*,\s*/) : [];
    }

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
    }

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
    }

    function delegate(fn, context) {
        return function () {
            var args = _slice.call(arguments);
            args.unshift(this);
            return fn.apply(context, args);
        };
    }

    function K(k) {
        return function () {
            return k;
        };
    }

    function defaultOrder(a, b) {
        return a < b;
    }

    function $isFunction(fn) {
        return fn instanceof Function;
    }

    function $isObject(obj) {
        return typeOf(obj) === "object";
    }

    function $isNothing(value) {
        return value == null;
    }

    function $isSomething$1(value) {
        return value != null;
    }

    function $flatten(arr, prune) {
        var _ref;

        if (!Array.isArray(arr)) return arr;
        var items = arr.map(function (item) {
            return $flatten(item, prune);
        });
        if (prune) items = items.filter($isSomething$1);
        return (_ref = []).concat.apply(_ref, _toConsumableArray(items));
    }

    function $equals(obj1, obj2) {
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

        var keys = ["value", "initializer", "get", "set"];

        for (var i = 0, l = keys.length; i < l; i++) {
            if (desc.hasOwnProperty(keys[i])) {
                return true;
            }
        }

        return false;
    }

    function _metadataGetter(metadataKey, own, target, targetKey) {
        return own ? this.getOwn(metadataKey, target, targetKey) : this.get(metadataKey, target, targetKey);
    }

    function _metadataKeyGetter(metadataKey, own, target, callback) {
        var _this5 = this;

        var found = false;
        if (!$isFunction(callback)) return false;
        var keys = Reflect.ownKeys(own ? target : getPropertyDescriptors(target)).concat("constructor");
        keys.forEach(function (key) {
            var metadata = own ? _this5.getOwn(metadataKey, target, key) : _this5.get(metadataKey, target, key);
            if (metadata) {
                callback(metadata, key);
                found = true;
            }
        });
        return found;
    }

    function _metadataCollector(metadataKey, target, targetKey, callback) {
        if (!callback && $isFunction(targetKey)) {
            var _ref2 = [null, targetKey];
            targetKey = _ref2[0];
            callback = _ref2[1];
        }
        if (!$isFunction(callback)) return;
        this.collect(metadataKey, target, targetKey, callback);
    }

    function _metadataKeyCollector(metadataKey, target, callback) {
        var _this6 = this;

        if (!$isFunction(callback)) return;
        var keys = Reflect.ownKeys(getPropertyDescriptors(target)).concat("constructor");
        keys.forEach(function (key) {
            return _this6.collect(metadataKey, target, key, callback);
        });
    }

    function $protocols(target, own) {
        if (!target) return [];
        if ($isFunction(target)) {
            target = target.prototype;
        }
        var protocols = !own ? new Set() : Metadata.getOwn(protocolMetadataKey, target);
        if (!own) {
            (function () {
                var add = protocols.add.bind(protocols);
                Metadata.collect(protocolMetadataKey, target, function (ps) {
                    return ps.forEach(function (p) {
                        return [p].concat(_toConsumableArray($protocols(p))).forEach(add);
                    });
                });
            })();
        }
        return protocols && [].concat(_toConsumableArray(protocols)) || [];
    }

    function protocol() {
        for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
            args[_key2] = arguments[_key2];
        }

        if (args.length === 0) {
            return function () {
                return _protocol.apply(null, arguments);
            };
        }
        return _protocol.apply(undefined, args);
    }

    function _protocol(target) {
        if ($isFunction(target)) {
            target = target.prototype;
        }
        Reflect.ownKeys(target).forEach(function (key) {
            if (key === "constructor") return;
            var descriptor = Object.getOwnPropertyDescriptor(target, key);
            if (!descriptor.enumerable) return;
            if ($isFunction(descriptor.value)) {
                descriptor.value = function () {
                    for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
                        args[_key3] = arguments[_key3];
                    }

                    return this[protocolInvoke](key, args);
                };
            } else {
                var isSimple = descriptor.hasOwnProperty("value") || descriptor.hasOwnProperty("initializer");
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
                    };
                }
            }
            Object.defineProperty(target, key, descriptor);
        });
    }

    function conformsTo() {
        for (var _len4 = arguments.length, protocols = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
            protocols[_key4] = arguments[_key4];
        }

        protocols = $flatten(protocols, true);
        if (!protocols.every($isProtocol)) {
            throw new TypeError("Only Protocols can be conformed to");
        }
        return protocols.length === 0 ? Undefined : adopt;
        function adopt(target, key, descriptor) {
            if (isDescriptor(descriptor)) {
                throw new SyntaxError("@conformsTo can only be applied to classes");
            }
            protocols.forEach(function (protocol) {
                return protocol.adoptBy(target);
            });
        }
    }

    function mixin() {
        for (var _len6 = arguments.length, behaviors = Array(_len6), _key6 = 0; _key6 < _len6; _key6++) {
            behaviors[_key6] = arguments[_key6];
        }

        behaviors = $flatten(behaviors, true);
        return function (target) {
            if (behaviors.length > 0 && $isFunction(target.implement)) {
                behaviors.forEach(function (b) {
                    return target.implement(b);
                });
            }
        };
    }

    function $isClass(target) {
        if (!target || $isProtocol(target)) return false;
        if (target.prototype instanceof Base) return true;
        var name = target.name;
        return name && $isFunction(target) && isUpperCase(name.charAt(0));
    }

    function $classOf(instance) {
        return instance == null ? undefined : instance.constructor;
    }

    function $decorator(decorations) {
        return function (decoratee) {
            if ($isNothing(decoratee)) {
                throw new TypeError("No decoratee specified.");
            }
            var decorator = Object.create(decoratee);
            Object.defineProperty(decorator, "decoratee", {
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

    function isUpperCase(char) {
        return char.toUpperCase() === char;
    }

    return {
        setters: [function (_reflectMetadata) {}],
        execute: function () {
            _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
                return typeof obj;
            } : function (obj) {
                return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
            };
            Undefined = K();
            _counter = 1;
            _IGNORE = K();
            _BASE = /\bbase\b/;
            _HIDDEN = ["constructor", "toString"];
            _slice = Array.prototype.slice;

            _subclass = function _subclass(_instance, _static) {
                __prototyping = this.prototype;
                var _prototype = new this();
                if (_instance) _extend(_prototype, _instance);
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
                }
                _prototype.constructor = _class;

                Object.setPrototypeOf(_class, this);
                if (_static) _extend(_class, _static);
                _class.ancestor = this;
                _class.prototype = _prototype;
                if (_class.init) _class.init();

                return _class;
            };

            Base = _subclass.call(Object, {
                constructor: function constructor() {
                    if (arguments.length > 0 && typeOf(arguments[0]) === 'object') {
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
            }, Base = {
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


            Base.base = Base.prototype.base = function () {};

            Package = Base.extend({
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
                    }
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
            Abstract = Base.extend({
                constructor: function constructor() {
                    throw new TypeError("Abstract class cannot be instantiated.");
                }
            });
            _moduleCount = 0;
            Module = Abstract.extend(null, {
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


            Module.prototype.base = Module.prototype.extend = _IGNORE;_toString = Object.prototype.toString;
            ArrayManager = Base.extend({
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
                            if (_items[index] === undefined) {
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
            IndexedList = Base.extend({
                constructor: function constructor() {
                    var order = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : defaultOrder;

                    var _index = {};
                    this.extend({
                        isEmpty: function isEmpty() {
                            return !this.head;
                        },
                        has: function has(node) {
                            var index = node.index;
                            var indexedNode = this.getFirst(index);
                            while (indexedNode && indexedNode.index === index) {
                                if ($equals(indxedNode, node)) {
                                    return true;
                                }
                                indexedNode = indexedNode.next;
                            }
                            return false;
                        },
                        getFirst: function getFirst(index) {
                            return index && _index[index];
                        },
                        insert: function insert(node, index) {
                            var indexedNode = this.getFirst(index);
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
                            return this;
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
                            if (this.getFirst(index) === node) {
                                if (next && next.index === index) {
                                    _index[index] = next;
                                } else {
                                    delete _index[index];
                                }
                            }
                            return this;
                        },
                        merge: function merge(list) {
                            if (!list) {
                                return this;
                            }
                            if (list.constructor !== this.constructor) {
                                throw new TypeError("merge expects lists of equal type");
                            }
                            var node = list.head;
                            while (node) {
                                var next = node.next;
                                if (!this.has(node)) {
                                    this.insert(node, node.index);
                                }
                                node = next;
                            }
                            return this;
                        }
                    });
                }
            });
            Delegate = Base.extend({
                get: function get(protocol, key, strict) {},
                set: function set(protocol, key, value, strict) {},
                invoke: function invoke(protocol, methodName, args, strict) {}
            });
            ObjectDelegate = Delegate.extend({
                constructor: function constructor(object) {
                    Object.defineProperty(this, "object", { value: object });
                },
                get: function get(protocol, key, strict) {
                    var object = this.object;
                    if (object && (!strict || protocol.isAdoptedBy(object))) {
                        return object[key];
                    }
                },
                set: function set(protocol, key, value, strict) {
                    var object = this.object;
                    if (object && (!strict || protocol.isAdoptedBy(object))) {
                        return object[key] = value;
                    }
                },
                invoke: function invoke(protocol, methodName, args, strict) {
                    var object = this.object;
                    if (object && (!strict || protocol.isAdoptedBy(object))) {
                        var method = object[methodName];
                        return method && method.apply(object, args);
                    }
                }
            });
            ArrayDelegate = Delegate.extend({
                constructor: function constructor(array) {
                    Object.defineProperty(this, "array", { value: array });
                },
                get: function get(protocol, key, strict) {
                    var array = this.array;
                    return array && array.reduce(function (result, object) {
                        return !strict || protocol.isAdoptedBy(object) ? object[key] : result;
                    }, undefined);
                },
                set: function set(protocol, key, value, strict) {
                    var array = this.array;
                    return array && array.reduce(function (result, object) {
                        return !strict || protocol.isAdoptedBy(object) ? object[key] = value : result;
                    }, undefined);
                },
                invoke: function invoke(protocol, methodName, args, strict) {
                    var array = this.array;
                    return array && array.reduce(function (result, object) {
                        var method = object[methodName];
                        return method && (!strict || protocol.isAdoptedBy(object)) ? method.apply(object, args) : result;
                    }, undefined);
                }
            });
            Metadata = Abstract.extend(null, {
                get: function get(metadataKey, target, targetKey) {
                    if (target) {
                        return targetKey ? Reflect.getMetadata(metadataKey, target, targetKey) : Reflect.getMetadata(metadataKey, target);
                    }
                },
                getOwn: function getOwn(metadataKey, target, targetKey) {
                    if (target) {
                        return targetKey ? Reflect.getOwnMetadata(metadataKey, target, targetKey) : Reflect.getOwnMetadata(metadataKey, target);
                    }
                },
                getOrCreateOwn: function getOrCreateOwn(metadataKey, target, targetKey, creator) {
                    if (arguments.length === 3) {
                        creator = targetKey;
                        targetKey = undefined;
                    }
                    if (!$isFunction(creator)) {
                        throw new TypeError("creator must be a function");
                    }
                    var metadata = this.getOwn(metadataKey, target, targetKey);
                    if (metadata === undefined) {
                        metadata = creator(metadataKey, target, targetKey);
                        this.define(metadataKey, metadata, target, targetKey);
                    }
                    return metadata;
                },
                define: function define(metadataKey, metadata, target, targetKey) {
                    if (target) {
                        return targetKey ? Reflect.defineMetadata(metadataKey, metadata, target, targetKey) : Reflect.defineMetadata(metadataKey, metadata, target);
                    }
                },
                remove: function remove(metadataKey, target, targetKey) {
                    if (target) {
                        return targetKey ? Reflect.deleteMetadata(metadataKey, target, targetKey) : Reflect.deleteMetadata(metadataKey, target);
                    }
                },
                copyOwn: function copyOwn(target, source) {
                    var _this = this;

                    this.copyOwnKey(target, source);
                    Reflect.ownKeys(source).forEach(function (sourceKey) {
                        return _this.copyOwnKey(target, source, sourceKey);
                    });
                },
                copyOwnKey: function copyOwnKey(target, source, sourceKey) {
                    var _this2 = this;

                    var metadataKeys = Reflect.getOwnMetadataKeys(source, sourceKey);
                    metadataKeys.forEach(function (metadataKey) {
                        var metadata = _this2.getOwn(metadataKey, source, sourceKey);
                        _this2.define(metadataKey, metadata, target, sourceKey);
                    });
                },
                mergeOwn: function mergeOwn(target, source) {
                    var _this3 = this;

                    this.mergeOwnKey(target, source);
                    Reflect.ownKeys(source).forEach(function (sourceKey) {
                        return _this3.mergeOwnKey(target, source, sourceKey);
                    });
                },
                mergeOwnKey: function mergeOwnKey(target, source, sourceKey) {
                    var _this4 = this;

                    var metadataKeys = Reflect.getOwnMetadataKeys(source, sourceKey);
                    metadataKeys.forEach(function (metadataKey) {
                        var targetMetadata = _this4.getOwn(metadataKey, target, sourceKey),
                            sourceMetadata = _this4.getOwn(metadataKey, source, sourceKey);
                        if (targetMetadata && targetMetadata.merge) {
                            targetMetadata.merge(sourceMetadata);x;
                        } else {
                            _this4.define(metadataKey, sourceMetadata, target, sourceKey);
                        }
                    });
                },
                collect: function collect(metadataKey, target, targetKey, collector) {
                    if (arguments.length === 3) {
                        collector = targetKey;
                        targetKey = undefined;
                    }
                    if (!$isFunction(collector)) {
                        throw new TypeError("collector must be a function");
                    }
                    while (target) {
                        var metadata = this.getOwn(metadataKey, target, targetKey);
                        if (metadata && collector(metadata, metadataKey, target, targetKey)) {
                            return true;
                        }
                        target = Object.getPrototypeOf(target);
                    }
                    return false;
                },
                decorator: function decorator(metadataKey, handler) {
                    function decorator() {
                        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                            args[_key] = arguments[_key];
                        }

                        return decorate(handler, args);
                    }
                    decorator.get = _metadataGetter.bind(this, metadataKey, false);
                    decorator.getOwn = _metadataGetter.bind(this, metadataKey, true);
                    decorator.getKeys = _metadataKeyGetter.bind(this, metadataKey, false);
                    decorator.getOwnKeys = _metadataKeyGetter.bind(this, metadataKey, true);
                    decorator.collect = _metadataCollector.bind(this, metadataKey);
                    decorator.collectKeys = _metadataKeyCollector.bind(this, metadataKey);
                    return decorator;
                }
            });
            protocolGet = Symbol();
            protocolSet = Symbol();
            protocolInvoke = Symbol();
            protocolDelegate = Symbol();
            protocolStrict = Symbol();
            protocolMetadataKey = Symbol();
            Protocol = Base.extend((_Base$extend = {
                constructor: function constructor(delegate$$1, strict) {
                    var _Object$definePropert;

                    if ($isNothing(delegate$$1)) {
                        delegate$$1 = new Delegate();
                    } else if (!(delegate$$1 instanceof Delegate)) {
                        if ($isFunction(delegate$$1.toDelegate)) {
                            delegate$$1 = delegate$$1.toDelegate();
                            if (!(delegate$$1 instanceof Delegate)) {
                                throw new TypeError("'toDelegate' method did not return a Delegate.");
                            }
                        } else if (Array.isArray(delegate$$1)) {
                            delegate$$1 = new ArrayDelegate(delegate$$1);
                        } else {
                            delegate$$1 = new ObjectDelegate(delegate$$1);
                        }
                    }
                    Object.defineProperties(this, (_Object$definePropert = {}, _defineProperty(_Object$definePropert, protocolDelegate, { value: delegate$$1, writable: false }), _defineProperty(_Object$definePropert, protocolStrict, { value: !!strict, writable: false }), _Object$definePropert));
                }
            }, _defineProperty(_Base$extend, protocolGet, function (key) {
                var delegate$$1 = this[protocolDelegate];
                return delegate$$1 && delegate$$1.get(this.constructor, key, this[protocolStrict]);
            }), _defineProperty(_Base$extend, protocolSet, function (key, value) {
                var delegate$$1 = this[protocolDelegate];
                return delegate$$1 && delegate$$1.set(this.constructor, key, value, this[protocolStrict]);
            }), _defineProperty(_Base$extend, protocolInvoke, function (methodName, args) {
                var delegate$$1 = this[protocolDelegate];
                return delegate$$1 && delegate$$1.invoke(this.constructor, methodName, args, this[protocolStrict]);
            }), _Base$extend), {
                isProtocol: function isProtocol(target) {
                    return target && target.prototype instanceof Protocol;
                },
                isAdoptedBy: function isAdoptedBy(target) {
                    var _this7 = this;

                    if (!target) return false;
                    if (this === target || target && target.prototype instanceof this) {
                        return true;
                    }
                    var metaTarget = $isFunction(target) ? target.prototype : target;
                    return Metadata.collect(protocolMetadataKey, metaTarget, function (protocols) {
                        return protocols.has(_this7) || [].concat(_toConsumableArray(protocols)).some(function (p) {
                            return _this7.isAdoptedBy(p);
                        });
                    });
                },
                adoptBy: function adoptBy(target) {
                    var _this8 = this;

                    if (!target) return;
                    var metaTarget = $isFunction(target) ? target.prototype : target;
                    if (Metadata.collect(protocolMetadataKey, metaTarget, function (p) {
                        return p.has(_this8);
                    })) {
                        return false;
                    }
                    var protocols = Metadata.getOrCreateOwn(protocolMetadataKey, metaTarget, function () {
                        return new Set();
                    });
                    protocols.add(this);
                    if ($isFunction(target.protocolAdopted)) {
                        target.protocolAdopted(this);
                    }
                    return true;
                },
                protocolAdopted: function protocolAdopted(protocol) {
                    var prototype = this.prototype,
                        protocolProto = Protocol.prototype,
                        props = getPropertyDescriptors(protocol.prototype);
                    Reflect.ownKeys(props).forEach(function (key) {
                        if (getPropertyDescriptors(protocolProto, key) || getPropertyDescriptors(prototype, key)) return;
                        Object.defineProperty(prototype, key, props[key]);
                    });
                },
                coerce: function coerce(object, strict) {
                    return new this(object, strict);
                }
            });
            StrictProtocol = Protocol.extend({
                constructor: function constructor(proxy, strict) {
                    this.base(proxy, strict === undefined || strict);
                }
            });
            $isProtocol = Protocol.isProtocol;
            Defining = Symbol();
            Enum = Base.extend({
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
                        throw new TypeError(value + " is not a valid value for this Enum.");
                    }
                    return match;
                }
            });

            Enum.prototype.valueOf = function () {
                var value = +this.value;
                return isNaN(value) ? this.ordinal : value;
            };

            Flags = Enum.extend({
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
            baseExtend = Base.extend;
            baseImplement = Base.implement;
            baseProtoExtend = Base.prototype.extend;

            _export("emptyArray", emptyArray = Object.freeze([]));

            _export("nothing", nothing = undefined);

            _export("MethodType", MethodType = Enum({
                Get: 1,

                Set: 2,

                Invoke: 3
            }));

            _export("Variance", Variance = Enum({
                Covariant: 1,

                Contravariant: 2,

                Invariant: 3
            }));

            Base.extend = function () {
                for (var _len5 = arguments.length, args = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
                    args[_key5] = arguments[_key5];
                }

                var constraints = args,
                    decorators = [];
                if (this === Protocol) {
                    decorators.push(protocol);
                }if ($isProtocol(this)) {
                    decorators.push(protocol, conformsTo(this));
                }
                if (args.length > 0 && Array.isArray(args[0])) {
                    constraints = args.shift();
                }
                while (constraints.length > 0) {
                    var constraint = constraints[0];
                    if (!constraint) {
                        break;
                    } else if ($isProtocol(constraint)) {
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
                    derived = baseExtend.call(this, members, classMembers);
                Metadata.copyOwn(derived, classMembers);
                Metadata.copyOwn(derived.prototype, members);
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
                Metadata.mergeOwn(type.prototype, source);
                return type;
            };

            Base.prototype.extend = function (key, value) {
                if (!key) return this;
                var numArgs = arguments.length;
                if (numArgs === 1) {
                    if (this instanceof Protocol) {
                        key = protocol(key) || key;
                    }
                    var instance = baseProtoExtend.call(this, key);
                    Metadata.mergeOwn(instance, key);
                    return instance;
                }
                return baseProtoExtend.call(this, key, value);
            };

            _export("Initializing", Initializing = Protocol.extend({
                initialize: function initialize() {}
            }));

            _export("Resolving", Resolving = Protocol.extend());

            _export("Invoking", Invoking = StrictProtocol.extend({
                invoke: function invoke(fn, dependencies, ctx) {}
            }));

            _export("Parenting", Parenting = Protocol.extend({
                newChild: function newChild() {}
            }));

            _export("Starting", Starting = Protocol.extend({
                start: function start() {}
            }));

            _export("Startup", Startup = Base.extend(Starting, {
                start: function start() {}
            }));

            _export("emptyArray", emptyArray);

            _export("nothing", nothing);

            _export("MethodType", MethodType);

            _export("Variance", Variance);

            _export("mixin", mixin);

            _export("Initializing", Initializing);

            _export("Resolving", Resolving);

            _export("Invoking", Invoking);

            _export("Parenting", Parenting);

            _export("Starting", Starting);

            _export("Startup", Startup);

            _export("$isClass", $isClass);

            _export("$classOf", $classOf);

            _export("$decorator", $decorator);

            _export("$decorate", $decorate);

            _export("$decorated", $decorated);
        }
    };
});