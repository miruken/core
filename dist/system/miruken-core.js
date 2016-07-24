"use strict";

System.register([], function (_export, _context) {
    "use strict";

    var _Base$extend, _typeof, $eq, $use, $copy, $lazy, $eval, $every, $child, $optional, $promise, $instant, Undefined, Null, True, False, __prototyping, _counter, _IGNORE, _BASE, _HIDDEN, _slice, _subclass, Base, Package, Abstract, _moduleCount, Module, _toString, Defining, Enum, Flags, ArrayManager, IndexedList, Metadata, ProtocolGet, ProtocolSet, ProtocolInvoke, ProtocolDelegate, ProtocolStrict, Protocol, MetaStep, MetaMacro, MetaBase, ClassMeta, InstanceMeta, $proxyProtocol, StrictProtocol, GETTER_CONVENTIONS, PropertiesTag, $properties, $inferProperties, $inheritStatic, Delegate, ObjectDelegate, ArrayDelegate, $isProtocol, Variance, Initializing, Resolving, Invoking, Parenting, Starting, Startup, Disposing, DisposingMixin, TraversingAxis, Traversing, TraversingMixin, Traversal, Facet, Interceptor, InterceptorSelector, ProxyBuilder, noProxyMethods;

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

    function _dummy() {}function _extend(object, source) {
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
                    if (!desc || desc.value != proto[key]) {
                        desc = _override(object, key, desc);
                        if (desc) Object.defineProperty(object, key, desc);
                    }
                }
            }

            var props = getPropertyDescriptors(source);
            Reflect.ownKeys(props).forEach(function (key) {
                if (typeof proto[key] == "undefined" && key !== "base") {
                    var desc = _override(object, key, props[key]);
                    if (desc) Object.defineProperty(object, key, desc);
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
    }function _partial(fn) {
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

    function K(k) {
        return function () {
            return k;
        };
    }

    function defineMetadata(target, metadata) {
        Object.defineProperty(target, Metadata, {
            enumerable: false,
            configurable: false,
            writable: false,
            value: metadata
        });
    }

    function cleanDescriptor(descriptor) {
        delete descriptor.writable;
        delete descriptor.value;
        delete descriptor.get;
        delete descriptor.set;
    }

    function checkCircularity(visited, node) {
        if (visited.indexOf(node) !== -1) {
            throw new Error("Circularity detected for node " + node);
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
        var _iteratorNormalCompletion9 = true;
        var _didIteratorError9 = false;
        var _iteratorError9 = undefined;

        try {
            for (var _iterator9 = this.children[Symbol.iterator](), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
                var child = _step9.value;

                if (visitor.call(context, child)) {
                    return;
                }
            }
        } catch (err) {
            _didIteratorError9 = true;
            _iteratorError9 = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion9 && _iterator9.return) {
                    _iterator9.return();
                }
            } finally {
                if (_didIteratorError9) {
                    throw _iteratorError9;
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
        var _this6 = this;

        if (withSelf) {
            Traversal.levelOrder(this, visitor, context);
        } else {
            Traversal.levelOrder(this, function (node) {
                return !$equals(_this6, node) && visitor.call(context, node);
            }, context);
        }
    }

    function traverseDescendantsReverse(visitor, withSelf, context) {
        var _this7 = this;

        if (withSelf) {
            Traversal.reverseLevelOrder(this, visitor, context);
        } else {
            Traversal.reverseLevelOrder(this, function (node) {
                return !$equals(_this7, node) && visitor.call(context, node);
            }, context);
        }
    }

    function traverseAncestorSiblingOrSelf(visitor, withSelf, withAncestor, context) {
        if (withSelf && visitor.call(context, this)) {
            return;
        }
        var parent = this.parent;
        if (parent) {
            var _iteratorNormalCompletion10 = true;
            var _didIteratorError10 = false;
            var _iteratorError10 = undefined;

            try {
                for (var _iterator10 = parent.children[Symbol.iterator](), _step10; !(_iteratorNormalCompletion10 = (_step10 = _iterator10.next()).done); _iteratorNormalCompletion10 = true) {
                    var sibling = _step10.value;

                    if (!$equals(this, sibling) && visitor.call(context, sibling)) {
                        return;
                    }
                }
            } catch (err) {
                _didIteratorError10 = true;
                _iteratorError10 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion10 && _iterator10.return) {
                        _iterator10.return();
                    }
                } finally {
                    if (_didIteratorError10) {
                        throw _iteratorError10;
                    }
                }
            }

            if (withAncestor) {
                traverseAncestors.call(parent, visitor, true, context);
            }
        }
    }

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
                var ctor = proxyMethod("constructor", this.base, base);
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

            extend: extendProxy
        }, {
            shouldProxy: options.shouldProxy
        });
        proxyClass(proxy, protocols);
        proxy.extend = proxy.implement = throwProxiesSealedExeception;
        return proxy;
    }

    function throwProxiesSealedExeception() {
        throw new TypeError("Proxy classes are sealed and cannot be extended from.");
    }

    function proxyClass(proxy, protocols) {
        var sources = [proxy].concat(protocols),
            proxyProto = proxy.prototype,
            proxied = {};
        for (var i = 0; i < sources.length; ++i) {
            var source = sources[i],
                sourceProto = source.prototype,
                isProtocol = $isProtocol(source);
            for (var key in sourceProto) {
                if (!(key in proxied || key in noProxyMethods) && (!proxy.shouldProxy || proxy.shouldProxy(key, source))) {
                    var descriptor = getPropertyDescriptors(sourceProto, key);
                    if ('value' in descriptor) {
                        var member = isProtocol ? undefined : descriptor.value;
                        if ($isNothing(member) || $isFunction(member)) {
                            proxyProto[key] = proxyMethod(key, member, proxy);
                        }
                        proxied[key] = true;
                    } else if (isProtocol) {
                        var cname = key.charAt(0).toUpperCase() + key.slice(1),
                            get = 'get' + cname,
                            set = 'set' + cname,
                            spec = proxyClass.spec || (proxyClass.spec = {
                            enumerable: true
                        });
                        spec.get = function (get) {
                            var proxyGet = void 0;
                            return function () {
                                if (get in this) {
                                    return this[get].call(this);
                                }
                                if (!proxyGet) {
                                    proxyGet = proxyMethod(get, undefined, proxy);
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
                                    proxySet = proxyMethod(set, undefined, proxy);
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

    function proxyMethod(key, method, source) {
        var interceptors = void 0;
        var spec = proxyMethod.spec || (proxyMethod.spec = {});
        function methodProxy() {
            var _this = this;
            var delegate = this.delegate,
                idx = -1;
            if (!interceptors) {
                interceptors = this.getInterceptors(source, key);
            }
            var invocation = {
                args: Array.from(arguments),
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
                    throw new Error("Interceptor cannot proceed without a class or delegate method '" + key + "'.");
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

    function extendProxy() {
        var proxy = this.constructor,
            clazz = proxy.prototype,
            overrides = arguments.length === 1 ? arguments[0] : {};
        if (arguments.length >= 2) {
            overrides[arguments[0]] = arguments[1];
        }
        for (var methodName in overrides) {
            if (!(methodName in noProxyMethods) && (!proxy.shouldProxy || proxy.shouldProxy(methodName, clazz))) {
                var method = this[methodName];
                if (method && method.baseMethod) {
                    this[methodName] = method.baseMethod;
                }
                this.base(methodName, overrides[methodName]);
                this[methodName] = proxyMethod(methodName, this[methodName], clazz);
            }
        }
        return this;
    }

    return {
        setters: [],
        execute: function () {
            _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
                return typeof obj;
            } : function (obj) {
                return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj;
            };


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

            _export("$eq", $eq = $createModifier());

            _export("$eq", $eq);

            _export("$use", $use = $createModifier());

            _export("$use", $use);

            _export("$copy", $copy = $createModifier());

            _export("$copy", $copy);

            _export("$lazy", $lazy = $createModifier());

            _export("$lazy", $lazy);

            _export("$eval", $eval = $createModifier());

            _export("$eval", $eval);

            _export("$every", $every = $createModifier());

            _export("$every", $every);

            _export("$child", $child = $createModifier());

            _export("$child", $child);

            _export("$optional", $optional = $createModifier());

            _export("$optional", $optional);

            _export("$promise", $promise = $createModifier());

            _export("$promise", $promise);

            _export("$instant", $instant = $createModifier());

            _export("$instant", $instant);

            function Modifier() {}

            _export("Modifier", Modifier);

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

            _export("$createModifier", $createModifier);

            _export("Undefined", Undefined = K());

            _export("Null", Null = K(null));

            _export("True", True = K(true));

            _export("False", False = K(false));

            _export("Undefined", Undefined);

            _export("Null", Null);

            _export("True", True);

            _export("False", False);

            _counter = 1;
            _IGNORE = K();
            _BASE = /\bbase\b/;
            _HIDDEN = ["constructor", "toString"];
            _slice = Array.prototype.slice;

            _subclass = function _subclass(_instance, _static) {
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

            _export("Base", Base = _subclass.call(Object, {
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
            }, _export("Base", Base = {
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
            })));

            _export("Base", Base);

            _export("Package", Package = Base.extend({
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
            }));

            _export("Package", Package);

            _export("Abstract", Abstract = Base.extend({
                constructor: function constructor() {
                    throw new TypeError("Abstract class cannot be instantiated.");
                }
            }));

            _export("Abstract", Abstract);

            _moduleCount = 0;

            _export("Module", Module = Abstract.extend(null, {
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
            }));

            _export("Module", Module);

            Module.prototype.base = Module.prototype.extend = _IGNORE;;;;

            function copy(object) {
                var copy = {};
                for (var i in object) {
                    copy[i] = object[i];
                }
                return copy;
            }
            _export("copy", copy);

            ;

            function pcopy(object) {
                _dummy.prototype = object;
                return new _dummy();
            }
            _export("pcopy", pcopy);

            ;;

            _export("extend", _extend);

            ;;;

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

            _export("getPropertyDescriptors", getPropertyDescriptors);

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
            }
            _export("instanceOf", instanceOf);

            ;

            _toString = Object.prototype.toString;
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
            _export("typeOf", typeOf);

            ;

            function assignID(object, name) {
                if (!name) name = object.nodeType == 1 ? "uniqueID" : "base2ID";
                if (!object[name]) object[name] = "b2_" + _counter++;
                return object[name];
            }
            _export("assignID", assignID);

            ;

            function format(string) {
                var args = arguments;
                var pattern = new RegExp("%([1-" + (arguments.length - 1) + "])", "g");
                return (string + "").replace(pattern, function (match, index) {
                    return args[index];
                });
            }
            _export("format", format);

            ;

            function csv(string) {
                return string ? (string + "").split(/\s*,\s*/) : [];
            }
            _export("csv", csv);

            ;

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
            _export("bind", bind);

            ;

            _export("partial", _partial);

            ;

            function delegate(fn, context) {
                return function () {
                    var args = _slice.call(arguments);
                    args.unshift(this);
                    return fn.apply(context, args);
                };
            }
            _export("delegate", delegate);

            ;;

            Defining = Symbol();

            _export("Enum", Enum = Base.extend({
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
                    return Object.freeze(en);
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
            }));

            _export("Enum", Enum);

            Enum.prototype.valueOf = function () {
                var value = +this.value;
                return isNaN(value) ? this.ordinal : value;
            };

            _export("Flags", Flags = Enum.extend({
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
            }));

            _export("Flags", Flags);

            _export("ArrayManager", ArrayManager = Base.extend({
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
            }));

            _export("ArrayManager", ArrayManager);

            _export("IndexedList", IndexedList = Base.extend({
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
            }));

            _export("IndexedList", IndexedList);

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
            }
            _export("$debounce", $debounce);

            ;

            _export("Metadata", Metadata = Symbol.for('miruken.$meta'));

            _export("Metadata", Metadata);

            ProtocolGet = Symbol();
            ProtocolSet = Symbol();
            ProtocolInvoke = Symbol();
            ProtocolDelegate = Symbol();
            ProtocolStrict = Symbol();

            _export("Protocol", Protocol = Base.extend((_Base$extend = {
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
            }));

            _export("Protocol", Protocol);

            _export("MetaStep", MetaStep = Enum({
                Subclass: 1,

                Implement: 2,

                Extend: 3
            }));

            _export("MetaStep", MetaStep);

            _export("MetaMacro", MetaMacro = Base.extend({
                get active() {
                    return false;
                },

                get inherit() {
                    return false;
                },
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
                }
            }, {
                coerce: function coerce() {
                    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                        args[_key] = arguments[_key];
                    }

                    return Reflect.construct(this, args);
                }
            }));

            _export("MetaMacro", MetaMacro);

            _export("MetaBase", MetaBase = MetaMacro.extend({
                constructor: function constructor(parent) {
                    var _protocols = [],
                        _descriptors = void 0;
                    this.extend({
                        get parent() {
                            return parent;
                        },

                        get protocols() {
                            return _protocols.slice(0);
                        },

                        get allProtocols() {
                            var protocols = this.protocols,
                                inner = protocols.slice(0);
                            for (var i = 0; i < inner.length; ++i) {
                                var innerProtocols = inner[i][Metadata].allProtocols;
                                for (var ii = 0; ii < innerProtocols.length; ++ii) {
                                    var protocol = innerProtocols[ii];
                                    if (protocols.indexOf(protocol) < 0) {
                                        protocols.push(protocol);
                                    }
                                }
                            }
                            return protocols;
                        },
                        addProtocol: function addProtocol() {
                            for (var _len2 = arguments.length, protocols = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
                                protocols[_key2] = arguments[_key2];
                            }

                            var _iteratorNormalCompletion = true;
                            var _didIteratorError = false;
                            var _iteratorError = undefined;

                            try {
                                for (var _iterator = $flatten(protocols, true)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                                    var protocol = _step.value;

                                    if (protocol.prototype instanceof Protocol && _protocols.indexOf(protocol) === -1) {
                                        _protocols.push(protocol);
                                        this.protocolAdded(this, protocol);
                                    }
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
                        },
                        protocolAdded: function protocolAdded(metadata, protocol) {
                            if (parent) {
                                parent.protocolAdded(metadata, protocol);
                            }
                        },
                        conformsTo: function conformsTo(protocol) {
                            return protocol && protocol.prototype instanceof Protocol && _protocols.some(function (p) {
                                return protocol === p || p.conformsTo(protocol);
                            });
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
                                    if (Array.isArray(match)) {
                                        if (!Array.isArray(value)) {
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
                                    return parent && parent[method].apply(parent, arguments);
                                });
                            }
                            return this;
                        }
                    });
                }
            }));

            _export("MetaBase", MetaBase);

            _export("ClassMeta", ClassMeta = MetaBase.extend({
                constructor: function constructor(baseMeta, subClass, protocols, macros) {
                    var _macros = macros && macros.slice(0),
                        _isProtocol = subClass === Protocol || subClass.prototype instanceof Protocol;
                    this.base(baseMeta);
                    this.extend({
                        get type() {
                            return subClass;
                        },
                        isProtocol: function isProtocol() {
                            return _isProtocol;
                        },

                        get allProtocols() {
                            var protocols = this.base();
                            if (!_isProtocol && baseMeta) {
                                var _iteratorNormalCompletion2 = true;
                                var _didIteratorError2 = false;
                                var _iteratorError2 = undefined;

                                try {
                                    for (var _iterator2 = baseMeta.allProtocols[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                                        var protocol = _step2.value;

                                        if (protocols.indexOf(protocol) < 0) {
                                            protocols.push(protocol);
                                        }
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
                            }
                            return protocols;
                        },
                        protocolAdded: function protocolAdded(metadata, protocol) {
                            this.base(metadata, protocol);
                            if (!_macros || _macros.length == 0) {
                                return;
                            }
                            var _iteratorNormalCompletion3 = true;
                            var _didIteratorError3 = false;
                            var _iteratorError3 = undefined;

                            try {
                                for (var _iterator3 = _macros[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                                    var macro = _step3.value;

                                    if ($isFunction(macro.protocolAdded)) {
                                        macro.protocolAdded(metadata, protocol);
                                    }
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
                            var _iteratorNormalCompletion4 = true;
                            var _didIteratorError4 = false;
                            var _iteratorError4 = undefined;

                            try {
                                for (var _iterator4 = _macros[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                                    var macro = _step4.value;

                                    if ($isFunction(macro.inflate) && (!active || macro.active) && macro.inherit) {
                                        macro.inflate(step, metadata, target, definition, expand);
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
                        },
                        execute: function execute(step, metadata, target, definition) {
                            this.base(step, metadata, target, definition);
                            if (!_macros || _macros.length == 0) {
                                return;
                            }
                            var inherit = this !== metadata,
                                active = step !== MetaStep.Subclass;
                            var _iteratorNormalCompletion5 = true;
                            var _didIteratorError5 = false;
                            var _iteratorError5 = undefined;

                            try {
                                for (var _iterator5 = _macros[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                                    var macro = _step5.value;

                                    if ((!active || macro.active) && (!inherit || macro.inherit)) {
                                        macro.execute(step, metadata, target, definition);
                                    }
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
                        },
                        createSubclass: function createSubclass() {
                            for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
                                args[_key3] = arguments[_key3];
                            }

                            var constraints = args,
                                protocols = void 0,
                                mixins = void 0,
                                macros = void 0;
                            if (subClass.prototype instanceof Protocol) {
                                (protocols = []).push(subClass);
                            }
                            if (args.length > 0 && Array.isArray(args[0])) {
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
                                var _iteratorNormalCompletion6 = true;
                                var _didIteratorError6 = false;
                                var _iteratorError6 = undefined;

                                try {
                                    for (var _iterator6 = macros[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                                        var macro = _step6.value;

                                        macro.inflate(MetaStep.Subclass, this, subClass.prototype, instanceDef, expand);
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
                            instanceDef = expand.x || instanceDef;
                            var derived = ClassMeta.baseExtend.call(subClass, instanceDef, staticDef),
                                metadata = new ClassMeta(this, derived, protocols, macros);
                            defineMetadata(derived, metadata);
                            Object.defineProperty(derived.prototype, Metadata, {
                                enumerable: false,
                                configurable: false,
                                get: ClassMeta.createInstanceMeta
                            });
                            derived.conformsTo = metadata.conformsTo.bind(metadata);
                            metadata.execute(MetaStep.Subclass, metadata, derived.prototype, instanceDef);
                            if (mixins) {
                                var _iteratorNormalCompletion7 = true;
                                var _didIteratorError7 = false;
                                var _iteratorError7 = undefined;

                                try {
                                    for (var _iterator7 = mixins[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
                                        var mixin = _step7.value;

                                        derived.implement(mixin);
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
                    defineMetadata(Base, new this(undefined, Base));
                    defineMetadata(Abstract, new this(Base[Metadata], Abstract));
                    Base.extend = Abstract.extend = function () {
                        var _Metadata;

                        return (_Metadata = this[Metadata]).createSubclass.apply(_Metadata, arguments);
                    };
                    Base.implement = Abstract.implement = function () {
                        var _Metadata2;

                        return (_Metadata2 = this[Metadata]).embellishClass.apply(_Metadata2, arguments);
                    };
                    Base.prototype.conformsTo = function (protocol) {
                        return this.constructor[Metadata].conformsTo(protocol);
                    };
                },
                createInstanceMeta: function createInstanceMeta(parent) {
                    var metadata = new InstanceMeta(parent || this.constructor[Metadata]);
                    defineMetadata(this, metadata);
                    return metadata;
                }
            }));

            _export("ClassMeta", ClassMeta);

            _export("InstanceMeta", InstanceMeta = MetaBase.extend({
                constructor: function constructor(classMeta) {
                    this.base(classMeta);
                    this.extend({
                        get type() {
                            return classMeta.type;
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
                        var metadata = this[Metadata];
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
            }));

            _export("InstanceMeta", InstanceMeta);

            Enum.extend = Base.extend;
            Enum.implement = Base.implement;
            defineMetadata(Enum, new ClassMeta(Base[Metadata], Enum));

            _export("$proxyProtocol", $proxyProtocol = MetaMacro.extend({
                get active() {
                    return true;
                },
                get inherit() {
                    return true;
                },
                inflate: function inflate(step, metadata, target, definition, expand) {
                    var expanded = void 0;
                    var props = getPropertyDescriptors(definition);
                    Reflect.ownKeys(props).forEach(function (key) {
                        var member = props[key];
                        if ($isFunction(member.value)) {
                            member.value = function () {
                                for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
                                    args[_key4] = arguments[_key4];
                                }

                                return this[ProtocolInvoke](key, args);
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
                                };
                            }
                        } else {
                            return;
                        }
                        expanded = expanded || expand();
                        Object.defineProperty(expanded, key, member);
                    });
                },
                execute: function execute(step, metadata, target, definition) {
                    if (step === MetaStep.Subclass) {
                        metadata.type.adoptedBy = Protocol.adoptedBy;
                    }
                },
                protocolAdded: function protocolAdded(metadata, protocol) {
                    var _this4 = this;

                    var source = protocol.prototype,
                        target = metadata.type.prototype,
                        protocolProto = Protocol.prototype,
                        props = getPropertyDescriptors(source);
                    Reflect.ownKeys(props).forEach(function (key) {
                        if (getPropertyDescriptors(protocolProto, key) || getPropertyDescriptors(_this4, key)) return;
                        Object.defineProperty(target, key, props[key]);
                    });
                }
            }));

            _export("$proxyProtocol", $proxyProtocol);

            Protocol.extend = Base.extend;
            Protocol.implement = Base.implement;
            defineMetadata(Protocol, new ClassMeta(Base[Metadata], Protocol, null, [new $proxyProtocol()]));

            _export("StrictProtocol", StrictProtocol = Protocol.extend({
                constructor: function constructor(proxy, strict) {
                    this.base(proxy, strict === undefined || strict);
                }
            }));

            _export("StrictProtocol", StrictProtocol);

            GETTER_CONVENTIONS = ['get', 'is'];
            PropertiesTag = Symbol();

            _export("$properties", $properties = MetaMacro.extend({
                constructor: function constructor(tag) {
                    if ($isNothing(tag)) {
                        throw new Error("$properties requires a tag name");
                    }
                    Object.defineProperty(this, PropertiesTag, { value: tag });
                },

                get active() {
                    return true;
                },
                get inherit() {
                    return true;
                },
                execute: function execute(step, metadata, target, definition) {
                    var _this5 = this;

                    var tag = this[PropertiesTag],
                        properties = this.extractProperty(tag, target, definition);
                    if (!properties) return;
                    var expanded = {},
                        source = void 0;
                    var props = getPropertyDescriptors(properties);
                    Reflect.ownKeys(props).forEach(function (key) {
                        source = expanded;
                        var property = properties[key],
                            spec = {
                            configurable: true,
                            enumerable: true
                        };
                        if ($isNothing(property) || $isString(property) || typeOf(property.length) == "number" || typeOf(property) !== 'object') {
                            property = { value: property };
                        }
                        if (getPropertyDescriptors(definition, key)) {
                            source = null;
                        } else if (property.get || property.set) {
                                spec.get = property.get;
                                spec.set = property.set;
                            } else if (target instanceof Protocol) {
                                spec.get = spec.set = Undefined;
                            } else if ("auto" in property) {
                                (function () {
                                    var field = property.auto || Symbol();
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
                        cleanDescriptor(property);
                        _this5.defineProperty(metadata, source, key, spec, property);
                    });
                    if (step == MetaStep.Extend) {
                        target.extend(expanded);
                    } else {
                        metadata.type.implement(expanded);
                    }
                },
                defineProperty: function defineProperty(metadata, target, name, spec, descriptor) {
                    metadata.defineProperty(target, name, spec, descriptor);
                }
            }, {
                init: function init() {
                    Object.defineProperty(this, 'shared', {
                        enumerable: false,
                        configurable: false,
                        writable: false,
                        value: Object.freeze(new this("$properties"))
                    });
                }
            }));

            _export("$properties", $properties);

            _export("$inferProperties", $inferProperties = MetaMacro.extend({
                get active() {
                    return true;
                },
                get inherit() {
                    return true;
                },
                inflate: function inflate(step, metadata, target, definition, expand) {
                    var expanded = void 0;
                    for (var key in definition) {
                        var member = getPropertyDescriptors(definition, key);
                        if (member && $isFunction(member.value)) {
                            var spec = { configurable: true, enumerable: true },
                                name = this.inferProperty(key, member.value, definition, spec);
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
                }
            }));

            _export("$inferProperties", $inferProperties);

            _export("$inheritStatic", $inheritStatic = MetaMacro.extend({
                constructor: function constructor() {
                    var spec = {
                        value: Array.from(arguments)
                    };
                    Object.defineProperty(this, 'members', spec);
                    delete spec.value;
                },

                get inherit() {
                    return true;
                },
                execute: function execute(step, metadata, target) {
                    if (step === MetaStep.Subclass) {
                        var members = this.members,
                            type = metadata.type,
                            ancestor = $ancestorOf(type);
                        if (members.length > 0) {
                            var _iteratorNormalCompletion8 = true;
                            var _didIteratorError8 = false;
                            var _iteratorError8 = undefined;

                            try {
                                for (var _iterator8 = members[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
                                    var member = _step8.value;

                                    if (!(member in type)) {
                                        type[member] = ancestor[member];
                                    }
                                }
                            } catch (err) {
                                _didIteratorError8 = true;
                                _iteratorError8 = err;
                            } finally {
                                try {
                                    if (!_iteratorNormalCompletion8 && _iterator8.return) {
                                        _iterator8.return();
                                    }
                                } finally {
                                    if (_didIteratorError8) {
                                        throw _iteratorError8;
                                    }
                                }
                            }
                        } else if (ancestor !== Base && ancestor !== Object) {
                            for (var key in ancestor) {
                                if (ancestor.hasOwnProperty(key) && !(key in type)) {
                                    type[key] = ancestor[key];
                                }
                            }
                        }
                    }
                }
            }));

            _export("$inheritStatic", $inheritStatic);

            _export("Delegate", Delegate = Base.extend({
                get: function get(protocol, key, strict) {},
                set: function set(protocol, key, value, strict) {},
                invoke: function invoke(protocol, methodName, args, strict) {}
            }));

            _export("Delegate", Delegate);

            _export("ObjectDelegate", ObjectDelegate = Delegate.extend({
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
            }));

            _export("ObjectDelegate", ObjectDelegate);

            _export("ArrayDelegate", ArrayDelegate = Delegate.extend({
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
            }));

            _export("ArrayDelegate", ArrayDelegate);

            function $decorator(decorations) {
                return function (decoratee) {
                    if ($isNothing(decoratee)) {
                        throw new TypeError("No decoratee specified.");
                    }
                    var decorator = Object.create(decoratee);
                    Object.defineProperty(decorator, 'decoratee', { value: decoratee });
                    ClassMeta.createInstanceMeta.call(decorator, decoratee[Metadata]);
                    if (decorations) {
                        decorator.extend(decorations);
                    }
                    return decorator;
                };
            }

            _export("$decorator", $decorator);

            function $decorate(decoratee, decorations) {
                return $decorator(decorations)(decoratee);
            }

            _export("$decorate", $decorate);

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

            _export("$decorated", $decorated);

            _export("$isProtocol", $isProtocol = Protocol.isProtocol);

            _export("$isProtocol", $isProtocol);

            function $isClass(clazz) {
                return clazz && clazz.prototype instanceof Base && !$isProtocol(clazz);
            }

            _export("$isClass", $isClass);

            function $classOf(instance) {
                return instance && instance.constructor;
            }

            _export("$classOf", $classOf);

            function $ancestorOf(clazz) {
                return clazz && clazz.ancestor;
            }

            _export("$ancestorOf", $ancestorOf);

            function $isString(str) {
                return typeOf(str) === 'string';
            }

            _export("$isString", $isString);

            function $isFunction(fn) {
                return fn instanceof Function;
            }

            _export("$isFunction", $isFunction);

            function $isObject(obj) {
                return obj === Object(obj);
            }

            _export("$isObject", $isObject);

            function $isPromise(promise) {
                return promise && $isFunction(promise.then);
            }

            _export("$isPromise", $isPromise);

            function $isNothing(value) {
                return value == null;
            }

            _export("$isNothing", $isNothing);

            function $isSomething(value) {
                return value != null;
            }

            _export("$isSomething", $isSomething);

            function $lift(value) {
                return function () {
                    return value;
                };
            }

            _export("$lift", $lift);

            function $flatten(arr, prune) {
                var _ref;

                if (!Array.isArray(arr)) return arr;
                var items = arr.map(function (item) {
                    return $flatten(item, prune);
                });
                if (prune) items = items.filter($isSomething);
                return (_ref = []).concat.apply(_ref, _toConsumableArray(items));
            }

            _export("$flatten", $flatten);

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

            _export("$equals", $equals);

            _export("Variance", Variance = Enum({
                Covariant: 1,

                Contravariant: 2,

                Invariant: 3
            }));

            _export("Variance", Variance);

            _export("Initializing", Initializing = Protocol.extend({
                initialize: function initialize() {}
            }));

            _export("Initializing", Initializing);

            _export("Resolving", Resolving = Protocol.extend());

            _export("Resolving", Resolving);

            _export("Invoking", Invoking = StrictProtocol.extend({
                invoke: function invoke(fn, dependencies, ctx) {}
            }));

            _export("Invoking", Invoking);

            _export("Parenting", Parenting = Protocol.extend({
                newChild: function newChild() {}
            }));

            _export("Parenting", Parenting);

            _export("Starting", Starting = Protocol.extend({
                start: function start() {}
            }));

            _export("Starting", Starting);

            _export("Startup", Startup = Base.extend(Starting, {
                start: function start() {}
            }));

            _export("Startup", Startup);

            _export("Disposing", Disposing = Protocol.extend({
                dispose: function dispose() {}
            }));

            _export("Disposing", Disposing);

            _export("DisposingMixin", DisposingMixin = Module.extend({
                dispose: function dispose(object) {
                    if ($isFunction(object._dispose)) {
                        var result = object._dispose();
                        object.dispose = Undefined;
                        return result;
                    }
                }
            }));

            _export("DisposingMixin", DisposingMixin);

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

            _export("$using", $using);

            _export("TraversingAxis", TraversingAxis = Enum({
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
            }));

            _export("TraversingAxis", TraversingAxis);

            _export("Traversing", Traversing = Protocol.extend({
                traverse: function traverse(axis, visitor, context) {}
            }));

            _export("Traversing", Traversing);

            _export("TraversingMixin", TraversingMixin = Module.extend({
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
                            throw new Error("Unrecognized TraversingAxis " + axis + ".");
                    }
                }
            }));

            _export("TraversingMixin", TraversingMixin);

            _export("Traversal", Traversal = Abstract.extend({}, {
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
            }));

            _export("Traversal", Traversal);

            _export("Facet", Facet = Object.freeze({
                Parameters: 'parameters',

                Interceptors: 'interceptors',

                InterceptorSelectors: 'interceptorSelectors',

                Delegate: 'delegate'
            }));

            _export("Facet", Facet);

            _export("Interceptor", Interceptor = Base.extend({
                intercept: function intercept(invocation) {
                    return invocation.proceed();
                }
            }));

            _export("Interceptor", Interceptor);

            _export("InterceptorSelector", InterceptorSelector = Base.extend({
                selectInterceptors: function selectInterceptors(type, method, interceptors) {
                    return interceptors;
                }
            }));

            _export("InterceptorSelector", InterceptorSelector);

            _export("ProxyBuilder", ProxyBuilder = Base.extend({
                buildProxy: function buildProxy(types, options) {
                    if (!Array.isArray(types)) {
                        throw new TypeError("ProxyBuilder requires an array of types to proxy.");
                    }
                    var classes = types.filter($isClass),
                        protocols = types.filter($isProtocol);
                    return _buildProxy(classes, protocols, options || {});
                }
            }));

            _export("ProxyBuilder", ProxyBuilder);

            noProxyMethods = {
                base: true, extend: true, constructor: true, conformsTo: true,
                getInterceptors: true, getDelegate: true, setDelegate: true
            };
        }
    };
});