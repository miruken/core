import { Base } from "./base2";

/**
 * Delegates properties and methods to another object.<br/>
 * See {{#crossLink "Protocol"}}{{/crossLink}}
 * @class Delegate
 * @extends Base
 */
export const Delegate = Base.extend({
    /**
     * Delegates the property get on `protocol`.
     * @method get
     * @param   {Protocol} protocol  - receiving protocol
     * @param   {string}   key       - key of the property
     * @returns {Any} result of the proxied get.
     */
    get(protocol, key) {},
    /**
     * Delegates the property set on `protocol`.
     * @method set
     * @param   {Protocol} protocol  - receiving protocol
     * @param   {string}   key       - key of the property
     * @param   {Object}   value     - value of the property
     */
    set(protocol, key, value) {},
    /**
     * Delegates the method invocation on `protocol`.
     * @method invoke
     * @param   {Protocol} protocol    - receiving protocol
     * @param   {string}   methodName  - name of the method
     * @param   {Array}    args        - method arguments
     * @returns {Any} result of the proxied invocation.
     */
    invoke(protocol, methodName, args) {}
});

/**
 * Delegates properties and methods to an object.
 * @class ObjectDelegate
 * @constructor
 * @param   {Object}  object  - receiving object
 * @extends Delegate
 */
export const ObjectDelegate = Delegate.extend({
    constructor(object) {
        Object.defineProperty(this, "object", { value: object });
    },
    get(protocol, key) {
        const object = this.object;
        if (object) { return object[key]; }
    },
    set(protocol, key, value) {
        const object = this.object;
        if (object) { return object[key] = value; }
    },
    invoke(protocol, methodName, args) {
        const object = this.object;
        if (object) {
            const method = object[methodName];                
            return method && method.apply(object, args);
        }
    }
});

/**
 * Delegates properties and methods to an array.
 * @class ArrayDelegate
 * @constructor
 * @param   {Array}  array  - receiving array
 * @extends Delegate
 */
export const ArrayDelegate = Delegate.extend({
    constructor(array) {
        Object.defineProperty(this, "array", { value: array });
    },
    get(protocol, key) {
        const array = this.array;
        return array && array.reduce(
            (result, object) => object[key],
            undefined);  
    },
    set(protocol, key, value) {
        const array = this.array;
        return array && array.reduce(
            (result, object) => object[key] = value,
            undefined);  
    },
    invoke(protocol, methodName, args) {
        const array = this.array;
        return array && array.reduce((result, object) => {
            const method = object[methodName];
            return method ? method.apply(object, args) : result;
        }, undefined);
    }
});
