import { Base, getPropertyDescriptors } from "./base2";
import { $isProtocol,$protocols } from "./protocol";
import { MethodType, $isClass } from "./core";
import { $isFunction } from "./util";
import Enum from "./enum";

/**
 * Facet choices for proxies.
 * @class Facet
 */
export const Facet = Object.freeze({
    /**
     * @property {string} Parameters
     */
    Parameters: "parameters",
    /**
     * @property {string} Interceptors
     */        
    Interceptors: "interceptors",
    /**
     * @property {string} InterceptorSelectors
     */                
    InterceptorSelectors: "interceptorSelectors",
    /**
     * @property {string} Delegate
     */                        
    Delegate: "delegate"
});

/**
 * Base class for method interception.
 * @class Interceptor
 * @extends Base
 */
export const Interceptor = Base.extend({
    /**
     * @method intercept
     * @param    {Object} invocation  - invocation
     * @returns  {Any} invocation result
     */
    intercept(invocation) { return invocation.proceed(); }
});

/**
 * Responsible for selecting which interceptors to apply to a method.
 * @class InterceptorSelector
 * @extends Base
 */
export const InterceptorSelector = Base.extend({
    /**
     * Selects `interceptors` to apply to `method`.
     * @method selectInterceptors
     * @param    {Type}    type         - intercepted type
     * @param    {string}  method       - intercepted method name
     * @param    {Array}   interceptors - available interceptors
     * @returns  {Array} interceptors to apply to method.
     */
    selectInterceptors(type, method, interceptors) {
        return interceptors;
    }
});

/**
 * Builds proxy classes for interception.
 * @class ProxyBuilder
 * @extends Base
 */
export const ProxyBuilder = Base.extend({
    /**
     * Builds a proxy class for the supplied types.
     * @method buildProxy
     * @param    {Array}     ...types  -  classes and protocols
     * @param    {Object}    options   -  literal options
     * @returns  {Function}  proxy class.
     */
    buildProxy(types, options) {
        if (!Array.isArray(types)) {
            throw new TypeError("ProxyBuilder requires an array of types to proxy.");
        }
        const classes   = types.filter($isClass),
              protocols = types.filter($isProtocol);
        return buildProxy(classes, protocols, options || {});
    }
});

function buildProxy(classes, protocols, options) {
    const base  = options.baseType || classes.shift() || Base,
          proxy = base.extend(...classes.concat(protocols), {
            constructor(facets) {
                const spec = {};
                spec.value = facets[Facet.InterceptorSelectors]
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
                const ctor = proxyMethod("constructor", this.base, base);
                ctor.apply(this, facets[Facet.Parameters]);
                delete spec.writable;
                delete spec.value;
            },
            getInterceptors(source, method) {
                const selectors = this.selectors;
                return selectors ? selectors.reduce((interceptors, selector) =>
                           selector.selectInterceptors(source, method, interceptors),
                           this.interceptors)
                     : this.interceptors;
            },
            extend: extendProxyInstance
        }, {
            shouldProxy: options.shouldProxy
        });
    proxyClass(proxy, protocols);
    proxy.extend = proxy.implement = throwProxiesSealedExeception;
    return proxy;
}

function throwProxiesSealedExeception()
{
    throw new TypeError("Proxy classes are sealed and cannot be extended from.");
}

const noProxyMethods = {
    base: true, extend: true, constructor: true, conformsTo: true,
    getInterceptors: true, getDelegate: true, setDelegate: true
};

function proxyClass(proxy, protocols) {
    const sources = [proxy].concat($protocols(proxy), protocols),
          proxied = {};
    for (let i = 0; i < sources.length; ++i) {
        const source     = sources[i],
              isProtocol = $isProtocol(source),
              props      = getPropertyDescriptors(source.prototype);
        Reflect.ownKeys(props).forEach(key => {
            if (proxied.hasOwnProperty(key) || (key in noProxyMethods)) return;
            if (proxy.shouldProxy && !proxy.shouldProxy(key, source)) return;
            const descriptor = props[key];
            if (!descriptor.enumerable) return;
            let { value, get, set } = descriptor;
            if ($isFunction(value)) {
                if (isProtocol) value = null;
                descriptor.value = proxyMethod(key, value, proxy);
            } else {
                if (descriptor.hasOwnProperty("value")) {
                    const field = Symbol();
                    get = function () { return this[field]; },
                    set = function (value) { this[field] = value; };
                    delete descriptor.value;
                    delete descriptor.writable;
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
    }
}

function proxyMethod(key, method, source, type) {
    let interceptors;    
    function methodProxy(...args) {
        const _this    = this;
        let   delegate = this.delegate,
              idx      = -1;
        if (!interceptors) {
            interceptors = this.getInterceptors(source, key);
        }
        type = type || MethodType.Invoke;
        const invocation = {
            method:     key,
            methodType: type,            
            source:     source,
            args:       args,
            useDelegate(value) { delegate = value; },
            replaceDelegate(value) {
                _this.delegate = delegate = value;
            },
            get canProceed() {
                if (interceptors && (idx + 1 < interceptors.length)) {
                    return true;
                }
                if (delegate) {
                    return $isFunction(delegate[key]);
                }
                return !!method;
            },
            proceed() {
                ++idx;
                if (interceptors && idx < interceptors.length) {
                    const interceptor = interceptors[idx];
                    return interceptor.intercept(invocation);
                }
                if (delegate) {
                    switch(type) {
                    case MethodType.Get:
                        return delegate[key];
                    case MethodType.Set:
                        delegate[key] = args[0];
                        break;
                    case MethodType.Invoke:
                        const invoke = delegate[key];
                        if ($isFunction(invoke)) {
                            return invoke.apply(delegate, this.args);
                        }
                        break;
                    }
                } else if (method) {
                    return method.apply(_this, this.args);
                }
                throw new Error(`Interceptor cannot proceed without a class or delegate method '${key}'.`);
            }
        };
        return invocation.proceed();
    }
    methodProxy.baseMethod = method;
    return methodProxy;
}

function extendProxyInstance(key, value) {
    const proxy     = this.constructor,
          overrides = arguments.length === 1
                    ? key : { [key]: value },
          props     = getPropertyDescriptors(overrides);
    Reflect.ownKeys(props).forEach(key => {
        const descriptor = props[key];        
        if (!descriptor.enumerable) return;
        let { value, get, set } = descriptor,
            baseDescriptor = getPropertyDescriptors(this, key);
        if (!baseDescriptor) return;
        if (value) {
            if ($isFunction(value)) {
                const baseValue = baseDescriptor.value;
                if ($isFunction(value) && value.baseMethod) {
                    baseDescriptor.value = value.baseMethod;
                }
            }
        } else if (get) {
            const baseGet = baseDescriptor.get;
            if (baseGet && get.baseMethod) {
                baseDescriptor.get = get.baseMethod;
            }
        } else if (set) {
            const baseSet = baseDescriptor.set;
            if (baseSet && set.baseMethod) {
                baseDescriptor.set = set.baseMethod;
            }            
        }
        Object.defineProperty(this, key, baseDescriptor);
    });
    this.base(overrides);
    Reflect.ownKeys(props).forEach(key => {
        if (key in noProxyMethods) return;
        if (proxy.shouldProxy && !proxy.shouldProxy(key, proxy)) return;
        const descriptor = props[key];
        if (!descriptor.enumerable) return;
        let { value, get, set } = descriptor;        
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
        Object.defineProperty(this, key, descriptor);
    });
    return this;
}
