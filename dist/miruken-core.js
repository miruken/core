import 'reflect-metadata';

/*
  base2 - copyright 2007-2009, Dean Edwards
  http://code.google.com/p/base2/
  http://www.opensource.org/licenses/mit-license.php

  Contributors:
    Doeke Zanstra
*/

const Undefined = K();
const Null      = K(null);
const True      = K(true);
const False     = K(false);

var __prototyping;
var _counter = 1;

const _IGNORE = K();
const _BASE   = /\bbase\b/;
const _HIDDEN = ["constructor", "toString"];
const _slice  = Array.prototype.slice;

// =========================================================================
// base2/Base.js
// =========================================================================

// http://dean.edwards.name/weblog/2006/03/base/

const _subclass = function(_instance, _static) {
  // Build the prototype.
  __prototyping = this.prototype;
  var _prototype = new this;
  if (_instance) extend(_prototype, _instance);
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
  }
  _prototype.constructor = _class;
  
  // Build the static interface.
  Object.setPrototypeOf(_class, this);
  if (_static) extend(_class, _static);
  _class.ancestor = this;
  _class.prototype = _prototype;
  if (_class.init) _class.init();
  
  return _class;
};

let Base = _subclass.call(Object, {
  constructor: function() {
    if (arguments.length > 0 && typeOf(arguments[0]) === 'object') {
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

Base.base = Base.prototype.base = function() {
  // call this method from any other method to invoke that method's ancestor
};

// =========================================================================
// base2/Package.js
// =========================================================================

const Package = Base.extend({
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
    }
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

const Abstract = Base.extend({
  constructor: function() {
    throw new TypeError("Abstract class cannot be instantiated.");
  }
});

// =========================================================================
// base2/Module.js
// =========================================================================

var _moduleCount = 0;

const Module = Abstract.extend(null, {
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
}

function _createStaticModuleMethod(module, name) {
  return function() {
    return module[name].apply(module, arguments);
  };
}

function _createModuleMethod(module, name) {
  return function() {
    var args = _slice.call(arguments);
    args.unshift(this);
    return module[name].apply(module, args);
  };
}

function pcopy(object) { // Prototype-base copy.
  // Doug Crockford / Richard Cornford
  _dummy.prototype = object;
  return new _dummy;
}

function _dummy(){}

// =========================================================================
// lang/extend.js
// =========================================================================

function extend(object, source) { // or extend(object, key, value)
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
}

function _ancestorOf(ancestor, fn) {
  // Check if a function is in another function's inheritance chain.
  while (fn) {
    if (!fn.ancestor) return false;
    fn = fn.ancestor;
    if (fn == ancestor) return true;
  }
  return false;
}

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
        };
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
        };
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
}
    
function getPropertyDescriptors(obj, key) {
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
}

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
}

function assignID(object, name) {
  // Assign a unique ID to an object.
  if (!name) name = object.nodeType == 1 ? "uniqueID" : "base2ID";
  if (!object.hasOwnProperty(name)) object[name] = "b2_" + _counter++;
  return object[name];
}

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
}

function csv(string) {
    return string ? (string + "").split(/\s*,\s*/) : [];
}

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
}

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
}

function delegate(fn, context) {
    return function() {
        var args = _slice.call(arguments);
        args.unshift(this);
        return fn.apply(context, args);
    };
}

function K(k) {
    return function() {
        return k;
    };
}

function decorate(decorator, args) {
    if (isDescriptor(args[args.length - 1])) {
        return decorator(...args, []);
    }
    return function () {
        return decorator(...arguments, args);
    };
}

function isDescriptor(desc) {
    if (!desc || !desc.hasOwnProperty) {
        return false;
    }

    const keys = ["value", "initializer", "get", "set"];

    for (let i = 0, l = keys.length; i < l; i++) {
        if (desc.hasOwnProperty(keys[i])) {
            return true;
        }
    }

    return false;
}

/**
 * Applies copy semantics on properties and return values.
 * @method copy
 */
function copy(...args) {
    return decorate(_copy, args);
}

function _copy(target, key, descriptor) {
    if (!isDescriptor(descriptor)) {
        throw new SyntaxError("@copy can only be applied to methods or properties");
    }
    const { get, set, value, initializer } = descriptor;
    if ($isFunction(value)) {
        descriptor.value = function () {
            return _copyOf(value.apply(this, arguments));
        };
    }
    if ($isFunction(initializer)) {
        descriptor.initializer = function () {
            return _copyOf(initializer.apply(this));
        };
    }
    if ($isFunction(get)) {
        descriptor.get = function () {
            return _copyOf(get.apply(this));
        };
    }
    if ($isFunction(set)) {
        descriptor.set = function (value) {
            return set.call(this, _copyOf(value));
        };
    }
}

function _copyOf(value) {
    if (value != null && $isFunction(value.copy)) {
        value = value.copy();
    }
    return value;
}

/**
 * Helper class to simplify array manipulation.
 * @class ArrayManager
 * @constructor
 * @param  {Array}  [...items]  -  initial items
 * @extends Base
 */
const ArrayManager = Base.extend({
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
                if (_items[index] === undefined) {
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
 * @param  {Function}  order  -  partially orders items
 * @extends Base
 */
const IndexedList = Base.extend({
    constructor(order = defaultOrder) {
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
             * Determines if `node` is present in list using `$equals`.
             * @method has
             * @param   {Any} node  -  node to test for
             * @returns  {boolean}  true if `node` exists.
             */            
            has(node) {
                const index = node.index;
                let   indexedNode = this.getFirst(index);
                while (indexedNode && indexedNode.index === index) {
                    if ($equals(indxedNode, node)) { return true; }
                    indexedNode = indexedNode.next;
                }
                return false;
            },
            /** 
             * Gets the first node at `index`.
             * @method getFirst
             * @param    {number} index  -  index of node
             * @returns  {Any}  the first node at index.
             */
            getFirst(index) {
                return index && _index[index];
            },
            /** 
             * Inserts `node` at `index`.
             * @method insert
             * @param  {Any}     node   -  node to insert
             * @param  {number}  index  -  index to insert at
             * @returns  {IndexedList}  the updated list.
             * @chainable
             */
            insert(node, index) {
                const indexedNode = this.getFirst(index);
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
                return this;
            },
            /** 
             * Removes `node` from the list.
             * @method remove
             * @param  {Any}  node  -  node to remove
             * @returns  {IndexedList}  the updated list.
             * @chainable
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
                if (this.getFirst(index) === node) {
                    if (next && next.index === index) {
                        _index[index] = next;
                    } else {
                        delete _index[index];
                    }
                }
                return this;
            },
            /** 
             * Merges `list` into this list.
             * @method list
             * @param  {IndexedList}  list  -  list to merge
             * @returns  {IndexedList}  the updated list.
             * @chainable
             */
            merge(list) {
                if (!list) { return this; }
                if (list.constructor !== this.constructor) {
                    throw new TypeError("merge expects lists of equal type");
                }
                let node = list.head;
                while (node) {
                    const next = node.next;
                    if (!this.has(node)) {
                        this.insert(node, node.index);
                    }
                    node = next;
                }
                return this;
            }
        });
    }
});

function defaultOrder(a, b) {
    return a < b;
}

/**
 * Determines if `str` is a string.
 * @method $isString
 * @param    {Any}     str  -  string to test
 * @returns  {boolean} true if a string.
 */
function $isString(str) {
    return typeOf(str) === "string";
}

/**
 * Determines if `sym` is a symbol.
 * @method $isSymbol
 * @param    {Symbole} sym  -  symbol to test
 * @returns  {boolean} true if a symbol.
 */
function $isSymbol(str) {
    return Object(str) instanceof Symbol;
}

/**
 * Determines if `fn` is a function.
 * @method $isFunction
 * @param    {Any}     fn  -  function to test
 * @returns  {boolean} true if a function.
 */
function $isFunction$1(fn) {
    return fn instanceof Function;
}

/**
 * Determines if `obj` is an object.
 * @method $isObject
 * @param    {Any}     obj  - object to test
 * @returns  {boolean} true if an object.
 */
function $isObject(obj) {
    return typeOf(obj) === "object";
}

/**
 * Determines if `obj` is a plain object or literal.
 * @method $isPlainObject
 * @param    {Any}     obj  -  object to test
 * @returns  {boolean} true if a plain object.
 */
function $isPlainObject(obj) {
    return $isObject(obj) && obj.constructor === Object;
}

/**
 * Determines if `promise` is a promise.
 * @method $isPromise
 * @param    {Any}     promise  -  promise to test
 * @returns  {boolean} true if a promise. 
 */
function $isPromise(promise) {
    return promise && $isFunction$1(promise.then);
}

/**
 * Determines if `value` is null or undefined.
 * @method $isNothing
 * @param    {Any}     value  -  value to test
 * @returns  {boolean} true if value null or undefined.
 */
function $isNothing(value) {
    return value == null;
}

/**
 * Determines if `value` is not null or undefined.
 * @method $isSomething
 * @param    {Any}     value  -  value to test
 * @returns  {boolean} true if value not null or undefined.
 */
function $isSomething$1(value) {
    return value != null;
}

/**
 * Returns a function that returns `value`.
 * @method $lift
 * @param    {Any}      value  -  any value
 * @returns  {Function} function that returns value.
 */
function $lift(value) {
    return function() { return value; };
}

/**
 * Recursively flattens and optionally prune an array.
 * @method $flatten
 * @param    {Array}   arr    -  array to flatten
 * @param    {boolean} prune  -  true if prune null items
 * @returns  {Array}   flattend/pruned array or `arr`
 */
function $flatten(arr, prune) {
    if (!Array.isArray(arr)) return arr;
    let items = arr.map(item => $flatten(item, prune));
    if (prune) items = items.filter($isSomething$1);
    return [].concat(...items);
}

/**
 * Determines whether `obj1` and `obj2` are considered equal.
 * <p>
 * Objects are considered equal if the objects are strictly equal (===) or
 * either object has an equals method accepting other object that returns true.
 * </p>
 * @method $equals
 * @param    {Any}     obj1  -  first object
 * @param    {Any}     obj2  -  second object
 * @returns  {boolean} true if the obejcts are considered equal, false otherwise.
 */
function $equals(obj1, obj2) {
    if (obj1 === obj2) {
        return true;
    }
    if (obj1 && $isFunction$1(obj1.equals)) {
        return obj1.equals(obj2);
    } else if (obj2 && $isFunction$1(obj2.equals)) {
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
function $debounce(fn, wait, immediate, defaultReturnValue) {
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
}

/**
 * Delegates properties and methods to another object.<br/>
 * See {{#crossLink "Protocol"}}{{/crossLink}}
 * @class Delegate
 * @extends Base
 */
const Delegate = Base.extend({
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
const ObjectDelegate = Delegate.extend({
    constructor(object) {
        Object.defineProperty(this, "object", { value: object });
    },
    get(protocol, key, strict) {
        const object = this.object;
        if (object && (!strict || protocol.isAdoptedBy(object))) {
            return object[key];
        }
    },
    set(protocol, key, value, strict) {
        const object = this.object;
        if (object && (!strict || protocol.isAdoptedBy(object))) {
            return object[key] = value;
        }
    },
    invoke(protocol, methodName, args, strict) {
        const object = this.object;
        if (object && (!strict || protocol.isAdoptedBy(object))) {
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
const ArrayDelegate = Delegate.extend({
    constructor(array) {
        Object.defineProperty(this, "array", { value: array });
    },
    get(protocol, key, strict) {
        const array = this.array;
        return array && array.reduce((result, object) =>
            !strict || protocol.isAdoptedBy(object) ? object[key] : result,
            undefined);  
    },
    set(protocol, key, value, strict) {
        const array = this.array;
        return array && array.reduce((result, object) =>
            !strict || protocol.isAdoptedBy(object) ? object[key] = value : result,
            undefined);  
    },
    invoke(protocol, methodName, args, strict) {
        const array = this.array;
        return array && array.reduce((result, object) => {
            const method = object[methodName];
            return method && (!strict || protocol.isAdoptedBy(object))
                ? method.apply(object, args)
                : result;
        }, undefined);
    }
});

/**
 * Provides an abstraction for meta-data management.
 * @class Metadata
 */
const Metadata = Abstract.extend(null, {
    /**
     * Gets metadata on the prototype chain of an object or property.
     * @static
     * @method get
     * @param   {Any}  metadataKey  -  metadata key
     * @param   {Any}  target       -  originating target
     * @param   {Any}  [targetKey]  -  property key
     * @returns {Any} the metadata for the `metadataKey`. 
     */
    get(metadataKey, target, targetKey) {
        if (target) {
            return targetKey
                 ? Reflect.getMetadata(metadataKey, target, targetKey)
                 : Reflect.getMetadata(metadataKey, target);
        }
    },
    /**
     * Gets owning metadata of an object or property.
     * @static
     * @method getOwn
     * @param   {Any}  metadataKey  -  metadata key
     * @param   {Any}  target       -  owning target
     * @param   {Any}  [targetKey]  -  property key
     * @returns {Any} the metadata for the `metadataKey`. 
     */
    getOwn(metadataKey, target, targetKey) {
        if (target) {
            return targetKey
                 ? Reflect.getOwnMetadata(metadataKey, target, targetKey)
                 : Reflect.getOwnMetadata(metadataKey, target);
        }
    },
    /**
     * Gets owning metadata of an object or property or lazily creates it.
     * @static
     * @method getOrCreateOwn
     * @param   {Any}       metadataKey  -  metadata key
     * @param   {Any}       target       -  owning target
     * @param   {Any}       [targetKey]  -  property key
     * @param   {Function}  creator      -  creates metadata if missing
     * @returns {Any} the metadata for the `metadataKey`. 
     */
    getOrCreateOwn(metadataKey, target, targetKey, creator) {
        if (arguments.length === 3) {
            creator   = targetKey;
            targetKey = undefined;
        }        
        if (!$isFunction$1(creator)) {
            throw new TypeError("creator must be a function");
        }
        let metadata = this.getOwn(metadataKey, target, targetKey);
        if (metadata === undefined) {
            metadata = creator(metadataKey, target, targetKey);
            this.define(metadataKey, metadata, target, targetKey);
        }
        return metadata;
    },
    /**
     * Defines metadata on an object or property.
     * @static
     * @method define
     * @param   {Any}  metadataKey  -  metadata key
     * @param   {Any}  metadata     -  metadata value
     * @param   {Any}  target       -  owning target
     * @param   {Any}  [targetKey]  -  property key
     */
    define(metadataKey, metadata, target, targetKey) {
        if (target) {
            return targetKey
                 ? Reflect.defineMetadata(metadataKey, metadata, target, targetKey)
                 : Reflect.defineMetadata(metadataKey, metadata, target);
        }
    },
    /**
     * Removes metadata from an object or property.
     * @static
     * @method remove
     * @param   {Any}  metadataKey  -  metadata key
     * @param   {Any}  target       -  owning target
     * @param   {Any}  [targetKey]  -  property key
     */
    remove(metadataKey, target, targetKey) {
        if (target) {
            return targetKey
                 ? Reflect.deleteMetadata(metadataKey, target, targetKey)
                 : Reflect.deleteMetadata(metadataKey, target);
        }
    },
    /**
     * Copies or replaces all metadata from `source` onto `target`.
     * @static
     * @method copyOwn
     * @param   {Any}  target  -  recieves metadata
     * @param   {Any}  source  -  provides metadata
     */
    copyOwn(target, source) {
        this.copyOwnKey(target, source);
        Reflect.ownKeys(source).forEach(sourceKey => this.copyOwnKey(target, source, sourceKey));
    },
    /**
     * Copies or replaces all `sourceKey` metadata from `source` onto `target`.
     * @static
     * @method copyOwnKey
     * @param   {Any}  target     -  recieves metadata
     * @param   {Any}  source     -  provides metadata
     * @param   {Any}  sourceKey  -  source property to copy from
     */
    copyOwnKey(target, source, sourceKey) {
        const metadataKeys = Reflect.getOwnMetadataKeys(source, sourceKey);
        metadataKeys.forEach(metadataKey => {
            const metadata = this.getOwn(metadataKey, source, sourceKey);
            this.define(metadataKey, metadata, target, sourceKey);
        });
    },
    /**
     * Merges all metadata from `source` onto `target`.
     * @static
     * @method mergeOwn
     * @param   {Any}  target  -  recieves metadata
     * @param   {Any}  source  -  provides metadata
     */    
    mergeOwn(target, source) {
        this.mergeOwnKey(target, source);
        Reflect.ownKeys(source).forEach(sourceKey => this.mergeOwnKey(target, source, sourceKey));
    },
    /**
     * Merges all `sourceKey` metadata from `source` onto `target`.
     * @static
     * @method copyOwnKey
     * @param   {Any}  target     -  recieves metadata
     * @param   {Any}  source     -  provides metadata
     * @param   {Any}  sourceKey  -  source property to copy from
     */    
    mergeOwnKey(target, source, sourceKey) {
        const metadataKeys = Reflect.getOwnMetadataKeys(source, sourceKey);
        metadataKeys.forEach(metadataKey => {
            const targetMetadata = this.getOwn(metadataKey, target, sourceKey),
                  sourceMetadata = this.getOwn(metadataKey, source, sourceKey);
            if (targetMetadata && targetMetadata.merge) {
                targetMetadata.merge(sourceMetadata);x;
            } else {
                this.define(metadataKey, sourceMetadata, target, sourceKey);                
            }
        });
    },
    /**
     * Collects metadata on the prototype chain of an object or property.
     * @static
     * @method collect
     * @param   {Any}       metadataKey  -  metadata key
     * @param   {Any}       target       -  originating target
     * @param   {Any}       [targetKey]  -  property key
     * @param   {Function}  collector    -  receives metadata.
     *                                      stops collecting if true is returned.
     * @returns {boolean} true if any `collector` returned true, false otherwise.
     */    
    collect(metadataKey, target, targetKey, collector) {
        if (arguments.length === 3) {
            collector = targetKey;
            targetKey = undefined;
        }
        if (!$isFunction$1(collector)) {
            throw new TypeError("collector must be a function");
        }
        while (target) {
            const metadata = this.getOwn(metadataKey, target, targetKey);
            if (metadata && collector(metadata, metadataKey, target, targetKey)) {
                return true;
            }
            target = Object.getPrototypeOf(target);
        }
        return false;
    },
    /**
     * Builds a metadata decorator.
     * @static
     * @method decorator
     * @param  {Any}       metadataKey  -  metadata key
     * @param  {Function}  handler      -  handler function
     */    
    decorator(metadataKey, handler) {
        function decorator(...args) {
            return decorate(handler, args);
        }
        decorator.get         = _metadataGetter.bind(this, metadataKey, false);
        decorator.getOwn      = _metadataGetter.bind(this, metadataKey, true);
        decorator.getKeys     = _metadataKeyGetter.bind(this, metadataKey, false);
        decorator.getOwnKeys  = _metadataKeyGetter.bind(this, metadataKey, true);        
        decorator.collect     = _metadataCollector.bind(this, metadataKey);
        decorator.collectKeys = _metadataKeyCollector.bind(this, metadataKey);
        return decorator;
    }
});

function _metadataGetter(metadataKey, own, target, targetKey) {
    return own
         ? this.getOwn(metadataKey, target, targetKey)
         : this.get(metadataKey, target, targetKey);
}

function _metadataKeyGetter(metadataKey, own,  target, callback) {
    let found = false;
    if (!$isFunction$1(callback)) return false;
    const keys = Reflect.ownKeys(own ? target : getPropertyDescriptors(target))
          .concat("constructor");
    keys.forEach(key => {
        const metadata = own
            ? this.getOwn(metadataKey, target, key)
            : this.get(metadataKey, target, key);
        if (metadata) {
            callback(metadata, key);
            found = true;
        }
    });
    return found;
}

function _metadataCollector(metadataKey, target, targetKey, callback) {
    if (!callback && $isFunction$1(targetKey)) {
        [targetKey, callback] = [null, targetKey];
    }
    if (!$isFunction$1(callback)) return;
    this.collect(metadataKey, target, targetKey, callback);
}

function _metadataKeyCollector(metadataKey, target, callback) {
    if (!$isFunction$1(callback)) return;
    const keys = Reflect.ownKeys(getPropertyDescriptors(target))
          .concat("constructor");
    keys.forEach(key => this.collect(metadataKey, target, key, callback));
}

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
const protocolGet         = Symbol();
const protocolSet         = Symbol();
const protocolInvoke      = Symbol();
const protocolDelegate    = Symbol();
const protocolStrict      = Symbol();
const protocolMetadataKey = Symbol();

const Protocol = Base.extend({
    constructor(delegate$$1, strict) {
        if ($isNothing(delegate$$1)) {
            delegate$$1 = new Delegate();
        } else if (!(delegate$$1 instanceof Delegate)) {
            if ($isFunction$1(delegate$$1.toDelegate)) {
                delegate$$1 = delegate$$1.toDelegate();
                if (!(delegate$$1 instanceof Delegate)) {
                    throw new TypeError("'toDelegate' method did not return a Delegate.");
                }
            } else if (Array.isArray(delegate$$1)) {
                delegate$$1 = new ArrayDelegate(delegate$$1);
            } else {
                delegate$$1 = new ObjectDelegate(delegate$$1);
            }
        }
        Object.defineProperties(this, {
            [protocolDelegate]: { value: delegate$$1, writable: false },            
            [protocolStrict]:   { value: !!strict, writable: false }
        });
    },
    [protocolGet](key) {
        const delegate$$1 = this[protocolDelegate];
        return delegate$$1 && delegate$$1.get(this.constructor, key, this[protocolStrict]);
    },
    [protocolSet](key, value) {
        const delegate$$1 = this[protocolDelegate];            
        return delegate$$1 && delegate$$1.set(this.constructor, key, value, this[protocolStrict]);
    },
    [protocolInvoke](methodName, args) {
        const delegate$$1 = this[protocolDelegate];                        
        return delegate$$1 && delegate$$1.invoke(this.constructor, methodName, args, this[protocolStrict]);
    }
}, {
    /**
     * Determines if `target` is a {{#crossLink "Protocol"}}{{/crossLink}}.
     * @static
     * @method isProtocol
     * @param   {Any}      target  -  target to test
     * @returns {boolean}  true if the target is a Protocol.
     */
    isProtocol(target) {
        return target && (target.prototype instanceof Protocol);
    },
    /**
     * Determines if `target` conforms to this protocol.
     * @static
     * @method isAdoptedBy
     * @param   {Any}      target    -  target to test
     * @returns {boolean}  true if the target conforms to this protocol.
     */
    isAdoptedBy(target) {
        if (!target) return false;
        if (this === target || (target && target.prototype instanceof this)) {
            return true;
        }
        const metaTarget = $isFunction$1(target) ? target.prototype : target;        
        return Metadata.collect(protocolMetadataKey, metaTarget,
                                protocols => protocols.has(this) ||
                                [...protocols].some(p => this.isAdoptedBy(p)));
    },
    /**
     * Marks `target` as conforming to this protocol.
     * @static
     * @method adoptBy
     * @param   {Any}      target  -  conforming target
     * @returns {boolean}  true if the this protocol could be adopted.
     */    
    adoptBy(target) {
        if (!target) return;
        const metaTarget = $isFunction$1(target) ? target.prototype : target;
        if (Metadata.collect(protocolMetadataKey, metaTarget, p => p.has(this))) {
            return false;
        }
        const protocols = Metadata.getOrCreateOwn(protocolMetadataKey, metaTarget, () => new Set());
        protocols.add(this);
        if ($isFunction$1(target.protocolAdopted)) {
            target.protocolAdopted(this);
        }
        return true;
    },
    /**
     * Notifies the `protocol` has been adopted.
     * @statics protocolAdopted
     * @method 
     * @param   {Protocol} protocol  -  protocol adopted
     */    
    protocolAdopted(protocol) {
        const prototype     = this.prototype,
              protocolProto = Protocol.prototype,
              props         = getPropertyDescriptors(protocol.prototype);
        Reflect.ownKeys(props).forEach(key => {
            if (getPropertyDescriptors(protocolProto, key) ||
                getPropertyDescriptors(prototype, key)) return;
            Object.defineProperty(prototype, key, props[key]);            
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

/**
 * Protocol base requiring conformance to match methods.
 * @class StrictProtocol
 * @constructor
 * @param   {Delegate}  delegate       -  delegate
 * @param   {boolean}   [strict=true]  -  true ifstrict, false otherwise
 * @extends miruekn.Protocol     
 */
const StrictProtocol = Protocol.extend({
    constructor(proxy, strict) {
        this.base(proxy, (strict === undefined) || strict);
    }
});

/**
 * Determines if `protocol` is a protocol.
 * @method $isProtocol
 * @param    {Any}     protocol  - target to test
 * @returns  {boolean} true if a protocol.
 */
const $isProtocol = Protocol.isProtocol;

/**
 * Gets all the `target` protocols.
 * @method $protocols
 * @param    {Any}     target  -  target
 * @param    {boolean} own     -  true if own protocols
 * @returns  {Array} conforming protocols.
 */
function $protocols(target, own) {
    if (!target) return [];
    if ($isFunction$1(target)) {
        target = target.prototype;
    }
    const protocols = !own ? new Set()
        : Metadata.getOwn(protocolMetadataKey, target);
    if (!own) {
        const add = protocols.add.bind(protocols);
        Metadata.collect(protocolMetadataKey, target,
          ps => ps.forEach(p => [p,...$protocols(p)].forEach(add)));
    }
    return (protocols && [...protocols]) || [];
}

/**
 * Marks a class as a {{#crossLink "Protocol"}}{{/crossLink}}.
 * @method protocol
 * @param  {Array}  args  -  protocol args
 */
function protocol(...args) {
    if (args.length === 0) {
        return function () {
            return _protocol.apply(null, arguments);
        };
    }
    return _protocol(...args);
}

function _protocol(target) {
    if ($isFunction$1(target)) {
        target = target.prototype;
    }
    Reflect.ownKeys(target).forEach(key => {
        if (key === "constructor") return;
        const descriptor = Object.getOwnPropertyDescriptor(target, key);
        if (!descriptor.enumerable) return;
        if ($isFunction$1(descriptor.value)) {
            descriptor.value = function (...args) {
                return this[protocolInvoke](key, args);
            };
        } else {
            const isSimple = descriptor.hasOwnProperty("value")
                          || descriptor.hasOwnProperty("initializer");
            if (isSimple) {
                delete descriptor.value;
                delete descriptor.writable;
            }
            if (descriptor.get || isSimple) {
                descriptor.get = function () {
                    return this[protocolGet](key);
                };
            }
            if (descriptor.set || isSimple) {
                descriptor.set = function (value) {
                    return this[protocolSet](key, value);
                };
            }
        }
        Object.defineProperty(target, key, descriptor);                
    });
}

/**
 * Marks a class or protocol as conforming to one or more
 * {{#crossLink "Protocol"}}{{/crossLink}}s.
 * @method conformsTo
 * @param    {Array}    protocols  -  conforming protocols
 * @returns  {Function} the conformsTo decorator.
 */
function conformsTo(...protocols) {
    protocols = $flatten(protocols, true);
    if (!protocols.every($isProtocol)) {
        throw new TypeError("Only Protocols can be conformed to");
    }
    return protocols.length === 0 ? Undefined : adopt;
    function adopt(target, key, descriptor) {
        if (isDescriptor(descriptor)) {
            throw new SyntaxError("@conformsTo can only be applied to classes");
        }
        protocols.forEach(protocol => protocol.adoptBy(target));
    }
}

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

const Enum = Base.extend({
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
        delete en[Defining];
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
};

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
const Flags = Enum.extend({
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

const baseExtend      = Base.extend;
const baseImplement   = Base.implement;
const baseProtoExtend = Base.prototype.extend;

const emptyArray = Object.freeze([]);
const nothing    = undefined;

/**
 * Type of property method.
 * @class PropertyType
 * @extends Enum
 */
const MethodType = Enum({
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
const Variance = Enum({
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

Base.extend = function (...args) {
    let constraints = args, decorators = [];
    if (this === Protocol) {
        decorators.push(protocol);
    } if ($isProtocol(this)) {
        decorators.push(protocol, conformsTo(this));
    }
    if (args.length > 0 && Array.isArray(args[0])) {
        constraints = args.shift();
    }
    while (constraints.length > 0) {
        const constraint = constraints[0];
        if (!constraint) {
            break;
        } else if ($isProtocol(constraint)) {
            decorators.push(conformsTo(constraint));
        } else if (constraint.prototype instanceof Base ||
                   constraint.prototype instanceof Module) {
            decorators.push(mixin(constraint));
        } else if ($isFunction$1(constraint)) {
            decorators.push(constraint);
        }
        else {
            break;
        }
        constraints.shift();
    }
    let members      = args.shift() || {},
        classMembers = args.shift() || {},
        derived      = baseExtend.call(this, members, classMembers);
    Metadata.copyOwn(derived, classMembers);
    Metadata.copyOwn(derived.prototype, members);
    if (decorators.length > 0) {
        derived = Reflect.decorate(decorators, derived);
    }
    return derived;                    
};

Base.implement = function (source) {
    if (source && $isProtocol(this) && $isObject(source)) {
        source = protocol(source) || source;
    }
    var type = baseImplement.call(this, source);
    Metadata.mergeOwn(type.prototype, source);
    return type;
};

Base.prototype.extend = function (key, value) {
    if (!key) return this;
    const numArgs = arguments.length;
    if (numArgs === 1) {
        if (this instanceof Protocol) {
            key = protocol(key) || key;
        }
        const instance = baseProtoExtend.call(this, key);
        Metadata.mergeOwn(instance, key);            
        return instance;
    }
    return baseProtoExtend.call(this, key, value);
};

/**
 * Decorates a class with behaviors to mix in.
 * @method mixin
 * @param    {Array}    ...behaviors  -  behaviors
 * @returns  {Function} the mixin decorator.
 */
function mixin(...behaviors) {
    behaviors = $flatten(behaviors, true);
    return function (target) {
        if (behaviors.length > 0 && $isFunction$1(target.implement)) {
            behaviors.forEach(b => target.implement(b));
        }
    };
}

/**
 * Protocol for targets that manage initialization.
 * @class Initializing
 * @extends Protocol
 */
const Initializing = Protocol.extend({
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
const Resolving = Protocol.extend();

/**
 * Protocol for targets that can execute functions.
 * @class Invoking
 * @extends StrictProtocol
 */
const Invoking = StrictProtocol.extend({
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
const Parenting = Protocol.extend({
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
const Starting = Protocol.extend({
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
const Startup = Base.extend(Starting, {
    start() {}
});

/**
 * Determines if `target` is a class.
 * @method $isClass
 * @param    {Any}     target  - target to test
 * @returns  {boolean} true if a class (and not a protocol).
 */
function $isClass(target) {
    if (!target || $isProtocol(target)) return false;    
    if (target.prototype instanceof Base) return true;
    const name = target.name;  // use Capital name convention
    return name && $isFunction$1(target) && isUpperCase(name.charAt(0));
}

/**
 * Gets the class `instance` is a member of.
 * @method $classOf
 * @param    {Object}  instance  - object
 * @returns  {Function} instance class. 
 */
function $classOf(instance) {
    return instance == null ? undefined : instance.constructor;
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
        const decorator = Object.create(decoratee);
        Object.defineProperty(decorator, "decoratee", {
            configurable: false,
            value:        decoratee
        });
        if (decorations && $isFunction$1(decorator.extend)) {
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
    let decoratee;
    while (decorator && (decoratee = decorator.decoratee)) {
        if (!deepest) return decoratee;
        decorator = decoratee;
    }
    return decorator;
}

function isUpperCase(char) {
    return char.toUpperCase() === char;
}

const designMetadataKey = Symbol();
const paramTypesKey     = "design:paramtypes";
const propertyTypeKey   = "design:type";

/**
 * Custom Metadata to bridge Typescript annotations.
 * @class DesignMetadata
 */
const DesignMetadata = Metadata.extend(null, {
    get(metadataKey, target, targetKey) {
        if (metadataKey === designMetadataKey) {
            return this.base(paramTypesKey, target, targetKey)
                || this.base(propertyTypeKey, target, targetKey);
        }
        return this.base(metadataKey, target, targetKey);
    },
    getOwn(metadataKey, target, targetKey) {
        if (metadataKey === designMetadataKey) {
            return this.base(paramTypesKey, target, targetKey)
                || this.base(propertyTypeKey, target, targetKey);
        }
        return this.base(metadataKey, target, targetKey);        
    }
});

/**
 * Attaches design metadata compatible with Typescript.
 * @method design
 */
const design = DesignMetadata.decorator(designMetadataKey,
    (target, key, descriptor, types) => {
        if (!isDescriptor(descriptor)) {
            if (target.length > key.length) {
                throw new SyntaxError(
                    `@design for constructor expects at least ${target.length} parameters but only ${key.length} specified`);
            }            
            _validateTypes(key);
            DesignMetadata.define(paramTypesKey, key, target.prototype, "constructor");
            return;
        }
        const { value } = descriptor;
        if ($isFunction$1(value)) {
            if (value.length > types.length) {
                throw new SyntaxError(
                    `@design for method '${key}' expects at least ${value.length} parameters but only ${types.length} specified`);
            }
            _validateTypes(types);
            DesignMetadata.define(paramTypesKey, types, target, key);        
        } else if (types.length !== 1) {
            throw new SyntaxError(`@design for property '${key}' requires a single type to be specified`);
        } else {
            _validateTypes(types);            
            DesignMetadata.define(propertyTypeKey, types[0], target, key);
        }
    });
    
function _validateTypes(types) {
    for (let i = 0; i < types.length; ++i) {
        let type = types[i];
        if (type == null) { return }
        if (Array.isArray(type)) {
            if (type.length !== 1) {
                throw new SyntaxError(`@design array specification at index ${i} expects a single type`);
            }
            type = type[0];
        }
        if (!$isFunction$1(type)) {
            throw new SyntaxError("@design expects basic types, classes or protocols");
        }
    }
}

/**
 * Protocol for targets that manage disposal lifecycle.
 * @class Disposing
 * @extends Protocol
 */
const Disposing = Protocol.extend({
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
const DisposingMixin = Module.extend({
    dispose(object) {
        if ($isFunction$1(object._dispose)) {
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
function $using(disposing, action, context) {
    if (disposing && $isFunction$1(disposing.dispose)) {
        if (!$isPromise(action)) {
            let result;
            try {
                result = $isFunction$1(action)
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
const TraversingAxis = Enum({
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
     * @property {number} SelfOrChild
     */
    SelfOrChild: 8,
    /**
     * Traverse current node and siblings.
     * @property {number} SelfOrSibling
     */
    SelfOrSibling: 9,
    /**
     * Traverse current node and ancestors.
     * @property {number} SelfOrAncestor
     */
    SelfOrAncestor: 10,
    /**
     * Traverse current node and descendents.
     * @property {number} SelfOrDescendant
     */
    SelfOrDescendant: 11,
    /**
     * Traverse current node and descendents in reverse.
     * @property {number} SelfOrDescendantReverse
     */
    SelfOrDescendantReverse: 12,
    /**
     * Traverse current node, ancestors and siblings.
     * @property {number} SelfSiblingOrAncestor 
     */
    SelfSiblingOrAncestor: 13
});

/**
 * Protocol for traversing an abitrary graph of objects.
 * @class Traversing
 * @extends Protocol
 */
const Traversing = Protocol.extend({
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
const TraversingMixin = Module.extend({
    traverse(object, axis, visitor, context) {
        if ($isFunction$1(axis)) {
            context = visitor;
            visitor = axis;
            axis    = TraversingAxis.Child;
        }
        if (!$isFunction$1(visitor)) return;
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
            traverseSelfSiblingOrAncestor.call(object, visitor, false, false, context);
            break;
            
        case TraversingAxis.SelfOrChild:
            traverseChildren.call(object, visitor, true, context);
            break;

        case TraversingAxis.SelfOrSibling:
            traverseSelfSiblingOrAncestor.call(object, visitor, true, false, context);
            break;
            
        case TraversingAxis.Ancestor:
            traverseAncestors.call(object, visitor, false, context);
            break;
            
        case TraversingAxis.SelfOrAncestor:
            traverseAncestors.call(object, visitor, true, context);
            break;
            
        case TraversingAxis.Descendant:
            traverseDescendants.call(object, visitor, false, context);
            break;
            
        case TraversingAxis.DescendantReverse:
            traverseDescendantsReverse.call(object, visitor, false, context);
            break;
            
        case TraversingAxis.SelfOrDescendant:
            traverseDescendants.call(object, visitor, true, context);
            break;

        case TraversingAxis.SelfOrDescendantReverse:
            traverseDescendantsReverse.call(object, visitor, true, context);
            break;
            
        case TraversingAxis.SelfSiblingOrAncestor:
            traverseSelfSiblingOrAncestor.call(object, visitor, true, true, context);
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

function traverseSelfSiblingOrAncestor(visitor, withSelf, withAncestor, context) {
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
const Traversal = Abstract.extend({}, {
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
    if (!node || !$isFunction$1(visitor) || visitor.call(context, node)) {
        return true;
    }
    if ($isFunction$1(node.traverse))
        node.traverse(child => preOrder(child, visitor, context, visited));
    return false;
}

function postOrder(node, visitor, context, visited = []) {
    checkCircularity(visited, node);
    if (!node || !$isFunction$1(visitor)) {
        return true;
    }
    if ($isFunction$1(node.traverse))
        node.traverse(child => postOrder(child, visitor, context, visited));
    return visitor.call(context, node);
}

function levelOrder(node, visitor, context, visited = []) {
    if (!node || !$isFunction$1(visitor)) {
        return;
    }
    const queue = [node];
    while (queue.length > 0) {
        const next = queue.shift();
        checkCircularity(visited, next);
        if (visitor.call(context, next)) {
            return;
        }
        if ($isFunction$1(next.traverse))
            next.traverse(child => {
                if (child) queue.push(child);
            });
    }
}

function reverseLevelOrder(node, visitor, context, visited = []) {
    if (!node || !$isFunction$1(visitor)) {
        return;
    }
    const queue = [node],
          stack = [];
    while (queue.length > 0) {
        const next = queue.shift();
        checkCircularity(visited, next);
        stack.push(next);
        const level = [];
        if ($isFunction$1(next.traverse))
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

const injectMetadataKey = Symbol();

/**
 * Specifies dependencies on properties and methods.
 * @method inject
 * @param  {Array}  ...dependencies  -  property/method dependencies
 */
const inject = Metadata.decorator(injectMetadataKey,
    (target, key, descriptor, dependencies) => {
        if (!isDescriptor(descriptor)) {
            dependencies = $flatten(key);
            Metadata.define(injectMetadataKey, dependencies, target.prototype, "constructor");
            return;
        }
        const { value } = descriptor;        
        dependencies = $flatten(dependencies);
        if ($isFunction$1(value)) {
            Metadata.define(injectMetadataKey, dependencies, target, key);
        } else if (dependencies.length !== 1) {
            throw new SyntaxError(`@inject for property '${key}' requires single key to be specified`);
        } else {
            Metadata.define(injectMetadataKey, dependencies[0], target, key);
        }
    });

/**
 * Annotates invariance.
 * @attribute $eq
 * @for Modifier
 */
const $eq = $createModifier();

/**
 * Annotates use value as is.
 * @attribute $use
 * @for Modifier
 */    
const $use = $createModifier();

/**
 * Annotates lazy semantics.
 * @attribute $lazy
 * @for Modifier
 */            
const $lazy = $createModifier();

/**
 * Annotates function to be evaluated.
 * @attribute $eval
 * @for Modifier
 */                
const $eval = $createModifier();

/**
 * Annotates zero or more semantics.
 * @attribute $every
 * @for Modifier
 */                    
const $every = $createModifier();

/**
 * Annotates 
 * @attribute use {{#crossLink "Parenting"}}{{/crossLink}} protocol.
 * @attribute $child
 * @for Modifier
 */                        
const $child = $createModifier();

/**
 * Annotates optional semantics.
 * @attribute $optional
 * @for Modifier
 */                        
const $optional = $createModifier();

/**
 * Annotates Promise expectation.
 * @attribute $promise
 * @for Modifier
 */                            
const $promise = $createModifier();

/**
 * Annotates synchronous.
 * @attribute $instant
 * @for Modifier
 */                                
const $instant = $createModifier();

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
            };
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
    };
    return modifier;
}

const Policy = Base.extend({
    /**
     * Merges this policy data into `policy`.
     * @method mergeInto
     * @param   {Policy}  policy  -  policy to receive data
     * @returns {boolean} true if policy could be merged into.
     */
    mergeInto(policy) {
        if (!(policy instanceof this.constructor)) {
            return false;
        }
        const descriptors = getPropertyDescriptors(this),
              keys        = Reflect.ownKeys(descriptors);
        keys.forEach(key => {
            const keyValue = this[key];
            if ($isFunction$1(keyValue)) { return; }
            if (keyValue !== undefined && this.hasOwnProperty(key)) {
                const policyValue = policy[key];
                if (policyValue === undefined || !policy.hasOwnProperty(key)) {
                    policy[key] = _copyPolicyValue(keyValue);
                } else if ($isFunction$1(keyValue.mergeInto)) {
                    keyValue.mergeInto(policyValue);
                }
            }
        });
        return true;
    },
    copy() {
        var policy = Reflect.construct(this.constructor, emptyArray);
        this.mergeInto(policy);
        return policy;
    }
}, {
    coerce(...args) { return Reflect.construct(this, args); }
});

function _copyPolicyValue(policyValue) {
    if ($isNothing(policyValue)) {
        return policyValue;
    }
    if (Array.isArray(policyValue)) {
        return policyValue.map(_copyPolicyValue);
    }
    if ($isFunction$1(policyValue.copy)) {
        return policyValue.copy();
    }
    return policyValue;
}

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
 * Facet choices for proxies.
 * @class Facet
 */
const Facet = Object.freeze({
    /**
     * @property {string} Parameters
     */
    Parameters: "proxy:parameters",
    /**
     * @property {string} Interceptors
     */        
    Interceptors: "proxy:interceptors",
    /**
     * @property {string} InterceptorSelectors
     */                
    InterceptorSelectors: "proxy:interceptorSelectors",
    /**
     * @property {string} Delegate
     */                        
    Delegate: "proxy:delegate"
});

/**
 * Base class for method interception.
 * @class Interceptor
 * @extends Base
 */
const Interceptor = Base.extend({
    /**
     * @method intercept
     * @param    {Object} invocation  - invocation
     * @returns  {Any} invocation result
     */
    intercept(invocation) { return invocation.proceed(); }
});

/**
 * Responsible for selecting which interceptors to apply to a method.
 * @class InterceptorSelector
 * @extends Base
 */
const InterceptorSelector = Base.extend({
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
const ProxyBuilder = Base.extend({
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
                spec.value = facets[Facet.InterceptorSelectors];
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
    const sources = [proxy].concat($protocols(proxy), protocols),
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
            if ($isFunction$1(value)) {
                if (isProtocol) value = null;
                descriptor.value = proxyMethod(key, value, proxy);
            } else {
                if (descriptor.hasOwnProperty("value")) {
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
        let   delegate$$1 = this.delegate,
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
            useDelegate(value) { delegate$$1 = value; },
            replaceDelegate(value) {
                _this.delegate = delegate$$1 = value;
            },
            get canProceed() {
                if (interceptors && (idx + 1 < interceptors.length)) {
                    return true;
                }
                if (delegate$$1) {
                    return $isFunction$1(delegate$$1[key]);
                }
                return !!method;
            },
            proceed() {
                ++idx;
                if (interceptors && idx < interceptors.length) {
                    const interceptor = interceptors[idx];
                    return interceptor.intercept(invocation);
                }
                if (delegate$$1) {
                    switch(type) {
                    case MethodType.Get:
                        return delegate$$1[key];
                    case MethodType.Set:
                        delegate$$1[key] = args[0];
                        break;
                    case MethodType.Invoke:
                        const invoke = delegate$$1[key];
                        if ($isFunction$1(invoke)) {
                            return invoke.apply(delegate$$1, this.args);
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
            if ($isFunction$1(value)) {
                const baseValue = baseDescriptor.value;
                if ($isFunction$1(value) && value.baseMethod) {
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
        if ($isFunction$1(value)) {
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

export { Undefined, Null, True, False, Base, Package, Abstract, Module, pcopy, extend, getPropertyDescriptors, instanceOf, typeOf, assignID, format, csv, bind, partial, delegate, copy, emptyArray, nothing, MethodType, Variance, mixin, Initializing, Resolving, Invoking, Parenting, Starting, Startup, $isClass, $classOf, $decorator, $decorate, $decorated, decorate, isDescriptor, Delegate, ObjectDelegate, ArrayDelegate, design, Disposing, DisposingMixin, $using, Enum, Flags, TraversingAxis, Traversing, TraversingMixin, Traversal, inject, Metadata, $eq, $use, $lazy, $eval, $every, $child, $optional, $promise, $instant, Modifier, $createModifier, Policy, Protocol, StrictProtocol, $isProtocol, $protocols, protocol, conformsTo, Facet, Interceptor, InterceptorSelector, ProxyBuilder, ArrayManager, IndexedList, $isString, $isSymbol, $isFunction$1 as $isFunction, $isObject, $isPlainObject, $isPromise, $isNothing, $isSomething$1 as $isSomething, $lift, $flatten, $equals, $debounce };
