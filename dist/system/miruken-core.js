"use strict";

System.register(["reflect-metadata"], function (_export, _context) {
    "use strict";

    var _Base$extend, _typeof, $eq, $use, $lazy, $eval, $every, $child, $optional, $promise, $instant, Undefined, Null, True, False, __prototyping, _counter, _IGNORE, _BASE, _HIDDEN, _slice, _subclass, Base, Package, Abstract, _moduleCount, Module, _toString, Delegate, ObjectDelegate, ArrayDelegate, Defining, Enum, Flags, ArrayManager, IndexedList, Metadata, injectMetadataKey, ProtocolGet, ProtocolSet, ProtocolInvoke, ProtocolDelegate, ProtocolStrict, ProtocolsMetadataKey, Protocol, StrictProtocol, $isProtocol, baseExtend, baseImplement, baseProtoExtend, emptyArray, nothing, MethodType, Variance, Initializing, Resolving, Invoking, Parenting, Starting, Startup, Disposing, DisposingMixin, TraversingAxis, Traversing, TraversingMixin, Traversal, Facet, Interceptor, InterceptorSelector, ProxyBuilder, noProxyMethods;

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

    function _copy(target, key, descriptor) {
        var get = descriptor.get;
        var set = descriptor.set;
        var value = descriptor.value;
        var initializer = descriptor.initializer;

        if ($isFunction(value)) {
            descriptor.value = function () {
                return _copyOf(value.apply(this, arguments));
            };
        }
        if ($isFunction(initializer)) {
            descriptor.initializer = function () {
                return _copyOf(initializer.apply(this));
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

    function defaultOrder(a, b) {
        return a < b;
    }

    function _inject(target, key, descriptor, dependencies) {
        if (!descriptor) {
            dependencies = key;
            target = target.prototype;
            key = "constructor";
        }
        dependencies = $flatten(dependencies);
        if (dependencies.length > 0) {
            Metadata.define(injectMetadataKey, dependencies, target, key);
        }
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
                    for (var _len5 = arguments.length, args = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
                        args[_key5] = arguments[_key5];
                    }

                    return this[ProtocolInvoke](key, args);
                };
            } else {
                var isSimple = descriptor.hasOwnProperty("value") || descriptor.hasOwnProperty("initializer");
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
            Object.defineProperty(target, key, descriptor);
        });
    }

    function isUpperCase(char) {
        return char.toUpperCase() === char;
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
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = this.children[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var child = _step.value;

                if (visitor.call(context, child)) {
                    return;
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
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = parent.children[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var sibling = _step2.value;

                    if (!$equals(this, sibling) && visitor.call(context, sibling)) {
                        return;
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
            proxy = base.extend.apply(base, _toConsumableArray(classes.concat(protocols)).concat([{
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

    function proxyClass(proxy, protocols) {
        var sources = [proxy].concat($protocols(proxy), protocols),
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
                    if (descriptor.hasOwnProperty("value")) {
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
            for (var _len8 = arguments.length, args = Array(_len8), _key8 = 0; _key8 < _len8; _key8++) {
                args[_key8] = arguments[_key8];
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
                    throw new Error("Interceptor cannot proceed without a class or delegate method '" + key + "'.");
                }
            };
            return invocation.proceed();
        }
        methodProxy.baseMethod = method;
        return methodProxy;
    }

    function extendProxyInstance(key, value) {
        var _this8 = this;

        var proxy = this.constructor,
            overrides = arguments.length === 1 ? key : _defineProperty({}, key, value),
            props = getPropertyDescriptors(overrides);
        Reflect.ownKeys(props).forEach(function (key) {
            var descriptor = props[key];
            if (!descriptor.enumerable) return;
            var value = descriptor.value;
            var get = descriptor.get;
            var set = descriptor.set;
            var baseDescriptor = getPropertyDescriptors(_this8, key);
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
            Object.defineProperty(_this8, key, baseDescriptor);
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
            Object.defineProperty(_this8, key, descriptor);
        });
        return this;
    }
    return {
        setters: [function (_reflectMetadata) {}],
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

            function decorate(decorator, args) {
                if (isDescriptor(args[args.length - 1])) {
                    return decorator.apply(undefined, _toConsumableArray(args).concat([[]]));
                }
                return function () {
                    return decorator.apply(undefined, Array.prototype.slice.call(arguments).concat([args]));
                };
            }

            _export("decorate", decorate);

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

            _export("isDescriptor", isDescriptor);

            _export("default", decorate);

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
                _class.prototype = _prototype;
                if (_class.init) _class.init();

                return _class;
            };

            _export("Base", Base = _subclass.call(Object, {
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

            Base.base = Base.prototype.base = function () {};

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
                if (!object.hasOwnProperty(name)) object[name] = "b2_" + _counter++;
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

            function copy() {
                for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                    args[_key] = arguments[_key];
                }

                return decorate(_copy, args);
            }
            _export("copy", copy);

            _export("default", copy);

            _export("Delegate", Delegate = Base.extend({
                get: function get(protocol, key, strict) {},
                set: function set(protocol, key, value, strict) {},
                invoke: function invoke(protocol, methodName, args, strict) {}
            }));

            _export("Delegate", Delegate);

            _export("ObjectDelegate", ObjectDelegate = Delegate.extend({
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
            }));

            _export("ObjectDelegate", ObjectDelegate);

            _export("ArrayDelegate", ArrayDelegate = Delegate.extend({
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
            }));

            _export("ArrayDelegate", ArrayDelegate);

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

            _export("default", Enum);

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
                constructor: function constructor() {
                    var order = arguments.length <= 0 || arguments[0] === undefined ? defaultOrder : arguments[0];

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
            }));

            _export("IndexedList", IndexedList);

            function $isString(str) {
                return typeOf(str) === "string";
            }

            _export("$isString", $isString);

            function $isSymbol(str) {
                return Object(str) instanceof Symbol;
            }

            _export("$isSymbol", $isSymbol);

            function $isFunction(fn) {
                return fn instanceof Function;
            }

            _export("$isFunction", $isFunction);

            function $isObject(obj) {
                return typeOf(obj) === "object";
            }

            _export("$isObject", $isObject);

            function $isPlainObject(obj) {
                return !!(obj && obj.constructor === Object);
            }

            _export("$isPlainObject", $isPlainObject);

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

            _export("$decorator", $decorator);

            function $decorate(decoratee, decorations) {
                return $decorator(decorations)(decoratee);
            }

            _export("$decorate", $decorate);

            function $decorated(decorator, deepest) {
                var decoratee = void 0;
                while (decorator && (decoratee = decorator.decoratee)) {
                    if (!deepest) return decoratee;
                    decorator = decoratee;
                }
                return decorator;
            }

            _export("$decorated", $decorated);

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
                if (obj1 && $isFunction(obj1.equals)) {
                    return obj1.equals(obj2);
                } else if (obj2 && $isFunction(obj2.equals)) {
                    return obj2.equals(obj1);
                }
                return false;
            }

            _export("$equals", $equals);

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

            _export("Metadata", Metadata = Base.extend(null, {
                get: function get(metadataKey, target, targetKey) {
                    return target && Reflect.getMetadata(metadataKey, target, targetKey);
                },
                getOwn: function getOwn(metadataKey, target, targetKey) {
                    return target && Reflect.getOwnMetadata(metadataKey, target, targetKey);
                },
                getOrCreateOwn: function getOrCreateOwn(metadataKey, target, targetKey, creator) {
                    if (arguments.length === 3) {
                        creator = targetKey;
                        targetKey = undefined;
                    }
                    if (!$isFunction(creator)) {
                        throw new TypeError("creator must be a function");
                    }
                    var metadata = Reflect.getOwnMetadata(metadataKey, target, targetKey);
                    if (metadata === undefined) {
                        metadata = creator(metadataKey, target, targetKey);
                        Reflect.defineMetadata(metadataKey, metadata, target, targetKey);
                    }
                    return metadata;
                },
                define: function define(metadataKey, metadata, target, targetKey) {
                    Reflect.defineMetadata(metadataKey, metadata, target, targetKey);
                },
                remove: function remove(metadataKey, target, targetKey) {
                    Reflect.deleteMetadata(metadataKey, target, targetKey);
                },
                copyOwn: function copyOwn(target, source) {
                    var _this2 = this;

                    this.copyOwnKey(target, source);
                    Reflect.ownKeys(source).forEach(function (sourceKey) {
                        return _this2.copyOwnKey(target, source, sourceKey);
                    });
                },
                copyOwnKey: function copyOwnKey(target, source, sourceKey) {
                    var metadataKeys = Reflect.getOwnMetadataKeys(source, sourceKey);
                    metadataKeys.forEach(function (metadataKey) {
                        var metadata = Reflect.getOwnMetadata(metadataKey, source, sourceKey);
                        Reflect.defineMetadata(metadataKey, metadata, target, sourceKey);
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
                    var metadataKeys = Reflect.getOwnMetadataKeys(source, sourceKey);
                    metadataKeys.forEach(function (metadataKey) {
                        var targetMetadata = Reflect.getOwnMetadata(metadataKey, target, sourceKey),
                            sourceMetadata = Reflect.getOwnMetadata(metadataKey, source, sourceKey);
                        if (targetMetadata && targetMetadata.merge) {
                            targetMetadata.merge(sourceMetadata);x;
                        } else {
                            Reflect.defineMetadata(metadataKey, sourceMetadata, target, sourceKey);
                        }
                    });
                },
                match: function match(metadataKey, target, targetKey, matcher) {
                    if (arguments.length === 3) {
                        matcher = targetKey;
                        targetKey = undefined;
                    }
                    if (!$isFunction(matcher)) {
                        throw new TypeError("matcher must be a function");
                    }
                    while (target) {
                        var metadata = Reflect.getOwnMetadata(metadataKey, target, targetKey);
                        if (metadata && matcher(metadata, metadataKey, target, targetKey)) {
                            return true;
                        }
                        target = Object.getPrototypeOf(target);
                    }
                    return false;
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
                        var metadata = Reflect.getOwnMetadata(metadataKey, target, targetKey);
                        if (metadata && collector(metadata, metadataKey, target, targetKey)) {
                            return;
                        }
                        target = Object.getPrototypeOf(target);
                    }
                },
                getter: function getter(metadataKey, own) {
                    return function (target, targetKey, callback) {
                        if (!callback && $isFunction(targetKey)) {
                            var _ref2 = [null, targetKey];
                            targetKey = _ref2[0];
                            callback = _ref2[1];
                        }
                        if (!$isFunction(callback)) return;
                        var targetKeys = targetKey ? [targetKey] : Reflect.ownKeys(own ? target : getPropertyDescriptors(target)).concat("constructor");
                        targetKeys.forEach(function (key) {
                            var metadata = own ? Reflect.getOwnMetadata(metadataKey, target, key) : Reflect.getMetadata(metadataKey, target, key);
                            if (metadata) {
                                callback(metadata, key);
                            }
                        });
                    };
                }
            }));

            _export("Metadata", Metadata);

            _export("default", Metadata);

            injectMetadataKey = Symbol();
            function inject() {
                for (var _len2 = arguments.length, dependencies = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
                    dependencies[_key2] = arguments[_key2];
                }

                return decorate(_inject, dependencies);
            }

            _export("inject", inject);

            inject.getOwn = Metadata.getter(injectMetadataKey, true);
            inject.get = Metadata.getter(injectMetadataKey);
            _export("default", inject);

            ProtocolGet = Symbol();
            ProtocolSet = Symbol();
            ProtocolInvoke = Symbol();
            ProtocolDelegate = Symbol();
            ProtocolStrict = Symbol();
            ProtocolsMetadataKey = Symbol();

            _export("Protocol", Protocol = Base.extend((_Base$extend = {
                constructor: function constructor(delegate, strict) {
                    var _Object$definePropert;

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
                isAdoptedBy: function isAdoptedBy(target) {
                    var _this4 = this;

                    if (!target) return false;
                    if (this === target || target && target.prototype instanceof this) {
                        return true;
                    }
                    var metaTarget = $isFunction(target) ? target.prototype : target;
                    return Metadata.match(ProtocolsMetadataKey, metaTarget, function (protocols) {
                        return protocols.has(_this4) || [].concat(_toConsumableArray(protocols)).some(function (p) {
                            return _this4.isAdoptedBy(p);
                        });
                    });
                },
                adoptBy: function adoptBy(target) {
                    var _this5 = this;

                    if (!target) return;
                    var metaTarget = $isFunction(target) ? target.prototype : target;
                    if (Metadata.match(ProtocolsMetadataKey, metaTarget, function (p) {
                        return p.has(_this5);
                    })) {
                        return false;
                    }
                    var protocols = Metadata.getOrCreateOwn(ProtocolsMetadataKey, metaTarget, function () {
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
            }));

            _export("Protocol", Protocol);

            _export("StrictProtocol", StrictProtocol = Protocol.extend({
                constructor: function constructor(proxy, strict) {
                    this.base(proxy, strict === undefined || strict);
                }
            }));

            _export("StrictProtocol", StrictProtocol);

            _export("$isProtocol", $isProtocol = Protocol.isProtocol);

            _export("$isProtocol", $isProtocol);

            function $protocols(target, own) {
                if (!target) return [];
                if ($isFunction(target)) {
                    target = target.prototype;
                }
                var protocols = !own ? new Set() : Metadata.getOwn(ProtocolsMetadataKey, target);
                if (!own) {
                    (function () {
                        var add = protocols.add.bind(protocols);
                        Metadata.collect(ProtocolsMetadataKey, target, function (ps) {
                            return ps.forEach(function (p) {
                                return [p].concat(_toConsumableArray($protocols(p))).forEach(add);
                            });
                        });
                    })();
                }
                return protocols && [].concat(_toConsumableArray(protocols)) || [];
            }

            _export("$protocols", $protocols);

            function protocol() {
                for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
                    args[_key3] = arguments[_key3];
                }

                if (args.length === 0) {
                    return function () {
                        return _protocol.apply(null, arguments);
                    };
                }
                return _protocol.apply(undefined, args);
            }

            _export("protocol", protocol);

            function conformsTo() {
                for (var _len4 = arguments.length, protocols = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
                    protocols[_key4] = arguments[_key4];
                }

                protocols = $flatten(protocols, true);
                if (!protocols.every($isProtocol)) {
                    throw new TypeError("Only Protocols can be conformed to");
                }
                return protocols.length === 0 ? Undefined : adopt;
                function adopt(target) {
                    protocols.forEach(function (protocol) {
                        return protocol.adoptBy(target);
                    });
                }
            }
            _export("conformsTo", conformsTo);

            _export("default", Protocol);

            baseExtend = Base.extend;
            baseImplement = Base.implement;
            baseProtoExtend = Base.prototype.extend;

            _export("emptyArray", emptyArray = Object.freeze([]));

            _export("nothing", nothing = undefined);

            _export("emptyArray", emptyArray);

            _export("nothing", nothing);

            _export("MethodType", MethodType = Enum({
                Get: 1,

                Set: 2,

                Invoke: 3
            }));

            _export("MethodType", MethodType);

            _export("Variance", Variance = Enum({
                Covariant: 1,

                Contravariant: 2,

                Invariant: 3
            }));

            _export("Variance", Variance);

            Base.extend = function () {
                for (var _len6 = arguments.length, args = Array(_len6), _key6 = 0; _key6 < _len6; _key6++) {
                    args[_key6] = arguments[_key6];
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
                    decorators.forEach(function (d) {
                        return derived = d(derived) || derived;
                    });
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

            function mixin() {
                for (var _len7 = arguments.length, behaviors = Array(_len7), _key7 = 0; _key7 < _len7; _key7++) {
                    behaviors[_key7] = arguments[_key7];
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

            _export("mixin", mixin);

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

            function $isClass(target) {
                if (!target || $isProtocol(target)) return false;
                if (target.prototype instanceof Base) return true;
                var name = target.name;
                return name && $isFunction(target) && isUpperCase(name.charAt(0));
            }

            _export("$isClass", $isClass);

            function $classOf(instance) {
                return instance && instance.constructor;
            }
            _export("$classOf", $classOf);

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
                Parameters: "parameters",

                Interceptors: "interceptors",

                InterceptorSelectors: "interceptorSelectors",

                Delegate: "delegate"
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