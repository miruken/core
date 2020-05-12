import { 
    emptyArray, $isNothing,
    $isSomething, $isFunction
} from "./base2";

/**
 * Annotates invariance.
 * @attribute $eq
 * @for Modifier
 */
export const $eq = $createFacet();

/**
 * Annotates use value as is.
 * @attribute $use
 * @for Modifier
 */    
export const $use = $createFacet();

/**
 * Annotates lazy semantics.
 * @attribute $lazy
 * @for Modifier
 */            
export const $lazy = $createFacet();

/**
 * Annotates function to be evaluated.
 * @attribute $eval
 * @for Modifier
 */                
export const $eval = $createFacet();

/**
 * Annotates zero or more semantics.
 * @attribute $every
 * @for Modifier
 */                    
export const $every = $createFacet();

/**
 * Annotates 
 * @attribute use {{#crossLink "Parenting"}}{{/crossLink}} protocol.
 * @attribute $child
 * @for Modifier
 */                        
export const $child = $createFacet();

/**
 * Annotates optional semantics.
 * @attribute $optional
 * @for Modifier
 */                        
export const $optional = $createFacet();

/**
 * Annotates Promise expectation.
 * @attribute $promise
 * @for Modifier
 */                            
export const $promise = $createFacet();

/**
 * Annotates synchronous.
 * @attribute $instant
 * @for Modifier
 */                                
export const $instant = $createFacet();

export function $content(content) {
    if (new.target) {
        if ($isNothing(content)) {
            throw new Error("The content argument is required.")
        }
        this.getContent = function () { return content; }
    } else {
        if ($isSomething(content) && $isFunction(content.getContent)) {
            return content.getContent();
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
        if (!(content instanceof $content)) {
            content = new $content(content);
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
        return content[key];
    };
    facet.test = function (content) {
        return !!content[key];
    };

    return facet;
}
