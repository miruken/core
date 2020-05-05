import { Base, assignID } from "../src/base2";
import createKey from "../src/privates";

import {
    Enum, Flags, Protocol, MethodType,
    createKeyDecorated, createKeyDecoratorChain,
    $isClass, $isFunction, $isString,
    $flatten, $protocols, $decorator,
    $decorate, $decorated
} from "../src/core";

import {
    Modifier, $createModifier, $every
} from "../src/modifier";

import {
    Disposing, DisposingMixin, $using
} from "../src/dispose";

import {
    Facet, Interceptor, InterceptorSelector,
    ProxyBuilder
} from "../src/proxy";

import { Options } from "../src/options";
import { design, designWithReturn } from "../src/design";
import { inject } from "../src/inject";

import { ArrayManager, IndexedList } from "../src/util";
import { debounce } from "../src/debounce";

import "reflect-metadata";
import "../src/promise";

import { expect } from "chai";

const _ = createKey(),
      D = createKeyDecorated(),
      C = createKeyDecoratorChain();

const Code  = Symbol(),
      Breed = Symbol();

const Animal = Protocol.extend({
    name:   "",
    [Code]: undefined,

    talk() {},
    eat(food) {},
    [Breed]() {}
});

const Person = Base.extend({
    firstName: "",
    lastName:  "",
    dob: undefined,
    pet: undefined,
    
    get fullName() {
        return this.firstName + " " + this.lastName;
    },
    set fullname(value) {
        const parts = value.split(" ");
        if (parts.length > 0) {
            this.firstName = parts[0];
        }
        if (parts.length > 1) {
            this.lastName = parts[1];
        }
    },
    get age() { return ~~((Date.now() - +this.dob) / (31557600000)); }
});

const Tricks = Protocol.extend({
    fetch (item) {}
});

const CircusAnimal = Animal.extend(Tricks, {
});

const Dog = Base.extend(Animal, Tricks, {
    constructor(name, color) {
        C(this).name  = name;
        C(this).color = color;
    },

    get name() { return  C(this).name; },
    set name(value) {  C(this).name = value; },
    get color() { return C(this).color; },
    set color(value) { C(this).color = value; },    

    talk() { return "Ruff Ruff"; },
    fetch(item) { return "Fetched " + item; },
    get [Code]() { return 1234; }    
});
    
const Elephant = Base.extend(CircusAnimal, {
});

const Tracked = Protocol.extend({
	getTag() {}
});

const AsianElephant = Elephant.extend(Tracked);

const ShoppingCart = Base.extend(Disposing, DisposingMixin, {
    constructor() {
        _(this).items = [];
    },

    getItems()    { return _(this).items; },
    addItem(item) { _(this).items.push(item); }, 
    _dispose()    { _(this).items = []; }    
});

const LogInterceptor = Interceptor.extend({
    intercept (invocation) {
        console.log(
            `${invocation.methodType.name} ${invocation.method} (${invocation.args.join(", ")})`
        );
        const result = invocation.proceed();
        console.log(`     Return ${result}`);
        return result;
    }
});

describe("miruken", () => {
    it("should late bind", () => {
        const Pincher = Dog.extend({
            get name() { return "YO " + this.base(); }
        });
        const p = new Pincher("Poo");
        expect(p.name).to.equal("YO Poo");
        p.name = "Do";
        expect(p.name).to.equal("YO Do");        
    });

    const Math = Base.extend(null, {
            PI: 3.14159265359,
            add(a, b) {
                return a + b;
            },
            identity(v) { return v; }
        }), 
        Geometry = Math.extend(null, {
            area(length, width) {
                return length * width;
            },
            identity(v) { return this.base(v) * 2; }
        });
    
    it("should inherit static members", () => {
        expect(Geometry.PI).to.equal(Math.PI);
        expect(Geometry.add).to.equal(Math.add);
        expect(Geometry.identity(2)).to.equal(4);
    });
});

describe("privates", () => {
    const echo = $decorator({
        get name() {
            return `${this.base()} ${this.base()}`;
        }
    });

    describe("createKey", () => {
       const Player = Base.extend({
           constructor(name) {
              _(this).name = name;
           },

           get name() { return _(this).name; },
           set name(name) { _(this).name = name; }
        });

        it("should create privates", () => {
            const player = new Player("Craig");
            expect(player.name).to.equal("Craig");
            player.name  = "Matthew";
            expect(player.name).to.equal("Matthew");
        });

        it("should fail privates for decorators", () => {
            const player = echo(new Player("Craig"));
            expect(player.name).to.equal("undefined undefined");
            player.name = "Matthew";
            expect(player.name).to.equal("Matthew Matthew");
        });   
    });

    describe("createDecorated", () => {
       const Player = Base.extend({
           constructor(name) {
              D(this).name = name;
           },

           get name() { return D(this).name; },
           set name(name) { D(this).name = name; }
        });

        it("should use decoratee store", () => {
            const player     = new Player("Craig"),
                  playerEcho = echo(player);
            expect(D(player)).to.equal(D(playerEcho));
        })

        it("should create privates", () => {
            const player     = new Player("Craig"),
                  playerEcho = echo(player);
            expect(player.name).to.equal("Craig");
            expect(playerEcho.name).to.equal("Craig Craig");
            player.name  = "Matthew";
            expect(player.name).to.equal("Matthew");
            expect(playerEcho.name).to.equal("Matthew Matthew");
            playerEcho.name = "Lauren";
            expect(player.name).to.equal("Lauren");
            expect(playerEcho.name).to.equal("Lauren Lauren");
            D(player).age = 13;
            expect(D(player).age).to.equal(13);
            expect(D(playerEcho).age).to.equal(13);            
        });

        it("should fail privates for decorators", () => {
            const player     = new Player("Craig"),
                  playerEcho = echo(player);
            D(player).age = 13;
            expect(_(playerEcho).age).to.be.undefined;
        });   
    });

    describe("createKeyDecoratorChain", () => {
       const Player = Base.extend({
           constructor(name) {
              C(this).name = name;
           },

           get name() { return C(this).name; },
           set name(name) { C(this).name = name; }
        });

        it("should build decoratee chain", () => {
            const player     = new Player("Craig"),
                  playerEcho = echo(player);
            expect(C(player)).to.not.equal(C(playerEcho));
            expect(C(player)).to.equal(C(Object.getPrototypeOf(playerEcho)));
        })

        it("should create privates", () => {
            const player     = new Player("Craig"),
                  playerEcho = echo(player);
            expect(player.name).to.equal("Craig");
            expect(playerEcho.name).to.equal("Craig Craig");
            player.name  = "Matthew";
            expect(player.name).to.equal("Matthew");
            expect(playerEcho.name).to.equal("Matthew Matthew");
            playerEcho.name = "Lauren";
            expect(player.name).to.equal("Matthew");
            expect(playerEcho.name).to.equal("Lauren Lauren");
            C(player).age = 13;
            expect(C(player).age).to.equal(13);
            expect(C(playerEcho).age).to.equal(13);
            C(playerEcho).age = 16;
            expect(C(playerEcho).age).to.equal(16);
            expect(C(player).age).to.equal(13);
        });

        it("should fail privates for decorators", () => {
            const player     = new Player("Craig"),
                  playerEcho = echo(player);
            C(player).age = 13;
            expect(_(playerEcho).age).to.be.undefined;          
        });   
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
            expect(+Color.red).to.equal(1);
            expect(+Color.blue).to.equal(2);
            expect(+Color.green).to.equal(3);
            expect(+Message.run).to.equal(0);
            expect(+Message.cancel).to.equal(1);            
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

describe("ArrayManager", () => {
     it("should manage new array", () => {
        const mgr = new ArrayManager();
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

describe("DisposingMixin", () => {
    describe("dispose", () => {
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
            const DisposeCounter = Base.extend(Disposing, DisposingMixin, {
                _dispose() { ++counter; }
            });
            const disposeCounter = new DisposeCounter();
            expect(counter).to.equal(0);
            disposeCounter.dispose();
            expect(counter).to.equal(1);
            disposeCounter.dispose();
            expect(counter).to.equal(1);
        });
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

describe("Modifier", () => {
    describe("$createModifier", () => {
        it("should create a new modifier", () => {
            const wrap    = $createModifier("wrap");
            expect(wrap.prototype).to.be.instanceOf(Modifier);
        });

        it("should apply a  modifier using function call", () => {
            const wrap    = $createModifier("wrap"),
                  wrapped = wrap(22);
            expect(wrap.test(wrapped)).to.be.true;
            expect(wrapped.getSource()).to.equal(22);
        });
        
        it("should not apply a modifier the using new operator", () => {
            const wrap    = $createModifier("wrap");
            expect(() => { 
                new wrap(22);
            }).to.throw(Error, /Modifiers should not be called with the new operator./);
        });
        
        it("should ignore modifier if already present", () => {
            const wrap    = $createModifier("wrap"),
                wrapped = wrap(wrap("soccer"));
            expect(wrapped.getSource()).to.equal("soccer");
        });
    })

    describe("#test", () => {
        it("should test chained modifiers", () => {
            const shape = $createModifier("shape"),
                  wrap  = $createModifier("wrap"),
                  roll  = $createModifier("roll"),
                  chain = shape(wrap(roll(19)));
            expect(shape.test(chain)).to.be.true;
            expect(wrap.test(chain)).to.be.true;
            expect(roll.test(chain)).to.be.true;
        });
    });

    describe("#unwrap", () => {
        it("should unwrap source when modifiers chained", () => {
            const shape = $createModifier("shape"),
                  wrap  = $createModifier("wrap"),
                  roll  = $createModifier("roll"),
                  chain = shape(wrap(roll(19)));
            expect(Modifier.unwrap(chain)).to.equal(19);
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
            expect(Animal.isAdoptedBy(dog)).to.be.true;
        });

        it("should only list protocol once", () => {
            const Cat = Base.extend(Animal, Animal);
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

        it("should allow redefining method", () => {
            const SmartTricks = Tricks.extend({
                    fetch(item) {}
                }),
                SmartDog = Dog.extend({
                    fetch(item) { return "Buried " + item; }
                }),
                dog = new SmartDog();
            expect(SmartTricks(dog).fetch("bone")).to.equal("Buried bone");
        });
    });

    describe("#adoptProtocol", () => {
        it("should add protocol to class", () => {
            const Bird  = Base.extend(Animal),
                  eagle = (new Bird()).extend({
                   getTag() { return "Eagle"; }
				  });
            Tracked.adoptBy(Bird);
            expect(Tracked.isAdoptedBy(Bird)).to.be.true;
			expect(eagle.getTag()).to.equal("Eagle");
        });

        it("should add protocol to protocol", () => {
            const Bear      = Base.extend(Animal),
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
            const Dog2 = Dog.extend({
                      talk() {
                          ++count;
                          return this.base();
                      }
                  }),
                  dogs = [new Dog2("Fluffy"), new Dog2("Max")];
            expect(Animal(dogs).talk()).to.equal("Ruff Ruff");
            expect(count).to.equal(2);
        });        
    });

    describe("#delegateGet", () => {
        it("should delegate property gets to object", () => {
            const dog  = new Dog("Franky");
            expect(Animal(dog).name).to.equal("Franky");
            // expect(Animal(dog)[Code]).to.equal(1234); Babel bug
            expect(CircusAnimal(dog).name).to.equal("Franky");
        });
        
        it("should delegate property gets to array", () => {
            let count = 0;
            const Dog2  = Dog.extend({
                     get name() {
                         ++count;
                         return this.base();
                      } 
                  }),            
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
            let count = 0;
            const Dog2  = Dog.extend({
                     get name() {
                         ++count;
                         return this.base();
                      }
                  }),
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

describe("Options", () => {
    const MyOptions = Options.extend({
        ack:   false,
        log:   false,
        child: undefined
    });

    describe("#copy", () => {
        it("should copy options", () => {
            const options     = new Options({ack: true, log: true}),
                  optionsCopy = options.copy();
            expect(optionsCopy).to.not.equal(options);
            expect(optionsCopy.ack).to.be.true;
            expect(optionsCopy.log).to.be.true;
            expect(optionsCopy.child).to.be.undefined;
        });

        it("should copy nested Options", () => {
            const options = new Options({
                      ack:   true,
                      log:   true,
                      child: new MyOptions({ack: true})
                  }),
                  optionsCopy = options.copy();
            expect(optionsCopy).to.not.equal(options);
            expect(optionsCopy.ack).to.be.true;
            expect(optionsCopy.log).to.be.true;
            expect(optionsCopy.child).to.not.equal(options.child);
            expect(optionsCopy.child.ack).to.be.true;
            expect(optionsCopy.child.log).to.be.false;
            expect(optionsCopy.child.child).to.be.undefined;            
        });        
    });

    describe("#mergeInto", () => {
        it("should merge options", () => {
            const options1 = new Options({
                      ack:   true,
                      log:   true,
                      child: new MyOptions({ack: true})                
                  }),
                  options2 = new Options({log: false});
            options1.mergeInto(options2);
            expect(options2.ack).to.be.true;
            expect(options2.log).to.be.false;
            expect(options2.child).to.not.equal(options1.child);
            expect(options2.child.ack).to.be.true;
            expect(options2.child.log).to.be.false;            
        });

        it("should merge nested options", () => {
            const options1 = new Options({
                      ack:   true,
                      log:   true,
                      child: new MyOptions({ack: true})
                  }),
                  options2 = new Options({
                      log:   false,
                      child: new MyOptions({
                          ack: false,
                          log: true
                      })
                  });
            options1.mergeInto(options2);
            expect(options2.ack).to.be.true;
            expect(options2.log).to.be.false;
            expect(options2.child).to.not.equal(options1.child);
            expect(options2.child.ack).to.be.false;
            expect(options2.child.log).to.be.true;            
        });        
    });
});

describe("ProxyBuilder", () => {
    const ToUpperInterceptor = Interceptor.extend({
        intercept(invocation) {
            const args = invocation.args;
            for (let i = 0; i < args.length; ++i) {
                if ($isString(args[i])) {
                    args[i] = args[i].toUpperCase();
                }
            }
            let result = invocation.proceed();
            if ($isString(result)) {
                result = result.toUpperCase();
            }
            return result;
        }
    });
        
    describe("#buildProxy", () => {
        it("should proxy class", () => {
            const proxyBuilder = new ProxyBuilder(),
                  DogProxy     = proxyBuilder.buildProxy([Dog]),
                  dog          = new DogProxy({
                                     [Facet.Parameters]:   ["Patches", "red"],
                                     [Facet.interceptors]: [new LogInterceptor()]
                  });
            expect(dog.name).to.equal("Patches");
            expect(dog.color).to.equal("red");            
            expect(dog.talk()).to.equal("Ruff Ruff");
            expect(dog.fetch("bone")).to.equal("Fetched bone");
        });

        it("should proxy protocol", () => {
            const proxyBuilder = new ProxyBuilder(),
                  AnimalProxy  = proxyBuilder.buildProxy([Animal]),
                  AnimalInterceptor = Interceptor.extend({
                      name : "",
                      intercept(invocation) {
                          const method = invocation.method,
                                type   = invocation.methodType,
                                args   = invocation.args;
                          if (method === "name") {
                              if (type === MethodType.Get) {
                                  return this.name;
                              } else if (type === MethodType.Set) {
                                  this.name = args[0];
                                  return;
                              }
                          } else if (method === "talk") {
                              return "I don't know what to say.";
                          } else if (method === "eat") {
                              return `I don\'t like ${args[0]}.`;
                          }
                        return invocation.proceed();
                      }
                  }),
                  animal = new AnimalProxy({
                      [Facet.Interceptors]: [new AnimalInterceptor()]
                  });
            animal.name = "Pluto";
            expect(animal.name).to.equal("Pluto");
            expect(animal.talk()).to.equal("I don't know what to say.");
            expect(animal.eat("pizza")).to.equal("I don't like pizza.");
        });

        it("should proxy classes and protocols", () => {
            const proxyBuilder   = new ProxyBuilder(),
                  Flying         = Protocol.extend({ fly() {} }),
                  FlyingInterceptor = Interceptor.extend({
                      intercept(invocation) {
                          if (invocation.method !== "fly") {
                              return invocation.proceed();
                          }
                      }
                  }),
                  FlyingDogProxy = proxyBuilder.buildProxy([Dog, Flying, DisposingMixin]);
            $using(new FlyingDogProxy({
                       [Facet.Parameters]:   ["Wonder Dog"],
                       [Facet.Interceptors]: [new FlyingInterceptor(), new LogInterceptor()]
                   }), wonderDog => {
                expect(wonderDog.name).to.equal("Wonder Dog");
                expect(wonderDog.talk()).to.equal("Ruff Ruff");
                expect(wonderDog.fetch("purse")).to.equal("Fetched purse");
                wonderDog.fly();
                }
            );
        });

        it("should modify arguments and return value", () => {
            const proxyBuilder = new ProxyBuilder(),
                  DogProxy     = proxyBuilder.buildProxy([Dog]),
                  dog          = new DogProxy({
                                     [Facet.Parameters]:   ["Patches"],
                                     [Facet.Interceptors]: [new ToUpperInterceptor()]
                                 });
            expect(dog.name).to.equal("PATCHES");
            expect(dog.talk()).to.equal("RUFF RUFF");
            expect(dog.fetch("bone")).to.equal("FETCHED BONE");
        });

        it("should restrict proxied method with interceptor selector options", () => {
            const proxyBuilder = new ProxyBuilder(),
                  selector     =  (new InterceptorSelector()).extend({
                      selectInterceptors(type, method, interceptors) {
                          return method === "name" ? interceptors : [];
                  }}),
                  DogProxy     = proxyBuilder.buildProxy([Dog]),
                  dog          = new DogProxy({
                                     [Facet.Parameters]:           ["Patches"],
                                     [Facet.Interceptors]:         [new ToUpperInterceptor()],
                                     [Facet.InterceptorSelectors]: [selector]
                                 });
            expect(dog.name).to.equal("PATCHES");
            expect(dog.talk()).to.equal("Ruff Ruff");
            expect(dog.fetch("bone")).to.equal("Fetched bone");
        });

        it("should fail if no types array provided", () => {
            const proxyBuilder = new ProxyBuilder();
            expect(() => {
                proxyBuilder.buildProxy();
            }).to.throw(Error, "ProxyBuilder requires an array of types to proxy.");
        });

        it("should fail if no method to proceed too", () => {
            const proxyBuilder = new ProxyBuilder(),
                  AnimalProxy  = proxyBuilder.buildProxy([Animal]),
                  animal       = new AnimalProxy([]);
            expect(() => {
                animal.talk();
            }).to.throw(Error, "Interceptor cannot proceed without a class or delegate method 'talk'.");
        });
    });

    describe("#extend", () => {
        it("should reject extending  proxy classes.", () => {
            const proxyBuilder = new ProxyBuilder(),
                  DogProxy     = proxyBuilder.buildProxy([Dog]);
            expect(() => {
                DogProxy.extend();
            }).to.throw(TypeError, "Proxy classes are sealed and cannot be extended from.");
        });

        it("should proxy new method", () => {
            const proxyBuilder = new ProxyBuilder(),
                  DogProxy     = proxyBuilder.buildProxy([Dog]),
                  dog          = new DogProxy({
                                    [Facet.Parameters]:  ["Patches"],
                                    [Facet.Interceptors]:[new ToUpperInterceptor()]
                                 });
            dog.extend("getColor", () => { return "white with brown spots"; });
            dog.extend({
                getBreed() { return "King James Cavalier"; }
            });
            expect(dog.getColor()).to.equal("WHITE WITH BROWN SPOTS");
            expect(dog.getBreed()).to.equal("KING JAMES CAVALIER");
        });

        it("should proxy existing methods", () => {
            const proxyBuilder = new ProxyBuilder(),
                  DogProxy     = proxyBuilder.buildProxy([Dog]),
                  dog          = new DogProxy({
                                    [Facet.Parameters]:  ["Patches"],
                                    [Facet.Interceptors]:[new ToUpperInterceptor()]
                                 });
            expect(dog.name).to.equal("PATCHES");
            dog.extend({
                get name() { return "Spike"; }
            });
            expect(dog.name).to.equal("SPIKE");
        });
    });

    describe("#implement", () => {
        it("should reject extending  proxy classes.", () => {
            const proxyBuilder = new ProxyBuilder(),
                  DogProxy     = proxyBuilder.buildProxy([Dog]);
            expect(() => {
                DogProxy.implement(DisposingMixin);
            }).to.throw(TypeError, "Proxy classes are sealed and cannot be extended from.");
        });
    });
});

describe("@design", () => {
    const Zoo = Base.extend({
              @design(Person)
              trainer: undefined,
        
              @design(Person, [Animal])
              constructor(zooKeeper, animals) {},

              @design(Person)
              get doctor() { return _(this).doctor; },
              set doctor(value) { _(this)._doctor = value; },
        
              @design(Dog, Elephant, AsianElephant)
              safari(dog, elephant, asianElephant) {},

              @designWithReturn(Animal, Dog, Elephant, AsianElephant)
              race(dog, elephant, asianElephant) {
                  return dog;
              }
          }),
          PettingZoo = Zoo.extend(design(Person, Person, [Animal]), {
              constructor(zooKeeper, trainer, animals) {
                  this.base(zooKeeper, animals);
              }
          });
    
    it("should get constructor design", () => {
        const types = design.get(Zoo.prototype, "constructor");
        expect(types[0]).to.equal(Person);
        expect(types[1]).to.eql([Animal]);        
    });

    it("should get method design", () => {
        const types = design.get(Zoo.prototype, "safari");
        expect(types).to.eql([Dog, Elephant, AsianElephant]);
    });

    it("should get method design with return", () => {
        const types = designWithReturn.get(Zoo.prototype, "race");
        expect(types).to.eql([Animal, Dog, Elephant, AsianElephant]);
    });
    
    it("should get field design", () => {
        const type = design.get(Zoo.prototype, "trainer");
        expect(type).to.equal(Person);
        const returnType = designWithReturn.get(Zoo.prototype, "trainer");
        expect(returnType).to.equal(Person);         
    });

    it("should get property design", () => {
        const type = design.get(Zoo.prototype, "doctor");
        expect(type).to.equal(Person);
        const returnType = designWithReturn.get(Zoo.prototype, "doctor");
        expect(returnType).to.equal(Person);        
    });
        
    it("should apply class design to constructor", () => {
        const types = design.get(PettingZoo.prototype, "constructor");
        expect(types[0]).to.equal(Person);
        expect(types[1]).to.equal(Person);        
        expect(types[2]).to.eql([Animal]);
    });

    it("should reject design if too few method types", () => {
        expect(() => {
            Base.extend({
                @design(Person)
                constructor(partner, canine) {}
            });
        }).to.throw(Error, "@design for method 'constructor' expects at least 2 parameters but only 1 specified");
    });
    
    it("should reject design if missing property type", () => {
        expect(() => {
            Base.extend({
                @design
                friend: undefined
            });
        }).to.throw(Error, "@design for property 'friend' requires a single type to be specified");
    });

    it("should reject property design on both getter and setter", () => {
        expect(() => {
            const Farm = Base.extend({
                @design(Person)
                get farmer() {},
                @design(Person)            
                set farmer(value) {}
            });
        }).to.throw(Error, "@design for property 'farmer' should only be specified on getter or setter");        
    });

    it("should reject invalid array specifications", () => {
        expect(() => {
            Base.extend({
                @design(Person, [Person, Person])
                sing(conductor, chorus) {} 
            });
        }).to.throw(Error, "@design array specification at index 1 expects a single type");
    });    
});

describe("inject", () => {
    const Circus = Base.extend({
              @inject($every(Animal))        
              constructor(animals) {},
        
              @inject(Dog)
              dancingDog(Dance) {},
        
              @inject($every(Elephant))
              elpehantParade(elephant) {}
          }),
          RingBrothers = Circus.extend(inject(undefined, Person), {
              constructor(animals, ringMaster) {},
          });
    
    it("should get class dependencies", () => {
        const dep = inject.get(Circus.prototype, "dancingDog");
        expect(dep).to.eql([Dog]);
    });

    it("should get dependencies with modifiers", () => {
        const dep = inject.get(Circus.prototype, "elpehantParade");
        expect($every.test(dep[0])).to.be.true;
        expect(Modifier.unwrap(dep[0])).to.equal(Elephant);
    });

    it("should get constructor dependencies", () => {
        const dep = inject.get(Circus.prototype, "constructor");
        expect($every.test(dep[0])).to.be.true;
        expect(Modifier.unwrap(dep[0])).to.equal(Animal);
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
        expect($every.test(deps.get("elpehantParade")[0])).to.be.true;
        expect(Modifier.unwrap(deps.get("elpehantParade")[0])).to.equal(Elephant);
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

describe("debounce", () => {
    const System = Base.extend({
              constructor() {
                  this.calls = 0;
              },
              @debounce(10)
              lookup(word) {
                  this.calls++;
              },
              @debounce(10, true)
              api(command) {
                  this.calls++;
              }
          });

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
