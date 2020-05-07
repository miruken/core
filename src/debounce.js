import { $isFunction } from "./base2";
import { decorate } from "./decorate";

/**
 * Throttles `fn` over a time period.
 * @method $debounce
 * @param    {Function} fn                  -  function to throttle
 * @param    {int}      wait                -  time (ms) to throttle func
 * @param    {boolean}  immediate           -  if true, trigger func early
 * @param    {Any}      defaultReturnValue  -  value to return when throttled
 * @returns  {Function} throttled function
 */
export function $debounce(fn, wait, immediate, defaultReturnValue) {
    let timeout;
    return function () {
        const context = this, args = arguments;
        const later   = function () {
            timeout = null;
            if (!immediate) {
                return fn.apply(context, args);
            }
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) {
            return fn.apply(context, args);
        }
        return defaultReturnValue;
    };
};

/**
 * Applies debouncing on functions.
 * @method debounce
 */
export function debounce(...args) {
    return decorate(_debounce, args);
}

function _debounce(target, key, descriptor,
                   [wait, immediate, defaultReturnValue]) {
    const { set, value } = descriptor;
    if ($isFunction(value)) {
        descriptor.value = $debounce(value, wait, immediate, defaultReturnValue);
    } else if ($isFunction(set)) {
        descriptor.set = $debounce(set, wait, immediate, defaultReturnValue);
    } else {
        throw new SyntaxError("@debounce can only be applied to methods and property setters");
    }
}
