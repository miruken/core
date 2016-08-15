

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
 * @for Modifier
 */
export const $eq = $createModifier();

/**
 * Annotates use value as is.
 * @attribute $use
 * @for Modifier
 */    
export const $use = $createModifier();

/**
 * Annotates copy semantics.
 * @attribute $copy
 * @for Modifier
 */        
export const $copy = $createModifier();

/**
 * Annotates lazy semantics.
 * @attribute $lazy
 * @for Modifier
 */            
export const $lazy = $createModifier();

/**
 * Annotates function to be evaluated.
 * @attribute $eval
 * @for Modifier
 */                
export const $eval = $createModifier();

/**
 * Annotates zero or more semantics.
 * @attribute $every
 * @for Modifier
 */                    
export const $every = $createModifier();

/**
 * Annotates 
 * @attribute use {{#crossLink "Parenting"}}{{/crossLink}} protocol.
 * @attribute $child
 * @for Modifier
 */                        
export const $child = $createModifier();

/**
 * Annotates optional semantics.
 * @attribute $optional
 * @for Modifier
 */                        
export const $optional = $createModifier();

/**
 * Annotates Promise expectation.
 * @attribute $promise
 * @for Modifier
 */                            
export const $promise = $createModifier();

/**
 * Annotates synchronous.
 * @attribute $instant
 * @for Modifier
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

export function decorate(decorator, args) {
    if (isDescriptor(args[args.length - 1])) {
        return decorator(...args, []);
    }
    return function () {
        return decorator(...arguments, args);
    };
}

export function isDescriptor(desc) {
    if (!desc || !desc.hasOwnProperty) {
        return false;
    }

    const keys = ['value', 'initializer', 'get', 'set'];

    for (let i = 0, l = keys.length; i < l; i++) {
        if (desc.hasOwnProperty(keys[i])) {
            return true;
        }
    }

    return false;
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
  Object.setPrototypeOf(_class, this);
  if (_static) extend(_class, _static);
  _class.ancestor = this;
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
        if (!desc || (desc.enumerable &&  desc.value != proto[key])) {
          desc = _override(object, key, desc);
          if (desc) Object.defineProperty(object, key, desc);
        }
      }
    }
      // Copy each of the source object's properties to the target object.
    var props = getPropertyDescriptors(source);
    Reflect.ownKeys(props).forEach(function (key) {
      if (typeof proto[key] == "undefined" && key !== "base") {
        var desc = props[key];
        if (desc.enumerable) {  
          desc = _override(object, key, desc);
          if (desc) Object.defineProperty(object, key, desc);
        }
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

export function copy(...args) {
    return decorate(handleCopy, args);
}

export default copy;

function handleCopy(target, key, descriptor) {
    const { get, set, value } = descriptor;
    if ($isFunction(value)) {
        descriptor.value = function () {
            return copyOf(value.apply(this, arguments));
        }
    }
    if ($isFunction(get)) {
        descriptor.get = function () {
            return copyOf(get.apply(this));
        }
    }
    if ($isFunction(set)) {
        descriptor.set = function (value) {
            return set.call(this, copyOf(value));
        }
    }
    return descriptor;
}

function copyOf(value) {
    if (value != null && $isFunction(value.copy)) {
        value = value.copy();
    }
    return value;
}

/**
 * Delegates properties and methods to another object.<br/>
 * See {{#crossLink "Protocol"}}{{/crossLink}}
 * @class Delegate
 * @extends Base
 */
export const Delegate = Base.extend({
    /**
     * Delegates the property get on `protocol`.
     * @method get
     * @param   {Protocol} protocol  - receiving protocol
     * @param   {string}   key       - key of the property
     * @param   {boolean}  strict    - true if target must adopt protocol
     * @returns {Any} result of the proxied get.
     */
    get(protocol, key, strict) {},
    /**
     * Delegates the property set on `protocol`.
     * @method set
     * @param   {Protocol} protocol  - receiving protocol
     * @param   {string}   key       - key of the property
     * @param   {Object}   value     - value of the property
     * @param   {boolean}  strict    - true if target must adopt protocol
     */
    set(protocol, key, value, strict) {},
    /**
     * Delegates the method invocation on `protocol`.
     * @method invoke
     * @param   {Protocol} protocol    - receiving protocol
     * @param   {string}   methodName  - name of the method
     * @param   {Array}    args        - method arguments
     * @param   {boolean}  strict      - true if target must adopt protocol
     * @returns {Any} result of the proxied invocation.
     */
    invoke(protocol, methodName, args, strict) {}
});

/**
 * Delegates properties and methods to an object.
 * @class ObjectDelegate
 * @constructor
 * @param   {Object}  object  - receiving object
 * @extends Delegate
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
 * @extends Delegate
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
 * Defines an enumeration.
 * <pre>
 *    const Color = Enum({
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
        return en;
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
 *    const DayOfWeek = Flags({
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
 * Determines if `str` is a string.
 * @method $isString
 * @param    {Any}     str  - string to test
 * @returns  {boolean} true if a string.
 */
export function $isString(str) {
    return typeOf(str) === 'string';
}

/**
 * Determines if `sym` is a symbol.
 * @method $isSymbol
 * @param    {Symbole} sym  - symbol to test
 * @returns  {boolean} true if a symbol.
 */
export function $isSymbol(str) {
    return Object(str) instanceof Symbol;
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
        Object.defineProperty(decorator, 'decoratee', {
            configurable: false,
            value:        decoratee
        });
        if (decorations && $isFunction(decorator.extend)) {
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
 * Recursively flattens and optionally prune an array.
 * @method $flatten
 * @param    {Array}   arr    -  array to flatten
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
 * Recursively merges `sources` into `target`.
 * @method $mergeDeep
 * @param    {Object}  target   -  object to merge into
 * @param    {Array}   sources  -  objects to merge from
 * @returns  {Object} the original `target`.
 */
export function $merge(target, ...sources) {
    if (!$isObject(target)) return target;
    for (let source of sources) {
        if ($isObject(source)) {
            const props = getPropertyDescriptors(source);
            for (let key in props) {
                if (!props[key].enumerable) continue;
                const newValue = source[key],
                      curValue = target[key];
                if (curValue && $isObject(curValue)) {
                    $merge(curValue, newValue);
                } else {
                    target[key] = newValue;
                }
            }
        }
    }
    return target;
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

const baseExtend        = Base.extend,
      baseImplement     = Base.implement,
      baseProtoExtend   = Base.prototype.extend,
      MetadataSymbol    = Symbol.for('miruken.$meta');

const { defineProperty, getOwnPropertyDescriptor } = Object,
      { ownKeys } = Reflect;

/**
 * Declares methods and properties independent of a class.
 * <pre>
 *    var Auditing = Protocol.extend({
 *        get level() {},
 *        record(activity) {}
 *    })
 * </pre>
 * @class Protocol
 * @constructor
 * @param   {Delegate}  delegate        -  delegate
 * @param   {boolean}   [strict=false]  -  true if strict, false otherwise
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
    /**
     * Determines if `target` is a {{#crossLink "Protocol"}}{{/crossLink}}.
     * @static
     * @method isProtocol
     * @param   {Any}      target    -  target to test
     * @returns {boolean}  true if the target is a Protocol.
     */
    isProtocol(target) {
        return target && (target.prototype instanceof Protocol);
    },
    /**
     * Determines if `target` conforms to this protocol.
     * @static
     * @method adoptedBy
     * @param   {Any}      target    -  target to test
     * @returns {boolean}  true if the target conforms to this protocol.
     */
    adoptedBy(target) {
        return $meta(target).conformsTo(this);
    },
    /**
     * Notifies the `protocol` has been adopted.
     * @staticsisProto
     * @method adoptedBy
     * @param   {Protocol} protocol  -  protocol adopted
     */    
    protocolAdopted(protocol) {
        const prototype     = this.prototype,
              protocolProto = Protocol.prototype,
              props         = getPropertyDescriptors(protocol.prototype);
        ownKeys(props).forEach(key => {
            if (getPropertyDescriptors(protocolProto, key) ||
                getPropertyDescriptors(prototype, key)) return;
            defineProperty(prototype, key, props[key]);            
        });        
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

function decorateProtocol(target) {
    if ($isFunction(target)) {
        target = target.prototype;
    }
    ownKeys(target).forEach(key => {
        if (key === 'constructor') return;
        const descriptor = getOwnPropertyDescriptor(target, key);
        if (!descriptor.enumerable) return;
        if ($isFunction(descriptor.value)) {
            descriptor.value = function (...args) {
                return this[ProtocolInvoke](key, args);
            };
        } else {
            const isSimple = descriptor.hasOwnProperty('value');
            if (isSimple) {
                delete descriptor.value;
                delete descriptor.writable;
            }
            if (descriptor.get || isSimple) {
                descriptor.get = function () {
                    return this[ProtocolGet](key);
                };
            }
            if (descriptor.set || isSimple) {
                descriptor.set = function (value) {
                    return this[ProtocolSet](key, value);
                }
            }
        }
        defineProperty(target, key, descriptor);                
    });
}

/**
 * Marks a class as a {{#crossLink "Protocol"}}{{/crossLink}}.
 * @method protocol
 * @param    {Array}    args  -  protocol args
 * @returns  {Function} the protocol decorator.
 */
export function protocol(...args) {
    if (args.length === 0) {
        return function () {
            return decorateProtocol.apply(null, arguments);
        };
    }
    return decorateProtocol(...args);
}

/**
 * Marks a class or protocol as conforming to one or more
 * {{#crossLink "Protocol"}}{{/crossLink}}s.
 * @method conformsTo
 * @param    {Array}    protocols  -  conforming protocols
 * @returns  {Function} the conformsTo decorator.
 */
export function conformsTo(...protocols) {
    protocols = $flatten(protocols, true);    
    if (protocols.length === 0) {
        return Undefined;
    }
    return function (target) {
        const meta = $meta(target);
        if (meta) {
            meta.adoptProtocol(protocols);
        }
    }
}

/**
 * Decorates a class with behaviors to mix in.
 * @method mixin
 * @param    {Array}    ...behaviors  -  behaviors
 * @returns  {Function} the mixin decorator.
 */
export function mixin(...behaviors) {
    behaviors = $flatten(behaviors, true);
    return function (target) {
        if (behaviors.length > 0 && $isFunction(target.implement)) {
            for (let behavior of behaviors) {
                target.implement(behavior);
            }
        }
    };
}

/**
 * Base class for all metadata.
 * @class Metadata
 * @constructor
 * @param  {Metadata}  [parent]  - parent metadata
 * @extends Base
 */
export const Metadata = Base.extend({
    constructor(parent)  {
        let _parent = parent,
            _type, _protocols,
            _metadata, _extensions;
        this.extend({
            /**
             * Gets the parent metadata.
             * @property {Metadata} parent
             */
            get parent() { return _parent; },
            /**
             * Gets/sets the associated type.
             * @property {Function} type
             */                                              
            get type() {
                return _type || (_parent && _parent.type);
            },
            set type(value) {
                if (_type != value && $isFunction(value)) {
                    _type   = value;
                    _parent = $meta(Object.getPrototypeOf(_type));
                }
            },
            /**
             * Returns true if this metadata represents a Protocol.
             * @property {boolean} isProtocol
             */
            get isProtocol() {
                return Protocol.isProtocol(_type);
            },
            /**
             * Gets the declared protocols.
             * @property {Array} protocols
             */
            get protocols() {
                return _protocols ? _protocols.slice(0) : [];
            },
            /**
             * Gets all conforming protocools.
             * @property {Array} allProtocols
             */
            get allProtocols() {
                const protocols = this.protocols,
                      declared  = protocols.slice(0);
                if (_parent) {
                    _parent.allProtocols.forEach(addProtocol);
                }                
                for (let protocol of declared) {
                    $meta(protocol).allProtocols.forEach(addProtocol);
                }
                if (_extensions) {
                    for (let extension of _extensions) {
                        extension.allProtocols.forEach(addProtocol);
                    }
                }
                function addProtocol(protocol) {
                    if (protocols.indexOf(protocol) < 0) {
                        protocols.push(protocol);
                    }
                }
                return protocols;
            },
            /**
             * Adopts one or more `protocols` by the metadata.
             * @method adoptProtocol
             * @param  {Array}  protocols  -  protocols to adopt
             * @returns  {Metadata} current metadata.
             * @chainable
             */
            adoptProtocol(...protocols) {
                protocols = $flatten(protocols, true);
                if (!protocols || protocols.length == 0) {
                    return this;
                }
                const type       = this.type,
                      notifyType = type && $isFunction(type.protocolAdopted);
                _protocols = _protocols || [];
                for (let protocol of protocols) {
                    if ((protocol.prototype instanceof Protocol) &&
                        (_protocols.indexOf(protocol) < 0)) {
                        _protocols.push(protocol);
                        if (notifyType) {
                            type.protocolAdopted(protocol);
                        }
                    }
                }
                return this;
            },
            /**
             * Determines if the metadata conforms to the `protocol`.
             * @method conformsTo
             * @param   {Protocol} protocol -  protocols to test
             * @returns {boolean}  true if the metadata includes the protocol.
             */
            conformsTo(protocol) {
                if (!(protocol && protocol.prototype instanceof Protocol)) {
                    return false;
                }
                const type = this.type;                
                return (type && ((protocol === type) || (type.prototype instanceof protocol)))
                    || (_protocols && _protocols.some(p => protocol === p || p.conformsTo(protocol)))
                    || (_extensions && _extensions.some(e => e.conformsTo(protocol)))
                    || !!(_parent && _parent.conformsTo(protocol));
                
            },
            /**
             * Creates a sub-class of the current class metadata.
             * @method subClass
             * @param   {Array}    args  -  constraints
             * @returns {Function} the newly created sub-class.
             */                                                                
            subClass(...args) {
                const type        = this.type;
                let   constraints = args, decorators = [];
                if (type === Protocol) {
                    decorators.push(protocol);
                } if (this.isProtocol) {
                    decorators.push(protocol, conformsTo(type));
                }
                if (args.length > 0 && Array.isArray(args[0])) {
                    constraints = args.shift();
                }
                while (constraints.length > 0) {
                    const constraint = constraints[0];
                    if (!constraint) {
                        break;
                    } else if (constraint.prototype instanceof Protocol) {
                        decorators.push(conformsTo(constraint));
                    } else if (constraint.prototype instanceof Base ||
                               constraint.prototype instanceof Module) {
                        decorators.push(mixin(constraint));
                    } else if ($isFunction(constraint)) {
                        decorators.push(constraint);
                    }
                    else {
                        break;
                    }
                    constraints.shift();
                }
                let members      = args.shift() || {},
                    classMembers = args.shift() || {},
                    derived      = baseExtend.call(type, members, classMembers);
                defineMetadata(derived.prototype, $meta(members));
                if (decorators.length > 0) {
                    for (let decorator of decorators) {
                        derived = decorator(derived) || derived;
                    }                    
                }                
                return derived;                    
            },
            /**
             * Extends the class represented by this metadata.
             * @method extendClass
             * @param   {Any} source  -  class function or object literal
             * @returns {Function} the class.
             */
            extendClass(source) {
                const type = this.type;
                if (!type) return;
                if (source) {
                    if (this.isProtocol && !(source instanceof Base)) {
                        source = protocol(source) || source;
                    }
                    (_extensions || (_extensions = [])).push($meta(source));
                }
                return baseImplement.call(type, source);
            },
            /**
             * Extends the instance represented by this metadata.
             * @method extendInstance
             * @param   {Object}           object   -  instance
             * @param   {string | Object}  key      -  key or object literal
             * @param   {Any}              [value]  -  key value if key is string
             * @returns {Object} the instance.
             */
            extendInstance(object, key, value) {
                if (!key) return object;
                const numArgs = arguments.length;
                if ( numArgs === 2) {
                    if (object instanceof Protocol) {
                        key = protocol(key) || key;
                    }
                    (_extensions || (_extensions = [])).push($meta(key));
                    return baseProtoExtend.call(object, key);
                }
                return baseProtoExtend.call(object, key, value);
            },            
            /**
             * Gets the metadata for one or all keys.
             * @method getMetadata
             * @param    {string|Symbol}  key  -  key selector
             * @returns  {Object} key metadata.
             */
            getMetadata(key) {
                let metadata;
                if (_parent) {
                    metadata = _parent.getMetadata(key);
                }
                if (_metadata) {
                    const keyData = key ? _metadata[key] : _metadata;
                    if (keyData) {
                        metadata = $merge(metadata || {}, keyData);
                    }
                }                
                if (_extensions) {
                    metadata = _extensions.reduce((result, ext) => {
                        const keyMeta = ext.getMetadata(key);
                        return keyMeta ? $merge(result || {}, keyMeta) : result;
                    }, metadata);  
                }
                return metadata;
            },
            /**
             * Adds metadata to a property `key`.
             * @method addMetadata
             * @param    {string | Symbol}  key       -  property key
             * @param    {Object}           metadata  -  metadata
             * @param    {boolean}          replace   -  true if replace
             * @returns  {Metadata} current metadata.
             * @chainable
             */
            addMetadata(key, metadata, replace) {
                if (key && metadata) {
                    const meta = _metadata || (_metadata = {});
                    if (replace) {
                        Object.assign(meta, {
                            [key]: Object.assign(meta[key] || {}, metadata)
                        });
                    } else {
                        $merge(meta, { [key]: metadata });
                    }
                }
                return this;
            },
        });
    }
});

const SUPPRESS_METADATA = [ Object, Function, Array ];

Base.extend = function () {
    const meta = $meta(this);
    return meta? meta.subClass(...arguments)
         : baseExtend.apply(this, arguments);
};

Base.implement = function () {
    const meta = $meta(this);
    return meta ? meta.extendClass(...arguments)
         : baseImplement.apply(this, arguments);
}

Base.conformsTo = Base.prototype.conformsTo = function (protocol) {
    return $meta(this).conformsTo(protocol);
};

Base.prototype.extend = function () {
    const meta = $meta(this);
    return meta ? meta.extendInstance(this, ...arguments)
         : baseProtoExtend.apply(this, arguments);
}

/**
 * Protocol base requiring conformance to match methods.
 * @class StrictProtocol
 * @constructor
 * @param   {Delegate}  delegate       -  delegate
 * @param   {boolean}   [strict=true]  -  true ifstrict, false otherwise
 * @extends miruekn.Protocol     
 */
export const StrictProtocol = Protocol.extend({
    constructor(proxy, strict) {
        this.base(proxy, (strict === undefined) || strict);
    }
});

/**
 * Gets the metadata associated with `target`.
 * @method
 * @param   {Function | Object}  target  -  target
 * @erturns {Metadata} target metadata.
 */
export function $meta(target) {
    if (target == null) return;
    if (target.hasOwnProperty(MetadataSymbol)) {
        return target[MetadataSymbol];
    }
    if (target === Metadata || target instanceof Metadata ||
        target.prototype instanceof Metadata)
        return;    
    let i = SUPPRESS_METADATA.length;
    while (i--) {
        const ignore = SUPPRESS_METADATA[i];
        if (target === ignore || target === ignore.prototype) {
            return;
        }
    }
    let meta;    
    if ($isFunction(target)) {
        meta = $meta(target.prototype);
        if (meta) meta.type = target;
    } else if ($isObject(target)) {
        const parent = Object.getPrototypeOf(target);
        meta = new Metadata($meta(parent));
    }
    if (meta) {
        defineMetadata(target, meta);
        return meta;
    }
}

function defineMetadata(target, metadata) {
    defineProperty(target, MetadataSymbol, {
        enumerable:   false,
        configurable: false,
        writable:     false,
        value:        metadata
    });
}

/**
 * Determines if `protocol` is a protocol.
 * @method $isProtocol
 * @param    {Any}     protocol  - target to test
 * @returns  {boolean} true if a protocol.
 * @for miruken-core.$
 */
export const $isProtocol = Protocol.isProtocol;

/**
 * Determines if `clazz` is a class.
 * @method $isClass
 * @param    {Any}     clazz  - class to test
 * @returns  {boolean} true if a class (and not a protocol).
 */
export function $isClass(clazz) {
    if (!clazz || $isProtocol(clazz)) return false;    
    if (clazz.prototype instanceof Base) return true;
    const name = clazz.name;  // use Capital name convention
    return name && $isFunction(clazz) && isUpperCase(name.charAt(0));
}

function isUpperCase(char) {
    return char.toUpperCase() === char;
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
 * Type of property method.
 * @class PropertyType
 * @extends Enum
 */
export const MethodType = Enum({
    /**
     * Getter property method
     * @property {number} Get
     */
    Get: 1,
    /**
     * Setter property method
     * @property {number} Set
     */    
    Set: 2,
    /**
     * Method invocation
     * @property {number} Invoke
     */        
    Invoke: 3
});

/**
 * Variance enum
 * @class Variance
 * @extends Enum
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
 * @extends Protocol
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
 * @extends Protocol
 */
export const Resolving = Protocol.extend();

/**
 * Protocol for targets that can execute functions.
 * @class Invoking
 * @extends StrictProtocol
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
 * @extends Protocol
 */
export const Parenting = Protocol.extend({
    /**
     * Creates a new child of the parent.
     * @method newChild
     * @returns {Object} the new child.
     */
    newChild() {}
});

/**
 * Protocol for targets that can be started.
 * @class Starting
 * @extends Protocol
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
 * @uses Starting
 * @extends Base
 */
export const Startup = Base.extend(Starting, {
    start() {}
});

/**
 * Protocol for targets that manage disposal lifecycle.
 * @class Disposing
 * @extends Protocol
 */
export const Disposing = Protocol.extend({
    /**
     * Releases any resources managed by the receiver.
     * @method dispose
     */
    dispose() {}
});

/**
 * Mixin for {{#crossLink "Disposing"}}{{/crossLink}} implementation.
 * @class DisposingMixin
 * @uses Disposing
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
 * @method $using
 * @param    {Disposing}           disposing  - object to dispose
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
 * @extends Enum
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
 * @extends Protocol
 */
export const Traversing = Protocol.extend({
    /**
     * Traverse a graph of objects.
     * @method traverse
     * @param {TraversingAxis}  axis       -  axis of traversal
     * @param {Function}        visitor    -  receives visited nodes
     * @param {Object}          [context]  -  visitor callback context
     */
    traverse(axis, visitor, context) {}
});

/**
 * Mixin for Traversing functionality.
 * @class TraversingMixin
 * @uses Traversing
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
     * @param  {Traversing}  node       -  node to traverse
     * @param  {Function}    visitor    -  receives visited nodes
     * @param  {Object}      [context]  -  visitor calling context
     */
    preOrder(node, visitor, context) {
        return preOrder(node, visitor, context);
    },
    /**
     * Performs a post-order graph traversal.
     * @static
     * @method postOrder
     * @param  {Traversing}  node       -  node to traverse
     * @param  {Function}    visitor    -  receives visited nodes
     * @param  {Object}      [context]  -  visitor calling context
     */
    postOrder(node, visitor, context) {
        return postOrder(node, visitor, context);
    },
    /**
     * Performs a level-order graph traversal.
     * @static
     * @method levelOrder
     * @param  {Traversing}  node       -  node to traverse
     * @param  {Function}    visitor    -  receives visited nodes
     * @param  {Object}      [context]  -  visitor calling context
     */
    levelOrder(node, visitor, context) {
        return levelOrder(node, visitor, context);
    },
    /**
     * Performs a reverse level-order graph traversal.
     * @static
     * @method levelOrder
     * @param  {Traversing}  node       -  node to traverse
     * @param  {Function}    visitor    -  receives visited nodes
     * @param  {Object}      [context]  -  visitor calling context
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

export function metadata(...args) {
    return decorate(handleMetadata, args);
}

function handleMetadata(target, key, descriptor, [keyMetadata]) {
    if (keyMetadata) {
        const meta = $meta(target);
        if (meta) {
            meta.addMetadata(key, keyMetadata);
        }
    }
    return descriptor;
}

export default metadata;

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
          proxy = base.extend(...classes.concat(protocols), {
            constructor(facets) {
                const spec = {};
                spec.value = facets[Facet.InterceptorSelectors]
                if (spec.value && spec.value.length > 0) {
                    Object.defineProperty(this, 'selectors', spec);
                }
                spec.value = facets[Facet.Interceptors];
                if (spec.value && spec.value.length > 0) {
                    Object.defineProperty(this, 'interceptors', spec);
                }
                spec.value = facets[Facet.Delegate];
                if (spec.value) {
                    spec.writable = true;
                    Object.defineProperty(this, 'delegate', spec);
                }
                const ctor = proxyMethod('constructor', this.base, base);
                ctor.apply(this, facets[Facet.Parameters]);
                delete spec.writable;
                delete spec.value;
            },
            getInterceptors(source, method) {
                const selectors = this.selectors;
                return selectors ? selectors.reduce((interceptors, selector) =>
                           selector.selectInterceptors(source, method, interceptors),
                           this.interceptors)
                     : this.interceptors;
            },
            extend: extendProxyInstance
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

const noProxyMethods = {
    base: true, extend: true, constructor: true, conformsTo: true,
    getInterceptors: true, getDelegate: true, setDelegate: true
};

function proxyClass(proxy, protocols) {
    const sources = [proxy].concat($meta(proxy).allProtocols, protocols),
          proxied = {};
    for (let i = 0; i < sources.length; ++i) {
        const source     = sources[i],
              isProtocol = $isProtocol(source),
              props      = getPropertyDescriptors(source.prototype);
        Reflect.ownKeys(props).forEach(key => {
            if (proxied.hasOwnProperty(key) || (key in noProxyMethods)) return;
            if (proxy.shouldProxy && !proxy.shouldProxy(key, source)) return;
            const descriptor = props[key];
            if (!descriptor.enumerable) return;
            let { value, get, set } = descriptor;
            if ($isFunction(value)) {
                if (isProtocol) value = null;
                descriptor.value = proxyMethod(key, value, proxy);
            } else {
                if (descriptor.hasOwnProperty('value')) {
                    const field = Symbol();
                    get = function () { return this[field]; },
                    set = function (value) { this[field] = value; };
                    delete descriptor.value;
                    delete descriptor.writable;
                }
                if (get) {
                    if (isProtocol) get = null;
                    descriptor.get = proxyMethod(key, get, proxy, MethodType.Get);
                }
                if (set) {
                    if (isProtocol) set = null;                    
                    descriptor.set = proxyMethod(key, set, proxy, MethodType.Set);
                }
            }
            Object.defineProperty(proxy.prototype, key, descriptor);
            proxied[key] = true;
        });
    }
}

function proxyMethod(key, method, source, type) {
    let interceptors;    
    function methodProxy(...args) {
        const _this    = this;
        let   delegate = this.delegate,
              idx      = -1;
        if (!interceptors) {
            interceptors = this.getInterceptors(source, key);
        }
        type = type || MethodType.Invoke;
        const invocation = {
            method:     key,
            methodType: type,            
            source:     source,
            args:       args,
            useDelegate(value) { delegate = value; },
            replaceDelegate(value) {
                _this.delegate = delegate = value;
            },
            get canProceed() {
                if (interceptors && (idx + 1 < interceptors.length)) {
                    return true;
                }
                if (delegate) {
                    return $isFunction(delegate[key]);
                }
                return !!method;
            },
            proceed() {
                ++idx;
                if (interceptors && idx < interceptors.length) {
                    const interceptor = interceptors[idx];
                    return interceptor.intercept(invocation);
                }
                if (delegate) {
                    switch(type) {
                    case MethodType.Get:
                        return delegate[key];
                    case MethodType.Set:
                        delegate[key] = args[0];
                        break;
                    case MethodType.Invoke:
                        const invoke = delegate[key];
                        if ($isFunction(invoke)) {
                            return invoke.apply(delegate, this.args);
                        }
                        break;
                    }
                } else if (method) {
                    return method.apply(_this, this.args);
                }
                throw new Error(`Interceptor cannot proceed without a class or delegate method '${key}'.`);
            }
        };
        return invocation.proceed();
    }
    methodProxy.baseMethod = method;
    return methodProxy;
}

function extendProxyInstance(key, value) {
    const proxy     = this.constructor,
          overrides = arguments.length === 1
                    ? key : { [key]: value },
          props     = getPropertyDescriptors(overrides);
    Reflect.ownKeys(props).forEach(key => {
        const descriptor = props[key];        
        if (!descriptor.enumerable) return;
        let { value, get, set } = descriptor,
            baseDescriptor = getPropertyDescriptors(this, key);
        if (!baseDescriptor) return;
        if (value) {
            if ($isFunction(value)) {
                const baseValue = baseDescriptor.value;
                if ($isFunction(value) && value.baseMethod) {
                    baseDescriptor.value = value.baseMethod;
                }
            }
        } else if (get) {
            const baseGet = baseDescriptor.get;
            if (baseGet && get.baseMethod) {
                baseDescriptor.get = get.baseMethod;
            }
        } else if (set) {
            const baseSet = baseDescriptor.set;
            if (baseSet && set.baseMethod) {
                baseDescriptor.set = set.baseMethod;
            }            
        }
        Object.defineProperty(this, key, baseDescriptor);
    });
    this.base(overrides);
    Reflect.ownKeys(props).forEach(key => {
        if (key in noProxyMethods) return;
        if (proxy.shouldProxy && !proxy.shouldProxy(key, proxy)) return;
        const descriptor = props[key];
        if (!descriptor.enumerable) return;
        let { value, get, set } = descriptor;        
        if ($isFunction(value)) {
            descriptor.value = proxyMethod(key, value, proxy);
        } else if (!(get || set)) {
            return;
        } else {
            if (get) {
                descriptor.get = proxyMethod(key, get, proxy, MethodType.Get);
            }
            if (set) {
                descriptor.set = proxyMethod(key, set, proxy, MethodType.Set);
            }
        }
        Object.defineProperty(this, key, descriptor);
    });
    return this;
}
