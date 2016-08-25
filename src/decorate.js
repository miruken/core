export function decorate(decorator, args) {
    if (isDescriptor(args[args.length - 1])) {
        return decorator(...args, []);
    }
    return function () {
        return decorator(...arguments, args);
    };
}

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

export default decorate;
