import {
    Base, $isSomething, $isFunction, $isNumber
} from "./base2";

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
    get description() {
        const name = this.name;
        return name == null ? "undefined"
            : name.match(/[A-Z][a-z]+|[0-9]+/g)?.join(" ") || name;
    },

    toJSON() {
        const value = this.valueOf();
        return value != null && value !== value &&
               $isFunction(value.toJSON)
             ? value.toJSON()
             : value;
    },   
    toString() { return this.name; }
}, {
    coerce(choices, behavior) {
        let baseEnum;
        if (this === Enum) {
            baseEnum = SimpleEnum;
        } else if (this === Flags) {
            baseEnum = Flags;
        } else {
            return;
        }
        
        let en = baseEnum.extend(behavior, {
            coerce(value) {
                return this.fromValue(value);
            }    
        });

        const isCustom = $isFunction(choices);

        if (isCustom) {
            en = en.extend({
                constructor() {
                    if (!this.constructor[Defining]) {
                        throw new TypeError("Enums cannot be instantiated.");
                    }
                    this.base(...arguments); 
                }
            });
            en[Defining] = true;
            choices = choices((...args) => Reflect.construct(en, args));
        } else {
            en[Defining] = true;
        }

        const names = Object.keys(choices);
        let   items = names.map((name, ordinal) => {
            const item   = choices[name],
                  choice = isCustom ? item : new en(item, name);
            if (isCustom) {
                createReadonlyProperty(choice, "name", name);    
            }
            createReadonlyProperty(choice, "ordinal", ordinal);
            createReadonlyProperty(en, name, choice);
            return choice;
        });
        createReadonlyProperty(en, "names", Object.freeze(names));
        createReadonlyProperty(en, "items", Object.freeze(items));
        delete en[Defining]
        return en;
    }
});
Enum.prototype.valueOf = function () {
    return "value" in this ? this.value : this;
}

/**
 * Defines a simple value enumeration.
 * <pre>
 *    const Color = Enum({
 *        red:   1
 *        blue:  2
 *        green: 3
 *    })
 * </pre>
 * @class SimpleEnum
 * @constructor
 * @param  {Any}    value   -  choice value
 * @param  {string} [name]  -  choice name
 */
const SimpleEnum = Enum.extend({
    constructor(value, name) {
        if (!this.constructor[Defining]) {
            throw new TypeError("Enums cannot be instantiated.");
        }
        createReadonlyProperty(this, "value", value);
        createReadonlyProperty(this, "name", name);         
    }
}, {
    fromValue(value) {
        const match = this.items.find(item => item.value == value);
        if (!match) {
            throw new TypeError(`${value} is not a valid value for this Enum.`);
        }
        return match;
    }    
});

/**
 * Defines a flags enumeration.
 * <pre>
 *    const DayOfWeek = Flags({
 *        monday:     1 << 0,
 *        tuesday:    1 << 1,
 *        wednesday:  1 << 2,
 *        thursday:   1 << 3,
 *        friday:     1 << 4,
 *        saturday:   1 << 5,
 *        sunday:     1 << 6
 *    })
 * </pre>
 * @class Enum
 * @constructor
 * @param  {Any}    value   -  flag value
 * @param  {string} [name]  -  flag name
 */
export const Flags = Enum.extend({
    constructor(value, name) {
        if (!$isNumber(value) || !Number.isInteger(value)) {
            throw new TypeError(`Flag named '${name}' has value '${value}' which is not an integer`);
        }
        createReadonlyProperty(this, "value", value);
        createReadonlyProperty(this, "name", name);  
    },

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

function createReadonlyProperty(object, name, value) {
    Object.defineProperty(object, name, {
        value:        value,
        writable:     false,
        configurable: false
    });
}

