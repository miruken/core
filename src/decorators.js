
export function isDescriptor(desc) {
    if (!desc || !desc.hasOwnProperty) {
        return false;
    }

    const keys = ['value', 'initializer', 'get', 'set'];

    for (let i = 0, l = keys.length; i < l; i++) {
        if (desc.hasOwnProperty(keys[i])) {
            return true;
        }
    }

    return false;
}

export function decorate(decorator, args) {
    if (isDescriptor(args[args.length - 1])) {
        return decorator(...args, []);
    }
    return function () {
        return decorator(...arguments, args);
    };
}

export function copy(target, key, descriptor) {
    const { get, set, value  } = descriptor;
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
}

function copyOf(value) {
    if (value != null && $isFunction(value.copy)) {
        value = value.copy();
    }
    return value;
}
