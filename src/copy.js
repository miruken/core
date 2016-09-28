import { decorate, isDescriptor } from "./decorate";

/**
 * Applies copy semantics on properties and return values.
 * @method copy
 */
export function copy(...args) {
    return decorate(_copy, args);
}

function _copy(target, key, descriptor) {
    if (!isDescriptor(descriptor)) {
        throw new SyntaxError("@copy can only be applied to methods or properties");
    }
    const { get, set, value, initializer } = descriptor;
    if ($isFunction(value)) {
        descriptor.value = function () {
            return _copyOf(value.apply(this, arguments));
        }
    }
    if ($isFunction(initializer)) {
        descriptor.initializer = function () {
            return _copyOf(initializer.apply(this));
        }
    }
    if ($isFunction(get)) {
        descriptor.get = function () {
            return _copyOf(get.apply(this));
        }
    }
    if ($isFunction(set)) {
        descriptor.set = function (value) {
            return set.call(this, _copyOf(value));
        }
    }
}

function _copyOf(value) {
    if (value != null && $isFunction(value.copy)) {
        value = value.copy();
    }
    return value;
}
