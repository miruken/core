import { $isFunction } from "./base2";
import { createKey } from "./privates";

const _ = createKey();

export class Either {
    static Left = class extends Either {
        constructor(value) {
            super();
            _(this).value = value;
        }

        get value() { return _(this).value; }

        map(func) { return this; }
        apply(other) { return this; }
        flatMap(func) { return this; }

        mapLeft(func) {
            return new Either.Left(func(_(this).value));
        }

        fold(left, right) {
            return left(_(this).value);
        }
    }

    static Right = class extends Either {
        constructor(value) {
            super();
            _(this).value = value;
        }

        get value() { return _(this).value; }

        map(func) {
            return new Either.Right(func(_(this).value));
        }

        apply(other) {
            const { value } = _(this);
            if (!$isFunction(value)) {
                throw new Error("Function containers can only call apply");
            }
            return other.map(value);
        }

        flatMap(func) {
            return func(_(this).value);
        }

        mapLeft(func) { return this; }

        fold(left, right) {
            return right(_(this).value);
        }
    }

    static left(value) {
        return new Either.Left(value);
    }

    static right(value) {
        return new Either.Right(value);
    }
}
