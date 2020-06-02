import { 
    Base, $isNothing, $isFunction
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

const parsers = [];

export const TypeInfo = Base.extend({
    constructor(type, flags) {
        if (!$isFunction(type)) {
            throw new TypeError("The type is not a constructor function.");
        }
        _(this).type  = type;
        _(this).flags = flags || TypeFlags.None;
    },

    get type()  { return _(this).type; },
    get flags() { return _(this).flags; }
}, {
    parse(spec) {
        if (spec == null)
            throw new Error("The specification argument is required.")

        let type  = spec,
            flags = TypeFlags.None;

        if ($isFunction(spec.$getContents)) {
            if (Qualifier.$eq.test(spec)) {
                flags = flags.addFlag(TypeFlags.Invariant);
            }            
            if (Qualifier.$lazy.test(spec)) {
                flags = flags.addFlag(TypeFlags.Lazy);
            }
            if (Qualifier.$optional.test(spec)) {
                flags = flags.addFlag(TypeFlags.Optional);
            }      
            if (Qualifier.$all.test(spec)) {
                flags = flags.addFlag(TypeFlags.Array);
            }

            type = Qualifier.$contents(spec);
        } 

        if (Array.isArray(type)) {
            if (type.length !== 1) {
                throw new SyntaxError("Array specification expects a single type.");
            }
            type  = type[0];
            flags = flags.addFlag(TypeFlags.Array);            
        }                     
        
        const typeInfo = new TypeInfo(type, flags);
        parsers.forEach(parser => parser(spec, typeInfo));
        return typeInfo;
    },
    addParser(parser) {
        if (!$isFunction(parser)) {
            throw new Error("The parser argument must be a function.");
        }
        parsers.push(parser);
    }
});

export default TypeInfo;
