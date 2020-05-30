import { Base, $isFunction } from "./base2";
import { Flags } from "./enum";
import { createKey } from "./privates";
import * as Qualifier from "./qualifier";

const _ = createKey();

export const TypeFlags = Flags({
    None:      0,
    Lazy:      1 << 1,
    Array:     1 << 2,
    Optional:  1 << 3,
    Promise:   1 << 4,
    Invariant: 1 << 5
});

export const TypeInfo = Base.extend({
    constructor(type, flags) {
        const details = parseType(type);
        _(this).type  = details.type;
        _(this).flags = details.flags.addFlag(flags);
    },

    get type()  { return _(this).type; },
    get flags() { return _(this).flags; }
});

function parseType(specification) {
    let type  = specification,
        flags = TypeFlags.None;

    if ($isFunction(specification.$getContents)) {
        if (Qualifier.$eq.test(specification)) {
            flags = flags.addFlag(TypeFlags.Invariant);
        }            
        if (Qualifier.$lazy.test(specification)) {
            flags = flags.addFlag(TypeFlags.Lazy);
        }
        if (Qualifier.$optional.test(specification)) {
            flags = flags.addFlag(TypeFlags.Optional);
        }
        if (Qualifier.$promise.test(specification)) {
            flags = flags.addFlag(TypeFlags.Promise);
        } else if (Qualifier.$instant.test(type)) {
            flags = flags.addFlag(TypeFlags.Instant);
        }            
        if (Qualifier.$all.test(type)) {
            flags = flags.addFlag(TypeFlags.Array);
        }
        type = Qualifier.$contents(specification);
    } 

    if (Array.isArray(type)) {
        if (type.length !== 1) {
            throw new SyntaxError("Array specification expects a single type.");
        }
        type  = type[0];
        flags = flags.addFlag(TypeFlags.Array);            
    }                     
    
    if (!$isFunction(type)) {
        throw new TypeError("The type is not a constructor function.");
    }

    return { type, flags };
}

export default TypeInfo;
