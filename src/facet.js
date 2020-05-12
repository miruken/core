import { 
    emptyArray, $isNothing,
    $isSomething, $isFunction
} from "./base2";

/**
 * Annotates invariance.
 * @attribute $eq
 */
export const $eq = $createFacet();

/**
 * Annotates use value as is.
 * @attribute $use
 */    
export const $use = $createFacet();

/**
 * Annotates lazy semantics.
 * @attribute $lazy
 */            
export const $lazy = $createFacet();

/**
 * Annotates function to be evaluated.
 * @attribute $eval
 */                
export const $eval = $createFacet();

/**
 * Annotates zero or more semantics.
 * @attribute $every
 */                    
export const $every = $createFacet();

/**
 * Annotates 
 * @attribute use {{#crossLink "Parenting"}}{{/crossLink}} protocol.
 * @attribute $child
 */                        
export const $child = $createFacet();

/**
 * Annotates optional semantics.
 * @attribute $optional
 */                        
export const $optional = $createFacet();

/**
 * Annotates Promise expectation.
 * @attribute $promise
 */                            
export const $promise = $createFacet();

/**
 * Annotates synchronous.
 * @attribute $instant
 */                                
export const $instant = $createFacet();

export function $contents(content) {
    if (new.target) {
        if ($isNothing(content)) {
            throw new Error("The content argument is required.")
        }
        this.$getContents = function () { return content; }
    } else {
        if ($isSomething(content)) {
            return $isFunction(content.$getContents) 
                 ? content.$getContents()
                 : content;
        }
    }
}

export function $createFacet() {
    const key = Symbol();
    function facet(content, ...args) {
        if (new.target) {
             throw new Error("Facets should not be called with the new operator.");
        }
        if (facet.test(content)) {
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
            }, 
        });
        return decorator;
    }
    facet.getArgs = function (content) {
        if ($isSomething(content)) {
            return content[key];
        }
    };
    facet.test = function (content) {
        return $isSomething(content) && !!content[key];
    };

    return facet;
}
