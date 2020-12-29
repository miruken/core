import { emptyArray } from "./base2";

export function isDescriptor(desc) {
    if (!desc || !desc.hasOwnProperty) {
        return false;
    }

    const keys = ["value", "initializer", "get", "set"];

    for (let i = 0, l = keys.length; i < l; i++) {
        if (desc.hasOwnProperty(keys[i])) {
            return true;
        }
    }

    return false;
}

export function decorate(decorator, args) {
    const [target, key, descriptor] = args || emptyArray;
    if (isDescriptor(descriptor)) {
        return decorator(target, key, descriptor, emptyArray);
    }
    return function (target, key, descriptor) {
        return decorator(target, key, descriptor, args);
    };
}


