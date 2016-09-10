import { Base  } from './base2';

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
     * @param   {boolean}  strict    - true if target must adopt protocol
     * @returns {Any} result of the proxied get.
     */
    get(protocol, key, strict) {},
    /**
     * Delegates the property set on `protocol`.
     * @method set
     * @param   {Protocol} protocol  - receiving protocol
     * @param   {string}   key       - key of the property
     * @param   {Object}   value     - value of the property
     * @param   {boolean}  strict    - true if target must adopt protocol
     */
    set(protocol, key, value, strict) {},
    /**
     * Delegates the method invocation on `protocol`.
     * @method invoke
     * @param   {Protocol} protocol    - receiving protocol
     * @param   {string}   methodName  - name of the method
     * @param   {Array}    args        - method arguments
     * @param   {boolean}  strict      - true if target must adopt protocol
     * @returns {Any} result of the proxied invocation.
     */
    invoke(protocol, methodName, args, strict) {}
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
        Object.defineProperty(this, 'object', { value: object });
    },
    get(protocol, key, strict) {
        const object = this.object;
        if (object && (!strict || protocol.isAdoptedBy(object))) {
            return object[key];
        }
    },
    set(protocol, key, value, strict) {
        const object = this.object;
        if (object && (!strict || protocol.isAdoptedBy(object))) {
            return object[key] = value;
        }
    },
    invoke(protocol, methodName, args, strict) {
        const object = this.object;
        if (object && (!strict || protocol.isAdoptedBy(object))) {
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
        Object.defineProperty(this, 'array', { value: array });
    },
    get(protocol, key, strict) {
        const array = this.array;
        return array && array.reduce((result, object) =>
            !strict || protocol.isAdoptedBy(object) ? object[key] : result,
            undefined);  
    },
    set(protocol, key, value, strict) {
        const array = this.array;
        return array && array.reduce((result, object) =>
            !strict || protocol.isAdoptedBy(object) ? object[key] = value : result,
            undefined);  
    },
    invoke(protocol, methodName, args, strict) {
        const array = this.array;
        return array && array.reduce((result, object) => {
            const method = object[methodName];
            return method && (!strict || protocol.isAdoptedBy(object))
                ? method.apply(object, args)
                : result;
        }, undefined);
    }
});
