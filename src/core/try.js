import { Either, left, right } from "./either";

export class Try extends Either {
    constructor() {
        if (new.target === Try) {
            throw new Error("Use Try.failure() or Try.success() to create instances.");
        }
        super();
    }

    static Failure = left(Try);
    static Success = right(Try);
    
    static failure(error) {
        return new Try.Failure(error);
    }

    static success(value) {
        return new Try.Success(value);
    }
}
