import { Either } from "core/either";
import { expect } from "chai";

describe("Either", () => {
    describe("Left", () => {
        it("should create left", () => {
            const left = Either.left(22);
            expect(left).to.be.instanceOf(Either.Left);
            expect(left.value).to.equal(22);
        });

        it("should not map left", () => {
            const left = Either.left(22);
            expect(left.map(x => x * 2)).to.equal(left);
        });

        it("should map left", () => {
            const left   = Either.left(22),
                  result = left.mapLeft(x => x * 2);
            expect(result).to.be.instanceOf(Either.Left);
            expect(result.value).to.equal(44);
        });

        it("should not apply left", () => {
            const left  = Either.left(22),
                  other = Either.right(15);
            expect(left.apply(other)).to.equal(left);
        });

        it("should not flatMap left", () => {
            const left = Either.left(22);
            expect(left.flatMap(x => Either.Right(x * 2))).to.equal(left);
        });

        it("should fold left", () => {
            const left   = Either.left(22),
                  result = left.fold(l => l * 2);
            expect(result).to.equal(44);
        });                        
    });

    describe("Right", () => {
        it("should create right", () => {
            const right = Either.right("abc");
            expect(right).to.be.instanceOf(Either.Right);
            expect(right.value).to.equal("abc");
        });

        it("should map right", () => {
            const right  = Either.right("abc"),
                  result = right.map(x => x + "def");
            expect(result).to.be.instanceOf(Either.Right);
            expect(result.value).to.equal("abcdef");
        });

        it("should not map right", () => {
            const right = Either.right("abc");
            expect(right.mapLeft(x => x.toUpperCase())).to.equal(right);
        });

        it("should apply right", () => {
            const right  = Either.right(x => x + "ABC"),
                  other  = Either.right("abc"),
                  result = right.apply(other);
            expect(result).to.be.instanceOf(Either.Right);
            expect(result.value).to.equal("abcABC");
        });

        it("should fold right", () => {
            const right  = Either.right("abc"),
                  result = right.fold(null, r => r + "XYZ");
            expect(result).to.equal("abcXYZ");
        });                     
    });

    it("should fail if using Either constructor.", () => {
        expect(() => {
            new Either();                   
        }).to.throw(Error, "Use Either.left() or Either.right() to create instances");
    });
});
