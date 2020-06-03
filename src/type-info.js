import { 
    Base, $isNothing, $isFunction,
    $isSymbol
} from "./base2";

import { Flags } from "./enum";
import { createKey } from "./privates";
import * as Qualifier from "./qualifier";

const _ = createKey();

export const TypeFlags = Flags({
    None:      0,
    Lazy:      1 << 1,
    Array:     1 << 2,
    Optional:  1 << 3,
    Invariant: 1 << 4
});

const qualifiers = {
    [Qualifier.$eq.key](typeInfo) {
        typeInfo.flags = typeInfo.flags.addFlag(TypeFlags.Invariant);
    },
    [Qualifier.$lazy.key](typeInfo) {
        typeInfo.flags = typeInfo.flags.addFlag(TypeFlags.Lazy);
    },
    [Qualifier.$optional.key](typeInfo) {
        typeInfo.flags = typeInfo.flags.addFlag(TypeFlags.Optional);
    },
    [Qualifier.$all.key](typeInfo) {
        typeInfo.flags = typeInfo.flags.addFlag(TypeFlags.Array);
    },
    [Qualifier.$contents.key](input) {
        if (Array.isArray(input)) {
            if (input.length !== 1) {
                throw new SyntaxError("Array specification expects a single type.");
            }
            return new TypeInfo(input[0], TypeFlags.Array );
        }
        return new TypeInfo(input, TypeFlags.None );
    }        
}

export const TypeInfo = Base.extend({
    constructor(type, flags) {
        if (!$isFunction(type)) {
            throw new TypeError("The type is not a constructor function.");
        }
        _(this).type  = type;
        _(this).flags = flags || TypeFlags.None;
    },

    get type()  { return _(this).type; },
    get flags() { return _(this).flags; },
    set flags(value) { _(this).flags = value; }
}, {
    parse(spec) {
        if (spec == null)
            throw new Error("The specification argument is required.")
        
        return spec instanceof Qualifier.$contents
             ? spec.visit(function (input, state) {
                 return this.key in qualifiers
                      ? qualifiers[this.key](input, state)
                      : input;
               })
             : qualifiers[Qualifier.$contents.key](spec);
    },
    registerQualifier(qualifier, visitor) {
        if ($isNothing(qualifier) || !$isSymbol(qualifier.key)) {
            throw new TypeError("The qualifier argument is not valid.");
        }
        if (!$isFunction(visitor)) {
            throw new TypeError("The visitor argument must be a function.");
        }
        qualifiers[qualifier.key] = visitor;
    }
});

export default TypeInfo;
