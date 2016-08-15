import { Base, assignID } from '../src/base2';
import { Enum, Flags } from '../src/enum';
import { MethodType } from '../src/core';
import { Modifier,  $createModifier } from '../src/modifier';
import { Disposing, DisposingMixin, $using } from '../src/dispose';
import { Interceptor, InterceptorSelector, ProxyBuilder } from '../src/proxy';
import { Protocol, $isClass, $meta } from '../src/meta';
import metadata from '../src/metadata';

import {
    $isFunction, $isString, $flatten, $merge,
    $decorator, $decorate, $decorated
} from '../src/util';

import '../src/promise';

import { expect } from 'chai';

const Code  = Symbol(),
      Breed = Symbol();

const Animal = Protocol.extend({
    name:   undefined,
    [Code]: undefined,
    
    talk() {},
    eat(food) {},
    [Breed]() {}
});

const Tricks = Protocol.extend({
    fetch (item) {}
});

const CircusAnimal = Animal.extend(Tricks, {
});

const Dog = Base.extend(Animal, Tricks, {
    constructor(name, color) {
       this.extend({
           get name() { return name; },
           set name(value) { name = value; },
           get color() { return color; },
           set color(value) { color = value; }
       });
    },
    talk() { return 'Ruff Ruff'; },
    fetch(item) { return 'Fetched ' + item; },
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
        let _items = [];
        this.extend({
            getItems() { return _items; },
            addItem(item) { _items.push(item); }, 
            _dispose() { _items = []; }
        });
    }
});

const LogInterceptor = Interceptor.extend({
    intercept (invocation) {
        console.log(
            `${invocation.methodType.name} ${invocation.method} (${invocation.args.join(", ")})`
        );
        const result = invocation.proceed();
        console.log(`    And returned ${result}`);
        return result;
    }
});

describe("miruken", () => {
    it("should late bind", () => {
        const Pincher = Dog.extend({
            get name() { return "YO " + this.base(); }
        });
        const p = new Pincher("Poo");
        expect(p.name).to.equal("Poo");
        p.name = "Do";
        expect(p.name).to.equal("Do");        
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

describe("$meta", () => {
    it("should not have metadata for primitives", () => {
        expect($meta()).to.be.undefined;
        expect($meta(1)).to.be.undefined;
        expect($meta(true)).to.be.undefined;
        expect($meta("hello")).to.be.undefined;
    });

    it("should not have metadata for Object, Function or Array", () => {
        expect($meta(Object)).to.be.undefined;
        expect($meta(Function)).to.be.undefined;
        expect($meta(Array)).to.be.undefined;
    });

    it("should have class metadata", () => {
        expect($meta(Dog)).to.be.ok;
    });

    it("should have instance metadata", () => {
        const dog = new Dog();
        expect($meta(dog)).to.be.ok;
        expect($meta(dog)).to.not.equal($meta(Dog));
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

describe("$meta", () => {
    const Person = Base.extend({
        firstName: '',
        lastName:  '',
        dob: undefined,
        @metadata({map: Animal})
        pet: undefined,
        
        get fullName() {
            return this.firstName + ' ' + this.lastName;
        },
        set fullname(value) {
            const parts = value.split(' ');
            if (parts.length > 0) {
                this.firstName = parts[0];
            }
            if (parts.length > 1) {
                this.lastName = parts[1];
            }
        },
        get age() { return ~~((Date.now() - +this.dob) / (31557600000)); }
    });
    const Doctor = Person.extend({
        @metadata({map: Person})        
        patient: undefined,
        get age() { return this.base() + 10; }
    });

    it("should support properties", () => {
        const person = new Person();
        person.dob = new Date(2003, 4, 9);
        expect(person.dob).to.eql(new Date(2003, 4, 9));
        expect(person.age).to.be.at.least(12);
    });

    it("should override standard properties", () => {
        const doctor = new Doctor();
        doctor.dob = new Date();
        expect(doctor.age).to.be.at.least(10);
    });

    it("should retrieve property metadata", () => {
        const patient = $meta(Doctor).getMetadata('patient');
        expect(patient.map).to.equal(Person);
    });

    it("should merge property metadata", () => {
        const meta = $meta(Base.extend({
            @metadata({required: true})
            age: undefined
        }));
        let age = meta.getMetadata("age");
        expect(age).to.eql({required: true});
        meta.addMetadata("age", {length: 1});
        age = meta.getMetadata("age");        
        expect(age).to.eql({required: true, length: 1});        
    });

    it("should merge property metadata with getter/setter", () => {
        const Hospital = Base.extend({
                @metadata({map: Doctor})            
                get chiefDoctor() {
                    return new Doctor({firstName: "Phil"});
                }
            }),
            chiefDoctor = $meta(Hospital).getMetadata('chiefDoctor'),
            hospital = new Hospital();
        expect(hospital.chiefDoctor.firstName).to.equal("Phil");
        expect(chiefDoctor.map).to.equal(Doctor);        
    });

    it("should retrieve inherited property metadata", () => {
        const pet = $meta(Doctor).getMetadata('pet');
        expect(pet.map).to.equal(Animal);
    });

    it("should retrieve all property metadata", () => {
        const all = $meta(Doctor).getMetadata();
        expect(all['pet'].map).to.equal(Animal);
        expect(all['patient'].map).to.equal(Person);
    });

    it("should synthesize instance properties", () => {
        const person = (new Person).extend({
            hairColor: 'brown',
            glasses:    true
        });
        expect(person.hairColor).to.equal('brown');
        expect(person.glasses).to.equal(true);
    });

    it("should retrieve instance property metadata", () => {
        const person = (new Person).extend({
            @metadata({ map: Person })
            friend: undefined
        });
        const friend = $meta(person).getMetadata('friend');
        expect(friend.map).to.equal(Person);
        expect($meta(Person).getMetadata('friend')).to.be.undefined;
    });

    it("should synthesize protocol properties", () => {
        const Employment = Protocol.extend({
                get id() {},
                get name() {},
                set name(value) {}
            }),
            Manager = Base.extend(Employment, {
                constructor(name) {
                    this.extend({
                        get name() { return name; },
                        set name(value) { name = value; }
                    });
                },
                get id() {
                    return "Manager" + assignID(this);
                }
            }),
            manager = new Manager("Bill Lumbergh");
        expect(Employment(manager).name).to.equal("Bill Lumbergh");
        expect(Employment(manager).id).to.equal("Manager" + assignID(manager));
        expect(Employment(manager).name = "Joe Girardi").to.equal("Joe Girardi");
        expect(Employment(manager).name).to.equal("Joe Girardi");
    });    
});

describe("DisposingMixin", () => {
    describe("dispose", () => {
        it("should provide dispose", () => {
            const shoppingCart = new ShoppingCart();
            shoppingCart.addItem("Sneakers");
            shoppingCart.addItem("Milk");
            expect(shoppingCart.getItems()).to.eql(["Sneakers", "Milk"]);
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
            expect(shoppingCart.getItems()).to.eql(["Halo II", "Porsche"]);
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
               expect(shoppingCart.getItems()).to.eql(["Halo II", "Porsche", "Book"]);
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
                   expect(shoppingCart.getItems()).to.eql(["Halo II", "Porsche", "Book"]);
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
                    return this.base() + ' ' + this.base();
                }
            }),
            dogEcho = echo(dog);
        expect(dogEcho.name).to.equal("Snuffy Snuffy");
    });
});

describe("$decorate", () => {
    it("should decorate an instance", () => {
        const dog     = new Dog("Sparky"),
              reverse = $decorate(dog, {
                get name() {
                    return this.base().split('').reverse().join('');
                }
            });
        expect(reverse.name).to.equal("ykrapS");
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
        expect($flatten([[[1,'a'],[2,'b']],[[3,'c'],4]])).to.eql([1,'a',2,'b',3,'c',4]);
    });

    it("should prune arrays", () => {
        expect($flatten([1,2,null,3], true)).to.eql([1,2,3]);
    });

    it("should prune deep arrays", () => {
        expect($flatten([1,[2,[3,null]],null,[4,[null,5]]], true)).to.eql([1,2,3,4,5]);
    });    
});

describe("$merge", () => {
    it("should merge nothing", () => {
        const target = {a: 1};
        expect($merge()).is.undefined;
        expect($merge(target)).eq(target);
        expect($merge(target, {})).eql({a: 1});
    });

    it("should  new properties", () => {
        const target = {};
        expect($merge(target, {a: 1})).to.eql({a: 1});
    });
    
    it("should merge new properties", () => {
        const target = {a: 1};
        expect($merge(target, {b: 2, c: {x: 'a'}}))
            .eql({a: 1, b: 2, c: {x:'a'}});
    });

    it("should replace properties", () => {
        const target = {a: 1};
        expect($merge(target, {a: {x:'a', y:'z'}})).eql({a: {x:'a', y:'z'}});
    });

    it("should replace nested properties", () => {
        const target = {a: {b: {c: 1}}, x: {y: 2}};
        expect($merge(target, {a: {b: {c: 3}, d: 'x'}, x: {z: 4}, u: {r: 6}}))
        	.eql({a: {b: {c: 3}, d: 'x'}, x: {y: 2, z: 4}, u: {r: 6}});
    });
});

describe("Modifier", () => {
    describe("$createModifier", () => {
        it("should create a new modifier", () => {
            const wrap    = $createModifier('wrap');
        expect(wrap.prototype).to.be.instanceOf(Modifier);
        });

        it("should apply a  modifier using function call", () => {
            const wrap    = $createModifier('wrap'),
                  wrapped = wrap(22);
            expect(wrap.test(wrapped)).to.be.true;
            expect(wrapped.getSource()).to.equal(22);
        });
        
        it("should not apply a modifier the using new operator", () => {
            const wrap    = $createModifier('wrap');
            expect(() => { 
                new wrap(22);
            }).to.throw(Error, /Modifiers should not be called with the new operator./);
        });
        
        it("should ignore modifier if already present", () => {
            const wrap    = $createModifier('wrap'),
                wrapped = wrap(wrap("soccer"));
            expect(wrapped.getSource()).to.equal("soccer");
        });
    })

    describe("#test", () => {
        it("should test chained modifiers", () => {
            const shape = $createModifier('shape'),
                  wrap  = $createModifier('wrap'),
                  roll  = $createModifier('roll'),
                  chain = shape(wrap(roll(19)));
            expect(shape.test(chain)).to.be.true;
            expect(wrap.test(chain)).to.be.true;
            expect(roll.test(chain)).to.be.true;
        });
    });

    describe("#unwrap", () => {
        it("should unwrap source when modifiers chained", () => {
            const shape = $createModifier('shape'),
                  wrap  = $createModifier('wrap'),
                  roll  = $createModifier('roll'),
                  chain = shape(wrap(roll(19)));
            expect(Modifier.unwrap(chain)).to.equal(19);
        });
    });
});

describe("Protocol", () => {
    it("should proxy calls to normal objects", () => {
        const dog = Animal(new Dog());
        expect(dog.talk()).to.equal('Ruff Ruff');
    });
    
    it("should ignore null or undefined target", () => {
        Animal().talk();
        Animal(null).talk();
    });
    
    it("should ignore missing methods", () => {
        const dog = Animal(new Dog());
        dog.eat('bug');
    });
    
    it("should support specialization", () => {
        expect(CircusAnimal(new Dog()).fetch("bone")).to.equal('Fetched bone');
    });
    
    it("should ignore if strict and protocol not adopted", () => {
        const Toy = Base.extend({
            talk() { return 'To infinity and beyond'; }
        });
        expect(Animal(new Toy()).talk()).to.equal('To infinity and beyond');
        expect(Animal(new Toy(), true).talk()).to.be.undefined;
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

    describe("#protocols", () => {
        it("should retrieve declaring protocols", () => {
            expect($meta(Dog).protocols).to.eql([Animal, Tricks]);
        });
    });

    describe("#allProtocols", () => {
        it("should retrieve all protocol protocols", () => {
            expect($meta(CircusAnimal).allProtocols).to.eql([Animal, Tricks]);
        });

        it("should retrieve all class protocols", () => {
            expect($meta(AsianElephant).allProtocols).to.eql([Tracked, CircusAnimal, Animal, Tricks]);
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
                    return new Dog('Hazel');
                }
            });
            expect(Animal(dog).reproduce().name).to.equal('Hazel');
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
                    return new Dog('Hazel');
                }
            });
            expect(animal.reproduce().name).to.equal('Hazel');
        });
    });

    describe("#conformsTo", () => {
        it("should conform to protocols by class", () => {
            expect(Dog.conformsTo()).to.be.false;
			expect(Dog.conformsTo(Animal)).to.be.true;
		    expect(Dog.conformsTo(Tricks)).to.be.true;
        });

        it("should conform to protocols by protocol", () => {
            expect(CircusAnimal.conformsTo(Animal)).to.be.true;
            expect(CircusAnimal.conformsTo(Tricks)).to.be.true;
            expect(Animal.conformsTo(Tricks)).to.be.false;
            expect(CircusAnimal.conformsTo(CircusAnimal)).to.be.true;
        });

        it("should conform to protocols by object", () => {
            const dog = new Dog();
            expect(dog.conformsTo(Animal)).to.be.true;
            expect(dog.conformsTo(Tricks)).to.be.true;
        });

        it("should only list protocol once", () => {
            const Cat = Base.extend(Animal, Animal);
            expect(Cat.conformsTo(Animal)).to.be.true;
            expect($meta(Cat).protocols).to.eql([Animal]);
        });

        it("should only list protocol once if extended", () => {
            const Cat = Animal.extend(Animal);
            expect(Cat.conformsTo(Animal)).to.be.true;
            expect($meta(Cat).protocols).to.eql([Animal]);
        });

        it("should support protocol inheritance", () => {
            expect(Elephant.conformsTo(Animal)).to.be.true;
            expect($meta(CircusAnimal).protocols).to.eql([Animal, Tricks]);
        });

        it("should inherit protocol conformance", () => {
            expect(AsianElephant.conformsTo(Animal)).to.be.true;
            expect(AsianElephant.conformsTo(Tricks)).to.be.true;
        });

        it("should accept array of protocols", () => {
            const EndangeredAnimal = Base.extend([Animal, Tracked]);
            expect(EndangeredAnimal.conformsTo(Animal)).to.be.true;
            expect(EndangeredAnimal.conformsTo(Tracked)).to.be.true;
            expect($meta(EndangeredAnimal).protocols).to.eql([Animal, Tracked]);
        });

        it("should allow redefining method", () => {
            const SmartTricks = Tricks.extend({
                    fetch(item) {}
                }),
                SmartDog = Dog.extend({
                    fetch(item) { return 'Buried ' + item; }
                }),
                dog = new SmartDog();
            expect(SmartTricks(dog).fetch('bone')).to.equal('Buried bone');
        });

        it("should support strict when redefing method", () => {
            const SmartTricks = Tricks.extend({
                    constructor(proxy) {
                        this.base(proxy, true);
                    },
                    fetch(item) {}
                }),
                SmartDog = Dog.extend({
                    fetch(item) { return 'Buried ' + item; }
                }),
                dog = new SmartDog();
            expect(Tricks(dog).fetch('bone')).to.equal('Buried bone');
            expect(SmartTricks(dog).fetch('bone')).to.be.undefined;
        });
    });

    describe("#adoptedBy", () => {
        it("should determine if protocol adopted by class", () => {
            expect(Animal.adoptedBy(Dog)).to.be.true;
        });

        it("should determine if protocol adopted by protocol", () => {
            expect(Protocol.adoptedBy(Animal)).to.be.false;
            expect(Tricks.adoptedBy(Animal)).to.be.false;
            expect(Animal.adoptedBy(CircusAnimal)).to.be.true;
        });

        it("should determine if protocol adopted by object", () => {
            expect(Animal.adoptedBy(new Dog())).to.be.true;
        });
    });

    describe("#adoptProtocol", () => {
        it("should add protocol to class", () => {
            const Bird  = Base.extend(Animal),
                  eagle = (new Bird()).extend({
                   getTag() { return "Eagle"; }
				});
            $meta(Bird).adoptProtocol(Tracked);
            expect(Bird.conformsTo(Tracked)).to.be.true;
			expect(eagle.getTag()).to.equal("Eagle");
        });

        it("should add protocol to protocol", () => {
            const Bear      = Base.extend(Animal),
                  polarBear = (new Bear()).extend({
                  getTag() { return "Polar Bear"; }
            });
			$meta(Animal).adoptProtocol(Tracked);
            expect(polarBear.conformsTo(Tracked)).to.be.true;
			expect(polarBear.getTag()).to.equal("Polar Bear");
			expect(Animal(polarBear).getTag()).to.equal("Polar Bear");
        });
    })

    describe("#delegate", () => {
        it("should delegate invocations to object", () => {
            const dog = new Dog('Fluffy');
            expect(Animal(dog).talk()).to.equal('Ruff Ruff');
        });

        it("should delegate invocations to array", () => {
            let count  = 0;
            const Dog2 = Dog.extend({
                      talk() {
                          ++count;
                          return this.base();
                      }
                  }),
                  dogs = [new Dog2('Fluffy'), new Dog2('Max')];
            expect(Animal(dogs).talk()).to.equal('Ruff Ruff');
            expect(count).to.equal(2);
        });        
    });

    describe("#delegateGet", () => {
        it("should delegate property gets to object", () => {
            const dog  = new Dog('Franky');
            expect(Animal(dog).name).to.equal('Franky');
            // expect(Animal(dog)[Code]).to.equal(1234); Babel bug
            expect(CircusAnimal(dog).name).to.equal('Franky');
        });
        
        it("should delegate property gets to array", () => {
            let count = 0;
            const Dog2  = Dog.extend({
                      constructor(name) {
                          this.base(name);
                          this.extend({
                              get name() {
                                  ++count;
                                  return this.base();
                              }
                          });
                      }
                  }),            
                  dogs = [new Dog2('Franky'), new Dog2('Spot')];
            expect(Animal(dogs).name).to.equal('Spot');
            expect(count).to.equal(2);
        });        
    });

    describe("#delegateSet", () => {
        it("should delegate property sets to object", () => {
            const dog = new Dog('Franky');
            Animal(dog).name = 'Ralphy';
            expect(dog.name).to.equal('Ralphy');
        });

        it("should delegate property sets to array", () => {
            let count = 0;
            const Dog2  = Dog.extend({
                      constructor(name) {
                          this.base(name);
                          this.extend({
                              get name() {
                                  ++count;
                                  return this.base();
                              }
                          });
                      }
                  }),
                  dogs = [new Dog2('Franky'), new Dog2('Pebbles')];
            Animal(dogs).name = 'Ralphy';
            expect(dogs[0].name).to.equal('Ralphy');
            expect(dogs[1].name).to.equal('Ralphy');
            expect(count).to.equal(2);            
        });
        
        it("should delegate extended property sets", () => {
            const dog  = new Dog('Franky');
            Animal.implement({
                nickname: undefined
            });
            dog.extend({
                nickname: ''
            });
            Animal(dog).nickname = 'HotDog';
            expect(dog.nickname).to.equal('HotDog');
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
                                     parameters:   ['Patches'],
                                     interceptors: [new LogInterceptor()]
                  });
            expect(dog.name).to.equal('Patches');
            expect(dog.talk()).to.equal('Ruff Ruff');
            expect(dog.fetch("bone")).to.equal('Fetched bone');
        });

        it("should proxy protocol", () => {
            const proxyBuilder = new ProxyBuilder(),
                  AnimalProxy  = proxyBuilder.buildProxy([Animal]),
                  AnimalInterceptor = Interceptor.extend({
                      name : '',
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
                      interceptors: [new AnimalInterceptor()]
                  });
            animal.name = "Pluto";
            expect(animal.name).to.equal("Pluto");
            expect(animal.talk()).to.equal("I don't know what to say.");
            expect(animal.eat('pizza')).to.equal("I don't like pizza.");
        });

        it("should proxy classes and protocols", () => {
            const proxyBuilder   = new ProxyBuilder(),
                  Flying         = Protocol.extend({ fly() {} }),
                  FlyingInterceptor = Interceptor.extend({
                      intercept(invocation) {
                          if (invocation.method !== 'fly') {
                              return invocation.proceed();
                          }
                      }
                  }),
                  FlyingDogProxy = proxyBuilder.buildProxy([Dog, Flying, DisposingMixin]);
            $using(new FlyingDogProxy({
                       parameters:   ['Wonder Dog'],
                       interceptors: [new FlyingInterceptor(), new LogInterceptor()]
                   }), wonderDog => {
                expect(wonderDog.name).to.equal('Wonder Dog');
                expect(wonderDog.talk()).to.equal('Ruff Ruff');
                expect(wonderDog.fetch("purse")).to.equal('Fetched purse');
                wonderDog.fly();
                }
            );
        });

        it("should modify arguments and return value", () => {
            const proxyBuilder = new ProxyBuilder(),
                  DogProxy     = proxyBuilder.buildProxy([Dog]),
                  dog          = new DogProxy({
                                     parameters:   ['Patches'],
                                     interceptors: [new ToUpperInterceptor()]
                                 });
            expect(dog.name).to.equal('PATCHES');
            expect(dog.talk()).to.equal('RUFF RUFF');
            expect(dog.fetch("bone")).to.equal('FETCHED BONE');
        });

        it("should restrict proxied method with interceptor selector options", () => {
            const proxyBuilder = new ProxyBuilder(),
                  selector     =  (new InterceptorSelector()).extend({
                      selectInterceptors(type, method, interceptors) {
                          return method === 'name' ? interceptors : [];
                  }}),
                  DogProxy     = proxyBuilder.buildProxy([Dog]),
                  dog          = new DogProxy({
                                     parameters:           ['Patches'],
                                     interceptors:         [new ToUpperInterceptor()],
                                     interceptorSelectors: [selector]
                                 });
            expect(dog.name).to.equal('PATCHES');
            expect(dog.talk()).to.equal('Ruff Ruff');
            expect(dog.fetch("bone")).to.equal('Fetched bone');
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
                                    parameters:  ['Patches'],
                                    interceptors:[new ToUpperInterceptor()]
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
                                    parameters:  ['Patches'],
                                    interceptors:[new ToUpperInterceptor()]
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
