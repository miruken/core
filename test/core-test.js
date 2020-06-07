import { 
    Base, assignID, $isString,
    $isFunction, $flatten
} from "../src/base2";

import { Enum, Flags } from "../src/enum";

import { 
    Protocol, conformsTo, $protocols
} from "../src/protocol";

import {
    MethodType, $isClass, $decorator,
    $decorate, $decorated
} from "../src/core";

import { 
    $createQualifier, $eq, $lazy,
    $eval, $all, $optional, $use,
    $contents
} from "../src/qualifier";

import {
    Disposing, DisposingMixin,
    disposableMixin, $using
} from "../src/dispose";

import { design, returns } from "../src/design";
import { inject } from "../src/inject";

import { TypeInfo, TypeFlags } from "../src/type-info";
import { ArrayManager, IndexedList } from "../src/util";
import { debounce } from "../src/debounce";
import { createKeyChain } from "../src/privates";

import "reflect-metadata";
import "../src/promise";

import { expect } from "chai";

const _ = createKeyChain();

const Code  = Symbol(),
      Breed = Symbol();

const Animal = Protocol.extend({
    name:   "",
    [Code]: undefined,

    talk() {},
    eat(food) {},
    [Breed]() {}
});

class Person extends Base {
    firstName = ""
    lastName  = ""
    dob       = undefined
    pet       = undefined
    
    get fullName() {
        return this.firstName + " " + this.lastName;
    }
    set fullname(value) {
        const parts = value.split(" ");
        if (parts.length > 0) {
            this.firstName = parts[0];
        }
        if (parts.length > 1) {
            this.lastName = parts[1];
        }
    }
    get age() { return ~~((Date.now() - +this.dob) / (31557600000)); }
}

const Tricks = Protocol.extend({
    fetch (item) {}
});

const CircusAnimal = Animal.extend(Tricks, {
});

@conformsTo(Animal, Tricks)
class Dog extends Base {
    constructor(name, color) {
        super();
        _(this).name  = name;
        _(this).color = color;
    }

    get name()       { return  _(this).name; }
    set name(value)  { _(this).name = value; }
    get color()      { return _(this).color; }
    set color(value) { _(this).color = value; }    

    talk() { return "Ruff Ruff"; }
    fetch(item) { return "Fetched " + item; }
    get [Code]() { return 1234; }    
}

@conformsTo(CircusAnimal) 
class Elephant extends Base {
}

const Tracked = Protocol.extend({
	getTag() {}
});

@conformsTo(Tracked)
class AsianElephant extends Elephant {}

class ShoppingCart extends disposableMixin(Base) {
    constructor() {
        super();
        _(this).items = [];
    }

    getItems()    { return _(this).items; }
    addItem(item) { _(this).items.push(item); }
    _dispose()    { _(this).items = []; }    
}

describe("miruken", () => {
    it("should late bind", () => {
        class Pincher extends Dog {
            get name() { return "YO " + super.name; }
            set name(value) { super.name = value; }
        }
        const p = new Pincher("Poo");
        expect(p.name).to.equal("YO Poo");
        p.name = "Do";
        expect(p.name).to.equal("YO Do");        
    });

    const Math = class extends Base {
            static PI = 3.14159265359        
            static add(a, b) { return a + b; }
            static identity(v) { return v; }
          }, 
          Geometry = class extends Math {
            static area(length, width) {
                return length * width;
            }
            static identity(v) { 
                return super.identity(v) * 2;
            }
        };
    
    it("should inherit static members", () => {
        expect(Geometry.PI).to.equal(Math.PI);
        expect(Geometry.add).to.equal(Math.add);
        expect(Geometry.identity(2)).to.equal(4);
    });
});

describe("Enum", () => {
    const Color = Enum({red: 1, blue: 2, green: 3}),
        Message = Enum({run: "run", cancel: "cancel" });

    describe("#name", () => {
        it("should obtain name", () => {
            expect(Color.red.name).to.equal("red");
            expect(Color.blue.name).to.equal("blue");
            expect(Color.green.name).to.equal("green");
            expect(Message.run.name).to.equal("run");
            expect(Message.cancel.name).to.equal("cancel");                        
        });
    });
    
    describe("#value", () => {
        it("should obtain value", () => {
            expect(Color.red.value).to.equal(1);
            expect(Color.blue.value).to.equal(2);
            expect(Color.green.value).to.equal(3);
            expect(Message.run.value).to.equal("run");
            expect(Message.cancel.value).to.equal("cancel");            
        });
    });

    describe("#ordinal", () => {
        it("should obtain ordinal", () => {
            expect(Color.red.ordinal).to.equal(0);
            expect(Color.blue.ordinal).to.equal(1);
            expect(Color.green.ordinal).to.equal(2);
            expect(Message.run.ordinal).to.equal(0);
            expect(Message.cancel.ordinal).to.equal(1);
        });
    });

    describe("#valueOf", () => {
        it("should obtain value", () => {
            expect(Color.red.valueOf()).to.equal(1);
            expect(Color.blue.valueOf()).to.equal(2);
            expect(Color.green.valueOf()).to.equal(3);
            expect(Message.run.valueOf()).to.equal("run");
            expect(Message.cancel.valueOf()).to.equal("cancel");            
        });
    });

    describe("#unaryPlus", () => {
        it("should obtain number", () => {
            expect(+Color.red).to.equal(1);
            expect(+Color.blue).to.equal(2);
            expect(+Color.green).to.equal(3);
            expect(+Message.run).to.eql(NaN);
            expect(+Message.cancel).to.eql(NaN);            
        });
    });

    describe("#toString", () => {
        it("should convert to string", () => {
            expect(Color.red.toString()).to.equal("red");
            expect(Color.blue.toString()).to.equal("blue");
            expect(Color.green.toString()).to.equal("green");
            expect(Message.run.toString()).to.equal("run");
            expect(Message.cancel.toString()).to.equal("cancel");                        
        });
    });

    describe("#toJSON", () => {
        it("should obtain JSON value", () => {
            expect(Color.red.toJSON()).to.equal(1);
            expect(Color.blue.toJSON()).to.equal(2);
            expect(Color.green.toJSON()).to.equal(3);
            expect(Message.run.toJSON()).to.equal("run");
            expect(Message.cancel.toJSON()).to.equal("cancel");            
        });
    });

    describe("#names", () => {
        it("should obtain all names", () => {
            expect(Color.names).to.include("red", "blue", "green");
        });
    });

    describe("#fromValue", () => {
        it("should obtain enum from value", () => {
            expect(Color(1)).to.equal(Color.red);
            expect(Color("2")).to.equal(Color.blue);
            expect(Color(Color.green)).to.equal(Color.green);
            expect(Message("run")).to.equal(Message.run);
            expect(Message(Message.cancel)).to.equal(Message.cancel);
        });

        it("should throw exception if invalid value", () => {
            expect(() => {
                const color = Color(10);
            }).to.throw(Error, /10 is not a valid value for this Enum./);            
        });

        it("should throw exception if instantiated", () => {
            expect(() => {
                new Color(29);
            }).to.throw(TypeError, "Enums cannot be instantiated.");
        }); 
    });
    
    it("should support logical operations", () => {
        expect(Color.red == Color.red).to.be.true;
        expect(Color.red === Color.red).to.be.true
        expect(Color.red != Color.blue).to.be.true;
        expect(Color.red !== Color.blue).to.be.true;
        expect(Color.red < Color.blue).to.be.true;
        expect(Color.red <= Color.red).to.be.true;
        expect(Color.green > Color.blue).to.be.true;
        expect(Color.green >= Color.blue).to.be.true;
    });
    
    it("should reject enum construction", () => {
        expect(() => { 
            new Color(2);
        }).to.throw(Error, /Enums cannot be instantiated./);
    });

    it("should extend enum class", () => {
        Color.implement({
            get rgb() { return "#FFFFFF"; },
            get displayName() { return this.name; }
        });
        expect(Color.red.rgb).to.equal("#FFFFFF");
        expect(Color.green.displayName).to.equal("green");        
    });

    describe("Custom", () => {
        const Store = Enum(Store => ({
            amazon:  Store(13, "www.amazon.com"),
            target:  Store(24, "www.target.com"),
            walmart: Store(9,  "www.walmart.com")
        }), {
            constructor(code, website) {
                this.extend({
                    get code()    { return code; },
                    get website() { return website; }
                });
            },

            placeOrder(plu, quantity) {
                console.log(`Placing order for ${quantity} of '${plu}' from ${this.name} (${this.website})`);
            },
            toString() {
                return `Store ${this.name} (${this.code}) @ ${this.website}`;
            }
        });

        describe("#name", () => {
            it("should obtain name", () => {
                expect(Store.amazon.name).to.equal("amazon");
                expect(Store.target.name).to.equal("target");
                expect(Store.walmart.name).to.equal("walmart");
            });
        });
        
        describe("#ordinal", () => {
            it("should obtain ordinal", () => {
                expect(Store.amazon.ordinal).to.equal(0);
                expect(Store.target.ordinal).to.equal(1);
                expect(Store.walmart.ordinal).to.equal(2);
            });
        });

        describe("#state", () => {
            it("should obtain state", () => {
                expect(Store.amazon.code).to.equal(13);
                expect(Store.target.code).to.equal(24);
                expect(Store.walmart.code).to.equal(9);         
            });
        });

        describe("#valueOf", () => {
            it("should obtain value", () => {
                expect(Store.amazon.valueOf()).to.equal(Store.amazon);
                expect(Store.target.valueOf()).to.equal(Store.target);
                expect(Store.walmart.valueOf()).to.equal(Store.walmart);          
            });
        });

        describe("#unaryPlus", () => {
            it("should obtain number", () => {
                expect(+Store.amazon).to.eql(NaN);
                expect(+Store.target).to.eql(NaN);
                expect(+Store.walmart).to.eql(NaN);            
            });
        });
        
        describe("#toString", () => {
            it("should convert to string", () => {
                expect(Store.amazon.toString()).to.equal(
                    "Store amazon (13) @ www.amazon.com");
                expect(Store.target.toString()).to.equal(
                    "Store target (24) @ www.target.com");
                expect(Store.walmart.toString()).to.equal(
                    "Store walmart (9) @ www.walmart.com");                    
            });
        });

        describe("#toJSON", () => {
            it("should obtain JSON value", () => {
                expect(Store.amazon.toJSON()).to.equal(Store.amazon);
                expect(Store.target.toJSON()).to.equal(Store.target);
                expect(Store.walmart.toJSON()).to.equal(Store.walmart);   
            });
        });

        describe("#names", () => {
            it("should obtain all names", () => {
                expect(Store.names).to.include("amazon", "target", "walmart");
            });
        });

        it("should throw exception if instantiated", () => {
            expect(() => {
                new Store("Sears", 91);
            }).to.throw(TypeError, "Enums cannot be instantiated.");
        });

        describe("#methods", () => {
            it("should call methods", () => {
                Store.target.placeOrder("Q8714", 3);
            });
        });              
    });
});

describe("Flags", () => {
    const DayOfWeek = Flags({
        Monday:    1,
        Tuesday:   2,
        Wednesday: 4,
        Thursday:  8,
        Friday:    16,
        Saturday:  32,
        Sunday:    64,
        Weekday:   31,
        Weekend:   96
    });

    describe("#value", () => {
        it("should obtain value", () => {
            expect(DayOfWeek.Monday.value).to.equal(1);
            expect(DayOfWeek.Tuesday.value).to.equal(2);
        });

        it("should reject flag if not an integer", () => {
            expect(() => { 
                const BadFlags = Flags({
                    level: "DEBUG"
                });
            }).to.throw(TypeError, "Flag named 'level' has value 'DEBUG' which is not an integer");
        });
    });

    describe("#name", () => {
        it("should obtain name", () => {
            expect(DayOfWeek.Monday.name).to.equal("Monday");
            expect(DayOfWeek.Tuesday.name).to.equal("Tuesday");
            expect(DayOfWeek(21).name).to.equal("Monday,Wednesday,Friday");
            expect(DayOfWeek.Weekend.name).to.equal("Weekend");            
        });
    });

    describe("#valueOf", () => {
        it("should obtain value", () => {
            expect(DayOfWeek.Friday.valueOf()).to.equal(16);
            expect(DayOfWeek.Weekend.valueOf()).to.equal(96);            
        });
    });

    describe("#unaryPlus", () => {
        it("should obtain number", () => {
            expect(+DayOfWeek.Friday).to.equal(16);
            expect(+DayOfWeek.Weekend).to.equal(96);            
        });
    });

    describe("#toString", () => {
        it("should convert to string", () => {        
            expect(DayOfWeek.Wednesday.toString()).to.equal("Wednesday");
            expect(DayOfWeek(21).toString()).to.equal("Monday,Wednesday,Friday");
            expect(DayOfWeek.Weekend.toString()).to.equal("Weekend");            
        });
    });
    
    describe("#toJSON", () => {
        it("should obtain JSON value", () => {
            expect(DayOfWeek.Friday.toJSON()).to.equal(16);
            expect(DayOfWeek.Weekend.toJSON()).to.equal(96);           
        });
    });

    describe("#names", () => {
        it("should obtain all names", () => {
            expect(DayOfWeek.names).to.include(
                "Monday", "Tuesday", "Wednesday",
                "Thursday", "Friday", "Saturday", "Sunday");            
        });
    });

    describe("#fromValue", () => {
        it("should obtain enum from value", () => {
            expect(DayOfWeek(1)).to.equal(DayOfWeek.Monday);
            expect(DayOfWeek("4")).to.equal(DayOfWeek.Wednesday);
            expect(DayOfWeek(DayOfWeek.Friday) === DayOfWeek.Friday).to.be.true;
            expect(DayOfWeek(21).value).to.equal(21);
            expect(DayOfWeek.Saturday | DayOfWeek.Sunday).to.equal(+DayOfWeek.Weekend);
            expect(DayOfWeek(DayOfWeek.Saturday | DayOfWeek.Sunday)).to.equal(DayOfWeek.Weekend);            
        });        
    });

    describe("#hasFlag", () => {
        it("should test enum flag", () => {
            expect(DayOfWeek.Tuesday.hasFlag(DayOfWeek.Tuesday)).to.be.true;
            expect(DayOfWeek(8).hasFlag(DayOfWeek.Thursday)).to.be.true;
            expect(DayOfWeek(16).hasFlag(DayOfWeek.Monday)).to.be.false;
            expect(DayOfWeek.Weekend.hasFlag(DayOfWeek.Sunday)).to.be.true;
            expect(DayOfWeek.Weekday.hasFlag(2)).to.be.true;            
        });        
    });    
});

describe("IndexedList", () => {
    let list;
    beforeEach(() => {
        list = new IndexedList();
    });

    class Item extends Base {
        constructor(value) {
            super();
            this.value = value;
        }
    }

    it("should determine if empty", () => {
        expect(list.isEmpty).to.be.true;
        list.insert(new Item(19), 19);
        expect(list.isEmpty).to.be.false;
    });

    it("should insert new item", () => {
        const item = new Item(19);
        list.insert(item, 19);
        expect(list.getFirst(19)).to.equal(item);
    });

    it("should check for node", () => {
        const item = new Item(19);
        list.insert(item, 19);
        expect(list.has(item)).to.be.true;
        expect(list.has(new Item("ABC"))).to.be.false;
    });
 
    it("should remove node", () => {
        const item = new Item("123");
        list.insert(item, 123);
        expect(list.getFirst(123)).to.equal(item);
        list.remove(item);
        expect(list.getFirst(123)).to.be.undefined;
    });

    it("should iterate list", () => {
        const item = new Item(19);
        list.insert(item, 19);
        expect([...list]).to.eql([item]);
    });

    it("should iterate list from an index", () => {
        const item1 = new Item(50),
              item2 = new Item("50"),
              item3 = new Item(49);
        list.insert(item3, 49);
        list.insert(item1, 50);
        list.insert(item2, 50);
        let [x,y,z] = [...list];
        expect(x).to.equal(item3);
        expect(y).to.equal(item1);
        expect(z).to.equal(item2);  
        [x,y,z] = [...list.fromIndex(50)];
        expect(x).to.equal(item1);
        expect(y).to.equal(item2);
        expect(z).to.be.undefined;
    });

    it("should merge lists", () => {
        const item = new Item(19);
        list.insert(item, 19);
        const otherList = new IndexedList(),
              item2 = new Item(28);
        otherList.insert(item2, 28);
        list.merge(otherList);
        expect([...list]).to.eql([item, item2]);
        expect([...otherList]).to.eql([]);
    });

    it("should merge lists with copy", () => {
        const item = new Item(19);
        list.insert(item, 19);
        const otherList = new IndexedList(),
              item2 = new Item(28);
        otherList.insert(item2, 28);
        list.merge(otherList, item => new Item(item.value + 1));
        expect([...list]).to.not.eql([item, item2]);
        expect([...otherList]).to.eql([item2]);
    });
});

describe("ArrayManager", () => {
    let arrayMgr;
    beforeEach(() => {
        arrayMgr = new ArrayManager();
    });

    it("should append new item", () => {
        arrayMgr.append(28);
        expect(arrayMgr.getIndex(0)).to.equal(28);
    });

    it("should iterate array", () => {
        arrayMgr.append("xyz", "789");
        expect([...arrayMgr]).to.eql(["xyz", "789"]);
    });   
});

describe("$isClass", () => {
    it("should identify miruken classes", () => {
        expect($isClass(Dog)).to.be.true;
    });
});

describe("$isFunction", () => {
    it("should identify functions", () => {
        const fn = () => {};
        expect($isFunction(fn)).to.be.true;
    });

    it("should reject no functions", () => {
        expect($isFunction(1)).to.be.false;
        expect($isFunction("hello")).to.be.false;
    });
});

describe("Disposing", () => {
    it("should adopt Disposing protocol", () => {
        expect(Disposing.isAdoptedBy(ShoppingCart)).to.be.true;
    });

    it("should provide dispose", () => {
        const shoppingCart = new ShoppingCart();
        shoppingCart.addItem("Sneakers");
        shoppingCart.addItem("Milk");
        expect(shoppingCart.getItems()).to.have.members(["Sneakers", "Milk"]);
        shoppingCart.dispose();
        expect(shoppingCart.getItems()).to.eql([]);
    });

    it("should only dispose once", () => {
        let counter = 0;
        class DisposeCounter extends disposableMixin(Base) {
            _dispose() { ++counter; }
        }
        const disposeCounter = new DisposeCounter();
        expect(counter).to.equal(0);
        disposeCounter.dispose();
        expect(counter).to.equal(1);
        disposeCounter.dispose();
        expect(counter).to.equal(1);
    });
});

describe("$using", () => {
    it("should call block then dispose", () => {
        const shoppingCart = new ShoppingCart();
        shoppingCart.addItem("Halo II");
        shoppingCart.addItem("Porsche");
        $using(shoppingCart, cart => {
            expect(shoppingCart.getItems()).to.have.members(["Halo II", "Porsche"]);
        });
        expect(shoppingCart.getItems()).to.eql([]);
    });
    
    it("should call block then dispose if exeception", () => {
        const shoppingCart = new ShoppingCart();
        shoppingCart.addItem("Halo II");
        shoppingCart.addItem("Porsche");
        expect(() => { 
            $using(shoppingCart, cart => {
                throw new Error("Something bad");
            });
        }).to.throw(Error, "Something bad");
        expect(shoppingCart.getItems()).to.eql([]);
    });

    it("should wait for promise to fulfill then dispose", done => {
        const shoppingCart = new ShoppingCart();
        shoppingCart.addItem("Halo II");
        shoppingCart.addItem("Porsche");
        $using(shoppingCart, Promise.delay(100).then(() => {
               shoppingCart.addItem("Book");
               expect(shoppingCart.getItems()).to.have.members(["Halo II", "Porsche", "Book"]);
               }) 
        ).finally(() => {
            expect(shoppingCart.getItems()).to.eql([]);
            done();
        });
    });

    it("should wait for promise fromm block to fulfill then dispose", done => {
        const shoppingCart = new ShoppingCart();
        shoppingCart.addItem("Halo II");
        shoppingCart.addItem("Porsche");
        $using(shoppingCart, cart => {
               return Promise.delay(100).then(() => {
                   shoppingCart.addItem("Book");
                   expect(shoppingCart.getItems()).to.have.members(["Halo II", "Porsche", "Book"]);
               })
        }).finally(() => {
            expect(shoppingCart.getItems()).to.eql([]);
            done();
        });
    });
    
    it("should wait for promise to fail then dispose", done => {
        const shoppingCart = new ShoppingCart();
        shoppingCart.addItem("Halo II");
        shoppingCart.addItem("Porsche");
        $using(shoppingCart, Promise.delay(100).then(() => {
               throw new Error("Something bad");
               })
        ).catch(err => {
            expect(shoppingCart.getItems()).to.eql([]);
            done();
        });
    });

    it("should return block result", () => {
        const shoppingCart = new ShoppingCart();
        shoppingCart.addItem("Halo II");
        shoppingCart.addItem("Porsche");
        expect($using(shoppingCart, cart => "approved")).to.equal("approved");
    });

    it("should return block promise result", done => {
        const shoppingCart = new ShoppingCart();
        shoppingCart.addItem("Halo II");
        shoppingCart.addItem("Porsche");
        $using(shoppingCart, cart => Promise.delay(100)
               .then(() => "approved")).then(result => {
            expect(result).to.equal("approved");
            done();
        });
    });
    
    it("should return dispose result if present", () => {
        const shoppingCart = (new ShoppingCart).extend({
            dispose() {
                this.base();
                return "rejected";
            }
        });
        shoppingCart.addItem("Halo II");
        shoppingCart.addItem("Porsche");
        expect($using(shoppingCart, cart =>  "approved")).to.equal("rejected");
    });

    it("should return dispose promise result", done => {
        const shoppingCart = (new ShoppingCart).extend({
            dispose() {
                this.base();
                return Promise.resolve("rejected");
            }
        });
        shoppingCart.addItem("Halo II");
        shoppingCart.addItem("Porsche");
        $using(shoppingCart, cart => "approved").then(result => {
            expect(result).to.equal("rejected");
            done();
        });
    });    
});

describe("$decorator", () => {
    it("should create a decorator", () => {
        const dog  = new Dog("Snuffy"),
              echo = $decorator({
                get name() {
                    return this.base() + " " + this.base();
                }
            }),
            dogEcho = echo(dog);
        expect(dogEcho.name).to.equal("Snuffy Snuffy");
        expect(dogEcho).to.be.an.instanceof(Dog);        
    });
});

describe("$decorate", () => {
    it("should decorate an instance", () => {
        const dog     = new Dog("Sparky"),
              reverse = $decorate(dog, {
                get name() {
                    return this.base().split("").reverse().join("");
                }
            });
        expect(reverse.name).to.equal("ykrapS");
        expect(reverse).to.be.an.instanceof(Dog);
    });

    it("should decorate an instance with new property", () => {
        const dog = new Dog("Sparky"),
              add = $decorate(dog, {
                  name: "Sputnik",
                  appearance: {
                      eyes:  "brown",
                      color: "white"
                  }
            });
        expect(add.name).to.equal("Sputnik");
        expect(add.appearance.eyes).to.equal("brown");
        expect(add.appearance.color).to.equal("white");
        expect(add).to.be.an.instanceof(Dog);
    });
});

describe("$decorated", () => {
    it("should return nearest decorated instance", () => {
        const dog        = new Dog("Brutus"),
              decorator  = $decorate(dog),
              decorator2 = $decorate(decorator);
        expect($decorated(decorator)).to.equal(dog);
        expect($decorated(decorator2)).to.equal(decorator);
    });

    it("should return deepest decorated instance", () => {
        const dog       = new Dog("Brutus"),
             decorator = $decorate($decorate(dog));
        expect($decorated(decorator, true)).to.equal(dog);
    });
});

describe("$flatten", () => {
    it("should ignore if not an array", () => {
        expect($flatten("hello")).to.equal("hello");
    });

    it("should preserve flattened arrays", () => {
        expect($flatten([1,2,null,3])).to.eql([1,2,null,3]);
    });

    it("should flatten arrays", () => {
        expect($flatten([[1,2],[3,4]])).to.eql([1,2,3,4]);
    });

    it("should flatten deep arrays", () => {
        expect($flatten([[[1,"a"],[2,"b"]],[[3,"c"],4]])).to.eql([1,"a",2,"b",3,"c",4]);
    });

    it("should prune arrays", () => {
        expect($flatten([1,2,null,3], true)).to.eql([1,2,3]);
    });

    it("should prune deep arrays", () => {
        expect($flatten([1,[2,[3,null]],null,[4,[null,5]]], true)).to.eql([1,2,3,4,5]);
    });    
});

function required(key) {
  return function (target, propertyKey, parameterIndex) {
    const metadata = `meta_${propertyKey}`;
    target[metadata] = [
      ...(target[metadata] || []),
      {
        index: parameterIndex,
        key
      }
    ]
  };
}

describe("Qualifier", () => {
    describe("$createQualifier", () => {
        it("should create a new qualifier", () => {
            const wrap = $createQualifier("wrap");
            expect(wrap.getArgs).to.be.a("function");
        });

        it("should add a qualifier using function call", () => {
            const wrap    = $createQualifier("wrap"),
                  wrapped = wrap(22);
            expect(wrap.test(wrapped)).to.be.true;
            expect(wrapped.$getContents()).to.equal(22);
        });
        
        it("should not add a qualifier using new operator", () => {
            const wrap = $createQualifier("wrap");
            expect(() => { 
                new wrap(22);
            }).to.throw(Error, /Qualifiers should not be called with the new operator./);
        });
        
        it("should ignore qualifier if already present", () => {
            const wrap    = $createQualifier("wrap"),
                  wrapped = wrap(wrap("soccer")),
                  content = Object.getPrototypeOf(wrapped);
            expect(content).to.be.instanceOf($contents);
        });
    })

    describe("#test", () => {
        it("should test chained qualifiers", () => {
            const shape = $createQualifier("shape"),
                  wrap  = $createQualifier("wrap"),
                  roll  = $createQualifier("roll"),
                  chain = shape(wrap(roll(19)));
            expect(shape.test(chain)).to.be.true;
            expect(wrap.test(chain)).to.be.true;
            expect(roll.test(chain)).to.be.true;
        });
    });

    describe("$contents", () => {
        it("should return input if no qualifiers", () => {
            expect($contents("Hello")).to.equal("Hello");
        });

        it("should obtain qualifier contents", () => {
            const shape = $createQualifier("shape"),
                  wrap  = $createQualifier("wrap"),
                  roll  = $createQualifier("roll"),
                  chain = shape(wrap(roll(19)));
            expect($contents(chain)).to.equal(19);
        });
    });
    
    describe("visit", () => {
        it("should visit $contents with input", () => {
            const output = new $contents("Hello").visit(function (input) {
                expect(this).to.equal($contents);
                return input;
            });
            expect(output).to.equal("Hello");
        });

        it("should visit qualifier pipeline", () => {
            const output = $eq("Hello").visit(function (input) {
                if (this === $contents) {
                    return input + " Craig";
                } else if (this === $eq) {
                    return `(${input})`;
                }
                return input;
            });
            expect(output).to.equal("(Hello Craig)");
        });

        it("should visit qualifier pipeline with state", () => {
            const output = $use("Hello", 19).visit(function (input, state) {
                if (this === $contents) {
                    return input + " World";
                } else if (this === $use) {
                    return `${input} ${state[0]}`;
                }
                return input;
            });
            expect(output).to.equal("Hello World 19");
        });        
    });    
});

describe("Protocol", () => {
    it("should proxy calls to properties", () => {
        const dog = Animal(new Dog("Bowser"));
        expect(dog.name).to.equal("Bowser");
    });
    
    it("should proxy calls to methods", () => {
        const dog = Animal(new Dog());
        expect(dog.talk()).to.equal("Ruff Ruff");
    });
    
    it("should ignore null or undefined target", () => {
        Animal().talk();
        Animal(null).talk();
    });
    
    it("should ignore missing methods", () => {
        const dog = Animal(new Dog());
        dog.eat("bug");
    });
    
    it("should support specialization", () => {
        expect(CircusAnimal(new Dog()).fetch("bone")).to.equal("Fetched bone");
    });
     
    describe("#isProtocol", () => {
        it("should determine if type is a protocol", () => {
            expect(Protocol.isProtocol(Animal)).to.be.true;
            expect(Protocol.isProtocol(CircusAnimal)).to.be.true;
            expect(Protocol.isProtocol(Dog)).to.be.false;
            expect(Protocol.isProtocol(AsianElephant)).be.false;
        });

        it("should not consider Protocol a protocol", () => {
            expect(Protocol.isProtocol(Protocol)).to.be.false;
        });
    });

    describe("$protocols", () => {
        it("should retrieve own protocols", () => {
            expect($protocols(Dog, true)).to.have.members([Animal, Tricks]);
        });

        it("should retrieve all protocol protocols", () => {
            expect($protocols(CircusAnimal)).to.have.members([Animal, Tricks]);
        });

        it("should retrieve all class protocols", () => {
            expect($protocols(AsianElephant)).to.have.members([Tracked, CircusAnimal, Animal, Tricks]);
        });        
    });

    describe("#implement", () => {
        it("should extend protocol", () => {
            Animal.implement({
               reproduce() {}
            });
            const dog = new Dog();
            expect(Animal(dog).reproduce()).to.be.undefined;
            dog.extend({
                reproduce() {
                    return new Dog("Hazel");
                }
            });
            expect(Animal(dog).reproduce().name).to.equal("Hazel");
        });
    });

    describe("#extend", () => {
        it("should extend protocol instance", () => {
            const dog    = new Dog(),
                  animal = Animal(dog).extend({
                               reproduce() {}                
                           });
            expect(animal.reproduce()).to.be.undefined;
            dog.extend({
                reproduce() {
                    return new Dog("Hazel");
                }
            });
            expect(animal.reproduce().name).to.equal("Hazel");
        });
    });

    describe("#isAdoptedBy", () => {
        it("should determine if protocol adopted by class", () => {
            expect(Animal.isAdoptedBy(Dog)).to.be.true;
        });

        it("should determine if protocol adopted by protocol", () => {
            expect(Protocol.isAdoptedBy(Animal)).to.be.true;
            expect(Tricks.isAdoptedBy(Animal)).to.be.false;
            expect(Animal.isAdoptedBy(CircusAnimal)).to.be.true;
        });

        it("should determine if protocol adopted by object", () => {
            expect(Animal.isAdoptedBy(new Dog())).to.be.true;
        });

        it("should conform to protocols by class", () => {
			expect(Animal.isAdoptedBy(Dog)).to.be.true;
		    expect(Tricks.isAdoptedBy(Dog)).to.be.true;
        });

        it("should conform to protocols by protocol", () => {
            expect(Animal.isAdoptedBy(CircusAnimal)).to.be.true;
            expect(Tricks.isAdoptedBy(CircusAnimal)).to.be.true;
            expect(Tricks.isAdoptedBy(Animal)).to.be.false;
            expect(CircusAnimal.isAdoptedBy(CircusAnimal)).to.be.true;
        });

        it("should conform to protocols by object", () => {
            const dog = new Dog();
            expect(Animal.isAdoptedBy(dog)).to.be.true;
        });

        it("should only list protocol once", () => {
            @conformsTo(Animal, Animal)
            class Cat extends Base {}
            expect(Animal.isAdoptedBy(Cat)).to.be.true;
            expect($protocols(Cat, true)).to.eql([Animal]);
        });

        it("should only list protocol once if extended", () => {
            const Cat = Animal.extend(Animal);
            expect(Animal.isAdoptedBy(Cat)).to.be.true;
            expect($protocols(Cat, true)).to.eql([Animal]);
        });

        it("should support protocol inheritance", () => {
            expect(Animal.isAdoptedBy(Elephant)).to.be.true;
            expect($protocols(CircusAnimal, true)).to.have.members([Animal, Tricks]);
        });

        it("should inherit protocol conformance", () => {
            expect(Animal.isAdoptedBy(AsianElephant)).to.be.true;
            expect(Tricks.isAdoptedBy(AsianElephant)).to.be.true;
        });

        it("should accept array of protocols", () => {
            const EndangeredAnimal = Base.extend([Animal, Tracked]);
            expect(Animal.isAdoptedBy(EndangeredAnimal)).to.be.true;
            expect(Tracked.isAdoptedBy(EndangeredAnimal)).to.be.true;
            expect($protocols(EndangeredAnimal, true)).to.have.members([Animal, Tracked]);
        });

        it("should conformsTo array of protocols", () => {
            @conformsTo(Animal, Tracked)
            class EndangeredAnimal extends Base {};
            expect(Animal.isAdoptedBy(EndangeredAnimal)).to.be.true;
            expect(Tracked.isAdoptedBy(EndangeredAnimal)).to.be.true;
            expect($protocols(EndangeredAnimal, true)).to.have.members([Animal, Tracked]);
        });

        it("should allow redefining method", () => {
            const SmartTricks = Tricks.extend({
                    fetch(item) {}
                }),
                SmartDog = class extends Dog {
                    fetch(item) { return "Buried " + item; }
                },
                dog = new SmartDog();
            expect(SmartTricks(dog).fetch("bone")).to.equal("Buried bone");
        });
    });

    describe("#adoptProtocol", () => {
        it("should add protocol to class", () => {
            const Bird  = @conformsTo(Animal) class extends Base {},
                  eagle = (new Bird()).extend({
                     getTag() { return "Eagle"; }
				  });
            Tracked.adoptBy(Bird);
            expect(Tracked.isAdoptedBy(Bird)).to.be.true;
			expect(eagle.getTag()).to.equal("Eagle");
        });

        it("should add protocol to protocol", () => {
            const Bear      = @conformsTo(Animal) class extends Base {},
                  polarBear = (new Bear()).extend({
                  getTag() { return "Polar Bear"; }
            });
			Tracked.adoptBy(Animal);
            expect(Tracked.isAdoptedBy(polarBear)).to.be.true;
			expect(polarBear.getTag()).to.equal("Polar Bear");
			expect(Animal(polarBear).getTag()).to.equal("Polar Bear");
        });
    })

    describe("#delegate", () => {
        it("should delegate invocations to object", () => {
            const dog = new Dog("Fluffy");
            expect(Animal(dog).talk()).to.equal("Ruff Ruff");
        });

        it("should delegate invocations to array", () => {
            let count  = 0;
            const Dog2 = class extends Dog {
                      talk() {
                          ++count;
                          return super.talk();
                      }
                  },
                  dogs = [new Dog2("Fluffy"), new Dog2("Max")];
            expect(Animal(dogs).talk()).to.equal("Ruff Ruff");
            expect(count).to.equal(2);
        });        
    });

    describe("#delegateGet", () => {
        it("should delegate property gets to object", () => {
            const dog  = new Dog("Franky");
            expect(Animal(dog).name).to.equal("Franky");
            expect(Animal(dog)[Code]).to.equal(1234);
            expect(CircusAnimal(dog).name).to.equal("Franky");
        });
        
        it("should delegate property gets to array", () => {
            let count = 0;
            const Dog2  = class extends Dog {
                     get name() {
                         ++count;
                         return super.name;
                      } 
                  },            
                  dogs = [new Dog2("Franky"), new Dog2("Spot")];
            expect(Animal(dogs).name).to.equal("Spot");
            expect(count).to.equal(2);
        });        
    });

    describe("#delegateSet", () => {
        it("should delegate property sets to object", () => {
            const dog = new Dog("Franky");
            Animal(dog).name = "Ralphy";
            expect(dog.name).to.equal("Ralphy");
        });

        it("should delegate property sets to array", () => {
            let count  = 0;
            const Dog2 = class extends Dog {
                     get name() {
                         ++count;
                         return super.name;
                     }
                     set name(value) { super.name = value; }
                  },
                  dogs = [new Dog2("Franky"), new Dog2("Pebbles")];
            Animal(dogs).name = "Ralphy";
            expect(dogs[0].name).to.equal("Ralphy");
            expect(dogs[1].name).to.equal("Ralphy");
            expect(count).to.equal(2);            
        });
        
        it("should delegate extended property sets", () => {
            const dog  = new Dog("Franky");
            Animal.implement({
                nickname: undefined
            });
            dog.extend({
                nickname: ""
            });
            Animal(dog).nickname = "HotDog";
            expect(dog.nickname).to.equal("HotDog");
        });
    });
});

describe("@design", () => {
    const Zoo = @design(Person, [Animal])
            class extends Base {
                @design(Person)
                trainer = undefined
    
                constructor(zooKeeper, animals) {
                    super();
                }

                @design(Person)
                get doctor() { return _(this).doctor; }
                set doctor(value) { _(this)._doctor = value; }
         
                @design(Dog, Elephant, AsianElephant)
                safari(dog, elephant, asianElephant) {}

                @design(Dog, Elephant, $optional(AsianElephant))
                @returns(Animal) race(dog, elephant, asianElephant) {
                    return dog;
                }
          },
          PettingZoo =  
            @design(Person, Person, [Animal])
            class extends Zoo {
                constructor(zooKeeper, trainer, animals) {
                    super(zooKeeper, animals);
                }
            };

    it("should get constructor design", () => {
        const { args } = design.get(Zoo.prototype, "constructor");
        expect(args[0].type).to.equal(Person);
        expect(args[1].type).to.equal(Animal);
        expect(args[1].flags.hasFlag(TypeFlags.Array)).to.be.true;  
    });

    it("should get constructor function design", () => {
        const { args } = design.get(Zoo);
        expect(args[0].type).to.equal(Person);
        expect(args[1].type).to.equal(Animal);
        expect(args[1].flags.hasFlag(TypeFlags.Array)).to.be.true;  
    });

    it("should get method design", () => {
        const { args } = design.get(Zoo.prototype, "safari");
        expect(args[0].type).to.equal(Dog);
        expect(args[1].type).to.equal(Elephant);
        expect(args[2].type).to.equal(AsianElephant);
    });

    it("should get method design with return", () => {
        const { args, returnType } = design.get(Zoo.prototype, "race");
        expect(returnType.type).to.equal(Animal);
        expect(args[0].type).to.equal(Dog);
        expect(args[1].type).to.equal(Elephant);
        expect(args[2].type).to.equal(AsianElephant);
        expect(args[2].flags.hasFlag(TypeFlags.Optional)).to.be.true;
    });
    
    it("should get field design", () => {
        const u = 1;
        const { propertyType } = design.get(Zoo.prototype, "trainer");
        expect(propertyType.type).to.equal(Person);
    });

    it("should get property design", () => {
        const { propertyType } = design.get(Zoo.prototype, "doctor");
        expect(propertyType.type).to.equal(Person);     
    });
        
    it("should apply class design to constructor", () => {
        const u = 1;
        const { args } = design.get(PettingZoo);
        expect(args[0].type).to.equal(Person);
        expect(args[1].type).to.equal(Person);        
        expect(args[2].type).to.equal(Animal);
        expect(args[2].flags.hasFlag(TypeFlags.Array)).to.be.true;  
    });
 
    it("should reject design if missing property type", () => {
        expect(() => {
            class _ extends Base {
                @design
                friend = undefined
            }
        }).to.throw(Error, "@design for property 'friend' expects a single property type.");
    });

    it("should reject property design on both getter and setter", () => {
        expect(() => {
            class Farm extends Base {
                @design(Person)
                get farmer() {}
                @design(Person)            
                set farmer(value) {}
            };
        }).to.throw(Error, "@design for property 'farmer' should only be specified on getter or setter.");        
    });

    it("should reject constructor @returns", () => {
        expect(() => {
            Base.extend({
                @returns constructor() {}
            });  
        }).to.throw(SyntaxError, "@returns cannot be applied to constructors.");
    });

    it("should reject properties @returns", () => {
        expect(() => {
            Base.extend({
                @returns(Number) get age() {}
            });  
        }).to.throw(SyntaxError, "@returns ('age') cannot be applied to properties.");
    });

    it("should reject missing @returns type", () => {
        expect(() => {
            Base.extend({
                @returns foo() {}
            });  
        }).to.throw(SyntaxError, "@returns for method 'foo' expects a single return type.");
    });

    it("should reject invalid @returns type", () => {
        expect(() => {
            Base.extend({
                @returns(22) foo() {}
            });  
        }).to.throw(TypeError, "The type is not a constructor function.");
    });

    it("should reject invalid array specifications", () => {
        expect(() => {
            Base.extend({
                @design(Person, [Person, Person])
                sing(conductor, chorus) {} 
            });
        }).to.throw(Error, "Array type specification expects a single type.");
    });

    describe("typescript", () => {
        class Park extends Base {
            get hasSlide() { return true; }

            swing(child) {
                return child.firstName;
            }
        }

        Reflect.defineMetadata("design:type", Boolean, Park.prototype, "hasSlide");
        Reflect.defineMetadata("design:paramtypes", [Person], Park.prototype, "swing");
        Reflect.defineMetadata("design:returnType", String, Park.prototype, "swing");

        it("should infer typescript method metadata", () => {
            const { args, returnType } = design.get(Park.prototype, "swing");
            expect(args[0].type).to.equal(Person);
            expect(returnType.type).to.equal(String);
        });
 
        it("should infer typescript property metadata", () => {
            const { propertyType } = design.get(Park.prototype, "hasSlide");
            expect(propertyType.type).to.equal(Boolean);
        });
    }); 
});

describe("@inject", () => {
    const Circus = Base.extend({
              @inject($all(Animal))        
              constructor(animals) {},
        
              @inject(Dog)
              dancingDog(Dance) {},
        
              @inject($all(Elephant))
              elpehantParade(elephant) {}
          }),
          RingBrothers = Circus.extend(inject(undefined, Person), {
              constructor(animals, ringMaster) {},
          });
    
    it("should get class dependencies", () => {
        const dep = inject.get(Circus.prototype, "dancingDog");
        expect(dep).to.eql([Dog]);
    });

    it("should get dependencies with qualifiers", () => {
        const dep = inject.get(Circus.prototype, "elpehantParade");
        expect($all.test(dep[0])).to.be.true;
        expect($contents(dep[0])).to.equal(Elephant);
    });

    it("should get constructor dependencies", () => {
        const dep = inject.get(Circus.prototype, "constructor");
        expect($all.test(dep[0])).to.be.true;
        expect($contents(dep[0])).to.equal(Animal);
    });

    it("should apply class dependencies to constructor", () => {
        const dep = inject.get(RingBrothers.prototype, "constructor");
        expect(dep).to.eql([undefined, Person]);
    });

    it("should get own class dependencies", () => {
        const dep = inject.getOwn(RingBrothers.prototype, "dancingDog");
        expect(dep).to.be.undefined;
    });

    it("should get all dependencies", () => {
        const deps = new Map();
        inject.getKeys(RingBrothers.prototype, (d, k) => deps.set(k, d));
        expect(deps.get("dancingDog")).to.eql([Dog]);
        expect($all.test(deps.get("elpehantParade")[0])).to.be.true;
        expect($contents(deps.get("elpehantParade")[0])).to.equal(Elephant);
        expect(deps.get("constructor")).to.eql([undefined, Person]);        
    });

    it("should get own dependencies", () => {
        const deps = new Map();
        inject.getOwnKeys(RingBrothers.prototype, (d, k) => deps.set(k, d));
        expect(deps.get("dancingDog")).to.be.undefined;
        expect(deps.get("elpehantParade")).to.be.undefined;
        expect(deps.get("constructor")).to.eql([undefined, Person]);
        inject.getOwnKeys(Circus.prototype, (d, k) => deps.set(k,d));
        expect(deps.get("dancingDog")).to.eql([Dog]);
    });            
});

describe("@debounce", () => {
    class System extends Base {
              constructor() {
                  super();
                  this.calls = 0;
              }

              @debounce(10)
              lookup(word) { this.calls++; }

              @debounce(10, true)
              api(command) { this.calls++; }
          };

    let system;
    beforeEach(() => {
        system = new System();
    });
    
    it("should debounce methods", done => {
        for (let i = 0; i < 10; ++i) {
            system.lookup("improving");
        }
        expect(system.calls).to.eql(0);        
        setTimeout(() => {
            expect(system.calls).to.eql(1);
            done();
        }, 20);
    });

    it("should debounce methods immediate", () => {
        for (let i = 0; i < 10; ++i) {
            system.api("fetch");
        }
        expect(system.calls).to.eql(1);
    });    
});

describe("TypeInfo", () => {
    it("should parse protocol", () => {
        const argument = TypeInfo.parse(Animal);
        expect(argument.type).to.equal(Animal);
        expect(argument.flags.hasFlag(TypeFlags.Protocol)).to.be.true;
    });

    it("should parse array construct", () => {
        const argument = TypeInfo.parse([Animal]);
        expect(argument.type).to.equal(Animal);
        expect(argument.flags.hasFlag(TypeFlags.Array)).to.be.true;
    });

    it("should parse with array construct", () => {
        const argument = TypeInfo.parse([Animal]);
        expect(argument.type).to.equal(Animal);
        expect(argument.flags.hasFlag(TypeFlags.Array)).to.be.true;
    });

    it("should parse without qualifiers", () => {
       const argument = TypeInfo.parse(Animal);
       expect(argument.type).to.equal(Animal);
    });

    it("should parse with qualifiers", () => {
        const argument = TypeInfo.parse($eq($lazy(Animal)));
        expect(argument.type).to.equal(Animal);
        expect(argument.flags.hasFlag(TypeFlags.Invariant)).to.be.true;
        expect(argument.flags.hasFlag(TypeFlags.Lazy)).to.be.true;
    });

    it("should parse with $optional qualifier", () => {
        const argument = TypeInfo.parse($optional(Animal));
        expect(argument.type).to.equal(Animal);
        expect(argument.flags.hasFlag(TypeFlags.Optional)).to.be.true;
    });

    it("should parse with $all qualifier", () => {
        const argument = TypeInfo.parse($all(Animal));
        expect(argument.type).to.equal(Animal);
        expect(argument.flags.hasFlag(TypeFlags.Array)).to.be.true;
    }); 

    it("should fail invalid array construct", () => {
        expect(() => {
            TypeInfo.parse([Animal, 1]);
        }).to.throw(SyntaxError, "Array type specification expects a single type."); 
    });

    describe("#validate", () => {
        class TestValidator extends Base {
            @design(Boolean, Number, String)
            primitive(bool, number, string) {}

            @design(Animal, Elephant, [String], [Person])
            complex(animal, elephant, strings, people) {}

            @design($optional(Number), $optional(Animal), $optional(Elephant))
            optional(number, animal, elephant) {}
        };

        it("should validate boolean", () => {
            const { args: [bool] } = design.get(TestValidator.prototype, "primitive");
            expect(bool.validate(true)).to.be.true;
            expect(bool.validate(false)).to.be.true;
            expect(bool.validate(new Boolean(true))).to.be.true;
            expect(bool.validate(22)).to.be.false;
            expect(bool.validate("hello")).to.be.false;
            expect(bool.validate(null)).to.be.false;
            expect(bool.validate()).to.be.false;
        });

        it("should validate number", () => {
            const { args: [b, number] } = design.get(TestValidator.prototype, "primitive");
            expect(number.validate(19)).to.be.true;
            expect(number.validate(100.3)).to.be.true;
            expect(number.validate(new Number(255))).to.be.true;
            expect(number.validate(true)).to.be.false;
            expect(number.validate(false)).to.be.false;
            expect(number.validate("hello")).to.be.false;
            expect(number.validate(null)).to.be.false;
            expect(number.validate()).to.be.false;
        });

        it("should validate string", () => {
            const { args: [b, n, string] } = design.get(TestValidator.prototype, "primitive");
            expect(string.validate("hello")).to.be.true;
            expect(string.validate(new String("world"))).to.be.true;
            expect(string.validate(19)).to.be.false;
            expect(string.validate(100.3)).to.be.false;
            expect(string.validate(new Number(255))).to.be.false;
            expect(string.validate(true)).to.be.false;
            expect(string.validate(false)).to.be.false;
            expect(string.validate(null)).to.be.false;
            expect(string.validate()).to.be.false;
        });

        it("should validate protocol", () => {
            const { args: [animal] } = design.get(TestValidator.prototype, "complex");
            expect(animal.validate(new Dog())).to.be.true;
            expect(animal.validate(new Elephant())).to.be.true;
            expect(animal.validate(false)).to.be.false;
            expect(animal.validate(new Boolean(true))).to.be.false;
            expect(animal.validate(22)).to.be.false;
            expect(animal.validate("hello")).to.be.false;
            expect(animal.validate(null)).to.be.false;
            expect(animal.validate()).to.be.false;
        });

        it("should validate class instance", () => {
            const { args: [a, elpehant] } = design.get(TestValidator.prototype, "complex");
            expect(elpehant.validate(new Elephant())).to.be.true;
            expect(elpehant.validate(new AsianElephant())).to.be.true;
            expect(elpehant.validate(new Dog())).to.be.false;
            expect(elpehant.validate(false)).to.be.false;
            expect(elpehant.validate(new Boolean(true))).to.be.false;
            expect(elpehant.validate(22)).to.be.false;
            expect(elpehant.validate("hello")).to.be.false;
            expect(elpehant.validate(null)).to.be.false;
            expect(elpehant.validate()).to.be.false;
        });

        it("should validate primitive array", () => {
            const { args: [a, e, strings] } = design.get(TestValidator.prototype, "complex");
            expect(strings.validate(["abc", "123"])).to.be.true;
            expect(strings.validate([new String("xyz"), new String("789")])).to.be.true;
            expect(strings.validate(new Dog())).to.be.false;
            expect(strings.validate([new Elephant()])).to.be.false;
            expect(strings.validate([true, false])).to.be.false;
            expect(strings.validate(new Boolean(true))).to.be.false;
            expect(strings.validate(22)).to.be.false;
            expect(strings.validate([19, 28])).to.be.false;
            expect(strings.validate("hello")).to.be.false;
            expect(strings.validate(null)).to.be.false;
            expect(strings.validate()).to.be.false;
        });

        it("should validate complex array", () => {
            const { args: [a, e, s, people] } = design.get(TestValidator.prototype, "complex");
            expect(people.validate([new Person()])).to.be.true;
            expect(people.validate([new Elephant()])).to.be.false;
            expect(people.validate([true, false])).to.be.false;
            expect(people.validate(new Boolean(true))).to.be.false;
            expect(people.validate(22)).to.be.false;
            expect(people.validate([19, 28])).to.be.false;
            expect(people.validate("hello")).to.be.false;
            expect(people.validate(null)).to.be.false;
            expect(people.validate()).to.be.false;
        });

        it("should validate optionals", () => {
            const { args: [number, animal, elpehant] } = design.get(TestValidator.prototype, "optional");
            expect(number.validate()).to.be.true;
            expect(animal.validate()).to.be.true;
            expect(elpehant.validate()).to.be.true;
        });                                               
    });              
});
