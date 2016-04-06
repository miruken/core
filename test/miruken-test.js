import {
    Enum, Flags, Base, Protocol, Modifier, Metadata,
    Interceptor, InterceptorSelector, ProxyBuilder,
    Miruken, Disposing, DisposingMixin, $using,
    $decorator, $decorate, $decorated, $createModifier,
    $isClass, $isFunction, $isString, assignID,
    $properties, $inferProperties, $inheritStatic
} from '../src/index';

import chai from 'chai';

const expect = chai.expect;

const Animal = Protocol.extend({
    $properties: {
        name: undefined
    },
    talk() {},
    eat(food) {}
});

const Tricks = Protocol.extend({
    fetch: function (item) {}
});

const CircusAnimal = Animal.extend(Tricks, {
});

const Dog = Base.extend(Animal, Tricks,
    $inferProperties, {
    constructor: function (name, color) {
       this.extend({
           getName() { return name; },
           setName(value) { name = value; },
           get color() { return color; },
           set color(value) { color = value; }
       });
    },
    talk() { return 'Ruff Ruff'; },
    fetch(item) { return 'Fetched ' + item; }
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
    intercept: function (invocation) {
        console.log(
            `Called ${invocation.method} with (${invocation.args.join(", ")})`
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
    
    it("should be immutable", () => {
        expect(Color.prototype).to.be.instanceOf(Enum);
        expect(() => {
            Color.black = 4;            
        }).to.throw(TypeError, "Can't add property black, object is not extensible");
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
    it("should have class metadata", () => {
        expect(Dog[Metadata]).to.be.ok;
    });

    it("should not be able to delete class metadata", () => {
        expect(Dog[Metadata]).to.be.ok;
        expect(() => {
            delete Dog[Metadata];            
        }).to.throw(Error, /Cannot delete property/);
    });

    it("should have instance metadata", () => {
        const dog = new Dog;
        expect(dog[Metadata]).to.be.ok;
        expect(dog[Metadata]).to.not.equal(Dog[Metadata]);
    });

    it("should not be able to delete instance metadata", () => {
        const dog = new Dog;
        expect(Dog[Metadata]).to.be.ok;
        expect(() => {
            delete dog[Metadata];            
        }).to.throw(Error, /Cannot delete property/);
    });
});

describe("$isClass", () => {
    it("should identify miruken classes", () => {
        expect($isClass(Dog)).to.be.true;
    });

    it("should reject non-miruken classes", () => {
        const SomeClass = () => {};
        expect($isClass(SomeClass)).to.be.false;
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

describe("$properties", () => {
    const Person = Base.extend({
        $properties: {
            firstName: '',
            lastName:  '',
            fullName:  {
                get() {
                    return this.firstName + ' ' + this.lastName;
                },
                set(value) {
                    const parts = value.split(' ');
                    if (parts.length > 0) {
                        this.firstName = parts[0];
                    }
                    if (parts.length > 1) {
                        this.lastName = parts[1];
                    }
                }
            },
            dob: { auto: null },
            pet:  { map: Animal}
        },
        get age() { return ~~((Date.now() - +this.dob) / (31557600000)); }
    });
    const Doctor = Person.extend({
        $properties: {
            patient: { map: Person }
        },
        get age() { return this.base() + 10; }
    });

    it("should ignore empty properties", () => {
        const Person = Base.extend({
            $properties: {}
        });
    });

    it("should synthesize properties", () => {
        const person = new Person,
              friend = new Person;
        expect(person.firstName).to.equal('');
        expect(person.lastName).to.equal('');
        person.firstName = 'John';
        expect(person.firstName).to.equal('John');
        expect(person._firstName).to.be.undefined;
        person.firstName = 'Sarah';
        expect(person.firstName).to.equal('Sarah');
        expect(friend.firstName).to.equal('');
        expect(person.$properties).to.be.undefined;
    });

    it("should synthesize value properties", () => {
        const person       = new Person;
        person.firstName = 'Mickey';
        person.lastName  = 'Mouse';
        expect(person.fullName).to.equal('Mickey Mouse');
    });

    it("should synthesize property setters ", () => {
        const person       = new Person;
        person.fullName  = 'Harry Potter';
        expect(person.firstName).to.equal('Harry');
        expect(person.lastName).to.equal('Potter');
    });

    it("should accept standard properties", () => {
        const person = new Person;
        person.dob = new Date(2003, 4, 9);
        expect(person.dob).to.eql(new Date(2003, 4, 9));
        expect(person.age).to.be.at.least(12);
    });

    it("should override standard properties", () => {
        const doctor = new Doctor;
        doctor.dob = new Date;
        expect(doctor.age).to.be.at.least(10);
    });

    it("should retrieve property descriptor", () => {
        const descriptor = Doctor[Metadata].getDescriptor('patient');
        expect(descriptor.map).to.equal(Person);
    });

    it("should merge property descriptor with getter/setter", () => {
        const Hospital = Base.extend({
                $properties: {
                    chiefDoctor: { map: Doctor }
                },
                get chiefDoctor() {
                    return new Doctor({firstName: "Phil"});
                }
            }),
            descriptor = Hospital[Metadata].getDescriptor('chiefDoctor'),
            hospital = new Hospital;
        expect(hospital.chiefDoctor.firstName).to.equal("Phil");
        expect(descriptor.map).to.equal(Doctor);        
    });

    it("should retrieve inherited property descriptor", () => {
        const descriptor = Doctor[Metadata].getDescriptor('pet');
        expect(descriptor.map).to.equal(Animal);
    });

    it("should retrieve all property descriptors", () => {
        const descriptors = Doctor[Metadata].getDescriptor();
        expect(descriptors['pet'].map).to.equal(Animal);
        expect(descriptors['patient'].map).to.equal(Person);
    });

    it("should filter property descriptors", () => {
        const Something = Base.extend({
            $properties: {
                matchBool:   { val: true },
                matchNumber: { val: 22 },
                matchString: { val: "Hello" },
                matchArray:  { val: ["a", "b", "c"] },
                matchNested: {
                    nestedBool: { val: false },
                    nestedNumber: { val: 19 },
                    nestedString: { val: "Goodbye" },
                    nestedArray:  { val: ["x", "y", "z"] }
                }
            }
        });

        let descriptors = Something[Metadata].getDescriptor({ val: false });
        expect(descriptors).to.be.undefined;
        descriptors = Something[Metadata].getDescriptor({ val: true });
        expect(descriptors).to.eql({ matchBool: { val: true } });
        descriptors = Something[Metadata].getDescriptor({ val: 22 });
        expect(descriptors).to.eql({ matchNumber: { val: 22 } });
        descriptors = Something[Metadata].getDescriptor({ val: 22 });
        expect(descriptors).to.eql({ matchNumber: { val: 22 } });
        descriptors = Something[Metadata].getDescriptor({ val: "Hello" });
        expect(descriptors).to.eql({ matchString: { val: "Hello" } });
        descriptors = Something[Metadata].getDescriptor({ val: ["z"] });
        expect(descriptors).to.be.undefined;
        descriptors = Something[Metadata].getDescriptor({ val: ["b"] });
        expect(descriptors).to.eql({ matchArray: { val: ["a", "b", "c" ] } });
        descriptors = Something[Metadata].getDescriptor({ nestedBool: { val: false } });
        expect(descriptors).to.eql({  
              matchNested: {
                    nestedBool: { val: false },
                    nestedNumber: { val: 19 },
                    nestedString: { val: "Goodbye" },
                    nestedArray:  { val: ["x", "y", "z"] }
                }});
        descriptors = Something[Metadata].getDescriptor({ nestedBool: undefined });
        expect(descriptors).to.eql({  
              matchNested: {
                    nestedBool: { val: false },
                    nestedNumber: { val: 19 },
                    nestedString: { val: "Goodbye" },
                    nestedArray:  { val: ["x", "y", "z"] }
                }});

    });

    it("should synthesize instance properties", () => {
        const person = (new Person).extend({
            $properties: {
                hairColor: 'brown',
                glasses:    true
            }
        });
        expect(person.hairColor).to.equal('brown');
        expect(person.glasses).to.equal(true);
        expect(person.$properties).to.be.undefined;
    });

    it("should retrieve instance property descriptor", () => {
        const person = (new Person).extend({
            $properties: {
                friend: { map: Person }
            }
        });
        const descriptor = person[Metadata].getDescriptor('friend');
        expect(descriptor.map).to.equal(Person);
        expect(Person[Metadata].getDescriptor('friend')).to.be.undefined;
    });

    it("should synthesize protocol properties", () => {
        const Employment = Protocol.extend({
                get id() {},
                get name() {},
                set name(value) {}
            }),
            Manager = Base.extend(Employment, {
                constructor: function (name) {
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

describe("$inferProperties", () => {
    const Person = Base.extend( 
        $inferProperties, {
        constructor: function (firstName) {
            this.firstName = firstName;
        },
        getFirstName() { return this._name; },
        setFirstName(value) { this._name = value; },
        getInfo(key) { return ""; },
        setKeyValue(key, value) {}
    });
    
    it("should infer instance properties", () => {
        const person = new Person('Sean');
        expect(person.firstName).to.equal('Sean');
        expect(person.getFirstName()).to.equal('Sean');
    });

    it("should not infer getters with arguments", () => {
        expect(Person.prototype).to.not.have.key('info');
    });

    it("should not infer setters unless 1 argument", () => {
        expect(Person.prototype).to.not.have.key('keyValue');
    });

    it("should infer extended properties", () => {
        const Doctor = Person.extend({
                constructor: function (firstName, speciality) {
                    this.base(firstName);
                    this.speciality = speciality;
                },
                getSpeciality() { return this._speciality; },
                setSpeciality(value) { this._speciality = value; }
            }),
            Surgeon = Doctor.extend({
                constructor: function (firstName, speciality, hospital) {
                    this.base(firstName, speciality);
                    this.hospital = hospital;
                },
                getHospital() { return this._hospital; },
                setHospital(value) { this._hospital = value; }
            }),
            doctor  = new Doctor('Frank', 'Orthopedics'),
            surgeon = new Surgeon('Brenda', 'Cardiac', 'Baylor');
        expect(doctor.firstName).to.equal('Frank');
        expect(doctor.getFirstName()).to.equal('Frank');
        expect(doctor.speciality).to.equal('Orthopedics');
        expect(doctor.getSpeciality()).to.equal('Orthopedics');
        expect(surgeon.firstName).to.equal('Brenda');
        expect(surgeon.getFirstName()).to.equal('Brenda');
        expect(surgeon.speciality).to.equal('Cardiac');
        expect(surgeon.getSpeciality()).to.equal('Cardiac');
        expect(surgeon.hospital).to.equal('Baylor');
        expect(surgeon.getHospital()).to.equal('Baylor');
    });

    it("should infer implemented properties", () => {
        Person.implement({
            getMother() { return this._mother; },
            setMother(value) { this._mother = value; } 
        });
        const mom = new Person,
              son = new Person;
        son.mother = mom;
        expect(son.mother).to.equals(mom);
        expect(son.getMother()).to.equal(mom);
    });

    it("should infer extended instance properties", () => {
        const person = new Person;
        person.extend({
            getAge() { return this._age; },
            setAge(value) { this._age = value; }
        });
        person.age = 23;
        expect(person.age).to.equal(23);
        expect(person.getAge()).to.equal(23);
    });

    it("should support property overrides", () => {
        const Teacher = Person.extend({
                getFirstName() { return 'Teacher ' + this.base(); }
            }),
            teacher = new Teacher('Jane');
        expect(teacher.firstName).to.equal('Teacher Jane');
        Teacher.implement({
            setFirstName: function (value) { this.base('Sarah'); }
        });                        
        teacher.firstName = 'Mary';
        expect(teacher.firstName).to.equal('Teacher Sarah');
    });
});

describe("$inheritStatic", () => {
    const Math = Base.extend(
        $inheritStatic, null, {
            PI: 3.14159265359,
            add: function (a, b) {
                return a + b;
            }
        }), 
        Geometry = Math.extend(null, {
            area: function(length, width) {
                return length * width;
            }
        });
    
    it("should inherit static members", () => {
        expect(Geometry.PI).to.equal(Math.PI);
        expect(Geometry.add).to.equal(Math.add);
    });
});

describe("DisposingMixin", () => {
    describe("dispose", () => {
        it("should provide dispose", () => {
            const shoppingCart = new ShoppingCart;
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
            const disposeCounter = new DisposeCounter;
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
        const shoppingCart = new ShoppingCart;
        shoppingCart.addItem("Halo II");
        shoppingCart.addItem("Porsche");
        $using(shoppingCart, function (cart) {
            expect(shoppingCart.getItems()).to.eql(["Halo II", "Porsche"]);
        });
        expect(shoppingCart.getItems()).to.eql([]);
    });
    
    it("should call block then dispose if exeception", () => {
        const shoppingCart = new ShoppingCart;
        shoppingCart.addItem("Halo II");
        shoppingCart.addItem("Porsche");
        expect(() => { 
            $using(shoppingCart, function (cart) {
                throw new Error("Something bad");
            });
        }).to.throw(Error, "Something bad");
        expect(shoppingCart.getItems()).to.eql([]);
    });

    it("should wait for promise to fulfill then dispose", function (done) {
        const shoppingCart = new ShoppingCart;
        shoppingCart.addItem("Halo II");
        shoppingCart.addItem("Porsche");
        $using(shoppingCart, delay(100).then(() => {
               shoppingCart.addItem("Book");
               expect(shoppingCart.getItems()).to.eql(["Halo II", "Porsche", "Book"]);
               }) 
        ).finally(() => {
            expect(shoppingCart.getItems()).to.eql([]);
            done();
        });
    });

    it("should wait for promise fromm block to fulfill then dispose", function (done) {
        const shoppingCart = new ShoppingCart;
        shoppingCart.addItem("Halo II");
        shoppingCart.addItem("Porsche");
        $using(shoppingCart, function (cart) {
               return delay(100).then(() => {
                   shoppingCart.addItem("Book");
                   expect(shoppingCart.getItems()).to.eql(["Halo II", "Porsche", "Book"]);
               })
        }).finally(() => {
            expect(shoppingCart.getItems()).to.eql([]);
            done();
        });
    });
    
    it("should wait for promise to fail then dispose", function (done) {
        const shoppingCart = new ShoppingCart;
        shoppingCart.addItem("Halo II");
        shoppingCart.addItem("Porsche");
        $using(shoppingCart, delay(100).then(() => {
               throw new Error("Something bad");
               })
        ).catch(function (err) {
            expect(shoppingCart.getItems()).to.eql([]);
            done();
        });
    });

    it("should return block result", () => {
        const shoppingCart = new ShoppingCart;
        shoppingCart.addItem("Halo II");
        shoppingCart.addItem("Porsche");
        expect($using(shoppingCart, function (cart) {
            return "approved";
        })).to.equal("approved");
    });

    it("should return block promise result", function (done) {
        const shoppingCart = new ShoppingCart;
        shoppingCart.addItem("Halo II");
        shoppingCart.addItem("Porsche");
        $using(shoppingCart, function (cart) {
            return delay(100).then(() => {
                return "approved";
            })
        }).then(function (result) {
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
        expect($using(shoppingCart, function (cart) {
            return "approved";
        })).to.equal("rejected");
    });

    it("should return dispose promise result", function (done) {
        const shoppingCart = (new ShoppingCart).extend({
            dispose() {
                this.base();
                return Promise.resolve("rejected");
            }
        });
        shoppingCart.addItem("Halo II");
        shoppingCart.addItem("Porsche");
        $using(shoppingCart, function (cart) {
                   return "approved";
        }).then(function (result) {
            expect(result).to.equal("rejected");
            done();
        });
    });    
});

describe("$decorator", () => {
    it("should create a decorator", () => {
        const dog  = new Dog("Snuffy"),
              echo = $decorator({
                getName() {
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
                getName() {
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
        const dog = Animal(new Dog);
        expect(dog.talk()).to.equal('Ruff Ruff');
    });
    
    it("should ignore null or undefined target", () => {
        Animal().talk();
        Animal(null).talk();
    });
    
    it("should ignore missing methods", () => {
        const dog = Animal(new Dog);
        dog.eat('bug');
    });
    
    it("should support specialization", () => {
        expect(CircusAnimal(new Dog).fetch("bone")).to.equal('Fetched bone');
    });
    
    it("should ignore if strict and protocol not adopted", () => {
        const Toy = Base.extend({
            talk() { return 'To infinity and beyond'; }
        });
        expect(Animal(new Toy).talk()).to.equal('To infinity and beyond');
        expect(Animal(new Toy, true).talk()).to.be.undefined;
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
            expect(Dog[Metadata].protocols).to.eql([Animal, Tricks]);
        });
    });

    describe("#allProtocols", () => {
        it("should retrieve all protocol protocols", () => {
            expect(CircusAnimal[Metadata].allProtocols).to.eql([Animal, Tricks]);
        });

        it("should retrieve all class protocols", () => {
            expect(AsianElephant[Metadata].allProtocols).to.eql([Tracked, CircusAnimal, Animal, Tricks]);
        });
    });

    describe("#implement", () => {
        it("should extend protocol", () => {
            Animal.implement({
               reproduce() {}
            });
            const dog = new Dog;
            expect(Animal(dog).reproduce()).to.be.undefined;
            dog.extend({
                reproduce() {
                    return new Dog('Hazel');
                }
            });
            expect(Animal(dog).reproduce().getName()).to.equal('Hazel');
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
            const dog = new Dog;
            expect(dog.conformsTo(Animal)).to.be.true;
            expect(dog.conformsTo(Tricks)).to.be.true;
        });

        it("should only list protocol once", () => {
            const Cat = Base.extend(Animal, Animal);
            expect(Cat.conformsTo(Animal)).to.be.true;
            expect(Cat[Metadata].protocols).to.eql([Animal]);
        });

        it("should only list protocol once if extended", () => {
            const Cat = Animal.extend(Animal);
            expect(Cat.conformsTo(Animal)).to.be.true;
            expect(Cat[Metadata].protocols).to.eql([Animal]);
        });

        it("should support protocol inheritance", () => {
            expect(Elephant.conformsTo(Animal)).to.be.true;
            expect(CircusAnimal[Metadata].protocols).to.eql([Animal, Tricks]);
        });

        it("should inherit protocol conformance", () => {
            expect(AsianElephant.conformsTo(Animal)).to.be.true;
            expect(AsianElephant.conformsTo(Tricks)).to.be.true;
        });

        it("should accept array of protocols", () => {
            const EndangeredAnimal = Base.extend([Animal, Tracked]);
            expect(EndangeredAnimal.conformsTo(Animal)).to.be.true;
            expect(EndangeredAnimal.conformsTo(Tracked)).to.be.true;
            expect(EndangeredAnimal[Metadata].protocols).to.eql([Animal, Tracked]);
        });

        it("should allow redefining method", () => {
            const SmartTricks = Tricks.extend({
                    fetch: function (item) {}
                }),
                SmartDog = Dog.extend({
                    fetch: function (item) { return 'Buried ' + item; }
                }),
                dog = new SmartDog;
            expect(SmartTricks(dog).fetch('bone')).to.equal('Buried bone');
        });

        it("should support strict when redefing method", () => {
            const SmartTricks = Tricks.extend({
                    constructor: function (proxy) {
                        this.base(proxy, true);
                    },
                    fetch: function (item) {}
                }),
                SmartDog = Dog.extend({
                    fetch: function (item) { return 'Buried ' + item; }
                }),
                dog = new SmartDog;
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
            expect(Animal.adoptedBy(new Dog)).to.be.true;
        });
    });

    describe("#addProtocol", () => {
        it("should add protocol to class", () => {
            const Bird  = Base.extend(Animal),
                  eagle = (new Bird).extend({
                   getTag() { return "Eagle"; }
				});
            Bird[Metadata].addProtocol(Tracked);
            expect(Bird.conformsTo(Tracked)).to.be.true;
			expect(eagle.getTag()).to.equal("Eagle");
        });

        it("should add protocol to protocol", () => {
            const Bear      = Base.extend(Animal),
                  polarBear = (new Bear).extend({
                  getTag() { return "Polar Bear"; }
            });
			Animal[Metadata].addProtocol(Tracked);
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
            let count = 0;
            const Dog2  = Dog.extend({
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
            expect(CircusAnimal(dog).name).to.equal('Franky');
        });

        it("should delegate property gets to array", () => {
            let count = 0;
            const Dog2  = Dog.extend({
                      constructor: function (name) {
                          this.base(name);
                          this.extend({
                              getName() {
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
                      constructor: function (name) {
                          this.base(name);
                          this.extend({
                              getName() {
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
                $properties: {
                    nickname: undefined
                }
            });
            dog.extend({
                $properties: {
                    nickname: ''
                }
            });
            Animal(dog).nickname = 'HotDog';
            expect(dog.nickname).to.equal('HotDog');
        });
    });
});

describe("ProxyBuilder", () => {
    const ToUpperInterceptor = Interceptor.extend({
        intercept: function (invocation) {
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
            const proxyBuilder = new ProxyBuilder,
                  DogProxy     = proxyBuilder.buildProxy([Dog]),
                  dog          = new DogProxy({
                                     parameters:   ['Patches'],
                                     interceptors: [new LogInterceptor]
                  });
            expect(dog.name).to.equal('Patches');
            expect(dog.getName()).to.equal('Patches');
            expect(dog.talk()).to.equal('Ruff Ruff');
            expect(dog.fetch("bone")).to.equal('Fetched bone');
        });

        it("should proxy protocol", () => {
            const proxyBuilder = new ProxyBuilder,
                  AnimalProxy  = proxyBuilder.buildProxy([Animal]),
                  AnimalInterceptor = Interceptor.extend({
                      name : '',
                      intercept: function (invocation) {
                          const method = invocation.method,
                                args   = invocation.args;
                          if (method === "getName") {
                              return this.name;
                          } else if (method === 'setName') {
                              return (this.name = args[0]);
                          } else if (method === "talk") {
                              return "I don't know what to say.";
                          } else if (method === "eat") {
                              return `I don\'t like ${args[0]}.`;
                          }
                        return invocation.proceed();
                      }
                  }),
                  animal = new AnimalProxy({
                      interceptors: [new AnimalInterceptor]
                  });
            animal.name = "Pluto";
            expect(animal.name).to.equal("Pluto");
            expect(animal.talk()).to.equal("I don't know what to say.");
            expect(animal.eat('pizza')).to.equal("I don't like pizza.");
        });

        it("should proxy classes and protocols", () => {
            const proxyBuilder   = new ProxyBuilder,
                  Flying         = Protocol.extend({ fly() {} }),
                  FlyingInterceptor = Interceptor.extend({
                      intercept: function (invocation) {
                          if (invocation.method !== 'fly') {
                              return invocation.proceed();
                          }
                      }
                  }),
                  FlyingDogProxy = proxyBuilder.buildProxy([Dog, Flying, DisposingMixin]);
            $using(new FlyingDogProxy({
                       parameters:   ['Wonder Dog'],
                       interceptors: [new FlyingInterceptor, new LogInterceptor]
                   }), function (wonderDog) {
                expect(wonderDog.getName()).to.equal('Wonder Dog');
                expect(wonderDog.talk()).to.equal('Ruff Ruff');
                expect(wonderDog.fetch("purse")).to.equal('Fetched purse');
                wonderDog.fly();
                }
            );
        });

        it("should modify arguments and return value", () => {
            const proxyBuilder = new ProxyBuilder,
                  DogProxy     = proxyBuilder.buildProxy([Dog]),
                  dog          = new DogProxy({
                                     parameters:   ['Patches'],
                                     interceptors: [new ToUpperInterceptor]
                                 });
            expect(dog.getName()).to.equal('PATCHES');
            expect(dog.talk()).to.equal('RUFF RUFF');
            expect(dog.fetch("bone")).to.equal('FETCHED BONE');
        });

        it("should restrict proxied method with interceptor selector options", () => {
            const proxyBuilder = new ProxyBuilder,
                  selector     =  (new InterceptorSelector).extend({
                      selectInterceptors: function (type, method, interceptors) {
                          return method === 'getName' ? interceptors : [];
                  }}),
                  DogProxy     = proxyBuilder.buildProxy([Dog]),
                  dog          = new DogProxy({
                                     parameters:           ['Patches'],
                                     interceptors:         [new ToUpperInterceptor],
                                     interceptorSelectors: [selector]
                                 });
            expect(dog.getName()).to.equal('PATCHES');
            expect(dog.talk()).to.equal('Ruff Ruff');
            expect(dog.fetch("bone")).to.equal('Fetched bone');
        });

        it("should fail if no types array provided", () => {
            const proxyBuilder = new ProxyBuilder;
            expect(() => {
                proxyBuilder.buildProxy();
            }).to.throw(Error, "ProxyBuilder requires an array of types to proxy.");
        });

        it("should fail if no method to proceed too", () => {
            const proxyBuilder = new ProxyBuilder,
                  AnimalProxy  = proxyBuilder.buildProxy([Animal]),
                  animal       = new AnimalProxy([]);
            expect(() => {
                animal.talk();
            }).to.throw(Error, "Interceptor cannot proceed without a class or delegate method 'talk'.");
        });
    });

    describe("#extend", () => {
        it("should reject extending  proxy classes.", () => {
            const proxyBuilder = new ProxyBuilder,
                  DogProxy     = proxyBuilder.buildProxy([Dog]);
            expect(() => {
                DogProxy.extend();
            }).to.throw(TypeError, "Proxy classes are sealed and cannot be extended from.");
        });

        it("should proxy new method", () => {
            const proxyBuilder = new ProxyBuilder,
                  DogProxy     = proxyBuilder.buildProxy([Dog]),
                  dog          = new DogProxy({
                                    parameters:  ['Patches'],
                                    interceptors:[new ToUpperInterceptor]
                                 });
            dog.extend("getColor", () => { return "white with brown spots"; });
            dog.extend({
                getBreed() { return "King James Cavalier"; }
            });
            expect(dog.getColor()).to.equal("WHITE WITH BROWN SPOTS");
            expect(dog.getBreed()).to.equal("KING JAMES CAVALIER");
        });

        it("should proxy existing methods", () => {
            const proxyBuilder = new ProxyBuilder,
                  DogProxy     = proxyBuilder.buildProxy([Dog]),
                  dog          = new DogProxy({
                                    parameters:  ['Patches'],
                                    interceptors:[new ToUpperInterceptor]
                                 });
            expect(dog.getName()).to.equal("PATCHES");
            dog.extend({
                getName() { return "Spike"; }
            });
            expect(dog.getName()).to.equal("SPIKE");
        });
    });

    describe("#implement", () => {
        it("should reject extending  proxy classes.", () => {
            const proxyBuilder = new ProxyBuilder,
                  DogProxy     = proxyBuilder.buildProxy([Dog]);
            expect(() => {
                DogProxy.implement(DisposingMixin);
            }).to.throw(TypeError, "Proxy classes are sealed and cannot be extended from.");
        });
    });
});

/*
describe("Package", () => {
    describe("#version", () => {
        it("should inherit parent version", () => {
            var foo = base2.package(this, {
                name:    "foo",
                version: "1.0.0"
            });
            var bar = foo.package(this, {
                name:    "bar",
            });
            var baz = bar.package(this, {
                name:    "baz",
                version: "2.0.0"
            });            
            expect(bar.version).to.equal("1.0.0");
            expect(baz.version).to.equal("2.0.0");
        });        
    });
    
    describe("#getProtocols", () => {
        it("should expose protocol definitions", () => {
            var protocols = [];
            miruken_test.getProtocols(function (protocol) {
                protocols.push(protocol.member);
            });
            expect(protocols).to.have.members([Animal, Tricks, CircusAnimal, Tracked]);
        });

        it("should expose filtered protocol definitions", () => {
            var protocols = [];
            miruken_test.getProtocols(["Tricks", "Tracked"], function (protocol) {
                protocols.push(protocol.member);
            });
            expect(protocols).to.have.members([Tricks, Tracked]);
        });
    });

    describe("#getClasses", () => {
        it("should expose class definitions", () => {
            var classes = [];
            miruken_test.getClasses(function (cls) {
                classes.push(cls.member);
            });
            expect(classes).to.have.members([Dog, Elephant, AsianElephant, ShoppingCart, LogInterceptor]);
        });

        it("should expose filtered class definitions", () => {
            var classes = [];
            miruken_test.getClasses(["Elephant", "AsianElephant"], function (cls) {
                classes.push(cls.member);
            });
            expect(classes).to.have.length(2);
            expect(classes).to.have.members([Elephant, AsianElephant]);
        });        
    });

    describe("#getPackages", () => {
        it("should expose package definitions", () => {
            var packages = [];
            base2.getPackages(function (pkg) {
                packages.push(pkg.member);
            });
            expect(packages).to.contain(miruken_test);
        });

        it("should expose filterd package definitions", () => {
            var packages = [];
            base2.getPackages("foo", function (pkg) {
                packages.push(pkg.member);
            });
            expect(packages).to.have.length(0);
        });
        
    });
});
*/

function delay(ms) {
    return new Promise(function (resolve, reject) {
        setTimeout(resolve, ms);
    });
}
