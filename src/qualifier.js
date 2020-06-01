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

export function $contents(content) {
    if (new.target) {
        this.$getContents = function () { return content; }
    } else {
        if ($isSomething(content)) {
            return $isFunction(content.$getContents) 
                 ? content.$getContents()
                 : content;
        }
    }
}

export function $createQualifier() {
    const key = Symbol();
    function qualifier(content, ...args) {
        if (new.target) {
             throw new Error("Qualifiers should not be called with the new operator.");
        }
        if (qualifier.test(content)) {
            return content;
        }
        if (!(content instanceof $contents)) {
            content = new $contents(content);
        }
        const decorator = Object.create(content, {
            [key]: {
                writable:     false,
                configurable: false,
                value:        args.length == 0 ? emptyArray : args
            }
        });
        return decorator;
    }
    qualifier.getArgs = function (content) {
        if ($isSomething(content)) {
            return content[key];
        }
    };
    qualifier.test = function (content) {
        return $isSomething(content) && !!content[key];
    };

    return qualifier;
}
