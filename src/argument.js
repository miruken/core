import { Base, $isFunction } from "./base2";
import { Flags } from "./enum";
import { createKey } from "./privates";
import * as Facet from "./facet";

const _ = createKey();

export const ArgumentFlags = Flags({
    None:      0,
    Use:       1 << 0,
    Lazy:      1 << 1,
    Array:     1 << 2,
    Dynamic:   1 << 3,
    Optional:  1 << 4,
    Promise:   1 << 5,
    Invariant: 1 << 6,
    Instant:   1 << 7,     
    Child:     1 << 8
});

export const Argument = Base.extend({
    constructor(argument, flags) {
        const details = parseArgument(argument);
        _(this).type  = details.type;
        _(this).flags = details.flags.addFlag(flags);
    },

    get type()  { return _(this).type; },
    get flags() { return _(this).flags; }
});

function parseArgument(specification) {
    let type  = specification,
        flags = ArgumentFlags.None;

    if ($isFunction(specification.$getContents)) {
        if (Facet.$eq.test(specification)) {
            flags = flags.addFlag(ArgumentFlags.Invariant);
        }            
        if (Facet.$lazy.test(specification)) {
            flags = flags.addFlag(ArgumentFlags.Lazy);
        }
        if (Facet.$eval.test(specification)) {
            flags = flags.addFlag(ArgumentFlags.Dynamic);
        }
        if (Facet.$optional.test(specification)) {
            flags = flags.addFlag(ArgumentFlags.Optional);
        }
        if (Facet.$promise.test(specification)) {
            flags = flags.addFlag(ArgumentFlags.Promise);
        } else if (Facet.$instant.test(type)) {
            flags = flags.addFlag(ArgumentFlags.Instant);
        }            
        if (Facet.$child.test(specification)) {
            flags = flags.addFlag(ArgumentFlags.Child);
        }
        if (Facet.$every.test(type)) {
            flags = flags.addFlag(ArgumentFlags.Array);
        }
        type = Facet.$contents(specification);
    } 

    if (Array.isArray(type)) {
        if (type.length !== 1) {
            throw new SyntaxError("Argument array specification expects a single type.");
        }
        type  = type[0];
        flags = flags.addFlag(ArgumentFlags.Array);            
    }                     
    
    if (!$isFunction(type)) {
        throw new TypeError("The argument type is not a constructor function.");
    }

    return { type, flags };
}

export default Argument;
