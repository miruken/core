import {
    Base, getPropertyDescriptors
} from "./base2";

import { $isNothing, $isFunction } from "./util";
import { emptyArray } from "./core";

export const Policy = Base.extend({
    /**
     * Merges this policy data into `policy`.
     * @method mergeInto
     * @param   {Policy}  policy  -  policy to receive data
     * @returns {boolean} true if policy could be merged into.
     */
    mergeInto(policy) {
        if (!(policy instanceof this.constructor)) {
            return false;
        }
        const descriptors = getPropertyDescriptors(this),
              keys        = Reflect.ownKeys(descriptors);
        keys.forEach(key => {
            const keyValue = this[key];
            if ($isFunction(keyValue)) { return; }
            if (keyValue !== undefined && this.hasOwnProperty(key)) {
                const policyValue = policy[key];
                if (policyValue === undefined || !policy.hasOwnProperty(key)) {
                    policy[key] = _copyPolicyValue(keyValue);
                } else if ($isFunction(keyValue.mergeInto)) {
                    keyValue.mergeInto(policyValue);
                }
            }
        });
        return true;
    },
    copy() {
        var policy = Reflect.construct(this.constructor, emptyArray);
        this.mergeInto(policy);
        return policy;
    }
});

function _copyPolicyValue(policyValue) {
    if ($isNothing(policyValue)) {
        return policyValue;
    }
    if (Array.isArray(policyValue)) {
        return policyValue.map(_copyPolicyValue);
    }
    if ($isFunction(policyValue.copy)) {
        return policyValue.copy();
    }
    return policyValue;
}
