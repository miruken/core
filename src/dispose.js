import { 
    Base, Module, Undefined,
    $isFunction, $isPromise
} from "./base2";

import { Protocol, conformsTo } from "./protocol";
import { $isClass } from "./core";

/**
 * Protocol for targets that manage disposal lifecycle.
 * @class Disposing
 * @extends Protocol
 */
export const Disposing = Protocol.extend({
    /**
     * Releases any resources managed by the receiver.
     * @method dispose
     */
    dispose() {}
});

/**
 * Mixin for {{#crossLink "Disposing"}}{{/crossLink}} implementation.
 * @class DisposingMixin
 * @uses Disposing
 * @extends Module
 */
export const DisposingMixin = Module.extend({
    dispose(object) {
        const dispose = object._dispose;
        if ($isFunction(dispose)) {
            object.dispose = Undefined;  // dispose once                
            return dispose.call(object);
        }        
    }
}, {
    coerce(target) {
        // Behave as class decorator
        if (arguments.length == 1 && $isClass(target)) {
            Disposing.adoptBy(target);
            return target.implement(DisposingMixin);
        }
    }
});

export const disposableMixin = Base => 
    @conformsTo(Disposing) class extends Base {
        dispose() {
            const dispose = this._dispose;
            if ($isFunction(dispose)) {
                this.dispose = Undefined;  // dispose once                
                return dispose.call(this);
            }        
        }
};

/**
 * Convenience function for disposing resources.
 * @method $using
 * @param    {Disposing}           disposing  - object to dispose
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
