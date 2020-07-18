import { 
    Base, $isNothing, $isFunction,
    $isBoolean, $isNumber, $isString,
    $isSymbol
} from "./base2";

import { $isProtocol } from "./protocol";
import { Flags } from "./enum";
import { createKey } from "./privates";
import { 
    $eq, $lazy, $optional, $all,
    $contents 
} from "./qualifier";

const _ = createKey();

export const TypeFlags = Flags({
    None:      0,
    Lazy:      1 << 1,
    Array:     1 << 2,
    Optional:  1 << 3,
    Invariant: 1 << 4,
    Protocol:  1 << 5,
});

const qualifiers = {
    [$eq.key](typeInfo) {
        typeInfo.flags = typeInfo.flags.addFlag(TypeFlags.Invariant);
    },
    [$lazy.key](typeInfo) {
        typeInfo.flags = typeInfo.flags.addFlag(TypeFlags.Lazy);
    },
    [$optional.key](typeInfo) {
        typeInfo.flags = typeInfo.flags.addFlag(TypeFlags.Optional);
    },
    [$all.key](typeInfo) {
        typeInfo.flags = typeInfo.flags.addFlag(TypeFlags.Array);
    },
    [$contents.key](input) {
        let type  = input,
            flags = TypeFlags.None;

        if (Array.isArray(input)) {
            if (input.length !== 1) {
                throw new SyntaxError("Array type specification expects a single type.");
            }
            type  = input[0];
            flags = flags.addFlag(TypeFlags.Array);
        }

        if ($isProtocol(type)) {
            flags = flags.addFlag(TypeFlags.Protocol);
        }

        return new TypeInfo(type, flags);
    }        
}

export class TypeInfo extends Base {
    constructor(type, flags) {
        super();
        if (type && !$isFunction(type)) {
            throw new TypeError("The type is not a constructor function.");
        }
        this.type  = type;
        this.flags = flags;
    }

    get type() { return _(this).type; }
    set type(value) {
        const type = this.type;
        if (type) {
            if (type !== value) {
                throw new TypeError("TypeInfo type cannot be changed once set.");
            }
            return;
        }
        _(this).type = value;
    }

    get flags() { return _(this).flags; }
    set flags(value) {
        _(this).flags = value || TypeFlags.None;
    }

    validate(value, require) {
        const type  = this.type,
              flags = this.flags
        if ($isNothing(value)) {
            if (flags.hasFlag(TypeFlags.Optional)) {
                return true;
            } else if (require) {
                throw new TypeError("The value is nothing.");
            }
            return false;
        }
        if (flags.hasFlag(TypeFlags.Array)) {
            if (!Array.isArray(value)) {
                if (require) {
                    throw new TypeError("The value is not an array.");
                }
                return false;
            }
            for (let i = 0; i < value.length; ++i) {
                const item = value[i];
                if ($isNothing(item)) {
                    if (require) {
                        throw new TypeError(`Array element at index ${i} is nothing.`);
                    }
                    return false;
                }
                if (!validateType(type, flags, item, i, require)) {
                    return false;
                }
            }
            return true;
        }
        return validateType(type, flags, value, null, require);
    }

    merge(otherTypeInfo) {
        const type      = this.type,
              otherType = otherTypeInfo.type;
        if ($isNothing(type)) {
            this.type = otherType;
        } else if (otherType && type !== otherType) {
            throw new TypeError("Cannot change type once set.")
        }
        this.flags = this.flags.addFlag(otherTypeInfo.flags);
        return this;
    }

    static parse(spec) {
        if ($isNothing(spec)) {
            return new TypeInfo();
        }
        
        return spec instanceof $contents
             ? spec.visit(function (input, state) {
                 return this.key in qualifiers
                      ? qualifiers[this.key](input, state)
                      : input;
               })
             : qualifiers[$contents.key](spec);
    }

    static registerQualifier(qualifier, visitor) {
        if ($isNothing(qualifier) || !$isSymbol(qualifier.key)) {
            throw new TypeError("The qualifier argument is not valid.");
        }
        if (!$isFunction(visitor)) {
            throw new TypeError("The visitor argument must be a function.");
        }
        qualifiers[qualifier.key] = visitor;
    }
}

function validateType(type, flags, value, index, require) {
    if ($isNothing(type)) return true;
    if (type === Boolean) {
        if (!$isBoolean(value)) {
            if (require) {
                if (index == null) {
                    throw new TypeError("The value is not a boolean.");
                } else {
                     throw new TypeError(`The element at index ${index} is not a boolean.`);
                }
            }
            return false;
        }
    } else if (type === Number) {
        if (!$isNumber(value)) {
            if (require) {
                if (index == null) {
                    throw new TypeError("The value is not a number.");
                } else {
                    throw new TypeError(`The element at index ${index} is not a number.`);
                }
            }
            return false;
        }
    } else if (type === String) {
        if (!$isString(value)) {
            if (require) {
                if (index == null) {
                    throw new TypeError("The value is not a string.");
                } else {
                    throw new TypeError(`The element at index ${index} is not a string.`);
                }
            }
            return false;
        }
    } else if (flags.hasFlag(TypeFlags.Protocol)) {
        if (!type.isAdoptedBy(value)) {
            if (require) {
                if (index == null) {
                    throw new TypeError(`The value does not conform to protocol ${type}.`);
                } else {
                    throw new TypeError(`The element at index ${index} does not conform to protocol ${type}.`);
                }
            }
            return false;
        }
    } else if (!(value instanceof type)) {
        if (require) {
            if (index == null) {
                throw new TypeError(`The value is not an instance of ${type}.`);
            } else {
                throw new TypeError(`The element at index ${index} is not an instance of ${type}.`);
            }
        }
        return false;
    }
    return true;
}

