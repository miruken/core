import { decorate } from './decorator';

export function copy(...args) {
    return decorate(handleCopy, args);
}

function handleCopy(target, key, descriptor) {
    const { get, set, value } = descriptor;
    if ($isFunction(value)) {
        descriptor.value = function () {
            return copyOf(value.apply(this, arguments));
        }
    }
    if ($isFunction(get)) {
        descriptor.get = function () {
            return copyOf(get.apply(this));
        }
    }
    if ($isFunction(set)) {
        descriptor.set = function (value) {
            return set.call(this, copyOf(value));
        }
    }
    return descriptor;
}

function copyOf(value) {
    if (value != null && $isFunction(value.copy)) {
        value = value.copy();
    }
    return value;
}
