import { Base } from './base2';

/**
 * Defines an enumeration.
 * <pre>
 *    const Color = Enum({
 *        red:   1,
 *        green: 2,
 *        blue:  3
 *    })
 * </pre>
 * @class Enum
 * @constructor
 * @param  {Any}     value    -  enum value
 * @param  {string}  name     -  enum name
 * @param  {number}  ordinal  -  enum position
 */
const Defining = Symbol();

export const Enum = Base.extend({
    constructor(value, name, ordinal) {
        this.constructing(value, name);
        Object.defineProperties(this, {
            "value": {
                value:        value,
                writable:     false,
                configurable: false
            },
            "name": {
                value:        name,
                writable:     false,
                configurable: false
            },
            "ordinal": {
                value:        ordinal,
                writable:     false,
                configurable: false
            },
            
        });
    },
    toString() { return this.name; },
    constructing(value, name) {
        if (!this.constructor[Defining]) {
            throw new TypeError("Enums cannot be instantiated.");
        }            
    }
}, {
    coerce(choices, behavior) {
        if (this !== Enum && this !== Flags) {
            return;
        }
        let en = this.extend(behavior, {
            coerce(value) {
                return this.fromValue(value);
            }
        });
        en[Defining] = true;
        const names  = Object.freeze(Object.keys(choices));
        let   items  = Object.keys(choices).map(
            (name, ordinal) => en[name] = new en(choices[name], name, ordinal));
        en.names     = Object.freeze(names);        
        en.items     = Object.freeze(items);
        en.fromValue = this.fromValue;
        delete en[Defining]
        return Object.freeze(en);
    },
    fromValue(value) {
        const match = this.items.find(item => item.value == value);
        if (!match) {
            throw new TypeError(`${value} is not a valid value for this Enum.`);
        }
        return match;
    }
});
Enum.prototype.valueOf = function () {
    const value = +this.value;
    return isNaN(value) ? this.ordinal : value;
}

/**
 * Defines a flags enumeration.
 * <pre>
 *    const DayOfWeek = Flags({
 *        Monday:     1 << 0,
 *        Tuesday:    1 << 1,
 *        Wednesday:  1 << 2,
 *        Thursday:   1 << 3,
 *        Friday:     1 << 4,
 *        Saturday:   1 << 5,
 *        Sunday:     1 << 6
 *    })
 * </pre>
 * @class Enum
 * @constructor
 * @param  {Any} value     -  flag value
 * @param  {string} value  -  flag name
 */    
export const Flags = Enum.extend({
    hasFlag(flag) {
        flag = +flag;
        return (this & flag) === flag;
    },
    addFlag(flag) {
        return $isSomething(flag)
             ? this.constructor.fromValue(this | flag)
             : this;
    },
    removeFlag(flag) {
        return $isSomething(flag)
             ? this.constructor.fromValue(this & (~flag))
             : this;
    },
    constructing(value, name) {}        
}, {
    fromValue(value) {
        value = +value;
        let name, names = this.names;
        for (let i = 0; i < names.length; ++i) {
            const flag = this[names[i]];
            if (flag.value === value) {
                return flag;
            }
            if ((value & flag.value) === flag.value) {
                name = name ? (name + "," + flag.name) : flag.name;
            }
        }
        return new this(value, name);
    }
});
