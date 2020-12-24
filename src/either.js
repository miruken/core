import { 
    $isNothing, $isFunction
} from "./base2";

import { createKey } from "./privates";

const _ = createKey();

export const left = (Base, constraint, required) =>
    class Left extends Base {
        constructor(value) {
            super();
            validate(value, constraint, required);
            _(this).value = value;
        }

        get value() { return _(this).value; }

        map(func) { return this; }
        apply(other) { return this; }
        flatMap(func) { return this; }

        mapLeft(func) {
            if ($isNothing(func)) {
                throw new Error("The func argument is required.");
            }
            if (!$isFunction(func)) {
                throw new Error("The func argument is not a function.");
            }
            return new Left(func(_(this).value));
        }

        fold(left, right) {
            if ($isNothing(left)) {
                throw new Error("The left argument is required.");
            }
            if (!$isFunction(left)) {
                throw new Error("The left argument is not a function.");
            }
            return left(_(this).value);
        }
    }

export const right = (Base, constraint, required) =>
   class Right extends Base {
        constructor(value) {
            super();
            validate(value, constraint, required);
            _(this).value = value;
        }

        get value() { return _(this).value; }

        map(func) {
            return new Right(func(_(this).value));
        }

        apply(other) {
            const { value } = _(this);
            if (!$isFunction(value)) {
                throw new Error("Function containers can only call apply.");
            }
            return other.map(value);
        }

        flatMap(func) {
            if ($isNothing(func)) {
                throw new Error("The func argument is required.");
            }
            if (!$isFunction(func)) {
                throw new Error("The func argument is not a function.");
            }
            return func(_(this).value);
        }

        mapLeft(func) { return this; }

        fold(left, right) {
            if ($isNothing(right)) {
                throw new Error("The right argument is required.");
            }
            if (!$isFunction(right)) {
                throw new Error("The right argument is not a function.");
            }
            return right(_(this).value);
        }
    };

export class Either {
    constructor() {
        if (new.target === Either) {
            throw new Error("Use Either.left() or Either.right() to create instances.");
        }
    }

    static Left  = left(Either);
    static Right = right(Either);
    
    static left(value) {
        return new Either.Left(value);
    }

    static right(value) {
        return new Either.Right(value);
    }
}

function validate(value, constraint, required) {
    if (!$isNothing(constraint)) {
        if (!$isFunction(constraint)) {
            throw new TypeError("The constraint must be a class.");
        }
        if ($isNothing(value)) {
            if (required) {
                throw new Error("The value argument is required.")
            }
        } else if (!(value instanceof constraint)) {
            throw new TypeError(`${value} is not a valid ${constraint.name} object.`);
        }
    }
}