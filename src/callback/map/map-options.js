import { 
    pcopy, $isNothing, $isFunction
} from "../../core/base2";

import { conformsTo } from "../../core/protocol";
import { handlesOptions } from "../handler-options";
import { Options } from "../options";
import { Mapping } from "./mapping"

@handlesOptions("mapOptions")
export class MapOptions extends Options {
    /**
     * The type of object.
     * @property {Function} type
     */   
    type;

    /**
     * The fields to map.  Object literal or true.
     * @property {Any} fields
     */   
    fields;

    /**
     * Determines how type identifiers are used.
     * @property {Function} typeIdHandling
     */   
    typeIdHandling;

    /**
     * The mapping strategy.
     * @property {Mapping} strategy
     */   
    strategy;

    mergeKeyInto(options, key, keyValue, optionsValue) {
        if (key === "strategy") {
            const target = pcopy(optionsValue),
                  merged = Reflect.ownKeys(Mapping.prototype)
                      .reduce((result, method) => method !== "constructor" &&
                          chain(method, target, keyValue) || result, false);
            if (merged) {  
                options[key] = target;
            }
        }
        return super.mergeKeyInto(options, key, keyValue, optionsValue);
    }
}

function chain(methodName, initial, merge) {
    const method1 = initial[methodName],
          method2 = merge[methodName];
    if ($isFunction(method1)) {
        if ($isFunction(method2)) {
            initial[methodName] = function (...args) {
                const result = method1.apply(this, args);
                return $isNothing(result) 
                     ? method2.apply(this, args)
                     : result; 
            }
            return true;
        }
    } else if ($isFunction(method2)) {
        initial[methodName] = method2;
        return true;
    }
    return false;
}