import { decorate } from './decorate';

export function copy(...args) {
    return decorate(_copy, args);
}

export default copy;

function _copy(target, key, descriptor) {
    const { get, set, value } = descriptor;
    if ($isFunction(value)) {
        descriptor.value = function () {
            return _copyOf(value.apply(this, arguments));
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
    return descriptor;
}

function _copyOf(value) {
    if (value != null && $isFunction(value.copy)) {
        value = value.copy();
    }
    return value;
}
