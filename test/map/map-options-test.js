import { Handler } from "../../src/callback/handler";
import { MapOptions } from "../../src/map/map-options";
import { expect } from "chai";

describe("MapOptions", () => {
    let handler;
    beforeEach(() => {
        handler = new Handler();
    });

    describe("strategy", () => {
        it("should combine strategies", () => {
            const h = handler
                .$mapOptions({
                    strategy: new class {
                        getPropertyName(target, key) {
                            return key.toUpperCase();
                        }
                    }
                })
                .$mapOptions({
                    strategy: new class {
                        shouldIgnore(value, target, key) {
                            return true;
                        }
                    }
                });
            const { strategy } = h.$getOptions(MapOptions);
            expect(strategy.getPropertyName(null, "foo")).to.equal("FOO");
            expect(strategy.shouldIgnore("foo")).to.be.true;
        });

        it("should compose strategies", () => {
            const h = handler
                .$mapOptions({
                    strategy: new class {
                        getPropertyName(target, key) {
                            return key.toUpperCase();
                        }
                    }
                })
                .$mapOptions({
                    strategy: new class {
                        getPropertyName(target, key) {
                            if (key.length % 2 === 0) {
                                return key + key;
                            }
                        }
                    }
                });
            const { strategy } = h.$getOptions(MapOptions);
            expect(strategy.getPropertyName(null, "foo")).to.equal("FOO");
            expect(strategy.getPropertyName(null, "jump")).to.equal("jumpjump");
        });
    });
});