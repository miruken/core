import { Try } from "../src/try";
import { expect } from "chai";

describe("Try", () => {
    describe("Failure", () => {
        it("should create failure", () => {
            const error   = new Error("Something went wrong"),
                  failure = Try.failure(error);
            expect(failure).to.be.instanceOf(Try.Failure);
            expect(failure.value).to.equal(error);
        });

        it("should not map failure", () => {
            const failure = Try.failure(new Error("Bad argument"));
            expect(failure.map(x => x * 2)).to.equal(failure);
        });

        it("should map failure", () => {
            const failure = Try.failure(new Error("Timeout occurred")),
                  result  = failure.mapLeft(x => new TypeError("Wrong type"));
            expect(result).to.be.instanceOf(Try.Failure);
            expect(result.value).to.be.instanceOf(TypeError);
        });

        it("should not apply failure", () => {
            const failure = Try.failure(new Error("Not supported")),
                  other   = Try.success(15);
            expect(failure.apply(other)).to.equal(failure);
        });

        it("should not flatMap failure", () => {
            const failure = Try.failure(new Error("Stack overflow"));
            expect(failure.flatMap(x => Try.success(x * 2))).to.equal(failure);
        });

        it("should fold failure", () => {
            const failure = Try.failure(new Error("Name is required")),
                  result  = failure.fold(l => l.message);
            expect(result).to.equal("Name is required");
        });                               
    });

    describe("Success", () => {
        it("should create success", () => {
            const success = Try.success("abc");
            expect(success).to.be.instanceOf(Try.Success);
            expect(success.value).to.equal("abc");
        });

        it("should map success", () => {
            const success  = Try.success("abc"),
                  result = success.map(x => x + "def");
            expect(result).to.be.instanceOf(Try.Success);
            expect(result.value).to.equal("abcdef");
        });

        it("should not map success", () => {
            const success = Try.success("abc");
            expect(success.mapLeft(x => x.toUpperCase())).to.equal(success);
        });

        it("should apply success", () => {
            const success = Try.success(x => x + "ABC"),
                  other   = Try.success("abc"),
                  result  = success.apply(other);
            expect(result).to.be.instanceOf(Try.Success);
            expect(result.value).to.equal("abcABC");
        });

        it("should fold success", () => {
            const success = Try.success("abc"),
                  result  = success.fold(null, r => r + "XYZ");
            expect(result).to.equal("abcXYZ");
        });                     
    });

    it("should fail if using Try constructor.", () => {
        expect(() => {
            new Try();                   
        }).to.throw(Error, "Use Try.failure() or Try.success() to create instances.");
    });
});
