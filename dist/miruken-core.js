

if (Promise.prototype.finally === undefined)
    Promise.prototype.finally = function (callback) {
        let p = this.constructor;
        return this.then(
            value  => p.resolve(callback()).then(() => value),
            reason => p.resolve(callback()).then(() => { throw reason })
        );
    };

if (Promise.delay === undefined)
    Promise.delay = function (ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    };

/**
 * Annotates invariance.
 * @attribute $eq
 * @for miruken.Modifier
 */
export const $eq = $createModifier();

/**
 * Annotates use value as is.
 * @attribute $use
 * @for miruken.Modifier
 */    
export const $use = $createModifier();

/**
 * Annotates copy semantics.
 * @attribute $copy
 * @for miruken.Modifier
 */        
export const $copy = $createModifier();

/**
 * Annotates lazy semantics.
 * @attribute $lazy
 * @for miruken.Modifier
 */            
export const $lazy = $createModifier();

/**
 * Annotates function to be evaluated.
 * @attribute $eval
 * @for miruken.Modifier
 */                
export const $eval = $createModifier();

/**
 * Annotates zero or more semantics.
 * @attribute $every
 * @for miruken.Modifier
 */                    
export const $every = $createModifier();

/**
 * Annotates 
 * @attribute use {{#crossLink "miruken.Parenting"}}{{/crossLink}} protocol.
 * @attribute $child
 * @for miruken.Modifier
 */                        
export const $child = $createModifier();

/**
 * Annotates optional semantics.
 * @attribute $optional
 * @for miruken.Modifier
 */                        
export const $optional = $createModifier();

/**
 * Annotates Promise expectation.
 * @attribute $promise
 * @for miruken.Modifier
 */                            
export const $promise = $createModifier();

/**
 * Annotates synchronous.
 * @attribute $instant
 * @for miruken.Modifier
 */                                
export const $instant = $createModifier();

/**
 * Class for annotating targets.
 * @class Modifier
 * @param  {Object}  source  -  source to annotate
 */
export function Modifier() {}
Modifier.isModified = function (source) {
    return source instanceof Modifier;
};
Modifier.unwrap = function (source) {
    return (source instanceof Modifier) 
        ? Modifier.unwrap(source.getSource())
        : source;
};
export function $createModifier() {
    let allowNew;
    function modifier(source) {
        if (!new.target) {
            if (modifier.test(source)) {
                return source;
            }
            allowNew = true;
            const wrapped = new modifier(source);
            allowNew = false;
            return wrapped;
        } else {
            if (!allowNew) {
                throw new Error("Modifiers should not be called with the new operator.");
            }
            this.getSource = function () {
                return source;
            }
        }
    }
    modifier.prototype = new Modifier();
    modifier.test      = function (source) {
        if (source instanceof modifier) {
            return true;
        } else if (source instanceof Modifier) {
            return modifier.test(source.getSource());
        }
        return false;
    }
    return modifier;
}

/*
  base2 - copyright 2007-2009, Dean Edwards
  http://code.google.com/p/base2/
  http://www.opensource.org/licenses/mit-license.php

  Contributors:
    Doeke Zanstra
*/

export const Undefined = K(),
             Null      = K(null),
             True      = K(true),
             False     = K(false);

var __prototyping, _counter = 1;

const _IGNORE = K(),
      _BASE   = /\bbase\b/,
      _HIDDEN = ["constructor", "toString"],     // only override these when prototyping
      _slice  = Array.prototype.slice;

// =========================================================================
// base2/Base.js
// =========================================================================

// http://dean.edwards.name/weblog/2006/03/base/

const _subclass = function(_instance, _static) {
  // Build the prototype.
  __prototyping = this.prototype;
  var _prototype = new this;
  if (_instance) extend(_prototype, _instance);
  _prototype.base = function() {
    // call this method from any other method to invoke that method's ancestor
  };
  __prototyping = undefined;
  
  // Create the wrapper for the constructor function.
  var _constructor = _prototype.constructor;
  function _class() {
    // Don't call the constructor function when prototyping.
    if (!__prototyping) {
      if (this && (this.constructor == _class || this.__constructing)) {
        // Instantiation.
        this.__constructing = true;
        var instance = _constructor.apply(this, arguments);
        delete this.__constructing;
        if (instance) return instance;
      } else {
        // Casting.
	    var target = arguments[0];
	    if (target instanceof _class) return target;
        var cls = _class;
        do {
          if (cls.coerce) {
	        var cast = cls.coerce.apply(_class, arguments);
            if (cast) return cast;
          }
        } while ((cls = cls.ancestor) && (cls != Base));
        return extend(target, _prototype);
      }
    }
    return this;
  };
  _prototype.constructor = _class;
  
  // Build the static interface.
  for (var i in Base) _class[i] = this[i];
  if (_static) extend(_class, _static);
  _class.ancestor = this;
  _class.ancestorOf = Base.ancestorOf;
  _class.base = _prototype.base;
  _class.prototype = _prototype;
  if (_class.init) _class.init();
  
  return _class;
};

export let Base = _subclass.call(Object, {
  constructor: function() {
    if (arguments.length > 0) {
      this.extend(arguments[0]);
    }
  },
  
  extend: delegate(extend),
  
  toString: function() {
    if (this.constructor.toString == Function.prototype.toString) {
      return "[object base2.Base]";
    } else {
      return "[object " + this.constructor.toString().slice(1, -1) + "]";
    }
  }
}, Base = {
  ancestorOf: function(klass) {
    return _ancestorOf(this, klass);
  },

  extend: _subclass,

  implement: function(source) {
    if (typeof source == "function") {
      source = source.prototype;
    }
    // Add the interface using the extend() function.
    extend(this.prototype, source);
    return this;
  }
});

// =========================================================================
// base2/Package.js
// =========================================================================

export const Package = Base.extend({
  constructor: function(_private, _public) {
    var pkg = this, openPkg;
    
    pkg.extend(_public);

    if (pkg.name && pkg.name != "base2") {
      if (_public.parent === undefined) pkg.parent = base2;
      openPkg = pkg.parent && pkg.parent[pkg.name];
      if (openPkg) {
        if (!(openPkg instanceof Package)) {
          throw new Error(format("'%1' is reserved and cannot be used as a package name", pkg.name));
        }
        pkg.namespace = openPkg.namespace;
      } else {
        if (pkg.parent) {
          pkg.version = pkg.version || pkg.parent.version;
          pkg.parent.addName(pkg.name, pkg);
        }
        pkg.namespace = format("var %1=%2;", pkg.name, pkg.toString().slice(1, -1));
      }
    }
    
    if (_private) {
      _private.__package = this;
      _private.package = openPkg || this;
      
      // This string should be evaluated immediately after creating a Package object.
      var namespace = "var base2=(function(){return this.base2})(),_private=base2.toString;" + base2.namespace;
      var imports = csv(pkg.imports), name;
      for (var i = 0; name = imports[i]; i++) {
        var ns = lookup(name) || lookup("js." + name);
        if (!ns) throw new ReferenceError(format("Object not found: '%1'.", name));
        namespace += ns.namespace;
      }
      if (openPkg) namespace += openPkg.namespace;

      _private.init = function() {
        if (pkg.init) pkg.init();
      };
      _private.imports = namespace + lang.namespace + "this.init();";
      
      // This string should be evaluated after you have created all of the objects
      // that are being exported.
      namespace = "";
      var nsPkg = openPkg || pkg;
      var exports = csv(pkg.exports);
      for (var i = 0; name = exports[i]; i++) {
        var fullName = pkg.name + "." + name;
        nsPkg.namespace += "var " + name + "=" + fullName + ";";
        namespace += "if(!" + fullName + ")" + fullName + "=" + name + ";";
      }
      _private.exported = function() {
        if (nsPkg.exported) nsPkg.exported(exports);
      };
      _private.exports = "if(!" + pkg.name +")var " + pkg.name + "=this.__package;" + namespace + "this._label_" + pkg.name + "();this.exported();";
      
      // give objects and classes pretty toString methods
      var packageName = pkg.toString().slice(1, -1);
      _private["_label_" + pkg.name] = function() {
        for (var name in nsPkg) {
          var object = nsPkg[name];
          if (object && object.ancestorOf == Base.ancestorOf && name != "constructor") { // it's a class
            object.toString = K("[" + packageName + "." + name + "]");
          }
        }
      };
    }

    if (openPkg) return openPkg;

    function lookup(names) {
      names = names.split(".");
      var value = base2, i = 0;
      while (value && names[i] != null) {
        value = value[names[i++]];
      }
      return value;
    };
  },

  exports: "",
  imports: "",
  name: "",
  namespace: "",
  parent: null,

  open: function(_private, _public) {
    _public.name   = this.name;
    _public.parent = this.parent;
    return new Package(_private, _public);
  },  

  addName: function(name, value) {
    if (!this[name]) {
      this[name] = value;
      this.exports += "," + name;
      this.namespace += format("var %1=%2.%1;", name, this.name);
      if (value && value.ancestorOf == Base.ancestorOf && name != "constructor") { // it's a class
        value.toString = K("[" + this.toString().slice(1, -1) + "." + name + "]");
      }
      if (this.exported) this.exported([name]);
    }
  },

  addPackage: function(name) {
    var pkg = new Package(null, {name: name, parent: this});
    this.addName(name, pkg);
    return pkg;
  },

  package: function(_private, _public) {
    _public.parent = this;
    return new Package(_private, _public);
  },
    
  toString: function() {
    return format("[%1]", this.parent
         ? this.parent.toString().slice(1, -1) + "." + this.name
         : this.name);
  }
});

// =========================================================================
// base2/Abstract.js
// =========================================================================

export const Abstract = Base.extend({
  constructor: function() {
    throw new TypeError("Abstract class cannot be instantiated.");
  }
});

// =========================================================================
// base2/Module.js
// =========================================================================

var _moduleCount = 0;

export const Module = Abstract.extend(null, {
  namespace: "",

  extend: function(_interface, _static) {
    // Extend a module to create a new module.
    var module = this.base();
    var index = _moduleCount++;
    module.namespace = "";
    module.partial = this.partial;
    module.toString = K("[base2.Module[" + index + "]]");
    Module[index] = module;
    // Inherit class methods.
    module.implement(this);
    // Implement module (instance AND static) methods.
    if (_interface) module.implement(_interface);
    // Implement static properties and methods.
    if (_static) {
      extend(module, _static);
      if (module.init) module.init();
    }
    return module;
  },

  implement: function(_interface) {
    var module = this;
    var id = module.toString().slice(1, -1);
    if (typeof _interface == "function") {
      if (!_ancestorOf(_interface, module)) {
        this.base(_interface);
      }
      if (_ancestorOf(Module, _interface)) {
        // Implement static methods.
        for (var name in _interface) {
          if (typeof module[name] == "undefined") {
            var property = _interface[name];
            if (typeof property == "function" && property.call && _interface.prototype[name]) {
              property = _createStaticModuleMethod(_interface, name);
            }
            module[name] = property;
          }
        }
        module.namespace += _interface.namespace.replace(/base2\.Module\[\d+\]/g, id);
      }
    } else {
      // Add static interface.
      extend(module, _interface);
      // Add instance interface.
      _extendModule(module, _interface);
    }
    return module;
  },

  partial: function() {
    var module = Module.extend();
    var id = module.toString().slice(1, -1);
    // partial methods are already bound so remove the binding to speed things up
    module.namespace = this.namespace.replace(/(\w+)=b[^\)]+\)/g, "$1=" + id + ".$1");
    this.forEach(function(method, name) {
      module[name] = partial(bind(method, module));
    });
    return module;
  }
});


Module.prototype.base =
Module.prototype.extend = _IGNORE;

function _extendModule(module, _interface) {
  var proto = module.prototype;
  var id = module.toString().slice(1, -1);
  for (var name in _interface) {
    var property = _interface[name], namespace = "";
    if (!proto[name]) {
      if (name == name.toUpperCase()) {
        namespace = "var " + name + "=" + id + "." + name + ";";
      } else if (typeof property == "function" && property.call) {
        namespace = "var " + name + "=base2.lang.bind('" + name + "'," + id + ");";
        proto[name] = _createModuleMethod(module, name);
      }
      if (module.namespace.indexOf(namespace) == -1) {
        module.namespace += namespace;
      }
    }
  }
};

function _createStaticModuleMethod(module, name) {
  return function() {
    return module[name].apply(module, arguments);
  };
};

function _createModuleMethod(module, name) {
  return function() {
    var args = _slice.call(arguments);
    args.unshift(this);
    return module[name].apply(module, args);
  };
};

// =========================================================================
// lang/copy.js
// =========================================================================

export function copy(object) { // A quick copy.
  var copy = {};
  for (var i in object) {
    copy[i] = object[i];
  }
  return copy;
};

export function pcopy(object) { // Prototype-base copy.
  // Doug Crockford / Richard Cornford
  _dummy.prototype = object;
  return new _dummy;
};

function _dummy(){};

// =========================================================================
// lang/extend.js
// =========================================================================

export function extend(object, source) { // or extend(object, key, value)
  if (object && source) {
    var useProto = __prototyping;
    if (arguments.length > 2) { // Extending with a key/value pair.
      var key = source;
      source = {};
      source[key] = arguments[2];
      useProto = true;
    }
    var proto = (typeof source == "function" ? Function : Object).prototype;
    // Add constructor, toString etc
    if (useProto) {
      var i = _HIDDEN.length, key;
      while ((key = _HIDDEN[--i])) {
        var desc = getPropertyDescriptors(source, key);
        if (!desc || desc.value != proto[key]) {
          desc = _override(object, key, desc);
          if (desc) Object.defineProperty(object, key, desc);
        }
      }
    }
      // Copy each of the source object's properties to the target object.
    var props = getPropertyDescriptors(source);
    Reflect.ownKeys(props).forEach(function (key) {
      if (typeof proto[key] == "undefined" && key !== "base") {
        var desc = _override(object, key, props[key]);
        if (desc) Object.defineProperty(object, key, desc);
      }
    });
  }
  return object;
};

function _ancestorOf(ancestor, fn) {
  // Check if a function is in another function's inheritance chain.
  while (fn) {
    if (!fn.ancestor) return false;
    fn = fn.ancestor;
    if (fn == ancestor) return true;
  }
  return false;
};

function _override(object, key, desc) {
  var value = desc.value;
  if (value === _IGNORE) return;
  if ((typeof value !== "function") && ("value" in desc)) {
    return desc;
  }
  var ancestor = getPropertyDescriptors(object, key);
  if (!ancestor) return desc;
  var superObject = __prototyping; // late binding for prototypes;
  if (superObject) {
    var sprop = getPropertyDescriptors(superObject, key);
    if (sprop && (sprop.value != ancestor.value ||
                  sprop.get   != ancestor.get ||
                  sprop.set   != ancestor.set)) {
        superObject = null;
    }
  }
  if (value) {
    var avalue = ancestor.value;
    if (avalue && _BASE.test(value)) {
      desc.value = function () {
        var b = this.base;
        this.base = function () {
          var b = this.base,
              method = (superObject && superObject[key]) || avalue;
          this.base = Undefined;  // method overriden in ctor
          var ret = method.apply(this, arguments);
          this.base = b;
          return ret;
        };
        var ret = value.apply(this, arguments);
        this.base = b;
        return ret;
      };
    }
    return desc;
  }
  var get = desc.get, aget = ancestor.get;        
  if (get) {
    if (aget && _BASE.test(get)) {
      desc.get = function () {
        var b = this.base;
        this.base = function () {
          var b = this.base,
              get = (superObject && getPropertyDescriptors(superObject, key).get) || aget;
          this.base = Undefined;  // getter overriden in ctor            
          var ret = get.apply(this, arguments);
          this.base = b;
          return ret;
        }
        var ret = get.apply(this, arguments);
        this.base = b;
        return ret;
      };
    }
  } else if (superObject) {
    desc.get = function () {
      var get = getPropertyDescriptors(superObject, key).get;
      return get.apply(this, arguments);
    };
  } else {
      desc.get = aget;
  }
  var set = desc.set, aset = ancestor.set;        
  if (set) {
    if (aset && _BASE.test(set)) {
      desc.set = function () {
        var b = this.base;
        this.base = function () {
          var b = this.base,
              set = (superObject && getPropertyDescriptors(superObject, key).set) || aset;
          this.base = Undefined;  // setter overriden in ctor            
          var ret = set.apply(this, arguments);
          this.base = b;
          return ret;
        }
        var ret = set.apply(this, arguments);
        this.base = b;
        return ret;
      };
    }
  } else if (superObject) {
    desc.set = function () {
      var set = getPropertyDescriptors(superObject, key).set;
      return set.apply(this, arguments);
    };      
  } else {
    desc.set = aset;
  }
  return desc;
};
    
export function getPropertyDescriptors(obj, key) {
    var props = key ? null : {},
        own   = false,
        prop;
    do {
      if (key) {
        prop = Reflect.getOwnPropertyDescriptor(obj, key);
        if (prop) return prop.own = own, prop;
      } else {
          Reflect.ownKeys(obj).forEach(function (key) {
            if (!Reflect.has(props, key)) {
              prop = Reflect.getOwnPropertyDescriptor(obj, key);
              if (prop) props[key] = (prop.own = own, prop);
            }
          });
        }
    } while (own = false, obj = Object.getPrototypeOf(obj));
    return props;
}

// =========================================================================
// lang/instanceOf.js
// =========================================================================

export function instanceOf(object, klass) {
  // Handle exceptions where the target object originates from another frame.
  // This is handy for JSON parsing (amongst other things).
  
  if (typeof klass != "function") {
    throw new TypeError("Invalid 'instanceOf' operand.");
  }

  if (object == null) return false;
   
  if (object.constructor == klass) return true;
  if (klass.ancestorOf) return klass.ancestorOf(object.constructor);
  /*@if (@_jscript_version < 5.1)
    // do nothing
  @else @*/
    if (object instanceof klass) return true;
  /*@end @*/

  // If the class is a base2 class then it would have passed the test above.
  if (Base.ancestorOf == klass.ancestorOf) return false;
  
  // base2 objects can only be instances of Object.
  if (Base.ancestorOf == object.constructor.ancestorOf) return klass == Object;
  
  switch (klass) {
    case Array:
      return _toString.call(object) == "[object Array]";
    case Date:
      return _toString.call(object) == "[object Date]";
    case RegExp:
      return _toString.call(object) == "[object RegExp]";
    case Function:
      return typeOf(object) == "function";
    case String:
    case Number:
    case Boolean:
      return typeOf(object) == typeof klass.prototype.valueOf();
    case Object:
      return true;
  }
  
  return false;
};

var _toString = Object.prototype.toString;

// =========================================================================
// lang/typeOf.js
// =========================================================================

// http://wiki.ecmascript.org/doku.php?id=proposals:typeof

export function typeOf(object) {
  var type = typeof object;
  switch (type) {
    case "object":
      return object == null
        ? "null"
        : typeof object.constructor == "function"
          && _toString.call(object) != "[object Date]"
             ? typeof object.constructor.prototype.valueOf() // underlying type
             : type;
    case "function":
      return typeof object.call == "function" ? type : "object";
    default:
      return type;
  }
};

export function assignID(object, name) {
  // Assign a unique ID to an object.
  if (!name) name = object.nodeType == 1 ? "uniqueID" : "base2ID";
  if (!object.hasOwnProperty(name)) object[name] = "b2_" + _counter++;
  return object[name];
};

export function format(string) {
    // Replace %n with arguments[n].
    // e.g. format("%1 %2%3 %2a %1%3", "she", "se", "lls");
    // ==> "she sells sea shells"
    // Only %1 - %9 supported.
    var args = arguments;
    var pattern = new RegExp("%([1-" + (arguments.length - 1) + "])", "g");
    return (string + "").replace(pattern, function(match, index) {
        return args[index];
    });
};

export function csv(string) {
    return string ? (string + "").split(/\s*,\s*/) : [];
};

export function bind(fn, context) {
    var lateBound = typeof fn != "function";
    if (arguments.length > 2) {
        var args = _slice.call(arguments, 2);
        return function() {
            return (lateBound ? context[fn] : fn).apply(context, args.concat.apply(args, arguments));
        };
    } else { // Faster if there are no additional arguments.
        return function() {
            return (lateBound ? context[fn] : fn).apply(context, arguments);
        };
    }
};

export function partial(fn) { // Based on Oliver Steele's version.
    var args = _slice.call(arguments, 1);
    return function() {
        var specialised = args.concat(), i = 0, j = 0;
        while (i < args.length && j < arguments.length) {
            if (specialised[i] === undefined) specialised[i] = arguments[j++];
            i++;
        }
        while (j < arguments.length) {
            specialised[i++] = arguments[j++];
        }
        if (Array2.contains(specialised, undefined)) {
            specialised.unshift(fn);
            return partial.apply(null, specialised);
        }
        return fn.apply(this, specialised);
    };
};

export function delegate(fn, context) {
    return function() {
        var args = _slice.call(arguments);
        args.unshift(this);
        return fn.apply(context, args);
    };
};

function K(k) {
    return function() {
        return k;
    };
};

/**
 * Defines an enumeration.
 * <pre>
 *    var Color = Enum({
 *        red:   1,
 *        green: 2,
 *        blue:  3
 *    })
 * </pre>
 * @class Enum
 * @constructor
 * @param  {Any}     value    -  enum value
 * @param  {string}  name     -  enum name
 * @param  {number}  ordinal  -  enum position
 */
const Defining = Symbol();

export const Enum = Base.extend({
    constructor(value, name, ordinal) {
        this.constructing(value, name);
        Object.defineProperties(this, {
            "value": {
                value:        value,
                writable:     false,
                configurable: false
            },
            "name": {
                value:        name,
                writable:     false,
                configurable: false
            },
            "ordinal": {
                value:        ordinal,
                writable:     false,
                configurable: false
            },
            
        });
    },
    toString() { return this.name; },
    constructing(value, name) {
        if (!this.constructor[Defining]) {
            throw new TypeError("Enums cannot be instantiated.");
        }            
    }
}, {
    coerce(choices, behavior) {
        if (this !== Enum && this !== Flags) {
            return;
        }
        let en = this.extend(behavior, {
            coerce(value) {
                return this.fromValue(value);
            }
        });
        en[Defining] = true;
        const names  = Object.freeze(Object.keys(choices));
        let   items  = Object.keys(choices).map(
            (name, ordinal) => en[name] = new en(choices[name], name, ordinal));
        en.names     = Object.freeze(names);        
        en.items     = Object.freeze(items);
        en.fromValue = this.fromValue;
        delete en[Defining]
        return Object.freeze(en);
    },
    fromValue(value) {
        const match = this.items.find(item => item.value == value);
        if (!match) {
            throw new TypeError(`${value} is not a valid value for this Enum.`);
        }
        return match;
    }
});
Enum.prototype.valueOf = function () {
    const value = +this.value;
    return isNaN(value) ? this.ordinal : value;
}

/**
 * Defines a flags enumeration.
 * <pre>
 *    var DayOfWeek = Flags({
 *        Monday:     1 << 0,
 *        Tuesday:    1 << 1,
 *        Wednesday:  1 << 2,
 *        Thursday:   1 << 3,
 *        Friday:     1 << 4,
 *        Saturday:   1 << 5,
 *        Sunday:     1 << 6
 *    })
 * </pre>
 * @class Enum
 * @constructor
 * @param  {Any} value     -  flag value
 * @param  {string} value  -  flag name
 */    
export const Flags = Enum.extend({
    hasFlag(flag) {
        flag = +flag;
        return (this & flag) === flag;
    },
    addFlag(flag) {
        return $isSomething(flag)
             ? this.constructor.fromValue(this | flag)
             : this;
    },
    removeFlag(flag) {
        return $isSomething(flag)
             ? this.constructor.fromValue(this & (~flag))
             : this;
    },
    constructing(value, name) {}        
}, {
    fromValue(value) {
        value = +value;
        let name, names = this.names;
        for (let i = 0; i < names.length; ++i) {
            const flag = this[names[i]];
            if (flag.value === value) {
                return flag;
            }
            if ((value & flag.value) === flag.value) {
                name = name ? (name + "," + flag.name) : flag.name;
            }
        }
        return new this(value, name);
    }
});

/**
 * Helper class to simplify array manipulation.
 * @class ArrayManager
 * @constructor
 * @param  {Array}  [...items]  -  initial items
 * @extends Base
 */
export const ArrayManager = Base.extend({
    constructor(items) {
        let _items = [];
        this.extend({
            /** 
             * Gets the array.
             * @method getItems
             * @returns  {Array} array.
             */
            getItems() { return _items; },
            /** 
             * Gets the item at array `index`.
             * @method getIndex
             * @param    {number}  index - index of item
             * @returns  {Any} item at index.
             */
            getIndex(index) {
                if (_items.length > index) {
                    return _items[index];
                }
            },
            /** 
             * Sets `item` at array `index` if empty.
             * @method setIndex
             * @param    {number}  index - index of item
             * @param    {Any}     item  - item to set
             * @returns  {ArrayManager} array manager.
             * @chainable
             */
            setIndex(index, item) {
                if ((_items.length <= index) ||
                    (_items[index] === undefined)) {
                    _items[index] = this.mapItem(item);
                }
                return this;
            },
            /** 
             * Inserts `item` at array `index`.
             * @method insertIndex
             * @param    {number}   index - index of item
             * @param    {Item}     item  - item to insert
             * @returns  {ArrayManager} array manager.
             * @chainable
             */
            insertIndex(index, item) {
                _items.splice(index, 0, this.mapItem(item));
                return this;
            },
            /** 
             * Replaces `item` at array `index`.
             * @method replaceIndex
             * @param    {number}   index - index of item
             * @param    {Item}     item  - item to replace
             * @returns  {ArrayManager} array manager.
             * @chainable
             */
            replaceIndex(index, item) {
                _items[index] = this.mapItem(item);
                return this;
            },
            /** 
             * Removes the item at array `index`.
             * @method removeIndex
             * @param    {number}   index - index of item
             * @returns  {ArrayManager} array manager.
             * @chainable
             */
            removeIndex(index) {
                if (_items.length > index) {
                    _items.splice(index, 1);
                }
                return this;
            },
            /** 
             * Appends one or more items to the end of the array.
             * @method append
             * @returns  {ArrayManager} array manager.
             * @chainable
             */
            append(/* items */) {
                let newItems;
                if (arguments.length === 1 && Array.isArray(arguments[0])) {
                    newItems = arguments[0];
                } else if (arguments.length > 0) {
                    newItems = arguments;
                }
                if (newItems) {
                    for (let i = 0; i < newItems.length; ++i) {
                        _items.push(this.mapItem(newItems[i]));
                    }
                }
                return this;
            },
            /** 
             * Merges the items into the array.
             * @method merge
             * @param    {Array}  items - items to merge from
             * @returns  {ArrayManager} array manager.
             * @chainable
             */
            merge(items) {
                for (let index = 0; index < items.length; ++index) {
                    const item = items[index];
                    if (item !== undefined) {
                        this.setIndex(index, item);
                    }
                }
                return this;
            }
        });
        if (items) {
            this.append(items);
        }
    },
    /** 
     * Optional mapping for items before adding to the array.
     * @method mapItem
     * @param    {Any}  item  -  item to map
     * @returns  {Any}  mapped item.
     */
    mapItem(item) { return item; }
});

/**
 * Maintains a simple doublely-linked list with indexing.
 * Indexes are partially ordered according to the order comparator.
 * @class IndexedList
 * @constructor
 * @param  {Function}  order  -  orders items
 * @extends Base
 */
export const IndexedList = Base.extend({
    constructor(order) {
        let _index = {};
        this.extend({
            /** 
             * Determines if list is empty.
             * @method isEmpty
             * @returns  {boolean}  true if list is empty, false otherwise.
             */
            isEmpty() {
                return !this.head;
            },
            /** 
             * Gets the node at an `index`.
             * @method getIndex
             * @param    {number} index - index of node
             * @returns  {Any}  the node at index.
             */
            getIndex(index) {
                return index && _index[index];
            },
            /** 
             * Inserts `node` at `index`.
             * @method insert
             * @param  {Any}     node   - node to insert
             * @param  {number}  index  - index to insert at
             */
            insert(node, index) {
                const indexedNode = this.getIndex(index);
                let insert = indexedNode;
                if (index) {
                    insert = insert || this.head;
                    while (insert && order(node, insert) >= 0) {
                        insert = insert.next;
                    }
                }
                if (insert) {
                    const prev  = insert.prev;
                    node.next   = insert;
                    node.prev   = prev;
                    insert.prev = node;
                    if (prev) {
                        prev.next = node;
                    }
                    if (this.head === insert) {
                        this.head = node;
                    }
                } else {
                    delete node.next;
                    const tail = this.tail;
                    if (tail) {
                        node.prev = tail;
                        tail.next = node;
                    } else {
                        this.head = node;
                        delete node.prev;
                    }
                    this.tail = node;
                }
                if (index) {
                    node.index = index;
                    if (!indexedNode) {
                        _index[index] = node;
                    }
                }
            },
            /** 
             * Removes `node` from the list.
             * @method remove
             * @param  {Any}  node  - node to remove
             */
            remove(node) {
                const prev = node.prev,
                      next = node.next;
                if (prev) {
                    if (next) {
                        prev.next = next;
                        next.prev = prev;
                    } else {
                        this.tail = prev;
                        delete prev.next;
                    }
                } else if (next) {
                    this.head = next;
                    delete next.prev;
                } else {
                    delete this.head;
                    delete this.tail;
                }
                const index = node.index;
                if (this.getIndex(index) === node) {
                    if (next && next.index === index) {
                        _index[index] = next;
                    } else {
                        delete _index[index];
                    }
                }
            }
        });
    }
});

/**
 * Throttles `fn` over a time period.
 * @method $debounce
 * @param    {Function} fn                  -  function to throttle
 * @param    {int}      wait                -  time (ms) to throttle func
 * @param    {boolean}  immediate           -  if true, trigger func early
 * @param    {Any}      defaultReturnValue  -  value to return when throttled
 * @returns  {Function} throttled function
 */
export function $debounce(fn, wait, immediate, defaultReturnValue) {
    let timeout;
    return function () {
        const context = this, args = arguments;
        const later = function () {
            timeout = null;
            if (!immediate) {
                return fn.apply(context, args);
            }
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) {
            return fn.apply(context, args);
        }
        return defaultReturnValue;
    };
};

export const Metadata = Symbol.for('miruken.$meta');

/**
 * Declares methods and properties independent of a class.
 * <pre>
 *    var Auditing = Protocol.extend({
 *        $properties: {
 *            level: undefined
 *        },
 *        record(activity) {}
 *    })
 * </pre>
 * @class Protocol
 * @constructor
 * @param   {miruken.Delegate}  delegate        -  delegate
 * @param   {boolean}           [strict=false]  -  true if strict, false otherwise
 * @extends Base
 */
const ProtocolGet      = Symbol(),
      ProtocolSet      = Symbol(),
      ProtocolInvoke   = Symbol(),
      ProtocolDelegate = Symbol(),
      ProtocolStrict   = Symbol();

export const Protocol = Base.extend({
    constructor(delegate, strict) {
        if ($isNothing(delegate)) {
            delegate = new Delegate();
        } else if ((delegate instanceof Delegate) === false) {
            if ($isFunction(delegate.toDelegate)) {
                delegate = delegate.toDelegate();
                if ((delegate instanceof Delegate) === false) {
                    throw new TypeError("'toDelegate' method did not return a Delegate.");
                }
            } else if (Array.isArray(delegate)) {
                delegate = new ArrayDelegate(delegate);
            } else {
                delegate = new ObjectDelegate(delegate);
            }
        }
        Object.defineProperties(this, {
            [ProtocolDelegate]: { value: delegate, writable: false },            
            [ProtocolStrict]:   { value: !!strict, writable: false }
        });
    },
    [ProtocolGet](key) {
        const delegate = this[ProtocolDelegate];
        return delegate && delegate.get(this.constructor, key, this[ProtocolStrict]);
    },
    [ProtocolSet](key, value) {
        const delegate = this[ProtocolDelegate];            
        return delegate && delegate.set(this.constructor, key, value, this[ProtocolStrict]);
    },
    [ProtocolInvoke](methodName, args) {
        const delegate = this[ProtocolDelegate];                        
        return delegate && delegate.invoke(this.constructor, methodName, args, this[ProtocolStrict]);
    }
}, {
    conformsTo: False,        
    /**
     * Determines if the target is a {{#crossLink "miruken.Protocol"}}{{/crossLink}}.
     * @static
     * @method isProtocol
     * @param   {Any}      target    -  target to test
     * @returns {boolean}  true if the target is a Protocol.
     */
    isProtocol(target) {
        return target && (target.prototype instanceof Protocol);
    },
    /**
     * Determines if the target conforms to this protocol.
     * @static
     * @method conformsTo
     * @param   {Any}      target    -  target to test
     * @returns {boolean}  true if the target conforms to this protocol.
     */
    adoptedBy(target) {
        return target && $isFunction(target.conformsTo)
            ? target.conformsTo(this)
            : false;
    },
    /**
     * Creates a protocol binding over the object.
     * @static
     * @method coerce
     * @param   {Object} object  -  object delegate
     * @returns {Object} protocol instance delegating to object. 
     */
    coerce(object, strict) { return new this(object, strict); }
});

/**
 * MetaStep enum
 * @class MetaStep
 * @extends Enum
 */
export const MetaStep = Enum({
    /**
     * Triggered when a new class is derived
     * @property {number} Subclass
     */
    Subclass: 1,
    /**
     * Triggered when an existing class is extended
     * @property {number} Implement
     */
    Implement: 2,
    /**
     * Triggered when an instance is extended
     * @property {number} Extend
     */
    Extend: 3
});

/**
 * Provides a method to modify a class definition at runtime.
 * @class MetaMacro
 * @extends Base
 */
export const MetaMacro = Base.extend({
    /**
     * Determines if macro applied on extension.
     * @property {boolean} active
     */
    get active() { return false; },    
    /**
     * Determines if the macro should be inherited
     * @property {boolean} inherit
     */
    get inherit() { return false; },
    /**
     * Inflates the macro for the given `step`.
     * @method inflate
     * @param  {miruken.MetaStep}  step        -  meta step
     * @param  {miruken.MetaBase}  metadata    -  source metadata
     * @param  {Object}            target      -  target macro applied to
     * @param  {Object}            definition  -  updates to apply
     * @param  {Function}          expand      -  expanded definition
     */
    inflate(step, metadata, target, definition, expand) {},
    /**
     * Execite the macro for the given `step`.
     * @method execute
     * @param  {miruken.MetaStep}  step        -  meta step
     * @param  {miruken.MetaBase}  metadata    -  effective metadata
     * @param  {Object}            target      -  target macro applied to
     * @param  {Object}            definition  -  source to apply
     */
    execute(step, metadata, target, definition) {},
    /**
     * Triggered when `protocol` is added to `metadata`.
     * @method protocolAdded
     * @param {miruken.MetaBase}  metadata  -  effective metadata
     * @param {miruken.Protocol}  protocol  -  protocol added
     */
    protocolAdded(metadata, protocol) {},
    /**
     * Extracts the `property` and evaluate it if a function.
     * @method extractProperty
     * @param    {string}  property  -  property name
     * @param    {Object}  target    -  owning target
     * @param    {Object}  source    -  definition source
     * @returns  {Any} property value.
     */                
    extractProperty(property, target, source) {
        let value = source[property];
        if ($isFunction(value)) {
            value = value();
        }
        delete target[property];            
        return value;
    },        
}, {
    coerce(...args) { return Reflect.construct(this, args); }
});

/**
 * Base class for all metadata.
 * @class MetaBase
 * @constructor
 * @param  {miruken.MetaBase}  [parent]  - parent meta-data
 * @extends miruken.MetaMacro
 */
export const MetaBase = MetaMacro.extend({
    constructor(parent)  {
        let _protocols = [], _descriptors;
        this.extend({
            /**
             * Gets the parent metadata.
             * @property {miruken.Metabase} parent
             */
            get parent() { return parent; },
            /**
             * Gets the declared protocols.
             * @property {Array} protocols
             */
            get protocols() { return _protocols.slice(0) },
            
            /**
             * Gets all conforming protocools.
             * @property {Array} allProtocols
             */
            get allProtocols() {
                const protocols = this.protocols,
                      inner     = protocols.slice(0);
                for (let i = 0; i < inner.length; ++i) {
                    const innerProtocols = inner[i][Metadata].allProtocols;
                    for (let ii = 0; ii < innerProtocols.length; ++ii) {
                        const protocol = innerProtocols[ii];
                        if (protocols.indexOf(protocol) < 0) {
                            protocols.push(protocol);
                        }
                    } 
                }
                return protocols;
            },
            /**
             * Adds one or more `protocols` to the metadata.
             * @method addProtocol
             * @param  {Array}  protocols  -  protocols to add
             */
            addProtocol(...protocols) {
                for (let protocol of $flatten(protocols, true)) {
                    if ((protocol.prototype instanceof Protocol) 
                        &&  (_protocols.indexOf(protocol) === -1)) {
                        _protocols.push(protocol);
                        this.protocolAdded(this, protocol);
                    }
                }
            },
            protocolAdded(metadata, protocol) {
                if (parent) {
                    parent.protocolAdded(metadata, protocol);
                }
            },
            /**
             * Determines if the metadata conforms to the `protocol`.
             * @method conformsTo
             * @param  {miruken.Protocol}   protocol -  protocols to test
             * @returns {boolean}  true if the metadata includes the protocol.
             */
            conformsTo(protocol) {
                return protocol && (protocol.prototype instanceof Protocol)
                    && _protocols.some(p => protocol === p || p.conformsTo(protocol));
            },
            inflate(step, metadata, target, definition, expand) {
                if (parent) {
                    parent.inflate(step, metadata, target, definition, expand);
                } else if ($properties) {
                    $properties.shared.inflate(step, metadata, target, definition, expand)
                }
            },
            execute(step, metadata, target, definition) {
                if (parent) {
                    parent.execute(step, metadata, target, definition);
                } else if ($properties) {
                    $properties.shared.execute(step, metadata, target, definition);
                }
            },
            /**
             * Defines a property on the metadata.
             * @method defineProperty
             * @param  {Object}   target        -  target receiving property
             * @param  {string}   name          -  name of the property
             * @param  {Object}   spec          -  property specification
             * @param  {Object}   [descriptor]  -  property descriptor
             */
            defineProperty(target, name, spec, descriptor) {
                if (target) {
                    Object.defineProperty(target, name, spec);
                }
                if (descriptor) {
                    this.addDescriptor(name, descriptor);
                }
            },
            /**
             * Gets the descriptor for one or more properties.
             * @method getDescriptor
             * @param    {Object|string}  filter  -  property selector
             * @returns  {Object} aggregated property descriptor.
             */
            getDescriptor(filter) {
                let descriptors;
                if ($isNothing(filter)) {
                    if (parent) {
                        descriptors = parent.getDescriptor(filter);
                    }
                    if (_descriptors) {
                        descriptors = extend(descriptors || {}, _descriptors);
                    }
                } else if ($isString(filter)) {
                    return (_descriptors && _descriptors[filter])
                        || (parent && parent.getDescriptor(filter));
                } else {
                    if (parent) {
                        descriptors = parent.getDescriptor(filter);
                    }
                    for (let key in _descriptors) {
                        let descriptor = _descriptors[key];
                        if (this.matchDescriptor(descriptor, filter)) {
                            descriptors = extend(descriptors || {}, key, descriptor);
                        }
                    }
                }
                return descriptors;
            },
            /**
             * Sets the descriptor for a property.
             * @method addDescriptor
             * @param    {string}   name        -  property name
             * @param    {Object}   descriptor  -  property descriptor
             * @returns  {miruken.MetaBase} current metadata.
             * @chainable
             */
            addDescriptor(name, descriptor) {
                _descriptors = extend(_descriptors || {}, name, descriptor);
                return this;
            },
            /**
             * Determines if the property `descriptor` matches the `filter`.
             * @method matchDescriptor
             * @param    {Object}   descriptor  -  property descriptor
             * @param    {Object}   filter      -  matching filter
             * @returns  {boolean} true if the descriptor matches, false otherwise.
             */
            matchDescriptor(descriptor, filter) {
                if (typeOf(descriptor) !== 'object' || typeOf(filter) !== 'object') {
                    return false;
                }
                for (let key in filter) {
                    const match = filter[key];
                    if (match === undefined) {
                        if (!(key in descriptor)) {
                            return false;
                        }
                    } else {
                        const value = descriptor[key];
                        if (Array.isArray(match)) {
                            if (!(Array.isArray(value))) {
                                return false;
                            }
                            for (let i = 0; i < match.length; ++i) {
                                if (value.indexOf(match[i]) < 0) {
                                    return false;
                                }
                            }
                        } else if (!(value === match || this.matchDescriptor(value, match))) {
                            return false;
                        }
                    }
                }
                return true;
            },
            /**
             * Binds `method` to the parent if not present.
             * @method linkBase
             * @param    {Function}  method  -  method name
             * @returns  {miruken.MetaBase} current metadata.
             * @chainable
             */
            linkBase(method) {
                if (!this[method]) {
                    this.extend(method, function () {
                        return parent && parent[method](...arguments);
                    });
                }
                return this;
            }
        });
    }
});

/**
 * Represents metadata describing a class.
 * @class ClassMeta
 * @constructor
 * @param   {miruken.MetaBase}  baseMeta   -  base meta data
 * @param   {Function}          subClass   -  associated class
 * @param   {Array}             protocols  -  conforming protocols
 * @param   {Array}             macros     -  class macros
 * @extends miruken.MetaBase
 */
export const ClassMeta = MetaBase.extend({
    constructor(baseMeta, subClass, protocols, macros)  {
        let _macros     = macros && macros.slice(0),
            _isProtocol = (subClass === Protocol)
            || (subClass.prototype instanceof Protocol);
        this.base(baseMeta);
        this.extend({
            /**
             * Gets the associated type.
             * @property {Function} type
             */                                
            get type() { return subClass; },
            /**
             * Determines if the meta-data represents a protocol.
             * @method isProtocol
             * @returns  {boolean} true if a protocol, false otherwise.
             */                                
            isProtocol() { return _isProtocol; },
            get allProtocols() {
                const protocols = this.base();
                if (!_isProtocol && baseMeta) {
                    for (let protocol of baseMeta.allProtocols) {
                        if (protocols.indexOf(protocol) < 0) {
                            protocols.push(protocol);
                        }
                    }
                }
                return protocols;
            },
            protocolAdded(metadata, protocol) {
                this.base(metadata, protocol);
                if (!_macros || _macros.length == 0) {
                    return;
                }
                for (let macro of _macros) {
                    if ($isFunction(macro.protocolAdded)) {
                        macro.protocolAdded(metadata, protocol);
                    }
                }
            },
            conformsTo(protocol) {
                if (!(protocol && (protocol.prototype instanceof Protocol))) {
                    return false;
                } else if ((protocol === subClass) || (subClass.prototype instanceof protocol)) {
                    return true;
                }
                return this.base(protocol) || !!(baseMeta && baseMeta.conformsTo(protocol));
            },
            inflate(step, metadata, target, definition, expand) {
                this.base(step, metadata, target, definition, expand);
                if (!_macros || _macros.length == 0) {
                    return;
                }
                const active = (step !== MetaStep.Subclass);
                for (let macro of _macros) {
                    if ($isFunction(macro.inflate) &&
                        (!active || macro.active) && macro.inherit) {
                        macro.inflate(step, metadata, target, definition, expand);
                    }
                }                    
            },
            execute(step, metadata, target, definition) {
                this.base(step, metadata, target, definition);
                if (!_macros || _macros.length == 0) {
                    return;
                }
                const inherit = (this !== metadata),
                      active  = (step !== MetaStep.Subclass);
                for (let macro of _macros) {
                    if ((!active  || macro.active) && (!inherit || macro.inherit)) {
                        macro.execute(step, metadata, target, definition);
                    }
                }
            },
            /**
             * Creates a sub-class from the current class metadata.
             * @method createSubclass
             * @param   {Array}   args  -  arguments
             * @returns  {Function} the newly created class function.
             */                                                                
            createSubclass(...args) {
                let constraints = args, protocols, mixins, macros;
                if (subClass.prototype instanceof Protocol) {
                    (protocols = []).push(subClass);
                }
                if (args.length > 0 && Array.isArray(args[0])) {
                    constraints = args.shift();
                }
                while (constraints.length > 0) {
                    const constraint = constraints[0];
                    if (!constraint) {
                        break;
                    } else if (constraint.prototype instanceof Protocol) {
                        (protocols || (protocols = [])).push(constraint);
                    } else if (constraint instanceof MetaMacro) {
                        (macros || (macros = [])).push(constraint);
                    } else if ($isFunction(constraint) && constraint.prototype instanceof MetaMacro) {
                        (macros || (macros = [])).push(new constraint);
                    } else if (constraint.prototype) {
                        (mixins || (mixins = [])).push(constraint);
                    } else {
                        break;
                    }
                    constraints.shift();
                }
                let instanceDef  = args.shift() || {},
                    staticDef    = args.shift() || {};
                this.inflate(MetaStep.Subclass, this, subClass.prototype, instanceDef, expand);
                if (macros) {
                    for (let macro of macros) {
                        macro.inflate(MetaStep.Subclass, this, subClass.prototype, instanceDef, expand);
                    }
                }
                instanceDef  = expand.x || instanceDef;
                const derived  = ClassMeta.baseExtend.call(subClass, instanceDef, staticDef),
                      metadata = new ClassMeta(this, derived, protocols, macros);
                defineMetadata(derived, metadata);
                Object.defineProperty(derived.prototype, Metadata, {
                    enumerable:   false,
                    configurable: false,
                    get:          ClassMeta.createInstanceMeta
                });
                derived.conformsTo = metadata.conformsTo.bind(metadata);
                metadata.execute(MetaStep.Subclass, metadata, derived.prototype, instanceDef);
                if (mixins) {
                    for (let mixin of mixins) {
                        derived.implement(mixin);
                    }
                }
                function expand() {
                    return expand.x || (expand.x = Object.create(instanceDef));
                }
                Reflect.setPrototypeOf(derived, subClass);                
                return derived;                    
            },
            /**
             * Embellishes the class represented by this metadata.
             * @method embellishClass
             * @param   {Any} source  -  class function or object literal
             * @returns {Function} the underlying class.
             */
            embellishClass(source) {
                if ($isFunction(source)) {
                    source = source.prototype; 
                }
                if ($isSomething(source)) {
                    this.inflate(MetaStep.Implement, this, subClass.prototype, source, expand);
                    source = expand.x || source;
                    ClassMeta.baseImplement.call(subClass, source);
                    this.execute(MetaStep.Implement, this, subClass.prototype, source);
                    function expand() {
                        return expand.x || (expand.x = Object.create(source));
                    };                    
                }
                return subClass;
            }
        });
        this.addProtocol(protocols);
    }
}, {
    init() {
        this.baseExtend    = Base.extend;
        this.baseImplement = Base.implement;
        defineMetadata(Base, new this(undefined, Base));
        defineMetadata(Abstract, new this(Base[Metadata], Abstract));
        Base.extend = Abstract.extend = function () {
            return this[Metadata].createSubclass(...arguments);
        };
        Base.implement = Abstract.implement = function () {
            return this[Metadata].embellishClass(...arguments);                
        }
        Base.prototype.conformsTo = function (protocol) {
            return this.constructor[Metadata].conformsTo(protocol);
        };
    },
    createInstanceMeta(parent) {
        const metadata = new InstanceMeta(parent || this.constructor[Metadata]);
        defineMetadata(this, metadata);
        return metadata;            
    }
});

/**
 * Represents metadata describing an instance.
 * @class InstanceMeta
 * @constructor
 * @param   {miruken.ClassMeta}  classMeta  -  class meta-data
 * @extends miruken.MetaBase
 */
export const InstanceMeta = MetaBase.extend({
    constructor(classMeta) {
        this.base(classMeta);
        this.extend({
            /**
             * Gets the associated type.
             * @property {Function} type
             */                                              
            get type() { return classMeta.type; },
            /**
             * Determines if the meta-data represents a protocol.
             * @method isProtocol
             * @returns  {boolean} true if a protocol, false otherwise.
             */                                                
            isProtocol() { return classMeta.isProtocol(); }
        });
    }
}, {
    init() {
        const baseExtend = Base.prototype.extend;
        Base.prototype.extend = function (key, value) {
            let numArgs    = arguments.length,
                definition = (numArgs === 1) ? key : {};
            if (numArgs >= 2) {
                definition[key] = value;
            } else if (numArgs === 0) {
                return this;
            }
            const metadata = this[Metadata];
            if (metadata) {
                metadata.inflate(MetaStep.Extend, metadata, this, definition, expand);
                definition = expand.x || definition;
                function expand() {
                    return expand.x || (expand.x = Object.create(definition));
                };                    
            }
            baseExtend.call(this, definition);                
            if (metadata) {
                metadata.execute(MetaStep.Extend, metadata, this, definition);
            }
            return this;
        }
    }
});

Enum.extend     = Base.extend
Enum.implement  = Base.implement;
defineMetadata(Enum, new ClassMeta(Base[Metadata], Enum));

/**
 * Metamacro to proxy protocol members through a delegate.<br/>
 * See {{#crossLink "miruken.Protocol"}}{{/crossLink}}
 * @class $proxyProtocol
 * @extends miruken.MetaMacro
 */
export const $proxyProtocol = MetaMacro.extend({
    get active() { return true; },
    get inherit() { return true; },
    inflate(step, metadata, target, definition, expand) {
        let expanded;
        const props = getPropertyDescriptors(definition);
        Reflect.ownKeys(props).forEach(key => {
            const member = props[key];
            if ($isFunction(member.value)) {
                member.value = function (...args) {
                    return this[ProtocolInvoke](key, args);
                };
            } else if (member.get || member.set) {
                if (member.get) {
                    member.get = function () {
                        return this[ProtocolGet](key);
                    };
                }
                if (member.set) {
                    member.set = function (value) {
                        return this[ProtocolSet](key, value);
                    }
                }
            } else {
                return;
            }
            expanded = expanded || expand();            
            Object.defineProperty(expanded, key, member);                
        });
    },
    execute(step, metadata, target, definition) {
        if (step === MetaStep.Subclass) {
            metadata.type.adoptedBy = Protocol.adoptedBy;
        }
    },
    protocolAdded(metadata, protocol) {
        const source        = protocol.prototype,
              target        = metadata.type.prototype,
              protocolProto = Protocol.prototype,
              props         = getPropertyDescriptors(source);
        Reflect.ownKeys(props).forEach(key => {
            if (getPropertyDescriptors(protocolProto, key) ||
                getPropertyDescriptors(this, key)) return;
            Object.defineProperty(target, key, props[key]);            
        });
    }
});
Protocol.extend    = Base.extend
Protocol.implement = Base.implement;
defineMetadata(Protocol, new ClassMeta(Base[Metadata], Protocol, null, [new $proxyProtocol()]));

/**
 * Protocol base requiring conformance to match methods.
 * @class StrictProtocol
 * @constructor
 * @param   {miruken.Delegate}  delegate       -  delegate
 * @param   {boolean}           [strict=true]  -  true ifstrict, false otherwise
 * @extends miruekn.Protocol     
 */
export const StrictProtocol = Protocol.extend({
    constructor(proxy, strict) {
        this.base(proxy, (strict === undefined) || strict);
    }
});

function defineMetadata(target, metadata) {
    Object.defineProperty(target, Metadata, {
        enumerable:   false,
        configurable: false,
        writable:     false,
        value:        metadata
    });
}

const GETTER_CONVENTIONS = ['get', 'is'];

/**
 * Metamacro to define class properties.  This macro is automatically applied.
 * <pre>
 *    const Person = Base.extend({
 *        $properties: {
 *            firstName: '',
 *            lastNane:  '',
 *            fullName:  {
 *                get() {
 *                   return this.firstName + ' ' + this.lastName;
 *                },
 *                set(value) {
 *                    const parts = value.split(' ');
 *                    if (parts.length > 0) {
 *                        this.firstName = parts[0];
 *                    }
 *                    if (parts.length > 1) {
 *                        this.lastName = parts[1];
 *                    }
 *                }
 *            }
 *        }
 *    })
 * </pre>
 * would give the Person class a firstName and lastName property and a computed fullName.
 * @class $properties
 * @constructor
 * @param   {string}  [tag='$properties']  - properties tag
 * @extends miruken.MetaMacro
 */
const PropertiesTag = Symbol();
      
export const $properties = MetaMacro.extend({
    constructor(tag) {
        if ($isNothing(tag)) {
            throw new Error("$properties requires a tag name");
        }
        Object.defineProperty(this, PropertiesTag, { value: tag });
    },
    get active() { return true; },
    get inherit() { return true; },    
    execute(step, metadata, target, definition) {
        const tag        = this[PropertiesTag],
              properties = this.extractProperty(tag, target, definition); 
        if (!properties) return;
        let expanded = {}, source;
        const props = getPropertyDescriptors(properties);
        Reflect.ownKeys(props).forEach(key => {
            source = expanded;
            let property = properties[key],
                spec     = {
                    configurable: true,
                    enumerable:   true
                };
            if ($isNothing(property) || $isString(property) ||
                typeOf(property.length) == "number" || typeOf(property) !== 'object') {
                property = { value: property };
            }
            if (getPropertyDescriptors(definition, key)) {
                source = null;  // don't replace standard properties
            } else if (property.get || property.set) {
                spec.get = property.get;
                spec.set = property.set;
            } else if (target instanceof Protocol) {
                // $proxyProtocol will do the real work
                spec.get = spec.set = Undefined;
            } else if ("auto" in property) {
                const field = property.auto || Symbol();
                spec.get = function () { return this[field]; };
                spec.set = function (value) { this[field] = value; };
            } else {
                spec.writable = true;
                spec.value    = property.value;
            }

            delete property.get;
            delete property.set;
            delete property.value;
            property = Object.assign({}, property);
            this.defineProperty(metadata, source, key, spec, property);
        });
        if (step == MetaStep.Extend) {
            target.extend(expanded);
        } else {
            metadata.type.implement(expanded);
        }
    },
    defineProperty(metadata, target, name, spec, descriptor) {
        metadata.defineProperty(target, name, spec, descriptor);
    }
}, {
    init() {
        Object.defineProperty(this, 'shared', {
            enumerable:   false,
            configurable: false,
            writable:     false,
            value:        Object.freeze(new this("$properties"))
        });
    }
});

/**
 * Metamacro to derive class properties from existng methods.
 * <p>Currently getFoo, isFoo and setFoo conventions are recognized.</p>
 * <pre>
 *    const Person = Base.extend(**$inferProperties**, {
 *        getName() { return this._name; },
 *        setName(value) { this._name = value; },
 *    })
 * </pre>
 * would create a Person.name property bound to getName and setName 
 * @class $inferProperties
 * @constructor
 * @extends miruken.MetaMacro
 */
export const $inferProperties = MetaMacro.extend({
    get active() { return true; },
    get inherit() { return true; },
    inflate(step, metadata, target, definition, expand) {
        let expanded;
        for (let key in definition) {
            const member = getPropertyDescriptors(definition, key);
            if (member && $isFunction(member.value)) {
                const spec = { configurable: true, enumerable: true },
                      name = this.inferProperty(key, member.value, definition, spec);
                if (name) {
                    expanded = expanded || expand();
                    Object.defineProperty(expanded, name, spec);
                }
            }
        }            
    },
    inferProperty(key, method, definition, spec) {
        for (let i = 0; i < GETTER_CONVENTIONS.length; ++i) {
            const prefix = GETTER_CONVENTIONS[i];
            if (key.lastIndexOf(prefix, 0) == 0) {
                if (method.length === 0) {  // no arguments
                    spec.get   = method;                        
                    const name   = key.substring(prefix.length),
                          setter = definition['set' + name];
                    if ($isFunction(setter)) {
                        spec.set = setter;
                    }
                    return name.charAt(0).toLowerCase() + name.slice(1);
                }
            }
        }
        if (key.lastIndexOf('set', 0) == 0) {
            if (method.length === 1) {  // 1 argument
                spec.set   = method;                    
                const name   = key.substring(3),
                      getter = definition['get' + name];
                if ($isFunction(getter)) {
                    spec.get = getter;
                }
                return name.charAt(0).toLowerCase() + name.slice(1);
            }
        }
    }
});

/**
 * Metamacro to inherit static members in subclasses.
 * <pre>
 * const Math = Base.extend(
 *     **$inheritStatic**, null, {
 *         PI:  3.14159265359,
 *         add(a, b) {
 *             return a + b;
 *          }
 *     }),
 *     Geometry = Math.extend(null, {
 *         area(length, width) {
 *             return length * width;
 *         }
 *     });
 * </pre>
 * would make Math.PI and Math.add available on the Geometry class.
 * @class $inhertStatic
 * @constructor
 * @param  {string}  [...members]  -  members to inherit
 * @extends miruken.MetaMacro
 */
export const $inheritStatic = MetaMacro.extend({
    constructor(/*members*/) {
        const spec = {
            value: Array.from(arguments)
        };
        Object.defineProperty(this, 'members', spec);
        delete spec.value;
    },
    get inherit() { return true; },
    execute(step, metadata, target) {
        if (step === MetaStep.Subclass) {
            const members  = this.members,
                  type     = metadata.type,
                  ancestor = $ancestorOf(type);
            if (members.length > 0) {
                for (let member of members) {
                    if (!(member in type)) {
                        type[member] = ancestor[member];
                    }
                }
            } else if (ancestor !== Base && ancestor !== Object) {
                for (let key in ancestor) {
                    if (ancestor.hasOwnProperty(key) && !(key in type)) {
                        type[key] = ancestor[key];
                    }
                }
            }
        }
    }
});

/**
 * Delegates properties and methods to another object.<br/>
 * See {{#crossLink "miruken.Protocol"}}{{/crossLink}}
 * @class Delegate
 * @extends Base
 */
export const Delegate = Base.extend({
    /**
     * Delegates the property get on `protocol`.
     * @method get
     * @param   {miruken.Protocol} protocol  - receiving protocol
     * @param   {string}           key       - key of the property
     * @param   {boolean}          strict    - true if target must adopt protocol
     * @returns {Any} result of the proxied get.
     */
    get(protocol, key, strict) {},
    /**
     * Delegates the property set on `protocol`.
     * @method set
     * @param   {miruken.Protocol} protocol  - receiving protocol
     * @param   {string}           key       - key of the property
     * @param   {Object}           value     - value of the property
     * @param   {boolean}          strict    - true if target must adopt protocol
     */
    set(protocol, key, value, strict) {},
    /**
     * Delegates the method invocation on `protocol`.
     * @method invoke
     * @param   {miruken.Protocol} protocol    - receiving protocol
     * @param   {string}           methodName  - name of the method
     * @param   {Array}            args        - method arguments
     * @param   {boolean}          strict      - true if target must adopt protocol
     * @returns {Any} result of the proxied invocation.
     */
    invoke(protocol, methodName, args, strict) {}
});

/**
 * Delegates properties and methods to an object.
 * @class ObjectDelegate
 * @constructor
 * @param   {Object}  object  - receiving object
 * @extends miruken.Delegate
 */
export const ObjectDelegate = Delegate.extend({
    constructor(object) {
        Object.defineProperty(this, 'object', { value: object });
    },
    get(protocol, key, strict) {
        const object = this.object;
        if (object && (!strict || protocol.adoptedBy(object))) {
            return object[key];
        }
    },
    set(protocol, key, value, strict) {
        const object = this.object;
        if (object && (!strict || protocol.adoptedBy(object))) {
            return object[key] = value;
        }
    },
    invoke(protocol, methodName, args, strict) {
        const object = this.object;
        if (object && (!strict || protocol.adoptedBy(object))) {
            const method = object[methodName];                
            return method && method.apply(object, args);
        }
    }
});

/**
 * Delegates properties and methods to an array.
 * @class ArrayDelegate
 * @constructor
 * @param   {Array}  array  - receiving array
 * @extends miruken.Delegate
 */
export const ArrayDelegate = Delegate.extend({
    constructor(array) {
        Object.defineProperty(this, 'array', { value: array });
    },
    get(protocol, key, strict) {
        const array = this.array;
        return array && array.reduce((result, object) =>
            !strict || protocol.adoptedBy(object) ? object[key] : result
        , undefined);  
    },
    set(protocol, key, value, strict) {
        const array = this.array;
        return array && array.reduce((result, object) =>
            !strict || protocol.adoptedBy(object) ? object[key] = value : result
        , undefined);  
    },
    invoke(protocol, methodName, args, strict) {
        const array = this.array;
        return array && array.reduce((result, object) => {
            const method = object[methodName];
            return method && (!strict || protocol.adoptedBy(object))
                ? method.apply(object, args)
                : result;
        }, undefined);
    }
});

/**
 * Creates a decorator builder.<br/>
 * See [Decorator Pattern](http://en.wikipedia.org/wiki/Decorator_pattern)
 * @method
 * @param   {Object}   decorations  -  object defining decorations
 * @erturns {Function} function to build decorators.
 */
export function $decorator(decorations) {
    return function (decoratee) {
        if ($isNothing(decoratee)) {
            throw new TypeError("No decoratee specified.");
        }
        const decorator = Object.create(decoratee);
        Object.defineProperty(decorator, 'decoratee', { value: decoratee });
        ClassMeta.createInstanceMeta.call(decorator, decoratee[Metadata]);
        if (decorations) {
            decorator.extend(decorations);
        }
        return decorator;
    }
}

/**
 * Decorates an instance using the 
 * [Decorator Pattern](http://en.wikipedia.org/wiki/Decorator_pattern).
 * @method
 * @param   {Object}   decoratee    -  decoratee
 * @param   {Object}   decorations  -  object defining decorations
 * @erturns {Function} function to build decorators.
 */
export function $decorate(decoratee, decorations) {
    return $decorator(decorations)(decoratee);
}

/**
 * Gets the decoratee used in the  
 * [Decorator Pattern](http://en.wikipedia.org/wiki/Decorator_pattern).
 * @method
 * @param   {Object}   decorator  -  possible decorator
 * @param   {boolean}  deepest    -  true if deepest decoratee, false if nearest.
 * @erturns {Object}   decoratee if present, otherwise decorator.
 */
export function $decorated(decorator, deepest) {
    let decoratee;
    while (decorator && (decoratee = decorator.decoratee)) {
        if (!deepest) {
            return decoratee;
        }
        decorator = decoratee;
    }
    return decorator;
}

/**
 * Determines if `protocol` is a protocol.
 * @method $isProtocol
 * @param    {Any}     protocol  - target to test
 * @returns  {boolean} true if a protocol.
 * @for miruken.$
 */
export const $isProtocol = Protocol.isProtocol;

/**
 * Determines if `clazz` is a class.
 * @method $isClass
 * @param    {Any}     clazz  - class to test
 * @returns  {boolean} true if a class (and not a protocol).
 */
export function $isClass(clazz) {
    return clazz && (clazz.prototype instanceof Base) && !$isProtocol(clazz);
}

/**
 * Gets the class `instance` belongs to.
 * @method $classOf
 * @param    {Object}  instance  - object
 * @returns  {Function} class of instance. 
 */
export function $classOf(instance) {
    return instance && instance.constructor;
}

/**
 * Gets `clazz` superclass.
 * @method $ancestorOf
 * @param    {Function} clazz  - class
 * @returns  {Function} ancestor of class. 
 */
export function $ancestorOf(clazz) {
    return clazz && clazz.ancestor;
}

/**
 * Determines if `str` is a string.
 * @method $isString
 * @param    {Any}     str  - string to test
 * @returns  {boolean} true if a string.
 */
export function $isString(str) {
    return typeOf(str) === 'string';
}

/**
 * Determines if `fn` is a function.
 * @method $isFunction
 * @param    {Any}     fn  - function to test
 * @returns  {boolean} true if a function.
 */
export function $isFunction(fn) {
    return fn instanceof Function;
}

/**
 * Determines if `obj` is an object.
 * @method $isObject
 * @param    {Any}     obj  - object to test
 * @returns  {boolean} true if an object.
 */
export function $isObject(obj) {
    return obj === Object(obj);
}

/**
 * Determines if `promise` is a promise.
 * @method $isPromise
 * @param    {Any}     promise  - promise to test
 * @returns  {boolean} true if a promise. 
 */
export function $isPromise(promise) {
    return promise && $isFunction(promise.then);
}

/**
 * Determines if `value` is null or undefined.
 * @method $isNothing
 * @param    {Any}     value  - value to test
 * @returns  {boolean} true if value null or undefined.
 */
export function $isNothing(value) {
    return value == null;
}

/**
 * Determines if `value` is not null or undefined.
 * @method $isSomething
 * @param    {Any}     value  - value to test
 * @returns  {boolean} true if value not null or undefined.
 */
export function $isSomething(value) {
    return value != null;
}

/**
 * Returns a function that returns `value`.
 * @method $lift
 * @param    {Any}      value  - any value
 * @returns  {Function} function that returns value.
 */
export function $lift(value) {
    return function() { return value; };
}

/**
 * Recursively flattens and optionally prune an array.
 * @method $flatten
 * @param    {Array}   arr     -  array to flatten
 * @param    {boolean} prune  -  true if prune null items
 * @returns  {Array}   flattend/pruned array or `arr`
 */
export function $flatten(arr, prune) {
    if (!Array.isArray(arr)) return arr;
    let items = arr.map(item => $flatten(item, prune));
    if (prune) items = items.filter($isSomething);
    return [].concat(...items);
}

/**
 * Determines whether `obj1` and `obj2` are considered equal.
 * <p>
 * Objects are considered equal if the objects are strictly equal (===) or
 * either object has an equals method accepting other object that returns true.
 * </p>
 * @method $equals
 * @param    {Any}     obj1  - first object
 * @param    {Any}     obj2  - second object
 * @returns  {boolean} true if the obejcts are considered equal, false otherwise.
 */
export function $equals(obj1, obj2) {
    if (obj1 === obj2) {
        return true;
    }
    if ($isFunction(obj1.equals)) {
        return obj1.equals(obj2);
    } else if ($isFunction(obj2.equals)) {
        return obj2.equals(obj1);
    }
    return false;
}

/**
 * Package containing enhancements to the javascript language.
 * @module miruken
 * @namespace miruken
 * @main miruken
 * @class $
 */

/**
 * Variance enum
 * @class Variance
 * @extends miruken.Enum
 */
export const Variance = Enum({
    /**
     * Matches a more specific type than originally specified.
     * @property {number} Covariant
     */
    Covariant: 1,
    /**
     * Matches a more generic (less derived) type than originally specified.
     * @property {number} Contravariant
     */        
    Contravariant: 2,
    /**
     * Matches only the type originally specified.
     * @property {number} Invariant
     */        
    Invariant: 3
});

/**
 * Protocol for targets that manage initialization.
 * @class Initializing
 * @extends miruken.Protocol
 */
export const Initializing = Protocol.extend({
    /**
     * Perform any initialization after construction..
     */
    initialize() {}
});

/**
 * Protocol marking resolve semantics.
 * @class Resolving
 * @extends miruken.Protocol
 */
export const Resolving = Protocol.extend();

/**
 * Protocol for targets that can execute functions.
 * @class Invoking
 * @extends miruken.StrictProtocol
 */
export const Invoking = StrictProtocol.extend({
    /**
     * Invokes the `fn` with `dependencies`.
     * @method invoke
     * @param    {Function} fn           - function to invoke
     * @param    {Array}    dependencies - function dependencies
     * @param    {Object}   [ctx]        - function context
     * @returns  {Any}      result of the function.
     */
    invoke(fn, dependencies, ctx) {}
});

/**
 * Protocol for targets that have parent/child relationships.
 * @class Parenting
 * @extends miruken.Protocol
 */
export const Parenting = Protocol.extend({
    /**
     * Creates a new child of the parent.
     * @method newChild
     * @returns  {Object} the new child.
     */
    newChild() {}
});

/**
 * Protocol for targets that can be started.
 * @class Starting
 * @extends miruken.Protocol
 */
export const Starting = Protocol.extend({
    /**
     * Starts the reciever.
     * @method start
     */
    start() {}
});

/**
 * Base class for startable targets.
 * @class Startup
 * @uses miruken.Starting
 * @extends Base
 */
export const Startup = Base.extend(Starting, {
    start() {}
});

/**
 * Protocol for targets that manage disposal lifecycle.
 * @class Disposing
 * @extends miruken.Protocol
 */
export const Disposing = Protocol.extend({
    /**
     * Releases any resources managed by the receiver.
     * @method dispose
     */
    dispose() {}
});

/**
 * Mixin for {{#crossLink "miruken.Disposing"}}{{/crossLink}} implementation.
 * @class DisposingMixin
 * @uses miruken.Disposing
 * @extends Module
 */
export const DisposingMixin = Module.extend({
    dispose(object) {
        if ($isFunction(object._dispose)) {
            const result = object._dispose();
            object.dispose = Undefined;  // dispose once
            return result;
        }
    }
});

/**
 * Convenience function for disposing resources.
 * @for miruken.$
 * @method $using
 * @param    {miruken.Disposing}   disposing  - object to dispose
 * @param    {Function | Promise}  action     - block or Promise
 * @param    {Object}              [context]  - block context
 * @returns  {Any} result of executing the action in context.
 */
export function $using(disposing, action, context) {
    if (disposing && $isFunction(disposing.dispose)) {
        if (!$isPromise(action)) {
            let result;
            try {
                result = $isFunction(action)
                    ? action.call(context, disposing)
                    : action;
                if (!$isPromise(result)) {
                    return result;
                }
            } finally {
                if ($isPromise(result)) {
                    action = result;
                } else {
                    const dresult = disposing.dispose();
                    if (dresult !== undefined) {
                        return dresult;
                    }
                }
            }
        }
        return action.then(function (res) {
            const dres = disposing.dispose();
            return dres !== undefined ? dres : res;
        }, function (err) {
            const dres = disposing.dispose();
            return dres !== undefined ? dres : Promise.reject(err);
        });
    }
}

/**
 * TraversingAxis enum
 * @class TraversingAxis
 * @extends miruken.Enum
 */
export const TraversingAxis = Enum({
    /**
     * Traverse only current node.
     * @property {number} Self
     */
    Self: 1,
    /**
     * Traverse only current node root.
     * @property {number} Root
     */
    Root: 2,
    /**
     * Traverse current node children.
     * @property {number} Child
     */
    Child: 3,
    /**
     * Traverse current node siblings.
     * @property {number} Sibling
     */
    Sibling: 4,
    /**
     * Traverse current node ancestors.
     * @property {number} Ancestor
     */
    Ancestor: 5,
    /**
     * Traverse current node descendants.
     * @property {number} Descendant
     */
    Descendant: 6,
    /**
     * Traverse current node descendants in reverse.
     * @property {number} DescendantReverse
     */
    DescendantReverse: 7,
    /**
     * Traverse current node and children.
     * @property {number} ChildOrSelf
     */
    ChildOrSelf: 8,
    /**
     * Traverse current node and siblings.
     * @property {number} SiblingOrSelf
     */
    SiblingOrSelf: 9,
    /**
     * Traverse current node and ancestors.
     * @property {number} AncestorOrSelf
     */
    AncestorOrSelf: 10,
    /**
     * Traverse current node and descendents.
     * @property {number} DescendantOrSelf
     */
    DescendantOrSelf: 11,
    /**
     * Traverse current node and descendents in reverse.
     * @property {number} DescendantOrSelfReverse
     */
    DescendantOrSelfReverse: 12,
    /**
     * Traverse current node, ancestors and siblings.
     * @property {number} AncestorSiblingOrSelf 
     */
    AncestorSiblingOrSelf: 13
});

/**
 * Protocol for traversing an abitrary graph of objects.
 * @class Traversing
 * @extends miruken.Protocol
 */
export const Traversing = Protocol.extend({
    /**
     * Traverse a graph of objects.
     * @method traverse
     * @param {miruken.graph.TraversingAxis} axis        -  axis of traversal
     * @param {Function}                     visitor     -  receives visited nodes
     * @param {Object}                       [context]   -  visitor callback context
     */
    traverse(axis, visitor, context) {}
});

/**
 * Mixin for Traversing functionality.
 * @class TraversingMixin
 * @uses miruken.graph.Traversing
 * @extends Module
 */
export const TraversingMixin = Module.extend({
    traverse(object, axis, visitor, context) {
        if ($isFunction(axis)) {
            context = visitor;
            visitor = axis;
            axis    = TraversingAxis.Child;
        }
        if (!$isFunction(visitor)) return;
        switch (axis) {
        case TraversingAxis.Self:
            traverseSelf.call(object, visitor, context);
            break;
            
        case TraversingAxis.Root:
            traverseRoot.call(object, visitor, context);
            break;
            
        case TraversingAxis.Child:
            traverseChildren.call(object, visitor, false, context);
            break;

        case TraversingAxis.Sibling:
            traverseAncestorSiblingOrSelf.call(object, visitor, false, false, context);
            break;
            
        case TraversingAxis.ChildOrSelf:
            traverseChildren.call(object, visitor, true, context);
            break;

        case TraversingAxis.SiblingOrSelf:
            traverseAncestorSiblingOrSelf.call(object, visitor, true, false, context);
            break;
            
        case TraversingAxis.Ancestor:
            traverseAncestors.call(object, visitor, false, context);
            break;
            
        case TraversingAxis.AncestorOrSelf:
            traverseAncestors.call(object, visitor, true, context);
            break;
            
        case TraversingAxis.Descendant:
            traverseDescendants.call(object, visitor, false, context);
            break;
            
        case TraversingAxis.DescendantReverse:
            traverseDescendantsReverse.call(object, visitor, false, context);
            break;
            
        case TraversingAxis.DescendantOrSelf:
            traverseDescendants.call(object, visitor, true, context);
            break;

        case TraversingAxis.DescendantOrSelfReverse:
            traverseDescendantsReverse.call(object, visitor, true, context);
            break;
            
        case TraversingAxis.AncestorSiblingOrSelf:
            traverseAncestorSiblingOrSelf.call(object, visitor, true, true, context);
            break;

        default:
            throw new Error(`Unrecognized TraversingAxis ${axis}.`);
        }
    }
});

function checkCircularity(visited, node) {
    if (visited.indexOf(node) !== -1) {
        throw new Error(`Circularity detected for node ${node}`);
    }
    visited.push(node);
    return node;
}

function traverseSelf(visitor, context) {
    visitor.call(context, this);
}

function traverseRoot(visitor, context) {
    let parent, root = this, visited = [this];
    while (parent = root.parent) {
        checkCircularity(visited, parent);
        root = parent;   
    }
    visitor.call(context, root);
}

function traverseChildren(visitor, withSelf, context) {
    if ((withSelf && visitor.call(context, this))) {
        return;
    }
    for (const child of this.children) {
        if (visitor.call(context, child)) {
            return;
        }
    }
}

function traverseAncestors(visitor, withSelf, context) {
    let parent = this, visited = [this];
    if (withSelf && visitor.call(context, this)) {
        return;
    }
    while ((parent = parent.parent) && !visitor.call(context, parent)) {
        checkCircularity(visited, parent);
    }
}

function traverseDescendants(visitor, withSelf, context) {
    if (withSelf) {
        Traversal.levelOrder(this, visitor, context);
    } else {
        Traversal.levelOrder(this, node =>
            !$equals(this, node) && visitor.call(context, node),
            context);
    }
}

function traverseDescendantsReverse(visitor, withSelf, context) {
    if (withSelf) {
        Traversal.reverseLevelOrder(this, visitor, context);
    } else {
        Traversal.reverseLevelOrder(this, node =>
            !$equals(this, node) && visitor.call(context, node),
            context);
    }
}

function traverseAncestorSiblingOrSelf(visitor, withSelf, withAncestor, context) {
    if (withSelf && visitor.call(context, this)) {
        return;
    }
    const parent = this.parent;
    if (parent) {
        for (const sibling of parent.children) {
            if (!$equals(this, sibling) && visitor.call(context, sibling)) {
                return;
            }
        }
        if (withAncestor) {
            traverseAncestors.call(parent, visitor, true, context);
        }
    }
}

/**
 * Helper class for traversing a graph.
 * @static
 * @class Traversal
 * @extends Abstract
 */
export const Traversal = Abstract.extend({}, {
    /**
     * Performs a pre-order graph traversal.
     * @static
     * @method preOrder
     * @param  {miruken.graph.Traversing}  node       -  node to traverse
     * @param  {Function}                  visitor    -  receives visited nodes
     * @param  {Object}                    [context]  -  visitor calling context
     */
    preOrder(node, visitor, context) {
        return preOrder(node, visitor, context);
    },
    /**
     * Performs a post-order graph traversal.
     * @static
     * @method postOrder
     * @param  {miruken.graph.Traversing}  node       -  node to traverse
     * @param  {Function}                  visitor    -  receives visited nodes
     * @param  {Object}                    [context]  -  visitor calling context
     */
    postOrder(node, visitor, context) {
        return postOrder(node, visitor, context);
    },
    /**
     * Performs a level-order graph traversal.
     * @static
     * @method levelOrder
     * @param  {miruken.graph.Traversing}  node       -  node to traverse
     * @param  {Function}                  visitor    -  receives visited nodes
     * @param  {Object}                    [context]  -  visitor calling context
     */
    levelOrder(node, visitor, context) {
        return levelOrder(node, visitor, context);
    },
    /**
     * Performs a reverse level-order graph traversal.
     * @static
     * @method levelOrder
     * @param  {miruken.graph.Traversing}  node       -  node to traverse
     * @param  {Function}                  visitor    -  receives visited nodes
     * @param  {Object}                    [context]  -  visitor calling context
     */
    reverseLevelOrder(node, visitor, context) {
        return reverseLevelOrder(node, visitor, context);
    }
});

function preOrder(node, visitor, context, visited = []) {
    checkCircularity(visited, node);
    if (!node || !$isFunction(visitor) || visitor.call(context, node)) {
        return true;
    }
    if ($isFunction(node.traverse))
        node.traverse(child => preOrder(child, visitor, context, visited));
    return false;
}

function postOrder(node, visitor, context, visited = []) {
    checkCircularity(visited, node);
    if (!node || !$isFunction(visitor)) {
        return true;
    }
    if ($isFunction(node.traverse))
        node.traverse(child => postOrder(child, visitor, context, visited));
    return visitor.call(context, node);
}

function levelOrder(node, visitor, context, visited = []) {
    if (!node || !$isFunction(visitor)) {
        return;
    }
    const queue = [node];
    while (queue.length > 0) {
        const next = queue.shift();
        checkCircularity(visited, next);
        if (visitor.call(context, next)) {
            return;
        }
        if ($isFunction(next.traverse))
            next.traverse(child => {
                if (child) queue.push(child);
            });
    }
}

function reverseLevelOrder(node, visitor, context, visited = []) {
    if (!node || !$isFunction(visitor)) {
        return;
    }
    const queue = [node],
          stack = [];
    while (queue.length > 0) {
        const next = queue.shift();
        checkCircularity(visited, next);
        stack.push(next);
        const level = [];
        if ($isFunction(next.traverse))
            next.traverse(child => {
                if (child) level.unshift(child);
            });
        queue.push.apply(queue, level);
    }
    while (stack.length > 0) {
        if (visitor.call(context, stack.pop())) {
            return;
        }
    }
}

/**
 * Facet choices for proxies.
 * @class Facet
 */
export const Facet = Object.freeze({
    /**
     * @property {string} Parameters
     */
    Parameters: 'parameters',
    /**
     * @property {string} Interceptors
     */        
    Interceptors: 'interceptors',
    /**
     * @property {string} InterceptorSelectors
     */                
    InterceptorSelectors: 'interceptorSelectors',
    /**
     * @property {string} Delegate
     */                        
    Delegate: 'delegate'
});

/**
 * Base class for method interception.
 * @class Interceptor
 * @extends Base
 */
export const Interceptor = Base.extend({
    /**
     * @method intercept
     * @param    {Object} invocation  - invocation
     * @returns  {Any} invocation result
     */
    intercept(invocation) {
        return invocation.proceed();
    }
});

/**
 * Responsible for selecting which interceptors to apply to a method.
 * @class InterceptorSelector
 * @extends Base
 */
export const InterceptorSelector = Base.extend({
    /**
     * Selects `interceptors` to apply to `method`.
     * @method selectInterceptors
     * @param    {Type}    type         - intercepted type
     * @param    {string}  method       - intercepted method name
     * @param    {Array}   interceptors - available interceptors
     * @returns  {Array} interceptors to apply to method.
     */
    selectInterceptors(type, method, interceptors) {
        return interceptors;
    }
});

/**
 * Builds proxy classes for interception.
 * @class ProxyBuilder
 * @extends Base
 */
export const ProxyBuilder = Base.extend({
    /**
     * Builds a proxy class for the supplied types.
     * @method buildProxy
     * @param    {Array}     ...types  -  classes and protocols
     * @param    {Object}    options   -  literal options
     * @returns  {Function}  proxy class.
     */
    buildProxy(types, options) {
        if (!Array.isArray(types)) {
            throw new TypeError("ProxyBuilder requires an array of types to proxy.");
        }
        const classes   = types.filter($isClass),
              protocols = types.filter($isProtocol);
        return buildProxy(classes, protocols, options || {});
    }
});

function buildProxy(classes, protocols, options) {
    const base  = options.baseType || classes.shift() || Base,
          proxy = base.extend(classes.concat(protocols), {
            constructor(facets) {
                const spec = {};
                spec.value = facets[Facet.InterceptorSelectors]
                if (spec.value && spec.value.length > 0) {
                    Object.defineProperty(this, "selectors", spec);
                }
                spec.value = facets[Facet.Interceptors];
                if (spec.value && spec.value.length > 0) {
                    Object.defineProperty(this, "interceptors", spec);
                }
                spec.value = facets[Facet.Delegate];
                if (spec.value) {
                    spec.writable = true;
                    Object.defineProperty(this, "delegate", spec);
                }
                const ctor = proxyMethod("constructor", this.base, base);
                ctor.apply(this, facets[Facet.Parameters]);
                delete spec.writable;
                delete spec.value;
            },
            getInterceptors(source, method) {
                const selectors = this.selectors;
                return selectors 
                    ? selectors.reduce((interceptors, selector) =>
                         selector.selectInterceptors(source, method, interceptors)
                    , this.interceptors)
                : this.interceptors;
            },
            extend: extendProxy
        }, {
            shouldProxy: options.shouldProxy
        });
    proxyClass(proxy, protocols);
    proxy.extend = proxy.implement = throwProxiesSealedExeception;
    return proxy;
}

function throwProxiesSealedExeception()
{
    throw new TypeError("Proxy classes are sealed and cannot be extended from.");
}

function proxyClass(proxy, protocols) {
    const sources    = [proxy].concat(protocols),
          proxyProto = proxy.prototype,
          proxied    = {};
    for (let i = 0; i < sources.length; ++i) {
        const source      = sources[i],
              sourceProto = source.prototype,
              isProtocol  = $isProtocol(source);
        for (let key in sourceProto) {
            if (!((key in proxied) || (key in noProxyMethods))
                && (!proxy.shouldProxy || proxy.shouldProxy(key, source))) {
                const descriptor = getPropertyDescriptors(sourceProto, key);
                if ('value' in descriptor) {
                    const member = isProtocol ? undefined : descriptor.value;
                    if ($isNothing(member) || $isFunction(member)) {
                        proxyProto[key] = proxyMethod(key, member, proxy);
                    }
                    proxied[key] = true;
                } else if (isProtocol) {
                    const cname = key.charAt(0).toUpperCase() + key.slice(1),
                          get   = 'get' + cname,
                          set   = 'set' + cname,
                          spec  = proxyClass.spec || (proxyClass.spec = {
                              enumerable: true
                          });
                    spec.get = function (get) {
                        let proxyGet;
                        return function () {
                            if (get in this) {
                                return (this[get]).call(this);
                            }
                            if (!proxyGet) {
                                proxyGet = proxyMethod(get, undefined, proxy);
                            }
                            return proxyGet.call(this);
                        }
                    }(get);
                    spec.set = function (set) {
                        let proxySet;
                        return function (value) {
                            if (set in this) {
                                return (this[set]).call(this, value);
                            }
                            if (!proxySet) {
                                proxySet = proxyMethod(set, undefined, proxy);
                            }
                            return proxySet.call(this, value);
                        }
                    }(set);
                    Object.defineProperty(proxy.prototype, key, spec);
                    proxied[key] = true;
                }
            }
        }
    }
}

function proxyMethod(key, method, source) {
    let interceptors;    
    const spec = proxyMethod.spec || (proxyMethod.spec = {});
    function methodProxy() {
        const _this    = this;
        let   delegate = this.delegate,
              idx      = -1;
        if (!interceptors) {
            interceptors = this.getInterceptors(source, key);
        }
        const invocation = {
            args: Array.from(arguments),
            useDelegate(value) {
                delegate = value;
            },
            replaceDelegate(value) {
                _this.delegate = delegate = value;
            },
            proceed() {
                ++idx;
                if (interceptors && idx < interceptors.length) {
                    const interceptor = interceptors[idx];
                    return interceptor.intercept(invocation);
                }
                if (delegate) {
                    const delegateMethod = delegate[key];
                    if ($isFunction(delegateMethod)) {
                        return delegateMethod.apply(delegate, this.args);
                    }
                } else if (method) {
                    return method.apply(_this, this.args);
                }
                throw new Error(`Interceptor cannot proceed without a class or delegate method '${key}'.`);
            }
        };
        spec.value = key;
        Object.defineProperty(invocation, 'method', spec);
        spec.value = source;
        Object.defineProperty(invocation, 'source', spec);
        delete spec.value;
        spec.get = function () {
            if (interceptors && (idx + 1 < interceptors.length)) {
                return true;
            }
            if (delegate) {
                return $isFunction(delegate(key));
            }
            return !!method;
        };
        Object.defineProperty(invocation, 'canProceed', spec);
        delete spec.get;
        return invocation.proceed();
    }
    methodProxy.baseMethod = method;
    return methodProxy;
}

function extendProxy() {
    const proxy     = this.constructor,
          clazz     = proxy.prototype,
          overrides = (arguments.length === 1) ? arguments[0] : {};
    if (arguments.length >= 2) {
        overrides[arguments[0]] = arguments[1];
    }
    for (let methodName in overrides) {
        if (!(methodName in noProxyMethods) && 
            (!proxy.shouldProxy || proxy.shouldProxy(methodName, clazz))) {
            const method = this[methodName];
            if (method && method.baseMethod) {
                this[methodName] = method.baseMethod;
            }
            this.base(methodName, overrides[methodName]);
            this[methodName] = proxyMethod(methodName, this[methodName], clazz);
        }
    }
    return this;
}

const noProxyMethods = {
    base: true, extend: true, constructor: true, conformsTo: true,
    getInterceptors: true, getDelegate: true, setDelegate: true
};
