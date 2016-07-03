import {
    Base, Module, Undefined
} from './base2';

import {
    Protocol, $isFunction, $isPromise
} from './meta';

/**
 * Protocol for targets that manage disposal lifecycle.
 * @class Disposing
 * @extends miruken.Protocol
 */
export const Disposing = Protocol.extend({
    /**
     * Releases any resources managed by the receiver.
     * @method dispose
     */
    dispose() {}
});

/**
 * Mixin for {{#crossLink "miruken.Disposing"}}{{/crossLink}} implementation.
 * @class DisposingMixin
 * @uses miruken.Disposing
 * @extends Module
 */
export const DisposingMixin = Module.extend({
    dispose(object) {
        if ($isFunction(object._dispose)) {
            const result = object._dispose();
            object.dispose = Undefined;  // dispose once
            return result;
        }
    }
});

/**
 * Convenience function for disposing resources.
 * @for miruken.$
 * @method $using
 * @param    {miruken.Disposing}   disposing  - object to dispose
 * @param    {Function | Promise}  action     - block or Promise
 * @param    {Object}              [context]  - block context
 * @returns  {Any} result of executing the action in context.
 */
export function $using(disposing, action, context) {
    if (disposing && $isFunction(disposing.dispose)) {
        if (!$isPromise(action)) {
            let result;
            try {
                result = $isFunction(action)
                    ? action.call(context, disposing)
                    : action;
                if (!$isPromise(result)) {
                    return result;
                }
            } finally {
                if ($isPromise(result)) {
                    action = result;
                } else {
                    const dresult = disposing.dispose();
                    if (dresult !== undefined) {
                        return dresult;
                    }
                }
            }
        }
        return action.then(function (res) {
            const dres = disposing.dispose();
            return dres !== undefined ? dres : res;
        }, function (err) {
            const dres = disposing.dispose();
            return dres !== undefined ? dres : Promise.reject(err);
        });
    }
}