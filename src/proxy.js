import { Base, getPropertyDescriptors } from './base2';

import {
    $isFunction, $isClass, $isProtocol, $isNothing
} from './meta';

/**
 * Facet choices for proxies.
 * @class Facet
 */
export const Facet = Object.freeze({
    /**
     * @property {string} Parameters
     */
    Parameters: 'parameters',
    /**
     * @property {string} Interceptors
     */        
    Interceptors: 'interceptors',
    /**
     * @property {string} InterceptorSelectors
     */                
    InterceptorSelectors: 'interceptorSelectors',
    /**
     * @property {string} Delegate
     */                        
    Delegate: 'delegate'
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
    intercept(invocation) {
        return invocation.proceed();
    }
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
          proxy = base.extend(classes.concat(protocols), {
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
                return selectors 
                    ? selectors.reduce((interceptors, selector) =>
                         selector.selectInterceptors(source, method, interceptors)
                    , this.interceptors)
                : this.interceptors;
            },
            extend: extendProxy
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

function proxyClass(proxy, protocols) {
    const sources    = [proxy].concat(protocols),
          proxyProto = proxy.prototype,
          proxied    = {};
    for (let i = 0; i < sources.length; ++i) {
        const source      = sources[i],
              sourceProto = source.prototype,
              isProtocol  = $isProtocol(source);
        for (let key in sourceProto) {
            if (!((key in proxied) || (key in noProxyMethods))
                && (!proxy.shouldProxy || proxy.shouldProxy(key, source))) {
                const descriptor = getPropertyDescriptors(sourceProto, key);
                if ('value' in descriptor) {
                    const member = isProtocol ? undefined : descriptor.value;
                    if ($isNothing(member) || $isFunction(member)) {
                        proxyProto[key] = proxyMethod(key, member, proxy);
                    }
                    proxied[key] = true;
                } else if (isProtocol) {
                    const cname = key.charAt(0).toUpperCase() + key.slice(1),
                          get   = 'get' + cname,
                          set   = 'set' + cname,
                          spec  = proxyClass.spec || (proxyClass.spec = {
                              enumerable: true
                          });
                    spec.get = function (get) {
                        let proxyGet;
                        return function () {
                            if (get in this) {
                                return (this[get]).call(this);
                            }
                            if (!proxyGet) {
                                proxyGet = proxyMethod(get, undefined, proxy);
                            }
                            return proxyGet.call(this);
                        }
                    }(get);
                    spec.set = function (set) {
                        let proxySet;
                        return function (value) {
                            if (set in this) {
                                return (this[set]).call(this, value);
                            }
                            if (!proxySet) {
                                proxySet = proxyMethod(set, undefined, proxy);
                            }
                            return proxySet.call(this, value);
                        }
                    }(set);
                    Object.defineProperty(proxy.prototype, key, spec);
                    proxied[key] = true;
                }
            }
        }
    }
}

function proxyMethod(key, method, source) {
    let interceptors;    
    const spec = proxyMethod.spec || (proxyMethod.spec = {});
    function methodProxy() {
        const _this    = this;
        let   delegate = this.delegate,
              idx      = -1;
        if (!interceptors) {
            interceptors = this.getInterceptors(source, key);
        }
        const invocation = {
            args: Array.from(arguments),
            useDelegate(value) {
                delegate = value;
            },
            replaceDelegate(value) {
                _this.delegate = delegate = value;
            },
            proceed() {
                ++idx;
                if (interceptors && idx < interceptors.length) {
                    const interceptor = interceptors[idx];
                    return interceptor.intercept(invocation);
                }
                if (delegate) {
                    const delegateMethod = delegate[key];
                    if ($isFunction(delegateMethod)) {
                        return delegateMethod.apply(delegate, this.args);
                    }
                } else if (method) {
                    return method.apply(_this, this.args);
                }
                throw new Error(`Interceptor cannot proceed without a class or delegate method '${key}'.`);
            }
        };
        spec.value = key;
        Object.defineProperty(invocation, 'method', spec);
        spec.value = source;
        Object.defineProperty(invocation, 'source', spec);
        delete spec.value;
        spec.get = function () {
            if (interceptors && (idx + 1 < interceptors.length)) {
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
    const proxy     = this.constructor,
          clazz     = proxy.prototype,
          overrides = (arguments.length === 1) ? arguments[0] : {};
    if (arguments.length >= 2) {
        overrides[arguments[0]] = arguments[1];
    }
    for (let methodName in overrides) {
        if (!(methodName in noProxyMethods) && 
            (!proxy.shouldProxy || proxy.shouldProxy(methodName, clazz))) {
            const method = this[methodName];
            if (method && method.baseMethod) {
                this[methodName] = method.baseMethod;
            }
            this.base(methodName, overrides[methodName]);
            this[methodName] = proxyMethod(methodName, this[methodName], clazz);
        }
    }
    return this;
}

const noProxyMethods = {
    base: true, extend: true, constructor: true, conformsTo: true,
    getInterceptors: true, getDelegate: true, setDelegate: true
};
