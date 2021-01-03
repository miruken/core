import { 
    emptyArray, $isNothing,
    $isSomething, $isFunction
} from "./base2";

/**
 * Annotates invariance.
 * @attribute $eq
 */
export const $eq = $createQualifier();

/**
 * Annotates use value as is.
 * @attribute $use
 */    
export const $use = $createQualifier();

/**
 * Annotates lazy semantics.
 * @attribute $lazy
 */            
export const $lazy = $createQualifier();

/**
 * Annotates function to be evaluated.
 * @attribute $eval
 */                
export const $eval = $createQualifier();

/**
 * Annotates zero or more semantics.
 * @attribute $all
 */                    
export const $all = $createQualifier();

/**
 * Annotates 
 * @attribute use {{#crossLink "Parenting"}}{{/crossLink}} protocol.
 * @attribute $child
 */                        
export const $child = $createQualifier();

/**
 * Annotates optional semantics.
 * @attribute $optional
 */                        
export const $optional = $createQualifier();

/**
 * Annotates Promise expectation.
 * @attribute $promise
 */                            
export const $promise = $createQualifier();

/**
 * Annotates synchronous.
 * @attribute $instant
 */                                
export const $instant = $createQualifier();

const nextKey = Symbol();

function visit(visitor) {
    const next = this[nextKey];
    if ($isFunction(next)) {
        return next.call(this, visitor);
    }
};

export function $contents(input) {
    if (new.target) {
        this.$getContents = function () { return input; }
        this[nextKey] = function (visitor) {
            return visitor.call($contents, input);
        }
    } else {
        if ($isSomething(input)) {
            const getContents = input.$getContents;
            return $isFunction(getContents) 
                 ? getContents.call(input)
                 : input;
        }
    }
}
$contents.prototype.visit = visit;
$contents.key = Symbol();

export function $createQualifier() {
    const key = Symbol();
    function qualifier(input, ...args) {
        if (new.target) {
             throw new Error("Qualifiers should not be called with the new operator.");
        }
        if (qualifier.test(input)) {
            return input;
        }
        if (!(input instanceof $contents)) {
            input = new $contents(input);
        }
        const next      = input[nextKey],
              state     = args.length == 0 ? emptyArray : args,
              decorator = Object.create(input, {
            [key]: {
                writable:     false,
                configurable: false,
                value:        state
            },
            [nextKey]: {
                writable:     false,
                configurable: false,
                value:        function (visitor) {
                    const result = input[nextKey](visitor);
                    return visitor.call(qualifier, result, state) || result;
                }
            },
        });
        decorator.visit = visit;
        return decorator;
    }
    qualifier.getArgs = function (input) {
        if ($isSomething(input)) {
            return input[key];
        }
    };
    qualifier.test = function (input) {
        return $isSomething(input) && !!input[key];
    };
    qualifier.key = key;
    return qualifier;
}
