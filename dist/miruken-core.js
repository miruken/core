
/*
  base2 - copyright 2007-2009, Dean Edwards
  http://code.google.com/p/base2/
  http://www.opensource.org/licenses/mit-license.php

  Contributors:
    Doeke Zanstra
*/

// timestamp: Wed, 23 Sep 2009 19:38:55

base2 = {
  name:    "base2",
  version: "1.1 (alpha1)",
  exports:
    "Base,Package,Abstract,Module,Enumerable," +
    "Undefined,Null,This,True,False,assignID,global",
  namespace: ""
};

new function(_no_shrink_) { ///////////////  BEGIN: CLOSURE  ///////////////

// =========================================================================
// base2/header.js
// =========================================================================

/*@cc_on @*/

var Undefined = K(), Null = K(null), True = K(true), False = K(false), This = function(){return this};

var global = This(), base2 = global.base2;
   
// private
var _IGNORE  = K(),
    _FORMAT  = /%([1-9])/g,
    _LTRIM   = /^\s\s*/,
    _RTRIM   = /\s\s*$/,
    _RESCAPE = /([\/()[\]{}|*+-.,^$?\\])/g,     // safe regular expressions
    _BASE    = /\bbase\b/,
    _HIDDEN  = ["constructor", "toString"],     // only override these when prototyping
    _counter = 1,
    _slice   = Array.prototype.slice;

_Function_forEach(); // make sure this is initialised

function assignID(object, name) {
  // Assign a unique ID to an object.
  if (!name) name = object.nodeType == 1 ? "uniqueID" : "base2ID";
  if (!object[name]) object[name] = "b2_" + _counter++;
  return object[name];
};

// =========================================================================
// base2/Base.js
// =========================================================================

// http://dean.edwards.name/weblog/2006/03/base/

var _subclass = function(_instance, _static) {
  // Build the prototype.
  base2.__prototyping = this.prototype;
  var _prototype = new this;
  if (_instance) extend(_prototype, _instance);
  _prototype.base = function() {
    // call this method from any other method to invoke that method's ancestor
  };
  delete base2.__prototyping;
  
  // Create the wrapper for the constructor function.
  var _constructor = _prototype.constructor;
  function _class() {
    // Don't call the constructor function when prototyping.
    if (!base2.__prototyping) {
      if (this.constructor == _class || this.__constructing) {
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
  
  // introspection (removed when packed)
  ;;; _class["#implements"] = [];
  ;;; _class["#implemented_by"] = [];
  
  return _class;
};

var Base = _subclass.call(Object, {
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
      return "[object " + String2.slice(this.constructor, 1, -1) + "]";
    }
  }
}, Base = {
  ancestorOf: function(klass) {
    return _ancestorOf(this, klass);
  },

  extend: _subclass,

  forEach: function(object, block, context) {
    _Function_forEach(this, object, block, context);
  },

  implement: function(source) {
    if (typeof source == "function") {
      ;;; if (_ancestorOf(Base, source)) {
        // introspection (removed when packed)
        ;;; this["#implements"].push(source);
        ;;; source["#implemented_by"].push(this);
      ;;; }
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

var Package = Base.extend({
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
        pkg.namespace = format("var %1=%2;", pkg.name, String2.slice(pkg, 1, -1));
      }
    }
    
    if (_private) {
      _private.__package = this;
      _private.package = openPkg || this;
      // This next line gets round a bug in old Mozilla browsers
      var jsNamespace = base2.js ? base2.js.namespace : "";
      
      // This string should be evaluated immediately after creating a Package object.
      var namespace = "var base2=(function(){return this.base2})(),_private=base2.toString;" + base2.namespace + jsNamespace;
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
      var packageName = String2.slice(pkg, 1, -1);
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
        value.toString = K("[" + String2.slice(this, 1, -1) + "." + name + "]");
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
    return format("[%1]", this.parent ? String2.slice(this.parent, 1, -1) + "." + this.name : this.name);
  }
});

// =========================================================================
// base2/Abstract.js
// =========================================================================

// Not very exciting this.

var Abstract = Base.extend({
  constructor: function() {
    throw new TypeError("Abstract class cannot be instantiated.");
  }
});

// =========================================================================
// base2/Module.js
// =========================================================================

var _moduleCount = 0;

var Module = Abstract.extend(null, {
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

  forEach: function(block, context) {
    _Function_forEach (Module, this.prototype, function(method, name) {
      if (typeOf(method) == "function") {
        block.call(context, this[name], name, this);
      }
    }, this);
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
        ;;; proto[name]._module = module; // introspection
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
// base2/Enumerable.js
// =========================================================================

var Enumerable = Module.extend({
  every: function(object, test, context) {
    var result = true;
    try {
      forEach (object, function(value, key) {
        result = test.call(context, value, key, object);
        if (!result) throw StopIteration;
      });
    } catch (error) {
      if (error != StopIteration) throw error;
    }
    return !!result; // cast to boolean
  },
  
  filter: function(object, test, context) {
    var i = 0;
    return this.reduce(object, function(result, value, key) {
      if (test.call(context, value, key, object)) {
        result[i++] = value;
      }
      return result;
    }, []);
  },
  
  invoke: function(object, method) {
    // Apply a method to each item in the enumerated object.
    var args = _slice.call(arguments, 2);
    return this.map(object, typeof method == "function" ? function(item) {
      return item == null ? undefined : method.apply(item, args);
    } : function(item) {
      return item == null ? undefined : item[method].apply(item, args);
    });
  },
  
  map: function(object, block, context) {
    var result = [], i = 0;
    forEach (object, function(value, key) {
      result[i++] = block.call(context, value, key, object);
    });
    return result;
  },
  
  pluck: function(object, key) {
    return this.map(object, function(item) {
      return item == null ? undefined : item[key];
    });
  },
  
  reduce: function(object, block, result, context) {
    var initialised = arguments.length > 2;
    forEach (object, function(value, key) {
      if (initialised) { 
        result = block.call(context, result, value, key, object);
      } else { 
        result = value;
        initialised = true;
      }
    });
    return result;
  },
  
  some: function(object, test, context) {
    return !this.every(object, not(test), context);
  }
});

// =========================================================================
// lang/package.js
// =========================================================================

var lang = {
  name:      "lang",
  version:   base2.version,
  exports:   "assert,assertArity,assertType,bind,copy,extend,forEach,format,instanceOf,match,pcopy,rescape,trim,typeOf",
  namespace: "" // Fixed later.
};

// =========================================================================
// lang/assert.js
// =========================================================================

function assert(condition, message, ErrorClass) {
  if (!condition) {
    throw new (ErrorClass || Error)(message || "Assertion failed.");
  }
};

function assertArity(args, arity, message) {
  if (arity == null) arity = args.callee.length; //-@DRE
  if (args.length < arity) {
    throw new SyntaxError(message || "Not enough arguments.");
  }
};

function assertType(object, type, message) {
  if (type && (typeof type == "function" ? !instanceOf(object, type) : typeOf(object) != type)) {
    throw new TypeError(message || "Invalid type.");
  }
};

// =========================================================================
// lang/copy.js
// =========================================================================

function copy(object) { // A quick copy.
  var copy = {};
  for (var i in object) {
    copy[i] = object[i];
  }
  return copy;
};

function pcopy(object) { // Prototype-base copy.
  // Doug Crockford / Richard Cornford
  _dummy.prototype = object;
  return new _dummy;
};

function _dummy(){};

// =========================================================================
// lang/extend.js
// =========================================================================

function extend(object, source) { // or extend(object, key, value)
  if (object && source) {
    var useProto = base2.__prototyping;
    if (arguments.length > 2) { // Extending with a key/value pair.
      var key = source;
      source = {};
      source[key] = arguments[2];
      useProto = true;
    }
    //var proto = (typeof source == "function" ? Function : Object).prototype;
    var proto = global[(typeof source == "function" ? "Function" : "Object")].prototype;
    // Add constructor, toString etc
    if (useProto) {
      var i = _HIDDEN.length, key;
      while ((key = _HIDDEN[--i])) {
        var desc = _getPropertyDescriptor(source, key);
        if (desc.value != proto[key]) {
          desc = _override(object, key, desc);
          if (desc) Object.defineProperty(object, key, desc);
        }
      }
    }
    // Copy each of the source object's properties to the target object.
    for (key in source) {
      if (typeof proto[key] == "undefined" && key !== "base") {
        var desc = _getPropertyDescriptor(source, key);
        desc = _override(object, key, desc);
        if (desc) Object.defineProperty(object, key, desc);
      }
    }
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

function _override(object, name, desc) {
  var value = desc.value;
  if (value === _IGNORE) return;
  if ((typeof value !== "function") && ("value" in desc)) {
    return desc;
  }
  var ancestor = _getPropertyDescriptor(object, name);
  if (!ancestor) return desc;
  var superObject = base2.__prototyping; // late binding for prototypes;
  if (superObject) {
    var sprop = _getPropertyDescriptor(superObject, name);
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
              method = (superObject && superObject[name]) || avalue;
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
              get = (superObject && _getPropertyDescriptor(superObject, name).get) || aget;
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
      var get = _getPropertyDescriptor(superObject, name).get;
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
              set = (superObject && _getPropertyDescriptor(superObject, name).set) || aset;
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
      var set = _getPropertyDescriptor(superObject, name).set;
      return set.apply(this, arguments);
    };      
  } else {
    desc.set = aset;
  }
  return desc;
};
    
function _getPropertyDescriptor(object, key) {
    var source = object, descriptor;
    while (source && !(
        descriptor = Object.getOwnPropertyDescriptor(source, key))
        ) source = Object.getPrototypeOf(source);
    return descriptor;
}

// =========================================================================
// lang/forEach.js
// =========================================================================

// http://dean.edwards.name/weblog/2006/07/enum/

if (typeof StopIteration == "undefined") {
  StopIteration = new Error("StopIteration");
}

function forEach(object, block, context, fn) {
  if (object == null) return;
  if (!fn) {
    if (typeof object == "function" && object.call) {
      // Functions are a special case.
      fn = Function;
    } else if (typeof object.forEach == "function" && object.forEach != forEach) {
      // The object implements a custom forEach method.
      object.forEach(block, context);
      return;
    } else if (typeof object.length == "number") {
      // The object is array-like.
      _Array_forEach(object, block, context);
      return;
    }
  }
  _Function_forEach(fn || Object, object, block, context);
};

forEach.csv = function(string, block, context) {
  forEach (csv(string), block, context);
};

// These are the two core enumeration methods. All other forEach methods
//  eventually call one of these two.

function _Array_forEach(array, block, context) {
  if (array == null) array = global;
  var length = array.length || 0, i; // preserve length
  if (typeof array == "string") {
    for (i = 0; i < length; i++) {
      block.call(context, array.charAt(i), i, array);
    }
  } else { // Cater for sparse arrays.
    for (i = 0; i < length; i++) {
    /*@if (@_jscript_version < 5.2)
      if (array[i] !== undefined && $Legacy.has(array, i))
    @else @*/
      if (i in array)
    /*@end @*/
        block.call(context, array[i], i, array);
    }
  }
};

function _Function_forEach(fn, object, block, context) {
  // http://code.google.com/p/base2/issues/detail?id=10
  // Run the test for Safari's buggy enumeration.
  var Temp = function(){this.i=1};
  Temp.prototype = {i:1};
  var count = 0;
  for (var i in new Temp) count++;

  // Overwrite the main function the first time it is called.
  _Function_forEach = count > 1 ? function(fn, object, block, context) {
    // Safari fix (pre version 3)
    var processed = {};
    for (var key in object) {
      if (!processed[key] && fn.prototype[key] === undefined) {
        processed[key] = true;
        block.call(context, object[key], key, object);
      }
    }
  } : function(fn, object, block, context) {
    // Enumerate an object and compare its keys with fn's prototype.
    for (var key in object) {
      if (typeof fn.prototype[key] == "undefined") {
        block.call(context, object[key], key, object);
      }
    }
  };

  _Function_forEach(fn, object, block, context);
};

// =========================================================================
// lang/instanceOf.js
// =========================================================================

function instanceOf(object, klass) {
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

function typeOf(object) {
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

// =========================================================================
// js/package.js
// =========================================================================

var js = {
  name:      "js",
  version:   base2.version,
  exports:   "Array2,Date2,Function2,String2",
  namespace: "", // fixed later
  
  bind: function(host) {
    var top = global;
    global = host;
    forEach.csv(this.exports, function(name2) {
      var name = name2.slice(0, -1);
      extend(host[name], this[name2]);
      this[name2](host[name].prototype); // cast
    }, this);
    global = top;
    return host;
  }
};

function _createObject2(Native, constructor, generics, extensions) {
  // Clone native objects and extend them.

  // Create a Module that will contain all the new methods.
  var INative = Module.extend();
  var id = INative.toString().slice(1, -1);
  // http://developer.mozilla.org/en/docs/New_in_JavaScript_1.6#Array_and_String_generics
  forEach.csv(generics, function(name) {
    INative[name] = unbind(Native.prototype[name]);
    INative.namespace += format("var %1=%2.%1;", name, id);
  });
  forEach (_slice.call(arguments, 3), INative.implement, INative);

  // create a faux constructor that augments the native object
  var Native2 = function() {
    return INative(this.constructor == INative ? constructor.apply(null, arguments) : arguments[0]);
  };
  Native2.prototype = INative.prototype;

  // Remove methods that are already implemented.
  for (var name in INative) {
    var method = Native[name];
    if (method && name != "prototype" && name != "toString" && method != Function.prototype[name]) {
      INative[name] = method;
      delete INative.prototype[name];
    }
    Native2[name] = INative[name];
  }
  Native2.ancestor = Object;
  delete Native2.extend;
  
  // remove "lang.bind.."
  Native2.namespace = Native2.namespace.replace(/(var (\w+)=)[^,;]+,([^\)]+)\)/g, "$1$3.$2");
  
  return Native2;
};

// =========================================================================
// js/~/Date.js
// =========================================================================

// Fix Date.get/setYear() (IE5-7)

if ((new Date).getYear() > 1900) {
  Date.prototype.getYear = function() {
    return this.getFullYear() - 1900;
  };
  Date.prototype.setYear = function(year) {
    return this.setFullYear(year + 1900);
  };
}

// https://bugs.webkit.org/show_bug.cgi?id=9532

var _testDate = new Date(Date.UTC(2006, 1, 20));
_testDate.setUTCDate(15);
if (_testDate.getUTCHours() != 0) {
  forEach.csv("FullYear,Month,Date,Hours,Minutes,Seconds,Milliseconds", function(type) {
    extend(Date.prototype, "setUTC" + type, function() {
      var value = this.base.apply(this, arguments);
      if (value >= 57722401000) {
        value -= 3600000;
        this.setTime(value);
      }
      return value;
    });
  });
}

// =========================================================================
// js/~/Function.js
// =========================================================================

// Some browsers don't define this.
Function.prototype.prototype = {};

// =========================================================================
// js/~/String.js
// =========================================================================

// A KHTML bug.
if ("".replace(/^/, K("$$")) == "$") {
  extend(String.prototype, "replace", function(expression, replacement) {
    if (typeof replacement == "function") {
      var fn = replacement;
      replacement = function() {
        return String(fn.apply(null, arguments)).split("$").join("$$");
      };
    }
    return this.base(expression, replacement);
  });
}

// =========================================================================
// js/Array2.js
// =========================================================================

var Array2 = _createObject2(
  Array,
  Array,
  "concat,join,pop,push,reverse,shift,slice,sort,splice,unshift", // generics
  Enumerable, {
    batch: function(array, block, timeout, oncomplete, context) {
      var index = 0,
          length = array.length;
      var batch = function() {
        var now = Date2.now(), start = now, k = 0;
        while (index < length && (now - start < timeout)) {
          block.call(context, array[index], index++, array);
          if (k++ < 5 || k % 50 == 0) now = Date2.now();
        }
        if (index < length) {
          setTimeout(batch, 10);
        } else {
          if (oncomplete) oncomplete.call(context);
        }
      };
      setTimeout(batch, 1);
    },

    combine: function(keys, values) {
      // Combine two arrays to make a hash.
      if (!values) values = keys;
      return Array2.reduce(keys, function(hash, key, index) {
        hash[key] = values[index];
        return hash;
      }, {});
    },

    contains: function(array, item) {
      return Array2.indexOf(array, item) != -1;
    },

    copy: function(array) {
      var copy = _slice.call(array);
      if (!copy.swap) Array2(copy); // cast to Array2
      return copy;
    },

    flatten: function(array) {
      var i = 0;
      var flatten = function(result, item) {
        if (Array2.like(item)) {
          Array2.reduce(item, flatten, result);
        } else {
          result[i++] = item;
        }
        return result;
      };
      return Array2.reduce(array, flatten, []);
    },
    
    forEach: _Array_forEach,
    
    indexOf: function(array, item, fromIndex) {
      var length = array.length;
      if (fromIndex == null) {
        fromIndex = 0;
      } else if (fromIndex < 0) {
        fromIndex = Math.max(0, length + fromIndex);
      }
      for (var i = fromIndex; i < length; i++) {
        if (array[i] === item) return i;
      }
      return -1;
    },
    
    insertAt: function(array, index, item) {
      Array2.splice(array, index, 0, item);
    },
    
    item: function(array, index) {
      if (index < 0) index += array.length; // starting from the end
      return array[index];
    },
    
    lastIndexOf: function(array, item, fromIndex) {
      var length = array.length;
      if (fromIndex == null) {
        fromIndex = length - 1;
      } else if (fromIndex < 0) {
        fromIndex = Math.max(0, length + fromIndex);
      }
      for (var i = fromIndex; i >= 0; i--) {
        if (array[i] === item) return i;
      }
      return -1;
    },
  
    map: function(array, block, context) {
      var result = [];
      _Array_forEach (array, function(item, index) {
        result[index] = block.call(context, item, index, array);
      });
      return result;
    },

    remove: function(array, item) {
      var index = Array2.indexOf(array, item);
      if (index != -1) Array2.removeAt(array, index);
    },

    removeAt: function(array, index) {
      Array2.splice(array, index, 1);
    },

    swap: function(array, index1, index2) {
      if (index1 < 0) index1 += array.length; // starting from the end
      if (index2 < 0) index2 += array.length;
      var temp = array[index1];
      array[index1] = array[index2];
      array[index2] = temp;
      return array;
    }
  }
);

Array2.forEach = _Array_forEach;
Array2.reduce = Enumerable.reduce; // Mozilla does not implement the thisObj argument

Array2.like = function(object) {
  // is the object like an array?
  return typeOf(object) == "object" && typeof object.length == "number";
};

// introspection (removed when packed)
;;; Enumerable["#implemented_by"].pop();
;;; Enumerable["#implemented_by"].push(Array2);

// =========================================================================
// js/Date2.js
// =========================================================================

// http://developer.mozilla.org/es4/proposals/date_and_time.html

// big, ugly, regular expression
var _DATE_PATTERN = /^((-\d+|\d{4,})(-(\d{2})(-(\d{2}))?)?)?T((\d{2})(:(\d{2})(:(\d{2})(\.(\d{1,3})(\d)?\d*)?)?)?)?(([+-])(\d{2})(:(\d{2}))?|Z)?$/;
var _DATE_PARTS = { // indexes to the sub-expressions of the RegExp above
  FullYear: 2,
  Month: 4,
  Date: 6,
  Hours: 8,
  Minutes: 10,
  Seconds: 12,
  Milliseconds: 14
};
var _TIMEZONE_PARTS = { // idem, but without the getter/setter usage on Date object
  Hectomicroseconds: 15, // :-P
  UTC: 16,
  Sign: 17,
  Hours: 18,
  Minutes: 20
};

//var _TRIM_ZEROES   = /(((00)?:0+)?:0+)?\.0+$/;
//var _TRIM_TIMEZONE = /(T[0-9:.]+)$/;

var Date2 = _createObject2(
  Date, 
  function(yy, mm, dd, h, m, s, ms) {
    switch (arguments.length) {
      case 0: return new Date;
      case 1: return typeof yy == "string" ? new Date(Date2.parse(yy)) : new Date(yy.valueOf());
      default: return new Date(yy, mm, arguments.length == 2 ? 1 : dd, h || 0, m || 0, s || 0, ms || 0);
    }
  }, "", {
    toISOString: function(date) {
      var string = "####-##-##T##:##:##.###";
      for (var part in _DATE_PARTS) {
        string = string.replace(/#+/, function(digits) {
          var value = date["getUTC" + part]();
          if (part == "Month") value++; // js month starts at zero
          return ("000" + value).slice(-digits.length); // pad
        });
      }
      //// remove trailing zeroes, and remove UTC timezone, when time's absent
      //return string.replace(_TRIM_ZEROES, "").replace(_TRIM_TIMEZONE, "$1Z");
      return string + "Z";
    }
  }
);

delete Date2.forEach;

Date2.now = function() {
  return (new Date).valueOf(); // milliseconds since the epoch
};

Date2.parse = function(string, defaultDate) {
  if (arguments.length > 1) {
    assertType(defaultDate, "number", "Default date should be of type 'number'.")
  }
  // parse ISO date
  var parts = match(string, _DATE_PATTERN);
  if (parts.length) {
    var month = parts[_DATE_PARTS.Month];
    if (month) parts[_DATE_PARTS.Month] = String(month - 1); // js months start at zero
    // round milliseconds on 3 digits
    if (parts[_TIMEZONE_PARTS.Hectomicroseconds] >= 5) parts[_DATE_PARTS.Milliseconds]++;
    var utc = parts[_TIMEZONE_PARTS.UTC] || parts[_TIMEZONE_PARTS.Hours] ? "UTC" : "";
    var date = new Date(defaultDate || 0);
    if (parts[_DATE_PARTS.Date]) date["set" + utc + "Date"](14);
    for (var part in _DATE_PARTS) {
      var value = parts[_DATE_PARTS[part]];
      if (value) {
        // set a date part
        date["set" + utc + part](value);
        // make sure that this setting does not overflow
        if (date["get" + utc + part]() != parts[_DATE_PARTS[part]]) {
          return NaN;
        }
      }
    }
    // timezone can be set, without time being available
    // without a timezone, local timezone is respected
    if (parts[_TIMEZONE_PARTS.Hours]) {
      var hours = Number(parts[_TIMEZONE_PARTS.Sign] + parts[_TIMEZONE_PARTS.Hours]);
      var minutes = Number(parts[_TIMEZONE_PARTS.Sign] + (parts[_TIMEZONE_PARTS.Minutes] || 0));
      date.setUTCMinutes(date.getUTCMinutes() + (hours * 60) + minutes);
    }
    return date.valueOf();
  } else {
    return Date.parse(string);
  }
};

// =========================================================================
// js/String2.js
// =========================================================================

var String2 = _createObject2(
  String, 
  function(string) {
    return new String(arguments.length == 0 ? "" : string);
  },
  "charAt,charCodeAt,concat,indexOf,lastIndexOf,match,replace,search,slice,split,substr,substring,toLowerCase,toUpperCase",
  {
    csv: csv,
    format: format,
    rescape: rescape,
    trim: trim
  }
);

delete String2.forEach;

// http://blog.stevenlevithan.com/archives/faster-trim-javascript
function trim(string) {
  return String(string).replace(_LTRIM, "").replace(_RTRIM, "");
};

function csv(string) {
  return string ? (string + "").split(/\s*,\s*/) : [];
};

function format(string) {
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

function match(string, expression) {
  // Same as String.match() except that this function will return an
  // empty array if there is no match.
  return (string + "").match(expression) || [];
};

function rescape(string) {
  // Make a string safe for creating a RegExp.
  return (string + "").replace(_RESCAPE, "\\$1");
};

// =========================================================================
// js/Function2.js
// =========================================================================

var Function2 = _createObject2(
  Function,
  Function,
  "", {
    I: I,
    II: II,
    K: K,
    bind: bind,
    compose: compose,
    delegate: delegate,
    flip: flip,
    not: not,
    partial: partial,
    unbind: unbind
  }
);

function I(i) { // Return first argument.
  return i;
};

function II(i, ii) { // Return second argument.
  return ii;
};

function K(k) {
  return function() {
    return k;
  };
};

function bind(fn, context) {
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

function compose() {
  var fns = _slice.call(arguments);
  return function() {
    var i = fns.length, result = fns[--i].apply(this, arguments);
    while (i--) result = fns[i].call(this, result);
    return result;
  };
};

function delegate(fn, context) {
  return function() {
    var args = _slice.call(arguments);
    args.unshift(this);
    return fn.apply(context, args);
  };
};

function flip(fn) {
  return function() {
    return fn.apply(this, Array2.swap(arguments, 0, 1));
  };
};

function not(fn) {
  return function() {
    return !fn.apply(this, arguments);
  };
};

function partial(fn) { // Based on Oliver Steele's version.
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

function unbind(fn) {
  return function(context) {
    return fn.apply(context, _slice.call(arguments, 1));
  };
};

// =========================================================================
// base2/init.js
// =========================================================================

base2 = global.base2 = new Package(this, base2);
base2.toString = K("[base2]"); // hide private data here

var _exports = this.exports;

lang = new Package(this, lang);
_exports += this.exports;

js = new Package(this, js);
eval(_exports + this.exports);

lang.extend = extend;

// legacy support
base2.JavaScript = pcopy(js);
base2.JavaScript.namespace += "var JavaScript=js;";

// Node.js support
if (typeof exports !== 'undefined') {
  if (typeof module !== 'undefined' && module.exports) {
    exports = module.exports = base2;
  }
  exports.base2 = base2;
} 

}; ////////////////////  END: CLOSURE  /////////////////////////////////////

require('./base2.js');
var Promise = require('bluebird');

new function () { // closure

    /**
     * Package containing enhancements to the javascript language.
     * @module miruken
     * @namespace miruken
     * @main miruken
     * @class $
     */
    base2.package(this, {
        name:    "miruken",
        version: "0.0.84",
        exports: "Enum,Flags,Variance,Protocol,StrictProtocol,Delegate,Miruken,MetaStep,MetaMacro," +
                 "Initializing,Disposing,DisposingMixin,Resolving,Invoking,Parenting,Starting,Startup," +
                 "Facet,Interceptor,InterceptorSelector,ProxyBuilder,Modifier,ArrayManager,IndexedList," +
                 "$isProtocol,$isClass,$classOf,$ancestorOf,$isString,$isFunction,$isObject,$isArray," +
                 "$isPromise,$isNothing,$isSomething,$using,$lift,$equals,$decorator,$decorate,$decorated," +
                 "$debounce,$eq,$use,$copy,$lazy,$eval,$every,$child,$optional,$promise,$instant," +
                 "$createModifier,$properties,$inferProperties,$inheritStatic"
    });

    eval(this.imports);

    /**
     * Annotates invariance.
     * @attribute $eq
     * @for miruken.Modifier
     */
    var $eq = $createModifier();
    /**
     * Annotates use value as is.
     * @attribute $use
     * @for miruken.Modifier
     */    
    var $use = $createModifier();
    /**
     * Annotates copy semantics.
     * @attribute $copy
     * @for miruken.Modifier
     */        
    var $copy = $createModifier();
    /**
     * Annotates lazy semantics.
     * @attribute $lazy
     * @for miruken.Modifier
     */            
    var $lazy = $createModifier();
    /**
     * Annotates function to be evaluated.
     * @attribute $eval
     * @for miruken.Modifier
     */                
    var $eval = $createModifier();
    /**
     * Annotates zero or more semantics.
     * @attribute $every
     * @for miruken.Modifier
     */                    
    var $every = $createModifier();
    /**
     * Annotates 
     * @attribute use {{#crossLink "miruken.Parenting"}}{{/crossLink}} protocol.
     * @attribute $child
     * @for miruken.Modifier
     */                        
    var $child  = $createModifier();
    /**
     * Annotates optional semantics.
     * @attribute $optional
     * @for miruken.Modifier
     */                        
    var $optional = $createModifier();
    /**
     * Annotates Promise expectation.
     * @attribute $promise
     * @for miruken.Modifier
     */                            
    var $promise = $createModifier();
    /**
     * Annotates synchronous.
     * @attribute $instant
     * @for miruken.Modifier
     */                                
    var $instant = $createModifier();
    
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
    var Enum = Base.extend({
        constructor: function (value, name, ordinal) {
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
        toString: function () { return this.name; },
        constructing: function (value, name) {
            if (!this.constructor.__defining) {
                throw new TypeError("Enums cannot be instantiated.");
            }            
        }
    }, {
        coerce: function _(choices, behavior) {
            if (this !== Enum && this !== Flags) {
                return;
            }
            var en = this.extend(behavior, {
                coerce: function _(value) {
                    return this.fromValue(value);
                }
            });
            en.__defining = true;
            var items     = [], ordinal = 0;
            en.names      = Object.freeze(Object.keys(choices));
            for (var choice in choices) {
                var item = en[choice] = new en(choices[choice], choice, ordinal++);
                items.push(item);
            }
            en.items     = Object.freeze(items);
            en.fromValue = this.fromValue;
            delete en.__defining;
            return Object.freeze(en);
        },
        fromValue: function (value) {
            var names = this.names;
            for (var i = 0; i < names.length; ++i) {
                var e = this[names[i]];
                if (e.value == value) {
                    return e;
                }
            }
            throw new TypeError(format("%1 is not a valid value for this Enum.", value));
        }
    });
    Enum.prototype.valueOf = function () {
        var value = +this.value;
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
    var Flags = Enum.extend({
        hasFlag: function (flag) {
            flag = +flag;
            return (this & flag) === flag;
        },
        addFlag: function (flag) {
            return $isSomething(flag)
                 ? this.constructor.fromValue(this | flag)
                 : this;
        },
        removeFlag: function (flag) {
            return $isSomething(flag)
                 ? this.constructor.fromValue(this & (~flag))
                 : this;
        },
        constructing: function (value, name) {}        
    }, {
        fromValue: function (value) {
            value = +value;
            var name, names = this.names;
            for (var i = 0; i < names.length; ++i) {
                var flag = this[names[i]];
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
     * Variance enum
     * @class Variance
     * @extends miruken.Enum
     */
    var Variance = Enum({
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
     * Declares methods and properties independent of a class.
     * <pre>
     *    var Auditing = Protocol.extend({
     *        $properties: {
     *            level: undefined
     *        },
     *        record: function (activity) {}
     *    })
     * </pre>
     * @class Protocol
     * @constructor
     * @param   {miruken.Delegate}  delegate        -  delegate
     * @param   {boolean}           [strict=false]  -  true if strict, false otherwise
     * @extends Base
     */
    var Protocol = Base.extend({
        constructor: function (delegate, strict) {
            if ($isNothing(delegate)) {
                delegate = new Delegate;
            } else if ((delegate instanceof Delegate) === false) {
                if ($isFunction(delegate.toDelegate)) {
                    delegate = delegate.toDelegate();
                    if ((delegate instanceof Delegate) === false) {
                        throw new TypeError(format(
                            "Invalid delegate: %1 is not a Delegate nor does it have a 'toDelegate' method that returned one.", delegate));
                    }
                } else if ($isArray(delegate)) {
                    delegate = new ArrayDelegate(delegate);
                } else {
                    delegate = new ObjectDelegate(delegate);
                }
            }
            Object.defineProperty(this, 'delegate', { value: delegate });
            Object.defineProperty(this, 'strict', { value: !!strict });
        },
        __get: function (propertyName) {
            var delegate = this.delegate;
            return delegate && delegate.get(this.constructor, propertyName, this.strict);
        },
        __set: function (propertyName, propertyValue) {
            var delegate = this.delegate;            
            return delegate && delegate.set(this.constructor, propertyName, propertyValue, this.strict);
        },
        __invoke: function (methodName, args) {
            var delegate = this.delegate;                        
            return delegate && delegate.invoke(this.constructor, methodName, args, this.strict);
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
        isProtocol: function (target) {
            return target && (target.prototype instanceof Protocol);
        },
        /**
         * Determines if the target conforms to this protocol.
         * @static
         * @method conformsTo
         * @param   {Any}      target    -  target to test
         * @returns {boolean}  true if the target conforms to this protocol.
         */
        adoptedBy: function (target) {
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
        coerce: function (object, strict) { return new this(object, strict); }
    });

    /**
     * MetaStep enum
     * @class MetaStep
     * @extends Enum
     */
    var MetaStep = Enum({
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
    var MetaMacro = Base.extend({
        /**
         * Inflates the macro for the given step.
         * @method inflate
         * @param  {miruken.MetaStep}  step        -  meta step
         * @param  {miruken.MetaBase}  metadata    -  source metadata
         * @param  {Object}            target      -  target macro applied to
         * @param  {Object}            definition  -  updates to apply
         * @param  {Function}          expand      -  expanded definition
         */
        inflate: function (step, metadata, target, definition, expand) {},
        /**
         * Execite the macro for the given step.
         * @method execute
         * @param  {miruken.MetaStep}  step        -  meta step
         * @param  {miruken.MetaBase}  metadata    -  effective metadata
         * @param  {Object}            target      -  target macro applied to
         * @param  {Object}            definition  -  source to apply
         */
        execute: function (step, metadata, target, definition) {},
        /**
         * Triggered when a protocol is added to metadata.
         * @method protocolAdded
         * @param {miruken.MetaBase}  metadata  -  effective metadata
         * @param {miruken.Protocol}  protocol  -  protocol added
         */
        protocolAdded: function (metadata, protocol) {},
        /**
         * Extracts the property and evaluate it if a function.
         * @method extractProperty
         * @param    {string}  property  -  property name
         * @param    {Object}  target    -  owning target
         * @param    {Object}  source    -  definition source
         * @returns  {Any} property value.
         */                
        extractProperty: function (property, target, source) {
            var value = source[property];
            if ($isFunction(value)) {
                value = value();
            }
            delete target[property];            
            return value;
        },        
        /**
         * Determines if the macro should be inherited
         * @method shouldInherit
         * @returns {boolean} false
         */
        shouldInherit: False,
        /**
         * Determines if the macro should be applied on extension.
         * @method isActive
         * @returns {boolean} false
         */
        isActive: False
    }, {
        coerce: function () { return this.new.apply(this, arguments); }
    });

    /**
     * Base class for all metadata.
     * @class MetaBase
     * @constructor
     * @param  {miruken.MetaBase}  [parent]  - parent meta-data
     * @extends miruken.MetaMacro
     */
    var MetaBase = MetaMacro.extend({
        constructor: function (parent)  {
            var _protocols = [], _descriptors;
            this.extend({
                /**
                 * Gets the parent metadata.
                 * @method getParent
                 * @returns {miruken.MetaBase} parent metadata if present.
                 */
                getParent: function () { return parent; },
                /**
                 * Gets the declared protocols.
                 * @method getProtocols
                 * @returns {Array} declared protocols.
                 */
                getProtocols: function () { return _protocols.slice(0) },
                /**
                 * Gets all conforming protocools.
                 * @method getAllProtocols
                 * @returns {Array} conforming protocols.
                 */
                getAllProtocols: function () {
                    var protocols = this.getProtocols(),
                        inner     = protocols.slice(0);
                    for (var i = 0; i < inner.length; ++i) {
                        var innerProtocols = inner[i].$meta.getAllProtocols();
                        for (var ii = 0; ii < innerProtocols.length; ++ii) {
                            var protocol = innerProtocols[ii];
                            if (protocols.indexOf(protocol) < 0) {
                                protocols.push(protocol);
                            }
                        } 
                    }
                    return protocols;
                },
                /**
                 * Adds one or more protocols to the metadata.
                 * @method addProtocol
                 * @param  {Array}  protocols  -  protocols to add
                 */
                addProtocol: function (protocols) {
                    if ($isNothing(protocols)) {
                        return;
                    }
                    if (!$isArray(protocols)) {
                        protocols = Array.prototype.slice.call(arguments);
                    }
                    for (var i = 0; i < protocols.length; ++i) {
                        var protocol = protocols[i];
                        if ((protocol.prototype instanceof Protocol) 
                        &&  (_protocols.indexOf(protocol) === -1)) {
                            _protocols.push(protocol);
                            this.protocolAdded(this, protocol);
                        }
                    }
                },
                protocolAdded: function (metadata, protocol) {
                    if (parent) {
                        parent.protocolAdded(metadata, protocol);
                    }
                },
                /**
                 * Determines if the metadata conforms to the protocol.
                 * @method conformsTo
                 * @param  {miruken.Protocol}   protocol -  protocols to test
                 * @returns {boolean}  true if the metadata includes the protocol.
                 */
                conformsTo: function (protocol) {
                    if (!(protocol && (protocol.prototype instanceof Protocol))) {
                        return false;
                    }
                    for (var index = 0; index < _protocols.length; ++index) {
                        var proto = _protocols[index];
                        if (protocol === proto || proto.conformsTo(protocol)) {
                            return true;
                        }
                    }
                    return false;
                },
                inflate: function (step, metadata, target, definition, expand) {
                    if (parent) {
                        parent.inflate(step, metadata, target, definition, expand);
                    } else if ($properties) {
                        $properties.shared.inflate(step, metadata, target, definition, expand)
                    }
                },
                execute: function (step, metadata, target, definition) {
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
                defineProperty: function(target, name, spec, descriptor) {
                    if (descriptor) {
                        descriptor = copy(descriptor);
                    }
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
                getDescriptor: function (filter) {
                    var descriptors;
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
                        for (var key in _descriptors) {
                            var descriptor = _descriptors[key];
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
                addDescriptor: function (name, descriptor) {
                    _descriptors = extend(_descriptors || {}, name, descriptor);
                    return this;
                },
                /**
                 * Determines if the property descriptor matches the filter.
                 * @method matchDescriptor
                 * @param    {Object}   descriptor  -  property descriptor
                 * @param    {Object}   filter      -  matching filter
                 * @returns  {boolean} true if the descriptor matches, false otherwise.
                 */
                matchDescriptor: function (descriptor, filter) {
                    if (typeOf(descriptor) !== 'object' || typeOf(filter) !== 'object') {
                        return false;
                    }
                    for (var key in filter) {
                        var match = filter[key];
                        if (match === undefined) {
                            if (!(key in descriptor)) {
                                return false;
                            }
                        } else {
                            var value = descriptor[key];
                            if ($isArray(match)) {
                                if (!($isArray(value))) {
                                    return false;
                                }
                                for (var i = 0; i < match.length; ++i) {
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
                 * Binds a method to the parent if not present.
                 * @method linkBase
                 * @param    {Function}  method  -  method name
                 * @returns  {miruken.MetaBase} current metadata.
                 * @chainable
                 */
                linkBase: function (method) {
                    if (!this[method]) {
                        this.extend(method, function () {
                            var baseMethod = parent && parent[method];
                            if (baseMethod) {
                                return baseMethod.apply(parent, arguments);
                            }
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
    var ClassMeta = MetaBase.extend({
        constructor: function(baseMeta, subClass, protocols, macros)  {
            var _macros     = macros && macros.slice(0),
                _isProtocol = (subClass === Protocol)
                           || (subClass.prototype instanceof Protocol);
            this.base(baseMeta);
            this.extend({
                /**
                 * Gets the associated class.
                 * @method getClass
                 * @returns  {Function} class.
                 */                                
                getClass: function () { return subClass; },
                /**
                 * Determines if the meta-data represents a protocol.
                 * @method isProtocol
                 * @returns  {boolean} true if a protocol, false otherwise.
                 */                                
                isProtocol: function () { return _isProtocol; },
                getAllProtocols: function () {
                    var protocols = this.base();
                    if (!_isProtocol && baseMeta) {
                        var baseProtocols = baseMeta.getAllProtocols();
                        for (var i = 0; i < baseProtocols.length; ++i) {
                            var protocol = baseProtocols[i];
                            if (protocols.indexOf(protocol) < 0) {
                                protocols.push(protocol);
                            }
                        }
                    }
                    return protocols;
                },
                protocolAdded: function (metadata, protocol) {
                    this.base(metadata, protocol);
                    if (!_macros || _macros.length == 0) {
                        return;
                    }
                    for (var i = 0; i < _macros.length; ++i) {
                        macro = _macros[i];
                        if ($isFunction(macro.protocolAdded)) {
                            macro.protocolAdded(metadata, protocol);
                        }
                    }
                },
                conformsTo: function (protocol) {
                    if (!(protocol && (protocol.prototype instanceof Protocol))) {
                        return false;
                    } else if ((protocol === subClass) || (subClass.prototype instanceof protocol)) {
                        return true;
                    }
                    return this.base(protocol) ||
                        !!(baseMeta && baseMeta.conformsTo(protocol));
                },
                inflate: function (step, metadata, target, definition, expand) {
                    this.base(step, metadata, target, definition, expand);
                    if (!_macros || _macros.length == 0) {
                        return;
                    }
                    var active = (step !== MetaStep.Subclass);
                    for (var i = 0; i < _macros.length; ++i) {
                        var macro = _macros[i];
                        if ($isFunction(macro.inflate) &&
                            (!active || macro.isActive()) && macro.shouldInherit()) {
                            macro.inflate(step, metadata, target, definition, expand);
                        }
                    }                    
                },
                execute: function (step, metadata, target, definition) {
                    this.base(step, metadata, target, definition);
                    if (!_macros || _macros.length == 0) {
                        return;
                    }
                    var inherit = (this !== metadata),
                        active  = (step !== MetaStep.Subclass);
                    for (var i = 0; i < _macros.length; ++i) {
                        var macro = _macros[i];
                        if ((!active  || macro.isActive()) &&
                            (!inherit || macro.shouldInherit())) {
                            macro.execute(step, metadata, target, definition);
                        }
                    }
                },
                /**
                 * Creates a sub-class from the current class metadata.
                 * @method createSubclass
                 * @returns  {Function} the newly created class function.
                 */                                                                
                createSubclass: function _() {
                    var args = Array.prototype.slice.call(arguments),
                        constraints = args, protocols, mixins, macros;
                    if (subClass.prototype instanceof Protocol) {
                        (protocols = []).push(subClass);
                    }
                    if (args.length > 0 && $isArray(args[0])) {
                        constraints = args.shift();
                    }
                    while (constraints.length > 0) {
                        var constraint = constraints[0];
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
                    var empty        = _.u  || (_.u = {}),
                        classSpec    = _.cm || (_.cm = {
                            enumerable:   false,
                            configurable: false,
                            writable:     false,
                        }),
                        instanceSpec = _.im || (_.im = {
                            enumerable:   false,
                            configurable: false,
                            get:          ClassMeta.createInstanceMeta
                        }),
                        instanceDef  = args.shift() || empty,
                        staticDef    = args.shift() || empty;
                    this.inflate(MetaStep.Subclass, this, subClass.prototype, instanceDef, expand);
                    if (macros) {
                        for (var i = 0; i < macros.length; ++i) {
                            macros[i].inflate(MetaStep.Subclass, this, subClass.prototype, instanceDef, expand);
                        }
                    }
                    instanceDef  = expand.x || instanceDef;
                    var derived  = ClassMeta.baseExtend.call(subClass, instanceDef, staticDef),
                        metadata = new ClassMeta(this, derived, protocols, macros);
                    classSpec.value = metadata;
                    Object.defineProperty(derived, '$meta', classSpec);
                    Object.defineProperty(derived.prototype, '$meta', instanceSpec);
                    delete classSpec.value;
                    derived.conformsTo = metadata.conformsTo.bind(metadata);
                    metadata.execute(MetaStep.Subclass, metadata, derived.prototype, instanceDef);
                    if (mixins) {
                        Array2.forEach(mixins, derived.implement, derived);
                    }
                    function expand() {
                        return expand.x || (expand.x = Object.create(instanceDef));
                    }   
                    return derived;                    
                },
                /**
                 * Embellishes the class represented by this metadata.
                 * @method embellishClass
                 * @param   {Any} source  -  class function or object literal
                 * @returns {Function} the underlying class.
                 */
                embellishClass: function (source) {
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
        init: function () {
            this.baseExtend    = Base.extend;
            this.baseImplement = Base.implement;
            Base.$meta         = new this(undefined, Base);
            Abstract.$meta     = new this(Base.$meta, Abstract);            
            Base.extend = Abstract.extend = function () {
                return this.$meta.createSubclass.apply(this.$meta, arguments);
            };
            Base.implement = Abstract.implement = function () {
                return this.$meta.embellishClass.apply(this.$meta, arguments);                
            }
            Base.prototype.conformsTo = function (protocol) {
                return this.constructor.$meta.conformsTo(protocol);
            };
        },
        createInstanceMeta: function _(parent) {
            var spec = _.spec || (_.spec = {
                enumerable:   false,
                configurable: true,
                writable:     false
            });
            var metadata = new InstanceMeta(parent || this.constructor.$meta);
            spec.value = metadata;
            Object.defineProperty(this, '$meta', spec);
            delete spec.value;
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
    var InstanceMeta = MetaBase.extend({
        constructor: function (classMeta) {
            this.base(classMeta);
            this.extend({
                /**
                 * Gets the associated class.
                 * @method getClass
                 * @returns  {Function} class.
                 */                                              
                getClass: function () { return classMeta.getClass(); },
                /**
                 * Determines if the meta-data represents a protocol.
                 * @method isProtocol
                 * @returns  {boolean} true if a protocol, false otherwise.
                 */                                                
                isProtocol: function () { return classMeta.isProtocol(); }
            });
        }
    }, {
        init: function () {
            var baseExtend = Base.prototype.extend;
            Base.prototype.extend = function (key, value) {
                var numArgs    = arguments.length,
                    definition = (numArgs === 1) ? key : {};
                if (numArgs >= 2) {
                    definition[key] = value;
                } else if (numArgs === 0) {
                    return this;
                }
                var metadata = this.$meta;
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

    Enum.$meta      = new ClassMeta(Base.$meta, Enum);
    Enum.extend     = Base.extend
    Enum.implement  = Base.implement;
    
    /**
     * Metamacro to proxy protocol members through a delegate.<br/>
     * See {{#crossLink "miruken.Protocol"}}{{/crossLink}}
     * @class $proxyProtocol
     * @extends miruken.MetaMacro
     */
    var $proxyProtocol = MetaMacro.extend({
        inflate: function (step, metadata, target, definition, expand) {
            var protocolProto = Protocol.prototype, expanded;
            for (var key in definition) {
                if (key in protocolProto) {
                    continue;
                }
                expanded = expanded || expand();
                var member = _getPropertyDescriptor(definition, key);
                if ($isFunction(member.value)) {
                    (function (method) {
                        member.value = function () {
                            var args = Array.prototype.slice.call(arguments);
                            return this.__invoke(method, args);
                        };
                    })(key);
                } else if (member.get || member.set) {
                    if (member.get) {
                        (function (get) {
                            member.get = function () {
                                return this.__get(get);
                            };
                        })(key);
                    }
                    if (member.set) {
                        (function (set) {                        
                            member.set = function (value) {
                                return this.__set(set, value);
                            }
                        })(key);
                    }
                } else {
                    continue;
                }
                Object.defineProperty(expanded, key, member);                
            }            
        },
        execute: function (step, metadata, target, definition) {
            if (step === MetaStep.Subclass) {
                var clazz = metadata.getClass();                
                clazz.adoptedBy = Protocol.adoptedBy;
            }
        },
        protocolAdded: function (metadata, protocol) {
            var source        = protocol.prototype,
                target        = metadata.getClass().prototype,
                protocolProto = Protocol.prototype;
            for (var key in source) {
                if (!((key in protocolProto) && (key in this))) {
                    var descriptor = _getPropertyDescriptor(source, key);
                    Object.defineProperty(target, key, descriptor);
                }
            }
        },
        /**
         * Determines if the macro should be inherited
         * @method shouldInherit
         * @returns {boolean} true
         */        
        shouldInherit: True,
        /**
         * Determines if the macro should be applied on extension.
         * @method isActive
         * @returns {boolean} true
         */        
        isActive: True
    });
    Protocol.extend    = Base.extend
    Protocol.implement = Base.implement;
    Protocol.$meta     = new ClassMeta(Base.$meta, Protocol, null, [new $proxyProtocol]);

    /**
     * Protocol base requiring conformance to match methods.
     * @class StrictProtocol
     * @constructor
     * @param   {miruken.Delegate}  delegate       -  delegate
     * @param   {boolean}           [strict=true]  -  true ifstrict, false otherwise
     * @extends miruekn.Protocol     
     */
    var StrictProtocol = Protocol.extend({
        constructor: function (proxy, strict) {
            this.base(proxy, (strict === undefined) || strict);
        }
    });

    var GETTER_CONVENTIONS = ['get', 'is'];
    
    /**
     * Metamacro to define class properties.  This macro is automatically applied.
     * <pre>
     *    var Person = Base.extend({
     *        $properties: {
     *            firstName: '',
     *            lastNane:  '',
     *            fullName:  {
     *                get: function () {
     *                   return this.firstName + ' ' + this.lastName;
     *                },
     *                set: function (value) {
     *                    var parts = value.split(' ');
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
    var $properties = MetaMacro.extend({
        constructor: function _(tag) {
            if ($isNothing(tag)) {
                throw new Error("$properties requires a tag name");
            }
            Object.defineProperty(this, 'tag', { value: tag });
        },
        execute: function _(step, metadata, target, definition) {
            var properties = this.extractProperty(this.tag, target, definition); 
            if (!properties) {
                return;
            }
            var expanded = {}, source;
            for (var name in properties) {
                source = expanded;
                var property = properties[name],
                    spec = _.spec || (_.spec = {
                        configurable: true,
                        enumerable:   true
                    });
                if ($isNothing(property) || $isString(property) ||
                    typeOf(property.length) == "number" || typeOf(property) !== 'object') {
                    property = { value: property };
                }
                if (name in definition) {
                    source = null;  // don't replace standard property
                } else if (property.get || property.set) {
                    spec.get = property.get;
                    spec.set = property.set;
                } else if (target instanceof Protocol) {
                    // $proxyProtocol will do the real work
                    spec.get = spec.set = Undefined;
                } else if ("auto" in property) {
                    var field = property.auto;
                    if (!(field && $isString(field))) {
                        field = "_" + name;
                    }
                    spec.get = function () { return this[field]; };
                    spec.set = function (value) { this[field] = value; };
                } else {
                    spec.writable = true;
                    spec.value    = property.value;
                }
                _cleanDescriptor(property);
                this.defineProperty(metadata, source, name, spec, property);                
                _cleanDescriptor(spec);
            }
            if (step == MetaStep.Extend) {
                target.extend(expanded);
            } else {
                metadata.getClass().implement(expanded);
            }
        },
        defineProperty: function(metadata, target, name, spec, descriptor) {
            metadata.defineProperty(target, name, spec, descriptor);
        },
        /**
         * Determines if the macro should be inherited
         * @method shouldInherit
         * @returns {boolean} true
         */                
        shouldInherit: True,
        /**
         * Determines if the macro should be applied on extension.
         * @method isActive
         * @returns {boolean} true
         */                
        isActive: True
    }, {
        init: function () {
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
     *    var Person = Base.extend(**$inferProperties**, {
     *        getName: function () { return this._name; },
     *        setName: function (value) { this._name = value; },
     *    })
     * </pre>
     * would create a Person.name property bound to getName and setName 
     * @class $inferProperties
     * @constructor
     * @extends miruken.MetaMacro
     */
    var $inferProperties = MetaMacro.extend({
        inflate: function _(step, metadata, target, definition, expand) {
            var expanded;
            for (var key in definition) {
                var member = _getPropertyDescriptor(definition, key);
                if ($isFunction(member.value)) {
                    var spec = _.spec || (_.spec = {
                        configurable: true,
                        enumerable:   true
                    });
                    var name = this.inferProperty(key, member.value, definition, spec);
                    if (name) {
                        expanded = expanded || expand();
                        Object.defineProperty(expanded, name, spec);
                        _cleanDescriptor(spec);                        
                    }
                }
            }            
        },
        inferProperty: function (key, method, definition, spec) {
            for (var i = 0; i < GETTER_CONVENTIONS.length; ++i) {
                var prefix = GETTER_CONVENTIONS[i];
                if (key.lastIndexOf(prefix, 0) == 0) {
                    if (method.length === 0) {  // no arguments
                        spec.get   = method;                        
                        var name   = key.substring(prefix.length),
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
                    var name   = key.substring(3),
                        getter = definition['get' + name];
                    if ($isFunction(getter)) {
                        spec.get = getter;
                    }
                    return name.charAt(0).toLowerCase() + name.slice(1);
                }
            }
        },
        /**
         * Determines if the macro should be inherited
         * @method shouldInherit
         * @returns {boolean} true
         */                
        shouldInherit: True,
        /**
         * Determines if the macro should be applied on extension.
         * @method isActive
         * @returns {boolean} true
         */               
        isActive: True
    });

    function _cleanDescriptor(descriptor) {
        delete descriptor.writable;
        delete descriptor.value;
        delete descriptor.get;
        delete descriptor.set;
    }
    
    /**
     * Metamacro to inherit static members in subclasses.
     * <pre>
     * var Math = Base.extend(
     *     **$inheritStatic**, null, {
     *         PI:  3.14159265359,
     *         add: function (a, b) {
     *             return a + b;
     *          }
     *     }),
     *     Geometry = Math.extend(null, {
     *         area: function(length, width) {
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
    var $inheritStatic = MetaMacro.extend({
        constructor: function _(/*members*/) {
            var spec = _.spec || (_.spec = {});
            spec.value = Array.prototype.slice.call(arguments);
            Object.defineProperty(this, 'members', spec);
            delete spec.value;
        },
        execute: function (step, metadata, target) {
            if (step === MetaStep.Subclass) {
                var members  = this.members,
                    clazz    = metadata.getClass(),
                    ancestor = $ancestorOf(clazz);
                if (members.length > 0) {
                    for (var i = 0; i < members.length; ++i) {
                        var member = members[i];
                        if (!(member in clazz)) {
                            clazz[member] = ancestor[member];
                        }
                    }
                } else if (ancestor !== Base && ancestor !== Object) {
                    for (var key in ancestor) {
                        if (ancestor.hasOwnProperty(key) && !(key in clazz)) {
                            clazz[key] = ancestor[key];
                        }
                    }
                }
            }
        },
        /**
         * Determines if the macro should be inherited
         * @method shouldInherit
         * @returns {boolean} true
         */                
        shouldInherit: True
    });

    /**
     * Delegates properties and methods to another object.<br/>
     * See {{#crossLink "miruken.Protocol"}}{{/crossLink}}
     * @class Delegate
     * @extends Base
     */
    var Delegate = Base.extend({
        /**
         * Delegates the property get on the protocol.
         * @method get
         * @param   {miruken.Protocol} protocol      - receiving protocol
         * @param   {string}           propertyName  - name of the property
         * @param   {boolean}          strict        - true if target must adopt protocol
         * @returns {Any} result of the proxied get.
         */
        get: function (protocol, propertyName, strict) {},
        /**
         * Delegates the property set on the protocol.
         * @method set
         * @param   {miruken.Protocol} protocol      - receiving protocol
         * @param   {string}           propertyName  - name of the property
         * @param   {Object}           propertyValue - value of the property
         * @param   {boolean}          strict        - true if target must adopt protocol
         */
        set: function (protocol, propertyName, propertyValue, strict) {},
        /**
         * Delegates the method invocation on the protocol.
         * @method invoke
         * @param   {miruken.Protocol} protocol      - receiving protocol
         * @param   {string}           methodName  - name of the method
         * @param   {Array}            args        - method arguments
         * @param   {boolean}          strict      - true if target must adopt protocol
         * @returns {Any} result of the proxied invocation.
         */
         invoke: function (protocol, methodName, args, strict) {}
    });

    /**
     * Delegates properties and methods to an object.
     * @class ObjectDelegate
     * @constructor
     * @param   {Object}  object  - receiving object
     * @extends miruken.Delegate
     */
    var ObjectDelegate = Delegate.extend({
        constructor: function (object) {
            Object.defineProperty(this, 'object', { value: object });
        },
        get: function (protocol, propertyName, strict) {
            var object = this.object;
            if (object && (!strict || protocol.adoptedBy(object))) {
                return object[propertyName];
            }
        },
        set: function (protocol, propertyName, propertyValue, strict) {
            var object = this.object;
            if (object && (!strict || protocol.adoptedBy(object))) {
                return object[propertyName] = propertyValue;
            }
        },
        invoke: function (protocol, methodName, args, strict) {
            var object = this.object;
            if (object && (!strict || protocol.adoptedBy(object))) {
                method = object[methodName];                
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
    var ArrayDelegate = Delegate.extend({
        constructor: function (array) {
            Object.defineProperty(this, 'array', { value: array });
        },
        get: function (protocol, propertyName, strict) {
            var array = this.array;
            return array && Array2.reduce(array, function (result, object) {
                return !strict || protocol.adoptedBy(object)
                     ? object[propertyName]
                     : result;
            }, undefined);  
        },
        set: function (protocol, propertyName, propertyValue, strict) {
            var array = this.array;
            return array && Array2.reduce(array, function (result, object) {
                return !strict || protocol.adoptedBy(object)
                     ? object[propertyName] = propertyValue
                     : result;
            }, undefined);  
        },
        invoke: function (protocol, methodName, args, strict) {
            var array = this.array;
            return array && Array2.reduce(array, function (result, object) {
                var method = object[methodName];
                return method && (!strict || protocol.adoptedBy(object))
                     ? method.apply(object, args)
                     : result;
            }, undefined);
        }
    });
    
    /**
     * Base class to prefer coercion over casting.
     * By default, Type(target) will cast target to the type.
     * @class Miruken
     * @extends Base
     */
    var Miruken = Base.extend(null, {
        coerce: function () { return this.new.apply(this, arguments); }
    });

    /**
     * Protocol for targets that manage initialization.
     * @class Initializing
     * @extends miruken.Protocol
     */
    var Initializing = Protocol.extend({
        /**
         * Perform any initialization after construction..
         */
        initialize: function () {}
    });
    
    /**
     * Protocol for targets that manage disposal lifecycle.
     * @class Disposing
     * @extends miruken.Protocol
     */
    var Disposing = Protocol.extend({
        /**
         * Releases any resources managed by the receiver.
         * @method dispose
         */
        dispose: function () {}
    });

    /**
     * Mixin for {{#crossLink "miruken.Disposing"}}{{/crossLink}} implementation.
     * @class DisposingMixin
     * @uses miruken.Disposing
     * @extends Module
     */
    var DisposingMixin = Module.extend({
        dispose: function (object) {
            if ($isFunction(object._dispose)) {
                var result = object._dispose();
                object.dispose = Undefined;  // dispose once
                return result;
            }
        }
    });

    /**
     * Protocol marking resolve semantics.
     * @class Resolving
     * @extends miruken.Protocol
     */
    var Resolving = Protocol.extend();

    /**
     * Protocol for targets that can execute functions.
     * @class Invoking
     * @extends miruken.StrictProtocol
     */
    var Invoking = StrictProtocol.extend({
        /**
         * Invokes the function with dependencies.
         * @method invoke
         * @param    {Function} fn           - function to invoke
         * @param    {Array}    dependencies - function dependencies
         * @param    {Object}   [ctx]        - function context
         * @returns  {Any}      result of the function.
         */
        invoke: function (fn, dependencies, ctx) {}
    });

    /**
     * Protocol for targets that have parent/child relationships.
     * @class Parenting
     * @extends miruken.Protocol
     */
    var Parenting = Protocol.extend({
        /**
         * Creates a new child of the parent.
         * @method newChild
         * @returns  {Object} the new child.
         */
        newChild: function () {}
    });

    /**
     * Protocol for targets that can be started.
     * @class Starting
     * @extends miruken.Protocol
     */
    var Starting = Protocol.extend({
        /**
         * Starts the reciever.
         * @method start
         */
        start: function () {}
    });

    /**
     * Base class for startable targets.
     * @class Startup
     * @uses miruken.Starting
     * @extends Base
     */
    var Startup = Base.extend(Starting, {
        start: function () {}
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
    function $using(disposing, action, context) {
        if (disposing && $isFunction(disposing.dispose)) {
            if (!$isPromise(action)) {
                var result;
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
                        var dresult = disposing.dispose();
                        if (dresult !== undefined) {
                            return dresult;
                        }
                    }
                }
            }
            return action.then(function (res) {
                var dres = disposing.dispose();
                return dres !== undefined ? dres : res;
            }, function (err) {
                var dres = disposing.dispose();
                return dres !== undefined ? dres : Promise.reject(err);
            });
        }
    }

    /**
     * Class for annotating targets.
     * @class Modifier
     * @param  {Object}  source  -  source to annotate
     */
    function Modifier() {}
    Modifier.isModified = function (source) {
        return source instanceof Modifier;
    };
    Modifier.unwrap = function (source) {
        return (source instanceof Modifier) 
             ? Modifier.unwrap(source.getSource())
             : source;
    };
    function $createModifier() {
        var allowNew;
        function modifier(source) {
            if (this === global) {
                if (modifier.test(source)) {
                    return source;
                }
                allowNew = true;
                var wrapped = new modifier(source);
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

    /**
     * Helper class to simplify array manipulation.
     * @class ArrayManager
     * @constructor
     * @param  {Array}  [...items]  -  initial items
     * @extends Base
     */
    var ArrayManager = Base.extend({
        constructor: function (items) {
            var _items = [];
            this.extend({
                /** 
                 * Gets the array.
                 * @method getItems
                 * @returns  {Array} array.
                 */
                getItems: function () { return _items; },
                /** 
                 * Gets the item at array index.
                 * @method getIndex
                 * @param    {number}  index - index of item
                 * @returns  {Any} item at index.
                 */
                getIndex: function (index) {
                    if (_items.length > index) {
                        return _items[index];
                    }
                },
                /** 
                 * Sets the item at array index if empty.
                 * @method setIndex
                 * @param    {number}  index - index of item
                 * @param    {Any}     item  - item to set
                 * @returns  {ArrayManager} array manager.
                 * @chainable
                 */
                setIndex: function (index, item) {
                    if ((_items.length <= index) ||
                        (_items[index] === undefined)) {
                        _items[index] = this.mapItem(item);
                    }
                    return this;
                },
                /** 
                 * Inserts the item at array index.
                 * @method insertIndex
                 * @param    {number}   index - index of item
                 * @param    {Item}     item  - item to insert
                 * @returns  {ArrayManager} array manager.
                 * @chainable
                 */
                insertIndex: function (index, item) {
                    _items.splice(index, 0, this.mapItem(item));
                    return this;
                },
                /** 
                 * Replaces the item at array index.
                 * @method replaceIndex
                 * @param    {number}   index - index of item
                 * @param    {Item}     item  - item to replace
                 * @returns  {ArrayManager} array manager.
                 * @chainable
                 */
                replaceIndex: function (index, item) {
                    _items[index] = this.mapItem(item);
                    return this;
                },
                /** 
                 * Removes the item at array index.
                 * @method removeIndex
                 * @param    {number}   index - index of item
                 * @returns  {ArrayManager} array manager.
                 * @chainable
                 */
                removeIndex: function (index) {
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
                append: function (/* items */) {
                    var newItems;
                    if (arguments.length === 1 && $isArray(arguments[0])) {
                        newItems = arguments[0];
                    } else if (arguments.length > 0) {
                        newItems = arguments;
                    }
                    if (newItems) {
                        for (var i = 0; i < newItems.length; ++i) {
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
                merge: function (items) {
                    for (var index = 0; index < items.length; ++index) {
                        var item = items[index];
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
        mapItem: function (item) { return item; }
    });

    /**
     * Maintains a simple doublely-linked list with indexing.
     * Indexes are partially ordered according to the order comparator.
     * @class IndexedList
     * @constructor
     * @param  {Function}  order  -  orders items
     * @extends Base
     */
    var IndexedList = Base.extend({
        constructor: function (order) {
            var _index = {};
            this.extend({
                /** 
                 * Determines if list is empty.
                 * @method isEmpty
                 * @returns  {boolean}  true if list is empty, false otherwise.
                 */
                isEmpty: function () {
                    return !this.head;
                },
                /** 
                 * Gets the node at an index.
                 * @method getIndex
                 * @param    {number} index - index of node
                 * @returns  {Any}  the node at index.
                 */
                getIndex: function (index) {
                    return index && _index[index];
                },
                /** 
                 * Inserts the node at an index.
                 * @method insert
                 * @param  {Any}     node   - node to insert
                 * @param  {number}  index  - index to insert at
                 */
                insert: function (node, index) {
                    var indexedNode = this.getIndex(index),
                        insert      = indexedNode;
                    if (index) {
                        insert = insert || this.head;
                        while (insert && order(node, insert) >= 0) {
                            insert = insert.next;
                        }
                    }
                    if (insert) {
                        var prev    = insert.prev;
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
                        var tail = this.tail;
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
                 * Removes the node from the list.
                 * @method remove
                 * @param  {Any}  node  - node to remove
                 */
                remove: function (node) {
                    var prev = node.prev,
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
                    var index = node.index;
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
     * Facet choices for proxies.
     * @class Facet
     */
    var Facet = Object.freeze({
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
    var Interceptor = Base.extend({
        /**
         * @method intercept
         * @param    {Object} invocation  - invocation
         * @returns  {Any} invocation result
         */
        intercept: function (invocation) {
            return invocation.proceed();
        }
    });

    /**
     * Responsible for selecting which interceptors to apply to a method.
     * @class InterceptorSelector
     * @extends Base
     */
    var InterceptorSelector = Base.extend({
        /**
         * Selects the interceptors to apply for the method.
         * @method selectInterceptors
         * @param    {Type}    type         - intercepted type
         * @param    {string}  method       - intercepted method name
         * @param    {Array}   interceptors - available interceptors
         * @returns  {Array} interceptors to apply to method.
         */
        selectInterceptors: function (type, method, interceptors) {
            return interceptors;
        }
    });

    /**
     * Builds proxy classes for interception.
     * @class ProxyBuilder
     * @extends Base
     */
    var ProxyBuilder = Base.extend({
        /**
         * Builds a proxy class for the supplied types.
         * @method buildProxy
         * @param    {Array}     ...types  -  classes and protocols
         * @param    {Object}    options   -  literal options
         * @returns  {Function}  proxy class.
         */
        buildProxy: function(types, options) {
            if (!$isArray(types)) {
                throw new TypeError("ProxyBuilder requires an array of types to proxy.");
            }
            var classes   = Array2.filter(types, $isClass),
                protocols = Array2.filter(types, $isProtocol);
            return _buildProxy(classes, protocols, options || {});
        }
    });

    function _buildProxy(classes, protocols, options) {
        var base  = options.baseType || classes.shift() || Base,
            proxy = base.extend(classes.concat(protocols), {
            constructor: function _(facets) {
                var spec = _.spec || (_.spec = {});
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
                ctor = _proxyMethod("constructor", this.base, base);
                ctor.apply(this, facets[Facet.Parameters]);
                delete spec.writable;
                delete spec.value;
            },
            getInterceptors: function (source, method) {
                var selectors = this.selectors;
                return selectors 
                     ? Array2.reduce(selectors, function (interceptors, selector) {
                           return selector.selectInterceptors(source, method, interceptors);
                       }, this.interceptors)
                     : this.interceptors;
            },
            extend: _extendProxy
        }, {
            shouldProxy: options.shouldProxy
        });
        _proxyClass(proxy, protocols);
        proxy.extend = proxy.implement = _throwProxiesSealedExeception;
        return proxy;
    }

    function _throwProxiesSealedExeception()
    {
        throw new TypeError("Proxy classes are sealed and cannot be extended from.");
    }

    function _proxyClass(proxy, protocols) {
        var sources    = [proxy].concat(protocols),
            proxyProto = proxy.prototype,
            proxied    = {};
        for (var i = 0; i < sources.length; ++i) {
            var source      = sources[i],
                sourceProto = source.prototype,
                isProtocol  = $isProtocol(source);
            for (key in sourceProto) {
                if (!((key in proxied) || (key in _noProxyMethods))
                && (!proxy.shouldProxy || proxy.shouldProxy(key, source))) {
                    var descriptor = _getPropertyDescriptor(sourceProto, key);
                    if ('value' in descriptor) {
                        var member = isProtocol ? undefined : descriptor.value;
                        if ($isNothing(member) || $isFunction(member)) {
                            proxyProto[key] = _proxyMethod(key, member, proxy);
                        }
                        proxied[key] = true;
                    } else if (isProtocol) {
                        var cname = key.charAt(0).toUpperCase() + key.slice(1),
                            get   = 'get' + cname,
                            set   = 'set' + cname,
                            spec  = _proxyClass.spec || (_proxyClass.spec = {
                                enumerable: true
                            });
                        spec.get = function (get) {
                            var proxyGet;
                            return function () {
                                if (get in this) {
                                    return (this[get]).call(this);
                                }
                                if (!proxyGet) {
                                    proxyGet = _proxyMethod(get, undefined, proxy);
                                }
                                return proxyGet.call(this);
                            }
                        }(get);
                        spec.set = function (set) {
                            var proxySet;
                            return function (value) {
                                if (set in this) {
                                    return (this[set]).call(this, value);
                                }
                                if (!proxySet) {
                                    proxySet = _proxyMethod(set, undefined, proxy);
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
    
    function _proxyMethod(key, method, source) {
        var spec = _proxyMethod.spec || (_proxyMethod.spec = {}),
            interceptors;
        function methodProxy() {
            var _this    = this,
                delegate = this.delegate,
                idx      = -1;
            if (!interceptors) {
                interceptors = this.getInterceptors(source, key);
            }
            var invocation = {
                args: Array.prototype.slice.call(arguments),
                useDelegate: function (value) {
                    delegate = value;
                },
                replaceDelegate: function (value) {
                    _this.delegate = delegate = value;
                },
                proceed: function () {
                    ++idx;
                    if (interceptors && idx < interceptors.length) {
                        var interceptor = interceptors[idx];
                        return interceptor.intercept(invocation);
                    }
                    if (delegate) {
                        var delegateMethod = delegate[key];
                        if ($isFunction(delegateMethod)) {
                            return delegateMethod.apply(delegate, this.args);
                        }
                    } else if (method) {
                        return method.apply(_this, this.args);
                    }
                    throw new Error(format(
                        "Interceptor cannot proceed without a class or delegate method '%1'.", key));
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
    
    function _extendProxy() {
        var proxy     = this.constructor,
            clazz     = proxy.prototype,
            overrides = (arguments.length === 1) ? arguments[0] : {};
        if (arguments.length >= 2) {
            overrides[arguments[0]] = arguments[1];
        }
        for (methodName in overrides) {
            if (!(methodName in _noProxyMethods) && 
                (!proxy.shouldProxy || proxy.shouldProxy(methodName, clazz))) {
                var method = this[methodName];
                if (method && method.baseMethod) {
                    this[methodName] = method.baseMethod;
                }
                this.base(methodName, overrides[methodName]);
                this[methodName] = _proxyMethod(methodName, this[methodName], clazz);
            }
        }
        return this;
    }

    var _noProxyMethods = {
        base: true, extend: true, constructor: true, conformsTo: true,
        getInterceptors: true, getDelegate: true, setDelegate: true
    };

    Package.implement({
        export: function (name, member) {
            this.addName(name, member);
        },
        getProtocols: function () {
            _listContents(this, arguments, $isProtocol);
        },
        getClasses: function () {
            _listContents(this, arguments, function (member, memberName) {
                return $isClass(member) && (memberName != "constructor");
            });
        },
        getPackages: function () {
            _listContents(this, arguments, function (member, memberName) {
                return (member instanceof Package) && (memberName != "parent");
            });
        }
    });

    function _listContents(pkg, args, filter) {
        var cb  = Array.prototype.pop.call(args);
        if ($isFunction(cb)) {
            var names = Array.prototype.pop.call(args) || Object.keys(pkg);
            for (var i = 0; i < names.length; ++i) {
                var name   = names[i],
                    member = pkg[name];
                if (member && (!filter || filter(member, name))) {
                    cb({ member: member, name: name});
                }
            }
        }
    }

    /**
     * Determines if target is a protocol.
     * @method $isProtocol
     * @param    {Any}     protocol  - target to test
     * @returns  {boolean} true if a protocol.
     * @for miruken.$
     */
    var $isProtocol = Protocol.isProtocol;

    /**
     * Determines if target is a class.
     * @method $isClass
     * @param    {Any}     clazz  - class to test
     * @returns  {boolean} true if a class (and not a protocol).
     */
    function $isClass(clazz) {
        return clazz && (clazz.prototype instanceof Base) && !$isProtocol(clazz);
    }

    /**
     * Gets the class the instance belongs to.
     * @method $classOf
     * @param    {Object}  instance  - object
     * @returns  {Function} class of instance. 
     */
    function $classOf(instance) {
        return instance && instance.constructor;
    }

    /**
     * Gets the classes superclass.
     * @method $ancestorOf
     * @param    {Function} clazz  - class
     * @returns  {Function} ancestor of class. 
     */
    function $ancestorOf(clazz) {
        return clazz && clazz.ancestor;
    }

    /**
     * Determines if target is a string.
     * @method $isString
     * @param    {Any}     str  - string to test
     * @returns  {boolean} true if a string.
     */
    function $isString(str) {
        return typeOf(str)  === 'string';
    }

    /**
     * Determines if the target is a function.
     * @method $isFunction
     * @param    {Any}     fn  - function to test
     * @returns  {boolean} true if a function.
     */
    function $isFunction(fn) {
        return fn instanceof Function;
    }

    /**
     * Determines if target is an object.
     * @method $isObject
     * @param    {Any}     obj  - object to test
     * @returns  {boolean} true if an object.
     */
    function $isObject(obj) {
        return obj === Object(obj);
    }

    /**
     * Determines if target is an array.
     * @method $isArray
     * @param    {Any}     obj  - array to test
     * @returns  {boolean} true if an array. 
     */    
    function $isArray(obj) {
        return Object.prototype.toString.call(obj) === '[object Array]';
    };
    
    /**
     * Determines if target is a promise.
     * @method $isPromise
     * @param    {Any}     promise  - promise to test
     * @returns  {boolean} true if a promise. 
     */
    function $isPromise(promise) {
        return promise && $isFunction(promise.then);
    }
    
    /**
     * Determines if value is null or undefined.
     * @method $isNothing
     * @param    {Any}     value  - value to test
     * @returns  {boolean} true if value null or undefined.
     */
    function $isNothing(value) {
        return value == null;
    }

    /**
     * Description goes here
     * @method $isSomething
     * @param    {Any}     value  - value to test
     * @returns  {boolean} true if value not null or undefined.
     */
    function $isSomething(value) {
        return value != null;
    }

    /**
     * Returns a function that returns value.
     * @method $lift
     * @param    {Any}      value  - any value
     * @returns  {Function} function that returns value.
     */
    function $lift(value) {
        return function() { return value; };
    }

    /**
     * Determines whether the objects are considered equal.
     * <p>
     * Objects are considered equal if the objects are strictly equal (===) or
     * either object has an equals method accepting other object that returns true.
     * </p>
     * @method $equals
     * @param    {Any}     obj1  - first object
     * @param    {Any}     obj2  - second object
     * @returns  {boolean} true if the obejcts are considered equal, false otherwise.
     */
    function $equals(obj1, obj2) {
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
     * Creates a decorator builder.<br/>
     * See [Decorator Pattern](http://en.wikipedia.org/wiki/Decorator_pattern)
     * @method
     * @param   {Object}   decorations  -  object defining decorations
     * @erturns {Function} function to build decorators.
     */
    function $decorator(decorations) {
        return function (decoratee) {
            if ($isNothing(decoratee)) {
                throw new TypeError("No decoratee specified.");
            }
            var decorator = Object.create(decoratee),
                spec      = $decorator.spec || ($decorator.spec = {});
            spec.value = decoratee;
            Object.defineProperty(decorator, 'decoratee', spec);
            ClassMeta.createInstanceMeta.call(decorator, decoratee.$meta);
            if (decorations) {
                decorator.extend(decorations);
            }
            delete spec.value;
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
    function $decorate(decoratee, decorations) {
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
    function $decorated(decorator, deepest) {
        var decoratee;
        while (decorator && (decoratee = decorator.decoratee)) {
            if (!deepest) {
                return decoratee;
            }
            decorator = decoratee;
        }
        return decorator;
    }

    /**
     * Throttles a function over a time period.
     * @method $debounce
     * @param    {Function} func                - function to throttle
     * @param    {int}      wait                - time (ms) to throttle func
     * @param    {boolean}  immediate           - if true, trigger func early
     * @param    {Any}      defaultReturnValue  - value to return when throttled
     * @returns  {Function} throttled function
     */
    function $debounce(func, wait, immediate, defaultReturnValue) {
        var timeout;
        return function () {
            var context = this, args = arguments;
            var later = function () {
                timeout = null;
                if (!immediate) {
                    return func.apply(context, args);
                }
            };
            var callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) {
                return func.apply(context, args);
            }
            return defaultReturnValue;
        };
    };

    function _getPropertyDescriptor(object, key, own) {
        var source = object, descriptor;
        while (source && !(
            descriptor = Object.getOwnPropertyDescriptor(source, key))
              ) source = own ? null : Object.getPrototypeOf(source);
        return descriptor;
    }

    /**
     * Enhances Functions to create instances.
     * @method new
     * @for Function
     */
    if (Function.prototype.new === undefined)
        Function.prototype.new = function () {
            var args        = arguments,
                constructor = this;
            function Wrapper () { constructor.apply(this, args); }
            Wrapper.prototype  = constructor.prototype;
            return new Wrapper;
        };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exports = this.package;
    }

    global.miruken = this.package;
    global.Miruken = Miruken;

    eval(this.exports);

}
