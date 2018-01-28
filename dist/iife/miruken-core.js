var mirukenCore = (function (exports) {
'use strict';

/*
  base2 - copyright 2007-2009, Dean Edwards
  http://code.google.com/p/base2/
  http://www.opensource.org/licenses/mit-license.php

  Contributors:
    Doeke Zanstra
*/

var Undefined = K();
var Null = K(null);
var True = K(true);
var False = K(false);

var __prototyping;
var _counter = 1;

var _IGNORE = K();
var _BASE = /\bbase\b/;
var _HIDDEN = ["constructor", "toString"];
var _slice = Array.prototype.slice;

// =========================================================================
// base2/Base.js
// =========================================================================

// http://dean.edwards.name/weblog/2006/03/base/

var _subclass = function (_instance, _static) {
  // Build the prototype.
  __prototyping = this.prototype;
  var _prototype = new this();
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
        } while ((cls = cls.ancestor) && cls != exports.Base);
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

exports.Base = _subclass.call(Object, {
  constructor: function () {
    if (arguments.length > 0 && typeOf(arguments[0]) === 'object') {
      this.extend(arguments[0]);
    }
  },

  extend: delegate(extend),

  toString: function () {
    if (this.constructor.toString == Function.prototype.toString) {
      return "[object base2.Base]";
    } else {
      return "[object " + this.constructor.toString().slice(1, -1) + "]";
    }
  }
}, exports.Base = {
  ancestorOf: function (klass) {
    return _ancestorOf(this, klass);
  },

  extend: _subclass,

  implement: function (source) {
    if (typeof source == "function") {
      source = source.prototype;
    }
    // Add the interface using the extend() function.
    extend(this.prototype, source);
    return this;
  }
});

exports.Base.base = exports.Base.prototype.base = function () {
  // call this method from any other method to invoke that method's ancestor
};

// =========================================================================
// base2/Package.js
// =========================================================================

var Package = exports.Base.extend({
  constructor: function (_private, _public) {
    var pkg = this,
        openPkg;

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
      var imports = csv(pkg.imports),
          name;
      for (var i = 0; name = imports[i]; i++) {
        var ns = lookup(name) || lookup("js." + name);
        if (!ns) throw new ReferenceError(format("Object not found: '%1'.", name));
        namespace += ns.namespace;
      }
      if (openPkg) namespace += openPkg.namespace;

      _private.init = function () {
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
      _private.exported = function () {
        if (nsPkg.exported) nsPkg.exported(exports);
      };
      _private.exports = "if(!" + pkg.name + ")var " + pkg.name + "=this.__package;" + namespace + "this._label_" + pkg.name + "();this.exported();";

      // give objects and classes pretty toString methods
      var packageName = pkg.toString().slice(1, -1);
      _private["_label_" + pkg.name] = function () {
        for (var name in nsPkg) {
          var object = nsPkg[name];
          if (object && object.ancestorOf == exports.Base.ancestorOf && name != "constructor") {
            // it's a class
            object.toString = K("[" + packageName + "." + name + "]");
          }
        }
      };
    }

    if (openPkg) return openPkg;

    function lookup(names) {
      names = names.split(".");
      var value = base2,
          i = 0;
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

  open: function (_private, _public) {
    _public.name = this.name;
    _public.parent = this.parent;
    return new Package(_private, _public);
  },

  addName: function (name, value) {
    if (!this[name]) {
      this[name] = value;
      this.exports += "," + name;
      this.namespace += format("var %1=%2.%1;", name, this.name);
      if (value && value.ancestorOf == exports.Base.ancestorOf && name != "constructor") {
        // it's a class
        value.toString = K("[" + this.toString().slice(1, -1) + "." + name + "]");
      }
      if (this.exported) this.exported([name]);
    }
  },

  addPackage: function (name) {
    var pkg = new Package(null, { name: name, parent: this });
    this.addName(name, pkg);
    return pkg;
  },

  package: function (_private, _public) {
    _public.parent = this;
    return new Package(_private, _public);
  },

  toString: function () {
    return format("[%1]", this.parent ? this.parent.toString().slice(1, -1) + "." + this.name : this.name);
  }
});

// =========================================================================
// base2/Abstract.js
// =========================================================================

var Abstract = exports.Base.extend({
  constructor: function () {
    throw new TypeError("Abstract class cannot be instantiated.");
  }
});

// =========================================================================
// base2/Module.js
// =========================================================================

var _moduleCount = 0;

var Module = Abstract.extend(null, {
  namespace: "",

  extend: function (_interface, _static) {
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

  implement: function (_interface) {
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

  partial: function () {
    var module = Module.extend();
    var id = module.toString().slice(1, -1);
    // partial methods are already bound so remove the binding to speed things up
    module.namespace = this.namespace.replace(/(\w+)=b[^\)]+\)/g, "$1=" + id + ".$1");
    this.forEach(function (method, name) {
      module[name] = partial(bind(method, module));
    });
    return module;
  }
});

Module.prototype.base = Module.prototype.extend = _IGNORE;

function _extendModule(module, _interface) {
  var proto = module.prototype;
  var id = module.toString().slice(1, -1);
  for (var name in _interface) {
    var property = _interface[name],
        namespace = "";
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
  return function () {
    return module[name].apply(module, arguments);
  };
}

function _createModuleMethod(module, name) {
  return function () {
    var args = _slice.call(arguments);
    args.unshift(this);
    return module[name].apply(module, args);
  };
}

function pcopy(object) {
  // Prototype-base copy.
  // Doug Crockford / Richard Cornford
  _dummy.prototype = object;
  return new _dummy();
}

function _dummy() {}

// =========================================================================
// lang/extend.js
// =========================================================================

function extend(object, source) {
  // or extend(object, key, value)
  if (object && source) {
    var useProto = __prototyping;
    if (arguments.length > 2) {
      // Extending with a key/value pair.
      var key = source;
      source = {};
      source[key] = arguments[2];
      useProto = true;
    }
    var proto = (typeof source == "function" ? Function : Object).prototype;
    // Add constructor, toString etc
    if (useProto) {
      var i = _HIDDEN.length,
          key;
      while (key = _HIDDEN[--i]) {
        var desc = getPropertyDescriptors(source, key);
        if (!desc || desc.enumerable && desc.value != proto[key]) {
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
  if (typeof value !== "function" && "value" in desc) {
    return desc;
  }
  var ancestor = getPropertyDescriptors(object, key);
  if (!ancestor) return desc;
  var superObject = __prototyping; // late binding for prototypes;
  if (superObject) {
    var sprop = getPropertyDescriptors(superObject, key);
    if (sprop && (sprop.value != ancestor.value || sprop.get != ancestor.get || sprop.set != ancestor.set)) {
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
              method = superObject && superObject[key] || avalue;
          this.base = Undefined; // method overriden in ctor
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
  var get = desc.get,
      aget = ancestor.get;
  if (get) {
    if (aget && _BASE.test(get)) {
      desc.get = function () {
        var b = this.base;
        this.base = function () {
          var b = this.base,
              get = superObject && getPropertyDescriptors(superObject, key).get || aget;
          this.base = Undefined; // getter overriden in ctor            
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
  var set = desc.set,
      aset = ancestor.set;
  if (set) {
    if (aset && _BASE.test(set)) {
      desc.set = function () {
        var b = this.base;
        this.base = function () {
          var b = this.base,
              set = superObject && getPropertyDescriptors(superObject, key).set || aset;
          this.base = Undefined; // setter overriden in ctor            
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
      own = false,
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
  } while ((own = false, obj = Object.getPrototypeOf(obj)));
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
  if (exports.Base.ancestorOf == klass.ancestorOf) return false;

  // base2 objects can only be instances of Object.
  if (exports.Base.ancestorOf == object.constructor.ancestorOf) return klass == Object;

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
      return object == null ? "null" : typeof object.constructor == "function" && _toString.call(object) != "[object Date]" ? typeof object.constructor.prototype.valueOf() // underlying type
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
  return (string + "").replace(pattern, function (match, index) {
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
    return function () {
      return (lateBound ? context[fn] : fn).apply(context, args.concat.apply(args, arguments));
    };
  } else {
    // Faster if there are no additional arguments.
    return function () {
      return (lateBound ? context[fn] : fn).apply(context, arguments);
    };
  }
}

function partial(fn) {
  // Based on Oliver Steele's version.
  var args = _slice.call(arguments, 1);
  return function () {
    var specialised = args.concat(),
        i = 0,
        j = 0;
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
  return function () {
    var args = _slice.call(arguments);
    args.unshift(this);
    return fn.apply(context, args);
  };
}

function K(k) {
  return function () {
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

    var keys = ["value", "initializer", "get", "set"];

    for (var i = 0, l = keys.length; i < l; i++) {
        if (desc.hasOwnProperty(keys[i])) {
            return true;
        }
    }

    return false;
}

/**
 * Helper class to simplify array manipulation.
 * @class ArrayManager
 * @constructor
 * @param  {Array}  [...items]  -  initial items
 * @extends Base
 */
var ArrayManager = exports.Base.extend({
    constructor(items) {
        var _items = [];
        this.extend({
            /** 
             * Gets the array.
             * @method getItems
             * @returns  {Array} array.
             */
            getItems() {
                return _items;
            },
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
            append() /* items */{
                var newItems = void 0;
                if (arguments.length === 1 && Array.isArray(arguments[0])) {
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
            merge(items) {
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
    mapItem(item) {
        return item;
    }
});

/**
 * Maintains a simple doublely-linked list with indexing.
 * Indexes are partially ordered according to the order comparator.
 * @class IndexedList
 * @constructor
 * @param  {Function}  order  -  partially orders items
 * @extends Base
 */
var IndexedList = exports.Base.extend({
    constructor(order = defaultOrder) {
        var _index = {};
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
                var index = node.index;
                var indexedNode = this.getFirst(index);
                while (indexedNode && indexedNode.index === index) {
                    if ($equals(indxedNode, node)) {
                        return true;
                    }
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
                var indexedNode = this.getFirst(index);
                var insert = indexedNode;
                if (index) {
                    insert = insert || this.head;
                    while (insert && order(node, insert) >= 0) {
                        insert = insert.next;
                    }
                }
                if (insert) {
                    var prev = insert.prev;
                    node.next = insert;
                    node.prev = prev;
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
                if (!list) {
                    return this;
                }
                if (list.constructor !== this.constructor) {
                    throw new TypeError("merge expects lists of equal type");
                }
                var node = list.head;
                while (node) {
                    var next = node.next;
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
function $isFunction(fn) {
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
    return promise && $isFunction(promise.then);
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
function $isSomething(value) {
    return value != null;
}

/**
 * Returns a function that returns `value`.
 * @method $lift
 * @param    {Any}      value  -  any value
 * @returns  {Function} function that returns value.
 */
function $lift(value) {
    return function () {
        return value;
    };
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
    var items = arr.map(item => $flatten(item, prune));
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
 * @param    {Any}     obj1  -  first object
 * @param    {Any}     obj2  -  second object
 * @returns  {boolean} true if the obejcts are considered equal, false otherwise.
 */
function $equals(obj1, obj2) {
    if (obj1 === obj2) {
        return true;
    }
    if (obj1 && $isFunction(obj1.equals)) {
        return obj1.equals(obj2);
    } else if (obj2 && $isFunction(obj2.equals)) {
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
    var timeout = void 0;
    return function () {
        var context = this,
            args = arguments;
        var later = function () {
            timeout = null;
            if (!immediate) {
                return fn.apply(context, args);
            }
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) {
            return fn.apply(context, args);
        }
        return defaultReturnValue;
    };
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
    var { get, set, value, initializer } = descriptor;
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
 * Delegates properties and methods to another object.<br/>
 * See {{#crossLink "Protocol"}}{{/crossLink}}
 * @class Delegate
 * @extends Base
 */
var Delegate = exports.Base.extend({
    /**
     * Delegates the property get on `protocol`.
     * @method get
     * @param   {Protocol} protocol  - receiving protocol
     * @param   {string}   key       - key of the property
     * @returns {Any} result of the proxied get.
     */
    get(protocol, key) {},
    /**
     * Delegates the property set on `protocol`.
     * @method set
     * @param   {Protocol} protocol  - receiving protocol
     * @param   {string}   key       - key of the property
     * @param   {Object}   value     - value of the property
     */
    set(protocol, key, value) {},
    /**
     * Delegates the method invocation on `protocol`.
     * @method invoke
     * @param   {Protocol} protocol    - receiving protocol
     * @param   {string}   methodName  - name of the method
     * @param   {Array}    args        - method arguments
     * @returns {Any} result of the proxied invocation.
     */
    invoke(protocol, methodName, args) {}
});

/**
 * Delegates properties and methods to an object.
 * @class ObjectDelegate
 * @constructor
 * @param   {Object}  object  - receiving object
 * @extends Delegate
 */
var ObjectDelegate = Delegate.extend({
    constructor(object) {
        Object.defineProperty(this, "object", { value: object });
    },
    get(protocol, key) {
        var object = this.object;
        if (object) {
            return object[key];
        }
    },
    set(protocol, key, value) {
        var object = this.object;
        if (object) {
            return object[key] = value;
        }
    },
    invoke(protocol, methodName, args) {
        var object = this.object;
        if (object) {
            var method = object[methodName];
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
var ArrayDelegate = Delegate.extend({
    constructor(array) {
        Object.defineProperty(this, "array", { value: array });
    },
    get(protocol, key) {
        var array = this.array;
        return array && array.reduce((result, object) => object[key], undefined);
    },
    set(protocol, key, value) {
        var array = this.array;
        return array && array.reduce((result, object) => object[key] = value, undefined);
    },
    invoke(protocol, methodName, args) {
        var array = this.array;
        return array && array.reduce((result, object) => {
            var method = object[methodName];
            return method ? method.apply(object, args) : result;
        }, undefined);
    }
});

/*! *****************************************************************************
Copyright (C) Microsoft. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */
var Reflect$1;
(function (Reflect) {
    // Metadata Proposal
    // https://rbuckton.github.io/reflect-metadata/
    (function (factory) {
        var root = typeof global === "object" ? global : typeof self === "object" ? self : typeof this === "object" ? this : Function("return this;")();
        var exporter = makeExporter(Reflect);
        if (typeof root.Reflect === "undefined") {
            root.Reflect = Reflect;
        } else {
            exporter = makeExporter(root.Reflect, exporter);
        }
        factory(exporter);
        function makeExporter(target, previous) {
            return function (key, value) {
                if (typeof target[key] !== "function") {
                    Object.defineProperty(target, key, { configurable: true, writable: true, value: value });
                }
                if (previous) previous(key, value);
            };
        }
    })(function (exporter) {
        var hasOwn = Object.prototype.hasOwnProperty;
        // feature test for Symbol support
        var supportsSymbol = typeof Symbol === "function";
        var toPrimitiveSymbol = supportsSymbol && typeof Symbol.toPrimitive !== "undefined" ? Symbol.toPrimitive : "@@toPrimitive";
        var iteratorSymbol = supportsSymbol && typeof Symbol.iterator !== "undefined" ? Symbol.iterator : "@@iterator";
        var supportsCreate = typeof Object.create === "function"; // feature test for Object.create support
        var supportsProto = { __proto__: [] } instanceof Array; // feature test for __proto__ support
        var downLevel = !supportsCreate && !supportsProto;
        var HashMap = {
            // create an object in dictionary mode (a.k.a. "slow" mode in v8)
            create: supportsCreate ? function () {
                return MakeDictionary(Object.create(null));
            } : supportsProto ? function () {
                return MakeDictionary({ __proto__: null });
            } : function () {
                return MakeDictionary({});
            },
            has: downLevel ? function (map, key) {
                return hasOwn.call(map, key);
            } : function (map, key) {
                return key in map;
            },
            get: downLevel ? function (map, key) {
                return hasOwn.call(map, key) ? map[key] : undefined;
            } : function (map, key) {
                return map[key];
            }
        };
        // Load global or shim versions of Map, Set, and WeakMap
        var functionPrototype = Object.getPrototypeOf(Function);
        var usePolyfill = typeof process === "object" && process.env && process.env["REFLECT_METADATA_USE_MAP_POLYFILL"] === "true";
        var _Map = !usePolyfill && typeof Map === "function" && typeof Map.prototype.entries === "function" ? Map : CreateMapPolyfill();
        var _Set = !usePolyfill && typeof Set === "function" && typeof Set.prototype.entries === "function" ? Set : CreateSetPolyfill();
        var _WeakMap = !usePolyfill && typeof WeakMap === "function" ? WeakMap : CreateWeakMapPolyfill();
        // [[Metadata]] internal slot
        // https://rbuckton.github.io/reflect-metadata/#ordinary-object-internal-methods-and-internal-slots
        var Metadata = new _WeakMap();
        /**
         * Applies a set of decorators to a property of a target object.
         * @param decorators An array of decorators.
         * @param target The target object.
         * @param propertyKey (Optional) The property key to decorate.
         * @param attributes (Optional) The property descriptor for the target key.
         * @remarks Decorators are applied in reverse order.
         * @example
         *
         *     class Example {
         *         // property declarations are not part of ES6, though they are valid in TypeScript:
         *         // static staticProperty;
         *         // property;
         *
         *         constructor(p) { }
         *         static staticMethod(p) { }
         *         method(p) { }
         *     }
         *
         *     // constructor
         *     Example = Reflect.decorate(decoratorsArray, Example);
         *
         *     // property (on constructor)
         *     Reflect.decorate(decoratorsArray, Example, "staticProperty");
         *
         *     // property (on prototype)
         *     Reflect.decorate(decoratorsArray, Example.prototype, "property");
         *
         *     // method (on constructor)
         *     Object.defineProperty(Example, "staticMethod",
         *         Reflect.decorate(decoratorsArray, Example, "staticMethod",
         *             Object.getOwnPropertyDescriptor(Example, "staticMethod")));
         *
         *     // method (on prototype)
         *     Object.defineProperty(Example.prototype, "method",
         *         Reflect.decorate(decoratorsArray, Example.prototype, "method",
         *             Object.getOwnPropertyDescriptor(Example.prototype, "method")));
         *
         */
        function decorate(decorators, target, propertyKey, attributes) {
            if (!IsUndefined(propertyKey)) {
                if (!IsArray(decorators)) throw new TypeError();
                if (!IsObject(target)) throw new TypeError();
                if (!IsObject(attributes) && !IsUndefined(attributes) && !IsNull(attributes)) throw new TypeError();
                if (IsNull(attributes)) attributes = undefined;
                propertyKey = ToPropertyKey(propertyKey);
                return DecorateProperty(decorators, target, propertyKey, attributes);
            } else {
                if (!IsArray(decorators)) throw new TypeError();
                if (!IsConstructor(target)) throw new TypeError();
                return DecorateConstructor(decorators, target);
            }
        }
        exporter("decorate", decorate);
        // 4.1.2 Reflect.metadata(metadataKey, metadataValue)
        // https://rbuckton.github.io/reflect-metadata/#reflect.metadata
        /**
         * A default metadata decorator factory that can be used on a class, class member, or parameter.
         * @param metadataKey The key for the metadata entry.
         * @param metadataValue The value for the metadata entry.
         * @returns A decorator function.
         * @remarks
         * If `metadataKey` is already defined for the target and target key, the
         * metadataValue for that key will be overwritten.
         * @example
         *
         *     // constructor
         *     @Reflect.metadata(key, value)
         *     class Example {
         *     }
         *
         *     // property (on constructor, TypeScript only)
         *     class Example {
         *         @Reflect.metadata(key, value)
         *         static staticProperty;
         *     }
         *
         *     // property (on prototype, TypeScript only)
         *     class Example {
         *         @Reflect.metadata(key, value)
         *         property;
         *     }
         *
         *     // method (on constructor)
         *     class Example {
         *         @Reflect.metadata(key, value)
         *         static staticMethod() { }
         *     }
         *
         *     // method (on prototype)
         *     class Example {
         *         @Reflect.metadata(key, value)
         *         method() { }
         *     }
         *
         */
        function metadata(metadataKey, metadataValue) {
            function decorator(target, propertyKey) {
                if (!IsObject(target)) throw new TypeError();
                if (!IsUndefined(propertyKey) && !IsPropertyKey(propertyKey)) throw new TypeError();
                OrdinaryDefineOwnMetadata(metadataKey, metadataValue, target, propertyKey);
            }
            return decorator;
        }
        exporter("metadata", metadata);
        /**
         * Define a unique metadata entry on the target.
         * @param metadataKey A key used to store and retrieve metadata.
         * @param metadataValue A value that contains attached metadata.
         * @param target The target object on which to define metadata.
         * @param propertyKey (Optional) The property key for the target.
         * @example
         *
         *     class Example {
         *         // property declarations are not part of ES6, though they are valid in TypeScript:
         *         // static staticProperty;
         *         // property;
         *
         *         constructor(p) { }
         *         static staticMethod(p) { }
         *         method(p) { }
         *     }
         *
         *     // constructor
         *     Reflect.defineMetadata("custom:annotation", options, Example);
         *
         *     // property (on constructor)
         *     Reflect.defineMetadata("custom:annotation", options, Example, "staticProperty");
         *
         *     // property (on prototype)
         *     Reflect.defineMetadata("custom:annotation", options, Example.prototype, "property");
         *
         *     // method (on constructor)
         *     Reflect.defineMetadata("custom:annotation", options, Example, "staticMethod");
         *
         *     // method (on prototype)
         *     Reflect.defineMetadata("custom:annotation", options, Example.prototype, "method");
         *
         *     // decorator factory as metadata-producing annotation.
         *     function MyAnnotation(options): Decorator {
         *         return (target, key?) => Reflect.defineMetadata("custom:annotation", options, target, key);
         *     }
         *
         */
        function defineMetadata(metadataKey, metadataValue, target, propertyKey) {
            if (!IsObject(target)) throw new TypeError();
            if (!IsUndefined(propertyKey)) propertyKey = ToPropertyKey(propertyKey);
            return OrdinaryDefineOwnMetadata(metadataKey, metadataValue, target, propertyKey);
        }
        exporter("defineMetadata", defineMetadata);
        /**
         * Gets a value indicating whether the target object or its prototype chain has the provided metadata key defined.
         * @param metadataKey A key used to store and retrieve metadata.
         * @param target The target object on which the metadata is defined.
         * @param propertyKey (Optional) The property key for the target.
         * @returns `true` if the metadata key was defined on the target object or its prototype chain; otherwise, `false`.
         * @example
         *
         *     class Example {
         *         // property declarations are not part of ES6, though they are valid in TypeScript:
         *         // static staticProperty;
         *         // property;
         *
         *         constructor(p) { }
         *         static staticMethod(p) { }
         *         method(p) { }
         *     }
         *
         *     // constructor
         *     result = Reflect.hasMetadata("custom:annotation", Example);
         *
         *     // property (on constructor)
         *     result = Reflect.hasMetadata("custom:annotation", Example, "staticProperty");
         *
         *     // property (on prototype)
         *     result = Reflect.hasMetadata("custom:annotation", Example.prototype, "property");
         *
         *     // method (on constructor)
         *     result = Reflect.hasMetadata("custom:annotation", Example, "staticMethod");
         *
         *     // method (on prototype)
         *     result = Reflect.hasMetadata("custom:annotation", Example.prototype, "method");
         *
         */
        function hasMetadata(metadataKey, target, propertyKey) {
            if (!IsObject(target)) throw new TypeError();
            if (!IsUndefined(propertyKey)) propertyKey = ToPropertyKey(propertyKey);
            return OrdinaryHasMetadata(metadataKey, target, propertyKey);
        }
        exporter("hasMetadata", hasMetadata);
        /**
         * Gets a value indicating whether the target object has the provided metadata key defined.
         * @param metadataKey A key used to store and retrieve metadata.
         * @param target The target object on which the metadata is defined.
         * @param propertyKey (Optional) The property key for the target.
         * @returns `true` if the metadata key was defined on the target object; otherwise, `false`.
         * @example
         *
         *     class Example {
         *         // property declarations are not part of ES6, though they are valid in TypeScript:
         *         // static staticProperty;
         *         // property;
         *
         *         constructor(p) { }
         *         static staticMethod(p) { }
         *         method(p) { }
         *     }
         *
         *     // constructor
         *     result = Reflect.hasOwnMetadata("custom:annotation", Example);
         *
         *     // property (on constructor)
         *     result = Reflect.hasOwnMetadata("custom:annotation", Example, "staticProperty");
         *
         *     // property (on prototype)
         *     result = Reflect.hasOwnMetadata("custom:annotation", Example.prototype, "property");
         *
         *     // method (on constructor)
         *     result = Reflect.hasOwnMetadata("custom:annotation", Example, "staticMethod");
         *
         *     // method (on prototype)
         *     result = Reflect.hasOwnMetadata("custom:annotation", Example.prototype, "method");
         *
         */
        function hasOwnMetadata(metadataKey, target, propertyKey) {
            if (!IsObject(target)) throw new TypeError();
            if (!IsUndefined(propertyKey)) propertyKey = ToPropertyKey(propertyKey);
            return OrdinaryHasOwnMetadata(metadataKey, target, propertyKey);
        }
        exporter("hasOwnMetadata", hasOwnMetadata);
        /**
         * Gets the metadata value for the provided metadata key on the target object or its prototype chain.
         * @param metadataKey A key used to store and retrieve metadata.
         * @param target The target object on which the metadata is defined.
         * @param propertyKey (Optional) The property key for the target.
         * @returns The metadata value for the metadata key if found; otherwise, `undefined`.
         * @example
         *
         *     class Example {
         *         // property declarations are not part of ES6, though they are valid in TypeScript:
         *         // static staticProperty;
         *         // property;
         *
         *         constructor(p) { }
         *         static staticMethod(p) { }
         *         method(p) { }
         *     }
         *
         *     // constructor
         *     result = Reflect.getMetadata("custom:annotation", Example);
         *
         *     // property (on constructor)
         *     result = Reflect.getMetadata("custom:annotation", Example, "staticProperty");
         *
         *     // property (on prototype)
         *     result = Reflect.getMetadata("custom:annotation", Example.prototype, "property");
         *
         *     // method (on constructor)
         *     result = Reflect.getMetadata("custom:annotation", Example, "staticMethod");
         *
         *     // method (on prototype)
         *     result = Reflect.getMetadata("custom:annotation", Example.prototype, "method");
         *
         */
        function getMetadata(metadataKey, target, propertyKey) {
            if (!IsObject(target)) throw new TypeError();
            if (!IsUndefined(propertyKey)) propertyKey = ToPropertyKey(propertyKey);
            return OrdinaryGetMetadata(metadataKey, target, propertyKey);
        }
        exporter("getMetadata", getMetadata);
        /**
         * Gets the metadata value for the provided metadata key on the target object.
         * @param metadataKey A key used to store and retrieve metadata.
         * @param target The target object on which the metadata is defined.
         * @param propertyKey (Optional) The property key for the target.
         * @returns The metadata value for the metadata key if found; otherwise, `undefined`.
         * @example
         *
         *     class Example {
         *         // property declarations are not part of ES6, though they are valid in TypeScript:
         *         // static staticProperty;
         *         // property;
         *
         *         constructor(p) { }
         *         static staticMethod(p) { }
         *         method(p) { }
         *     }
         *
         *     // constructor
         *     result = Reflect.getOwnMetadata("custom:annotation", Example);
         *
         *     // property (on constructor)
         *     result = Reflect.getOwnMetadata("custom:annotation", Example, "staticProperty");
         *
         *     // property (on prototype)
         *     result = Reflect.getOwnMetadata("custom:annotation", Example.prototype, "property");
         *
         *     // method (on constructor)
         *     result = Reflect.getOwnMetadata("custom:annotation", Example, "staticMethod");
         *
         *     // method (on prototype)
         *     result = Reflect.getOwnMetadata("custom:annotation", Example.prototype, "method");
         *
         */
        function getOwnMetadata(metadataKey, target, propertyKey) {
            if (!IsObject(target)) throw new TypeError();
            if (!IsUndefined(propertyKey)) propertyKey = ToPropertyKey(propertyKey);
            return OrdinaryGetOwnMetadata(metadataKey, target, propertyKey);
        }
        exporter("getOwnMetadata", getOwnMetadata);
        /**
         * Gets the metadata keys defined on the target object or its prototype chain.
         * @param target The target object on which the metadata is defined.
         * @param propertyKey (Optional) The property key for the target.
         * @returns An array of unique metadata keys.
         * @example
         *
         *     class Example {
         *         // property declarations are not part of ES6, though they are valid in TypeScript:
         *         // static staticProperty;
         *         // property;
         *
         *         constructor(p) { }
         *         static staticMethod(p) { }
         *         method(p) { }
         *     }
         *
         *     // constructor
         *     result = Reflect.getMetadataKeys(Example);
         *
         *     // property (on constructor)
         *     result = Reflect.getMetadataKeys(Example, "staticProperty");
         *
         *     // property (on prototype)
         *     result = Reflect.getMetadataKeys(Example.prototype, "property");
         *
         *     // method (on constructor)
         *     result = Reflect.getMetadataKeys(Example, "staticMethod");
         *
         *     // method (on prototype)
         *     result = Reflect.getMetadataKeys(Example.prototype, "method");
         *
         */
        function getMetadataKeys(target, propertyKey) {
            if (!IsObject(target)) throw new TypeError();
            if (!IsUndefined(propertyKey)) propertyKey = ToPropertyKey(propertyKey);
            return OrdinaryMetadataKeys(target, propertyKey);
        }
        exporter("getMetadataKeys", getMetadataKeys);
        /**
         * Gets the unique metadata keys defined on the target object.
         * @param target The target object on which the metadata is defined.
         * @param propertyKey (Optional) The property key for the target.
         * @returns An array of unique metadata keys.
         * @example
         *
         *     class Example {
         *         // property declarations are not part of ES6, though they are valid in TypeScript:
         *         // static staticProperty;
         *         // property;
         *
         *         constructor(p) { }
         *         static staticMethod(p) { }
         *         method(p) { }
         *     }
         *
         *     // constructor
         *     result = Reflect.getOwnMetadataKeys(Example);
         *
         *     // property (on constructor)
         *     result = Reflect.getOwnMetadataKeys(Example, "staticProperty");
         *
         *     // property (on prototype)
         *     result = Reflect.getOwnMetadataKeys(Example.prototype, "property");
         *
         *     // method (on constructor)
         *     result = Reflect.getOwnMetadataKeys(Example, "staticMethod");
         *
         *     // method (on prototype)
         *     result = Reflect.getOwnMetadataKeys(Example.prototype, "method");
         *
         */
        function getOwnMetadataKeys(target, propertyKey) {
            if (!IsObject(target)) throw new TypeError();
            if (!IsUndefined(propertyKey)) propertyKey = ToPropertyKey(propertyKey);
            return OrdinaryOwnMetadataKeys(target, propertyKey);
        }
        exporter("getOwnMetadataKeys", getOwnMetadataKeys);
        /**
         * Deletes the metadata entry from the target object with the provided key.
         * @param metadataKey A key used to store and retrieve metadata.
         * @param target The target object on which the metadata is defined.
         * @param propertyKey (Optional) The property key for the target.
         * @returns `true` if the metadata entry was found and deleted; otherwise, false.
         * @example
         *
         *     class Example {
         *         // property declarations are not part of ES6, though they are valid in TypeScript:
         *         // static staticProperty;
         *         // property;
         *
         *         constructor(p) { }
         *         static staticMethod(p) { }
         *         method(p) { }
         *     }
         *
         *     // constructor
         *     result = Reflect.deleteMetadata("custom:annotation", Example);
         *
         *     // property (on constructor)
         *     result = Reflect.deleteMetadata("custom:annotation", Example, "staticProperty");
         *
         *     // property (on prototype)
         *     result = Reflect.deleteMetadata("custom:annotation", Example.prototype, "property");
         *
         *     // method (on constructor)
         *     result = Reflect.deleteMetadata("custom:annotation", Example, "staticMethod");
         *
         *     // method (on prototype)
         *     result = Reflect.deleteMetadata("custom:annotation", Example.prototype, "method");
         *
         */
        function deleteMetadata(metadataKey, target, propertyKey) {
            if (!IsObject(target)) throw new TypeError();
            if (!IsUndefined(propertyKey)) propertyKey = ToPropertyKey(propertyKey);
            var metadataMap = GetOrCreateMetadataMap(target, propertyKey, /*Create*/false);
            if (IsUndefined(metadataMap)) return false;
            if (!metadataMap.delete(metadataKey)) return false;
            if (metadataMap.size > 0) return true;
            var targetMetadata = Metadata.get(target);
            targetMetadata.delete(propertyKey);
            if (targetMetadata.size > 0) return true;
            Metadata.delete(target);
            return true;
        }
        exporter("deleteMetadata", deleteMetadata);
        function DecorateConstructor(decorators, target) {
            for (var i = decorators.length - 1; i >= 0; --i) {
                var decorator = decorators[i];
                var decorated = decorator(target);
                if (!IsUndefined(decorated) && !IsNull(decorated)) {
                    if (!IsConstructor(decorated)) throw new TypeError();
                    target = decorated;
                }
            }
            return target;
        }
        function DecorateProperty(decorators, target, propertyKey, descriptor) {
            for (var i = decorators.length - 1; i >= 0; --i) {
                var decorator = decorators[i];
                var decorated = decorator(target, propertyKey, descriptor);
                if (!IsUndefined(decorated) && !IsNull(decorated)) {
                    if (!IsObject(decorated)) throw new TypeError();
                    descriptor = decorated;
                }
            }
            return descriptor;
        }
        function GetOrCreateMetadataMap(O, P, Create) {
            var targetMetadata = Metadata.get(O);
            if (IsUndefined(targetMetadata)) {
                if (!Create) return undefined;
                targetMetadata = new _Map();
                Metadata.set(O, targetMetadata);
            }
            var metadataMap = targetMetadata.get(P);
            if (IsUndefined(metadataMap)) {
                if (!Create) return undefined;
                metadataMap = new _Map();
                targetMetadata.set(P, metadataMap);
            }
            return metadataMap;
        }
        // 3.1.1.1 OrdinaryHasMetadata(MetadataKey, O, P)
        // https://rbuckton.github.io/reflect-metadata/#ordinaryhasmetadata
        function OrdinaryHasMetadata(MetadataKey, O, P) {
            var hasOwn = OrdinaryHasOwnMetadata(MetadataKey, O, P);
            if (hasOwn) return true;
            var parent = OrdinaryGetPrototypeOf(O);
            if (!IsNull(parent)) return OrdinaryHasMetadata(MetadataKey, parent, P);
            return false;
        }
        // 3.1.2.1 OrdinaryHasOwnMetadata(MetadataKey, O, P)
        // https://rbuckton.github.io/reflect-metadata/#ordinaryhasownmetadata
        function OrdinaryHasOwnMetadata(MetadataKey, O, P) {
            var metadataMap = GetOrCreateMetadataMap(O, P, /*Create*/false);
            if (IsUndefined(metadataMap)) return false;
            return ToBoolean(metadataMap.has(MetadataKey));
        }
        // 3.1.3.1 OrdinaryGetMetadata(MetadataKey, O, P)
        // https://rbuckton.github.io/reflect-metadata/#ordinarygetmetadata
        function OrdinaryGetMetadata(MetadataKey, O, P) {
            var hasOwn = OrdinaryHasOwnMetadata(MetadataKey, O, P);
            if (hasOwn) return OrdinaryGetOwnMetadata(MetadataKey, O, P);
            var parent = OrdinaryGetPrototypeOf(O);
            if (!IsNull(parent)) return OrdinaryGetMetadata(MetadataKey, parent, P);
            return undefined;
        }
        // 3.1.4.1 OrdinaryGetOwnMetadata(MetadataKey, O, P)
        // https://rbuckton.github.io/reflect-metadata/#ordinarygetownmetadata
        function OrdinaryGetOwnMetadata(MetadataKey, O, P) {
            var metadataMap = GetOrCreateMetadataMap(O, P, /*Create*/false);
            if (IsUndefined(metadataMap)) return undefined;
            return metadataMap.get(MetadataKey);
        }
        // 3.1.5.1 OrdinaryDefineOwnMetadata(MetadataKey, MetadataValue, O, P)
        // https://rbuckton.github.io/reflect-metadata/#ordinarydefineownmetadata
        function OrdinaryDefineOwnMetadata(MetadataKey, MetadataValue, O, P) {
            var metadataMap = GetOrCreateMetadataMap(O, P, /*Create*/true);
            metadataMap.set(MetadataKey, MetadataValue);
        }
        // 3.1.6.1 OrdinaryMetadataKeys(O, P)
        // https://rbuckton.github.io/reflect-metadata/#ordinarymetadatakeys
        function OrdinaryMetadataKeys(O, P) {
            var ownKeys = OrdinaryOwnMetadataKeys(O, P);
            var parent = OrdinaryGetPrototypeOf(O);
            if (parent === null) return ownKeys;
            var parentKeys = OrdinaryMetadataKeys(parent, P);
            if (parentKeys.length <= 0) return ownKeys;
            if (ownKeys.length <= 0) return parentKeys;
            var set = new _Set();
            var keys = [];
            for (var _i = 0, ownKeys_1 = ownKeys; _i < ownKeys_1.length; _i++) {
                var key = ownKeys_1[_i];
                var hasKey = set.has(key);
                if (!hasKey) {
                    set.add(key);
                    keys.push(key);
                }
            }
            for (var _a = 0, parentKeys_1 = parentKeys; _a < parentKeys_1.length; _a++) {
                var key = parentKeys_1[_a];
                var hasKey = set.has(key);
                if (!hasKey) {
                    set.add(key);
                    keys.push(key);
                }
            }
            return keys;
        }
        // 3.1.7.1 OrdinaryOwnMetadataKeys(O, P)
        // https://rbuckton.github.io/reflect-metadata/#ordinaryownmetadatakeys
        function OrdinaryOwnMetadataKeys(O, P) {
            var keys = [];
            var metadataMap = GetOrCreateMetadataMap(O, P, /*Create*/false);
            if (IsUndefined(metadataMap)) return keys;
            var keysObj = metadataMap.keys();
            var iterator = GetIterator(keysObj);
            var k = 0;
            while (true) {
                var next = IteratorStep(iterator);
                if (!next) {
                    keys.length = k;
                    return keys;
                }
                var nextValue = IteratorValue(next);
                try {
                    keys[k] = nextValue;
                } catch (e) {
                    try {
                        IteratorClose(iterator);
                    } finally {
                        throw e;
                    }
                }
                k++;
            }
        }
        // 6 ECMAScript Data Typ0es and Values
        // https://tc39.github.io/ecma262/#sec-ecmascript-data-types-and-values
        function Type(x) {
            if (x === null) return 1 /* Null */;
            switch (typeof x) {
                case "undefined":
                    return 0 /* Undefined */;
                case "boolean":
                    return 2 /* Boolean */;
                case "string":
                    return 3 /* String */;
                case "symbol":
                    return 4 /* Symbol */;
                case "number":
                    return 5 /* Number */;
                case "object":
                    return x === null ? 1 /* Null */ : 6 /* Object */;
                default:
                    return 6 /* Object */;
            }
        }
        // 6.1.1 The Undefined Type
        // https://tc39.github.io/ecma262/#sec-ecmascript-language-types-undefined-type
        function IsUndefined(x) {
            return x === undefined;
        }
        // 6.1.2 The Null Type
        // https://tc39.github.io/ecma262/#sec-ecmascript-language-types-null-type
        function IsNull(x) {
            return x === null;
        }
        // 6.1.5 The Symbol Type
        // https://tc39.github.io/ecma262/#sec-ecmascript-language-types-symbol-type
        function IsSymbol(x) {
            return typeof x === "symbol";
        }
        // 6.1.7 The Object Type
        // https://tc39.github.io/ecma262/#sec-object-type
        function IsObject(x) {
            return typeof x === "object" ? x !== null : typeof x === "function";
        }
        // 7.1 Type Conversion
        // https://tc39.github.io/ecma262/#sec-type-conversion
        // 7.1.1 ToPrimitive(input [, PreferredType])
        // https://tc39.github.io/ecma262/#sec-toprimitive
        function ToPrimitive(input, PreferredType) {
            switch (Type(input)) {
                case 0 /* Undefined */:
                    return input;
                case 1 /* Null */:
                    return input;
                case 2 /* Boolean */:
                    return input;
                case 3 /* String */:
                    return input;
                case 4 /* Symbol */:
                    return input;
                case 5 /* Number */:
                    return input;
            }
            var hint = PreferredType === 3 /* String */ ? "string" : PreferredType === 5 /* Number */ ? "number" : "default";
            var exoticToPrim = GetMethod(input, toPrimitiveSymbol);
            if (exoticToPrim !== undefined) {
                var result = exoticToPrim.call(input, hint);
                if (IsObject(result)) throw new TypeError();
                return result;
            }
            return OrdinaryToPrimitive(input, hint === "default" ? "number" : hint);
        }
        // 7.1.1.1 OrdinaryToPrimitive(O, hint)
        // https://tc39.github.io/ecma262/#sec-ordinarytoprimitive
        function OrdinaryToPrimitive(O, hint) {
            if (hint === "string") {
                var toString_1 = O.toString;
                if (IsCallable(toString_1)) {
                    var result = toString_1.call(O);
                    if (!IsObject(result)) return result;
                }
                var valueOf = O.valueOf;
                if (IsCallable(valueOf)) {
                    var result = valueOf.call(O);
                    if (!IsObject(result)) return result;
                }
            } else {
                var valueOf = O.valueOf;
                if (IsCallable(valueOf)) {
                    var result = valueOf.call(O);
                    if (!IsObject(result)) return result;
                }
                var toString_2 = O.toString;
                if (IsCallable(toString_2)) {
                    var result = toString_2.call(O);
                    if (!IsObject(result)) return result;
                }
            }
            throw new TypeError();
        }
        // 7.1.2 ToBoolean(argument)
        // https://tc39.github.io/ecma262/2016/#sec-toboolean
        function ToBoolean(argument) {
            return !!argument;
        }
        // 7.1.12 ToString(argument)
        // https://tc39.github.io/ecma262/#sec-tostring
        function ToString(argument) {
            return "" + argument;
        }
        // 7.1.14 ToPropertyKey(argument)
        // https://tc39.github.io/ecma262/#sec-topropertykey
        function ToPropertyKey(argument) {
            var key = ToPrimitive(argument, 3 /* String */);
            if (IsSymbol(key)) return key;
            return ToString(key);
        }
        // 7.2 Testing and Comparison Operations
        // https://tc39.github.io/ecma262/#sec-testing-and-comparison-operations
        // 7.2.2 IsArray(argument)
        // https://tc39.github.io/ecma262/#sec-isarray
        function IsArray(argument) {
            return Array.isArray ? Array.isArray(argument) : argument instanceof Object ? argument instanceof Array : Object.prototype.toString.call(argument) === "[object Array]";
        }
        // 7.2.3 IsCallable(argument)
        // https://tc39.github.io/ecma262/#sec-iscallable
        function IsCallable(argument) {
            // NOTE: This is an approximation as we cannot check for [[Call]] internal method.
            return typeof argument === "function";
        }
        // 7.2.4 IsConstructor(argument)
        // https://tc39.github.io/ecma262/#sec-isconstructor
        function IsConstructor(argument) {
            // NOTE: This is an approximation as we cannot check for [[Construct]] internal method.
            return typeof argument === "function";
        }
        // 7.2.7 IsPropertyKey(argument)
        // https://tc39.github.io/ecma262/#sec-ispropertykey
        function IsPropertyKey(argument) {
            switch (Type(argument)) {
                case 3 /* String */:
                    return true;
                case 4 /* Symbol */:
                    return true;
                default:
                    return false;
            }
        }
        // 7.3 Operations on Objects
        // https://tc39.github.io/ecma262/#sec-operations-on-objects
        // 7.3.9 GetMethod(V, P)
        // https://tc39.github.io/ecma262/#sec-getmethod
        function GetMethod(V, P) {
            var func = V[P];
            if (func === undefined || func === null) return undefined;
            if (!IsCallable(func)) throw new TypeError();
            return func;
        }
        // 7.4 Operations on Iterator Objects
        // https://tc39.github.io/ecma262/#sec-operations-on-iterator-objects
        function GetIterator(obj) {
            var method = GetMethod(obj, iteratorSymbol);
            if (!IsCallable(method)) throw new TypeError(); // from Call
            var iterator = method.call(obj);
            if (!IsObject(iterator)) throw new TypeError();
            return iterator;
        }
        // 7.4.4 IteratorValue(iterResult)
        // https://tc39.github.io/ecma262/2016/#sec-iteratorvalue
        function IteratorValue(iterResult) {
            return iterResult.value;
        }
        // 7.4.5 IteratorStep(iterator)
        // https://tc39.github.io/ecma262/#sec-iteratorstep
        function IteratorStep(iterator) {
            var result = iterator.next();
            return result.done ? false : result;
        }
        // 7.4.6 IteratorClose(iterator, completion)
        // https://tc39.github.io/ecma262/#sec-iteratorclose
        function IteratorClose(iterator) {
            var f = iterator["return"];
            if (f) f.call(iterator);
        }
        // 9.1 Ordinary Object Internal Methods and Internal Slots
        // https://tc39.github.io/ecma262/#sec-ordinary-object-internal-methods-and-internal-slots
        // 9.1.1.1 OrdinaryGetPrototypeOf(O)
        // https://tc39.github.io/ecma262/#sec-ordinarygetprototypeof
        function OrdinaryGetPrototypeOf(O) {
            var proto = Object.getPrototypeOf(O);
            if (typeof O !== "function" || O === functionPrototype) return proto;
            // TypeScript doesn't set __proto__ in ES5, as it's non-standard.
            // Try to determine the superclass constructor. Compatible implementations
            // must either set __proto__ on a subclass constructor to the superclass constructor,
            // or ensure each class has a valid `constructor` property on its prototype that
            // points back to the constructor.
            // If this is not the same as Function.[[Prototype]], then this is definately inherited.
            // This is the case when in ES6 or when using __proto__ in a compatible browser.
            if (proto !== functionPrototype) return proto;
            // If the super prototype is Object.prototype, null, or undefined, then we cannot determine the heritage.
            var prototype = O.prototype;
            var prototypeProto = prototype && Object.getPrototypeOf(prototype);
            if (prototypeProto == null || prototypeProto === Object.prototype) return proto;
            // If the constructor was not a function, then we cannot determine the heritage.
            var constructor = prototypeProto.constructor;
            if (typeof constructor !== "function") return proto;
            // If we have some kind of self-reference, then we cannot determine the heritage.
            if (constructor === O) return proto;
            // we have a pretty good guess at the heritage.
            return constructor;
        }
        // naive Map shim
        function CreateMapPolyfill() {
            var cacheSentinel = {};
            var arraySentinel = [];
            var MapIterator = function () {
                function MapIterator(keys, values, selector) {
                    this._index = 0;
                    this._keys = keys;
                    this._values = values;
                    this._selector = selector;
                }
                MapIterator.prototype["@@iterator"] = function () {
                    return this;
                };
                MapIterator.prototype[iteratorSymbol] = function () {
                    return this;
                };
                MapIterator.prototype.next = function () {
                    var index = this._index;
                    if (index >= 0 && index < this._keys.length) {
                        var result = this._selector(this._keys[index], this._values[index]);
                        if (index + 1 >= this._keys.length) {
                            this._index = -1;
                            this._keys = arraySentinel;
                            this._values = arraySentinel;
                        } else {
                            this._index++;
                        }
                        return { value: result, done: false };
                    }
                    return { value: undefined, done: true };
                };
                MapIterator.prototype.throw = function (error) {
                    if (this._index >= 0) {
                        this._index = -1;
                        this._keys = arraySentinel;
                        this._values = arraySentinel;
                    }
                    throw error;
                };
                MapIterator.prototype.return = function (value) {
                    if (this._index >= 0) {
                        this._index = -1;
                        this._keys = arraySentinel;
                        this._values = arraySentinel;
                    }
                    return { value: value, done: true };
                };
                return MapIterator;
            }();
            return function () {
                function Map() {
                    this._keys = [];
                    this._values = [];
                    this._cacheKey = cacheSentinel;
                    this._cacheIndex = -2;
                }
                Object.defineProperty(Map.prototype, "size", {
                    get: function () {
                        return this._keys.length;
                    },
                    enumerable: true,
                    configurable: true
                });
                Map.prototype.has = function (key) {
                    return this._find(key, /*insert*/false) >= 0;
                };
                Map.prototype.get = function (key) {
                    var index = this._find(key, /*insert*/false);
                    return index >= 0 ? this._values[index] : undefined;
                };
                Map.prototype.set = function (key, value) {
                    var index = this._find(key, /*insert*/true);
                    this._values[index] = value;
                    return this;
                };
                Map.prototype.delete = function (key) {
                    var index = this._find(key, /*insert*/false);
                    if (index >= 0) {
                        var size = this._keys.length;
                        for (var i = index + 1; i < size; i++) {
                            this._keys[i - 1] = this._keys[i];
                            this._values[i - 1] = this._values[i];
                        }
                        this._keys.length--;
                        this._values.length--;
                        if (key === this._cacheKey) {
                            this._cacheKey = cacheSentinel;
                            this._cacheIndex = -2;
                        }
                        return true;
                    }
                    return false;
                };
                Map.prototype.clear = function () {
                    this._keys.length = 0;
                    this._values.length = 0;
                    this._cacheKey = cacheSentinel;
                    this._cacheIndex = -2;
                };
                Map.prototype.keys = function () {
                    return new MapIterator(this._keys, this._values, getKey);
                };
                Map.prototype.values = function () {
                    return new MapIterator(this._keys, this._values, getValue);
                };
                Map.prototype.entries = function () {
                    return new MapIterator(this._keys, this._values, getEntry);
                };
                Map.prototype["@@iterator"] = function () {
                    return this.entries();
                };
                Map.prototype[iteratorSymbol] = function () {
                    return this.entries();
                };
                Map.prototype._find = function (key, insert) {
                    if (this._cacheKey !== key) {
                        this._cacheIndex = this._keys.indexOf(this._cacheKey = key);
                    }
                    if (this._cacheIndex < 0 && insert) {
                        this._cacheIndex = this._keys.length;
                        this._keys.push(key);
                        this._values.push(undefined);
                    }
                    return this._cacheIndex;
                };
                return Map;
            }();
            function getKey(key, _) {
                return key;
            }
            function getValue(_, value) {
                return value;
            }
            function getEntry(key, value) {
                return [key, value];
            }
        }
        // naive Set shim
        function CreateSetPolyfill() {
            return function () {
                function Set() {
                    this._map = new _Map();
                }
                Object.defineProperty(Set.prototype, "size", {
                    get: function () {
                        return this._map.size;
                    },
                    enumerable: true,
                    configurable: true
                });
                Set.prototype.has = function (value) {
                    return this._map.has(value);
                };
                Set.prototype.add = function (value) {
                    return this._map.set(value, value), this;
                };
                Set.prototype.delete = function (value) {
                    return this._map.delete(value);
                };
                Set.prototype.clear = function () {
                    this._map.clear();
                };
                Set.prototype.keys = function () {
                    return this._map.keys();
                };
                Set.prototype.values = function () {
                    return this._map.values();
                };
                Set.prototype.entries = function () {
                    return this._map.entries();
                };
                Set.prototype["@@iterator"] = function () {
                    return this.keys();
                };
                Set.prototype[iteratorSymbol] = function () {
                    return this.keys();
                };
                return Set;
            }();
        }
        // naive WeakMap shim
        function CreateWeakMapPolyfill() {
            var UUID_SIZE = 16;
            var keys = HashMap.create();
            var rootKey = CreateUniqueKey();
            return function () {
                function WeakMap() {
                    this._key = CreateUniqueKey();
                }
                WeakMap.prototype.has = function (target) {
                    var table = GetOrCreateWeakMapTable(target, /*create*/false);
                    return table !== undefined ? HashMap.has(table, this._key) : false;
                };
                WeakMap.prototype.get = function (target) {
                    var table = GetOrCreateWeakMapTable(target, /*create*/false);
                    return table !== undefined ? HashMap.get(table, this._key) : undefined;
                };
                WeakMap.prototype.set = function (target, value) {
                    var table = GetOrCreateWeakMapTable(target, /*create*/true);
                    table[this._key] = value;
                    return this;
                };
                WeakMap.prototype.delete = function (target) {
                    var table = GetOrCreateWeakMapTable(target, /*create*/false);
                    return table !== undefined ? delete table[this._key] : false;
                };
                WeakMap.prototype.clear = function () {
                    // NOTE: not a real clear, just makes the previous data unreachable
                    this._key = CreateUniqueKey();
                };
                return WeakMap;
            }();
            function CreateUniqueKey() {
                var key;
                do {
                    key = "@@WeakMap@@" + CreateUUID();
                } while (HashMap.has(keys, key));
                keys[key] = true;
                return key;
            }
            function GetOrCreateWeakMapTable(target, create) {
                if (!hasOwn.call(target, rootKey)) {
                    if (!create) return undefined;
                    Object.defineProperty(target, rootKey, { value: HashMap.create() });
                }
                return target[rootKey];
            }
            function FillRandomBytes(buffer, size) {
                for (var i = 0; i < size; ++i) {
                    buffer[i] = Math.random() * 0xff | 0;
                }return buffer;
            }
            function GenRandomBytes(size) {
                if (typeof Uint8Array === "function") {
                    if (typeof crypto !== "undefined") return crypto.getRandomValues(new Uint8Array(size));
                    if (typeof msCrypto !== "undefined") return msCrypto.getRandomValues(new Uint8Array(size));
                    return FillRandomBytes(new Uint8Array(size), size);
                }
                return FillRandomBytes(new Array(size), size);
            }
            function CreateUUID() {
                var data = GenRandomBytes(UUID_SIZE);
                // mark as random - RFC 4122 § 4.4
                data[6] = data[6] & 0x4f | 0x40;
                data[8] = data[8] & 0xbf | 0x80;
                var result = "";
                for (var offset = 0; offset < UUID_SIZE; ++offset) {
                    var byte = data[offset];
                    if (offset === 4 || offset === 6 || offset === 8) result += "-";
                    if (byte < 16) result += "0";
                    result += byte.toString(16).toLowerCase();
                }
                return result;
            }
        }
        // uses a heuristic used by v8 and chakra to force an object into dictionary mode.
        function MakeDictionary(obj) {
            obj.__ = undefined;
            delete obj.__;
            return obj;
        }
    });
})(Reflect$1 || (Reflect$1 = {}));

/**
 * Provides an abstraction for meta-data management.
 * @class Metadata
 */
var Metadata = Abstract.extend(null, {
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
            return targetKey ? Reflect.getMetadata(metadataKey, target, targetKey) : Reflect.getMetadata(metadataKey, target);
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
            return targetKey ? Reflect.getOwnMetadata(metadataKey, target, targetKey) : Reflect.getOwnMetadata(metadataKey, target);
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
            creator = targetKey;
            targetKey = undefined;
        }
        if (!$isFunction(creator)) {
            throw new TypeError("creator must be a function");
        }
        var metadata = this.getOwn(metadataKey, target, targetKey);
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
            return targetKey ? Reflect.defineMetadata(metadataKey, metadata, target, targetKey) : Reflect.defineMetadata(metadataKey, metadata, target);
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
            return targetKey ? Reflect.deleteMetadata(metadataKey, target, targetKey) : Reflect.deleteMetadata(metadataKey, target);
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
        var metadataKeys = Reflect.getOwnMetadataKeys(source, sourceKey);
        metadataKeys.forEach(metadataKey => {
            var metadata = this.getOwn(metadataKey, source, sourceKey);
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
        var metadataKeys = Reflect.getOwnMetadataKeys(source, sourceKey);
        metadataKeys.forEach(metadataKey => {
            var targetMetadata = this.getOwn(metadataKey, target, sourceKey),
                sourceMetadata = this.getOwn(metadataKey, source, sourceKey);
            if (targetMetadata && targetMetadata.merge) {
                targetMetadata.merge(sourceMetadata);
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
        if (!$isFunction(collector)) {
            throw new TypeError("collector must be a function");
        }
        while (target) {
            var metadata = this.getOwn(metadataKey, target, targetKey);
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
        decorator.get = _metadataGetter.bind(this, metadataKey, false);
        decorator.getOwn = _metadataGetter.bind(this, metadataKey, true);
        decorator.getKeys = _metadataKeyGetter.bind(this, metadataKey, false);
        decorator.getOwnKeys = _metadataKeyGetter.bind(this, metadataKey, true);
        decorator.collect = _metadataCollector.bind(this, metadataKey);
        decorator.collectKeys = _metadataKeyCollector.bind(this, metadataKey);
        return decorator;
    }
});

function _metadataGetter(metadataKey, own, target, targetKey) {
    return own ? this.getOwn(metadataKey, target, targetKey) : this.get(metadataKey, target, targetKey);
}

function _metadataKeyGetter(metadataKey, own, target, callback) {
    var found = false;
    if (!$isFunction(callback)) return false;
    var keys = Reflect.ownKeys(own ? target : getPropertyDescriptors(target)).concat("constructor");
    keys.forEach(key => {
        var metadata = own ? this.getOwn(metadataKey, target, key) : this.get(metadataKey, target, key);
        if (metadata) {
            callback(metadata, key);
            found = true;
        }
    });
    return found;
}

function _metadataCollector(metadataKey, target, targetKey, callback) {
    if (!callback && $isFunction(targetKey)) {
        [targetKey, callback] = [null, targetKey];
    }
    if (!$isFunction(callback)) return;
    this.collect(metadataKey, target, targetKey, callback);
}

function _metadataKeyCollector(metadataKey, target, callback) {
    if (!$isFunction(callback)) return;
    var keys = Reflect.ownKeys(getPropertyDescriptors(target)).concat("constructor");
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
 * @param   {Delegate}  delegate  -  delegate
 * @extends Base
 */
var protocolGet = Symbol();
var protocolSet = Symbol();
var protocolInvoke = Symbol();
var protocolDelegate = Symbol();
var protocolMetadataKey = Symbol();

var Protocol = exports.Base.extend({
    constructor(delegate$$1) {
        if ($isNothing(delegate$$1)) {
            delegate$$1 = new Delegate();
        } else if ($isFunction(delegate$$1.toDelegate)) {
            delegate$$1 = delegate$$1.toDelegate();
            if (!(delegate$$1 instanceof Delegate)) {
                throw new TypeError("'toDelegate' method did not return a Delegate.");
            }
        } else if (!(delegate$$1 instanceof Delegate)) {
            if (Array.isArray(delegate$$1)) {
                delegate$$1 = new ArrayDelegate(delegate$$1);
            } else {
                delegate$$1 = new ObjectDelegate(delegate$$1);
            }
        }
        Object.defineProperty(this, protocolDelegate, {
            value: delegate$$1,
            writable: false
        });
    },
    [protocolGet](key) {
        var delegate$$1 = this[protocolDelegate];
        return delegate$$1 && delegate$$1.get(this.constructor, key);
    },
    [protocolSet](key, value) {
        var delegate$$1 = this[protocolDelegate];
        return delegate$$1 && delegate$$1.set(this.constructor, key, value);
    },
    [protocolInvoke](methodName, args) {
        var delegate$$1 = this[protocolDelegate];
        return delegate$$1 && delegate$$1.invoke(this.constructor, methodName, args);
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
        return target && target.prototype instanceof Protocol;
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
        if (this === target || target && target.prototype instanceof this) {
            return true;
        }
        var metaTarget = $isFunction(target) ? target.prototype : target;
        return Metadata.collect(protocolMetadataKey, metaTarget, protocols => protocols.has(this) || [...protocols].some(p => this.isAdoptedBy(p)));
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
        var metaTarget = $isFunction(target) ? target.prototype : target;
        if (Metadata.collect(protocolMetadataKey, metaTarget, p => p.has(this))) {
            return false;
        }
        var protocols = Metadata.getOrCreateOwn(protocolMetadataKey, metaTarget, () => new Set());
        protocols.add(this);
        if ($isFunction(target.protocolAdopted)) {
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
        var prototype = this.prototype,
            protocolProto = Protocol.prototype,
            props = getPropertyDescriptors(protocol.prototype);
        Reflect.ownKeys(props).forEach(key => {
            if (getPropertyDescriptors(protocolProto, key) || getPropertyDescriptors(prototype, key)) return;
            Object.defineProperty(prototype, key, props[key]);
        });
    },
    /**
     * Determines if `target` conforms to this protocol and is toplevel.
     * @static
     * @method isToplevel
     * @param   {Any}      target    -  target to test
     * @returns {boolean}  true if the target conforms to this toplevel protocol.
     */
    isToplevel(target) {
        var protocols = $protocols(target);
        return protocols.indexOf(this) >= 0 && protocols.every(p => p === this || !this.isAdoptedBy(p));
    },
    /**
     * Creates a protocol binding over the object.
     * @static
     * @method coerce
     * @param   {Object} object  -  object delegate
     * @returns {Object} protocol instance delegating to object. 
     */
    coerce(object) {
        return new this(object);
    }
});

/**
 * Protocol base requiring exact conformance (toplevel).
 * @class StrictProtocol
 * @constructor
 * @param   {Delegate}  delegate  -  delegate
 * @extends Protocol     
 */
var StrictProtocol = Protocol.extend();

/**
 * Protocol base requiring no conformance.
 * @class DuckTyping
 * @constructor
 * @param   {Delegate}  delegate  -  delegate
 * @extends Protocol     
 */
var DuckTyping = Protocol.extend();

/**
 * Determines if `protocol` is a protocol.
 * @method $isProtocol
 * @param    {Any}     protocol  - target to test
 * @returns  {boolean} true if a protocol.
 */
var $isProtocol = Protocol.isProtocol;

/**
 * Gets all the `target` protocols.
 * @method $protocols
 * @param    {Any}     target  -  target
 * @param    {boolean} own     -  true if own protocols
 * @returns  {Array} conforming protocols.
 */
function $protocols(target, own) {
    if (!target) return [];
    if ($isFunction(target)) {
        target = target.prototype;
    }
    var protocols = !own ? new Set() : Metadata.getOwn(protocolMetadataKey, target);
    if (!own) {
        var add = protocols.add.bind(protocols);
        Metadata.collect(protocolMetadataKey, target, ps => ps.forEach(p => [p, ...$protocols(p)].forEach(add)));
    }
    return protocols && [...protocols] || [];
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
    if ($isFunction(target)) {
        target = target.prototype;
    }
    Reflect.ownKeys(target).forEach(key => {
        if (key === "constructor") return;
        var descriptor = Object.getOwnPropertyDescriptor(target, key);
        if (!descriptor.enumerable) return;
        if ($isFunction(descriptor.value)) {
            descriptor.value = function (...args) {
                return this[protocolInvoke](key, args);
            };
        } else {
            var isSimple = descriptor.hasOwnProperty("value") || descriptor.hasOwnProperty("initializer");
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
var Defining = Symbol();

var Enum = exports.Base.extend({
    constructor(value, name, ordinal) {
        this.constructing(value, name);
        Object.defineProperties(this, {
            "value": {
                value: value,
                writable: false,
                configurable: false
            },
            "name": {
                value: name,
                writable: false,
                configurable: false
            },
            "ordinal": {
                value: ordinal,
                writable: false,
                configurable: false
            }

        });
    },
    toString() {
        return this.name;
    },
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
        var en = this.extend(behavior, {
            coerce(value) {
                return this.fromValue(value);
            }
        });
        en[Defining] = true;
        var names = Object.freeze(Object.keys(choices));
        var items = Object.keys(choices).map((name, ordinal) => en[name] = new en(choices[name], name, ordinal));
        en.names = Object.freeze(names);
        en.items = Object.freeze(items);
        en.fromValue = this.fromValue;
        delete en[Defining];
        return en;
    },
    fromValue(value) {
        var match = this.items.find(item => item.value == value);
        if (!match) {
            throw new TypeError(`${value} is not a valid value for this Enum.`);
        }
        return match;
    }
});
Enum.prototype.valueOf = function () {
    var value = +this.value;
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
var Flags = Enum.extend({
    hasFlag(flag) {
        flag = +flag;
        return (this & flag) === flag;
    },
    addFlag(flag) {
        return $isSomething(flag) ? this.constructor.fromValue(this | flag) : this;
    },
    removeFlag(flag) {
        return $isSomething(flag) ? this.constructor.fromValue(this & ~flag) : this;
    },
    constructing(value, name) {}
}, {
    fromValue(value) {
        value = +value;
        var name = void 0,
            names = this.names;
        for (var i = 0; i < names.length; ++i) {
            var flag = this[names[i]];
            if (flag.value === value) {
                return flag;
            }
            if ((value & flag.value) === flag.value) {
                name = name ? name + "," + flag.name : flag.name;
            }
        }
        return new this(value, name);
    }
});

var baseExtend = exports.Base.extend;
var baseImplement = exports.Base.implement;
var baseProtoExtend = exports.Base.prototype.extend;

var emptyArray = Object.freeze([]);
var nothing = undefined;

/**
 * Type of property method.
 * @class PropertyType
 * @extends Enum
 */
var MethodType = Enum({
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

exports.Base.extend = function (...args) {
    var constraints = args,
        decorators = [];
    if (this === Protocol) {
        decorators.push(protocol);
    }if ($isProtocol(this)) {
        decorators.push(protocol, conformsTo(this));
    }
    if (args.length > 0 && Array.isArray(args[0])) {
        constraints = args.shift();
    }
    while (constraints.length > 0) {
        var constraint = constraints[0];
        if (!constraint) {
            break;
        } else if ($isProtocol(constraint)) {
            decorators.push(conformsTo(constraint));
        } else if (constraint.prototype instanceof exports.Base || constraint.prototype instanceof Module) {
            decorators.push(mixin(constraint));
        } else if ($isFunction(constraint)) {
            decorators.push(constraint);
        } else {
            break;
        }
        constraints.shift();
    }
    var members = args.shift() || {},
        classMembers = args.shift() || {},
        derived = baseExtend.call(this, members, classMembers);
    Metadata.copyOwn(derived, classMembers);
    Metadata.copyOwn(derived.prototype, members);
    if (decorators.length > 0) {
        derived = Reflect.decorate(decorators, derived);
    }
    return derived;
};

exports.Base.implement = function (source) {
    if (source && $isProtocol(this) && $isObject(source)) {
        source = protocol(source) || source;
    }
    var type = baseImplement.call(this, source);
    Metadata.mergeOwn(type.prototype, source);
    return type;
};

exports.Base.prototype.extend = function (key, value) {
    if (!key) return this;
    var numArgs = arguments.length;
    if (numArgs === 1) {
        if (this instanceof Protocol) {
            key = protocol(key) || key;
        }
        var instance = baseProtoExtend.call(this, key);
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
        if (behaviors.length > 0 && $isFunction(target.implement)) {
            behaviors.forEach(b => target.implement(b));
        }
    };
}

/**
 * Protocol for targets that manage initialization.
 * @class Initializing
 * @extends Protocol
 */
var Initializing = Protocol.extend({
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
var Resolving = Protocol.extend();

/**
 * Protocol for targets that can execute functions.
 * @class Invoking
 * @extends StrictProtocol
 */
var Invoking = StrictProtocol.extend({
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
var Parenting = Protocol.extend({
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
var Starting = Protocol.extend({
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
var Startup = exports.Base.extend(Starting, {
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
    if (target.prototype instanceof exports.Base) return true;
    var name = target.name; // use Capital name convention
    return name && $isFunction(target) && isUpperCase(name.charAt(0));
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
        var decorator = Object.create(decoratee);
        Object.defineProperty(decorator, "decoratee", {
            configurable: false,
            value: decoratee
        });
        if (decorations && $isFunction(decorator.extend)) {
            decorator.extend(decorations);
        }
        return decorator;
    };
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
    var decoratee = void 0;
    while (decorator && (decoratee = decorator.decoratee)) {
        if (!deepest) return decoratee;
        decorator = decoratee;
    }
    return decorator;
}

function isUpperCase(char) {
    return char.toUpperCase() === char;
}

var designMetadataKey = Symbol();
var paramTypesKey = "design:paramtypes";
var propertyTypeKey = "design:type";

/**
 * Custom Metadata to bridge Typescript annotations.
 * @class DesignMetadata
 */
var DesignMetadata = Metadata.extend(null, {
    get(metadataKey, target, targetKey) {
        if (metadataKey === designMetadataKey) {
            return this.base(paramTypesKey, target, targetKey) || this.base(propertyTypeKey, target, targetKey);
        }
        return this.base(metadataKey, target, targetKey);
    },
    getOwn(metadataKey, target, targetKey) {
        if (metadataKey === designMetadataKey) {
            return this.base(paramTypesKey, target, targetKey) || this.base(propertyTypeKey, target, targetKey);
        }
        return this.base(metadataKey, target, targetKey);
    }
});

/**
 * Attaches design metadata compatible with Typescript.
 * @method design
 */
var design = DesignMetadata.decorator(designMetadataKey, (target, key, descriptor, types) => {
    if (!isDescriptor(descriptor)) {
        if (target.length > key.length) {
            throw new SyntaxError(`@design for constructor expects at least ${target.length} parameters but only ${key.length} specified`);
        }
        _validateTypes(key);
        DesignMetadata.define(paramTypesKey, key, target.prototype, "constructor");
        return;
    }
    var { value } = descriptor;
    if ($isFunction(value)) {
        if (value.length > types.length) {
            throw new SyntaxError(`@design for method '${key}' expects at least ${value.length} parameters but only ${types.length} specified`);
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
    for (var i = 0; i < types.length; ++i) {
        var type = types[i];
        if (type == null) {
            return;
        }
        if (Array.isArray(type)) {
            if (type.length !== 1) {
                throw new SyntaxError(`@design array specification at index ${i} expects a single type`);
            }
            type = type[0];
        }
        if (!$isFunction(type)) {
            throw new SyntaxError("@design expects basic types, classes or protocols");
        }
    }
}

/**
 * Protocol for targets that manage disposal lifecycle.
 * @class Disposing
 * @extends Protocol
 */
var Disposing = Protocol.extend({
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
var DisposingMixin = Module.extend({
    dispose(object) {
        var dispose = object._dispose;
        if ($isFunction(dispose)) {
            object.dispose = Undefined; // dispose once                
            return dispose.call(object);
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
    if (disposing && $isFunction(disposing.dispose)) {
        if (!$isPromise(action)) {
            var result = void 0;
            try {
                result = $isFunction(action) ? action.call(context, disposing) : action;
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
 * TraversingAxis enum
 * @class TraversingAxis
 * @extends Enum
 */
var TraversingAxis = Enum({
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
var Traversing = Protocol.extend({
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
var TraversingMixin = Module.extend({
    traverse(object, axis, visitor, context) {
        if ($isFunction(axis)) {
            context = visitor;
            visitor = axis;
            axis = TraversingAxis.Child;
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
    var parent = void 0,
        root = this,
        visited = [this];
    while (parent = root.parent) {
        checkCircularity(visited, parent);
        root = parent;
    }
    visitor.call(context, root);
}

function traverseChildren(visitor, withSelf, context) {
    if (withSelf && visitor.call(context, this)) {
        return;
    }
    for (var child of this.children) {
        if (visitor.call(context, child)) {
            return;
        }
    }
}

function traverseAncestors(visitor, withSelf, context) {
    var parent = this,
        visited = [this];
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
        Traversal.levelOrder(this, node => !$equals(this, node) && visitor.call(context, node), context);
    }
}

function traverseDescendantsReverse(visitor, withSelf, context) {
    if (withSelf) {
        Traversal.reverseLevelOrder(this, visitor, context);
    } else {
        Traversal.reverseLevelOrder(this, node => !$equals(this, node) && visitor.call(context, node), context);
    }
}

function traverseSelfSiblingOrAncestor(visitor, withSelf, withAncestor, context) {
    if (withSelf && visitor.call(context, this)) {
        return;
    }
    var parent = this.parent;
    if (parent) {
        for (var sibling of parent.children) {
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
var Traversal = Abstract.extend({}, {
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
    if ($isFunction(node.traverse)) node.traverse(child => preOrder(child, visitor, context, visited));
    return false;
}

function postOrder(node, visitor, context, visited = []) {
    checkCircularity(visited, node);
    if (!node || !$isFunction(visitor)) {
        return true;
    }
    if ($isFunction(node.traverse)) node.traverse(child => postOrder(child, visitor, context, visited));
    return visitor.call(context, node);
}

function levelOrder(node, visitor, context, visited = []) {
    if (!node || !$isFunction(visitor)) {
        return;
    }
    var queue = [node];
    while (queue.length > 0) {
        var next = queue.shift();
        checkCircularity(visited, next);
        if (visitor.call(context, next)) {
            return;
        }
        if ($isFunction(next.traverse)) next.traverse(child => {
            if (child) queue.push(child);
        });
    }
}

function reverseLevelOrder(node, visitor, context, visited = []) {
    if (!node || !$isFunction(visitor)) {
        return;
    }
    var queue = [node],
        stack = [];

    var _loop = function () {
        var next = queue.shift();
        checkCircularity(visited, next);
        stack.push(next);
        var level = [];
        if ($isFunction(next.traverse)) next.traverse(child => {
            if (child) level.unshift(child);
        });
        queue.push.apply(queue, level);
    };

    while (queue.length > 0) {
        _loop();
    }
    while (stack.length > 0) {
        if (visitor.call(context, stack.pop())) {
            return;
        }
    }
}

var injectMetadataKey = Symbol();

/**
 * Specifies dependencies on properties and methods.
 * @method inject
 * @param  {Array}  ...dependencies  -  property/method dependencies
 */
var inject = Metadata.decorator(injectMetadataKey, (target, key, descriptor, dependencies) => {
    if (!isDescriptor(descriptor)) {
        dependencies = $flatten(key);
        Metadata.define(injectMetadataKey, dependencies, target.prototype, "constructor");
        return;
    }
    var { value } = descriptor;
    dependencies = $flatten(dependencies);
    if ($isFunction(value)) {
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
var $eq = $createModifier();

/**
 * Annotates use value as is.
 * @attribute $use
 * @for Modifier
 */
var $use = $createModifier();

/**
 * Annotates lazy semantics.
 * @attribute $lazy
 * @for Modifier
 */
var $lazy = $createModifier();

/**
 * Annotates function to be evaluated.
 * @attribute $eval
 * @for Modifier
 */
var $eval = $createModifier();

/**
 * Annotates zero or more semantics.
 * @attribute $every
 * @for Modifier
 */
var $every = $createModifier();

/**
 * Annotates 
 * @attribute use {{#crossLink "Parenting"}}{{/crossLink}} protocol.
 * @attribute $child
 * @for Modifier
 */
var $child = $createModifier();

/**
 * Annotates optional semantics.
 * @attribute $optional
 * @for Modifier
 */
var $optional = $createModifier();

/**
 * Annotates Promise expectation.
 * @attribute $promise
 * @for Modifier
 */
var $promise = $createModifier();

/**
 * Annotates synchronous.
 * @attribute $instant
 * @for Modifier
 */
var $instant = $createModifier();

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
    return source instanceof Modifier ? Modifier.unwrap(source.getSource()) : source;
};
function $createModifier() {
    var allowNew = void 0;
    function modifier(source) {
        if (!new.target) {
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
            };
        }
    }
    modifier.prototype = new Modifier();
    modifier.test = function (source) {
        if (source instanceof modifier) {
            return true;
        } else if (source instanceof Modifier) {
            return modifier.test(source.getSource());
        }
        return false;
    };
    return modifier;
}

var Policy = exports.Base.extend({
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
        var descriptors = getPropertyDescriptors(this),
            keys = Reflect.ownKeys(descriptors);
        keys.forEach(key => {
            var keyValue = this[key];
            if ($isFunction(keyValue)) {
                return;
            }
            if (keyValue !== undefined && this.hasOwnProperty(key)) {
                var policyValue = policy[key];
                if (policyValue === undefined || !policy.hasOwnProperty(key)) {
                    policy[key] = _copyPolicyValue(keyValue);
                } else if ($isFunction(keyValue.mergeInto)) {
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
    coerce(...args) {
        return Reflect.construct(this, args);
    }
});

function _copyPolicyValue(policyValue) {
    if ($isNothing(policyValue)) {
        return policyValue;
    }
    if (Array.isArray(policyValue)) {
        return policyValue.map(_copyPolicyValue);
    }
    if ($isFunction(policyValue.copy)) {
        return policyValue.copy();
    }
    return policyValue;
}

if (Promise.prototype.finally === undefined) Promise.prototype.finally = function (callback) {
    var p = this.constructor;
    return this.then(value => p.resolve(callback()).then(() => value), reason => p.resolve(callback()).then(() => {
        throw reason;
    }));
};

if (Promise.delay === undefined) Promise.delay = function (ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Facet choices for proxies.
 * @class Facet
 */
var Facet = Object.freeze({
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
var Interceptor = exports.Base.extend({
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
var InterceptorSelector = exports.Base.extend({
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
var ProxyBuilder = exports.Base.extend({
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
        var classes = types.filter($isClass),
            protocols = types.filter($isProtocol);
        return buildProxy(classes, protocols, options || {});
    }
});

function buildProxy(classes, protocols, options) {
    var base = options.baseType || classes.shift() || exports.Base,
        proxy = base.extend(...classes.concat(protocols), {
        constructor(facets) {
            var spec = {};
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
            var ctor = proxyMethod("constructor", this.base, base);
            ctor.apply(this, facets[Facet.Parameters]);
            delete spec.writable;
            delete spec.value;
        },
        getInterceptors(source, method) {
            var selectors = this.selectors;
            return selectors ? selectors.reduce((interceptors, selector) => selector.selectInterceptors(source, method, interceptors), this.interceptors) : this.interceptors;
        },
        extend: extendProxyInstance
    }, {
        shouldProxy: options.shouldProxy
    });
    proxyClass(proxy, protocols);
    proxy.extend = proxy.implement = throwProxiesSealedExeception;
    return proxy;
}

function throwProxiesSealedExeception() {
    throw new TypeError("Proxy classes are sealed and cannot be extended from.");
}

var noProxyMethods = {
    base: true, extend: true, constructor: true, conformsTo: true,
    getInterceptors: true, getDelegate: true, setDelegate: true
};

function proxyClass(proxy, protocols) {
    var sources = [proxy].concat($protocols(proxy), protocols),
        proxied = {};

    var _loop = function (i) {
        var source = sources[i],
            isProtocol = $isProtocol(source),
            props = getPropertyDescriptors(source.prototype);
        Reflect.ownKeys(props).forEach(key => {
            if (proxied.hasOwnProperty(key) || key in noProxyMethods) return;
            if (proxy.shouldProxy && !proxy.shouldProxy(key, source)) return;
            var descriptor = props[key];
            if (!descriptor.enumerable) return;
            var { value, get, set } = descriptor;
            if ($isFunction(value)) {
                if (isProtocol) value = null;
                descriptor.value = proxyMethod(key, value, proxy);
            } else {
                if (descriptor.hasOwnProperty("value")) {
                    var field = Symbol();
                    get = function () {
                        return this[field];
                    }, set = function (value) {
                        this[field] = value;
                    };
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
    };

    for (var i = 0; i < sources.length; ++i) {
        _loop(i);
    }
}

function proxyMethod(key, method, source, type) {
    var interceptors = void 0;
    function methodProxy(...args) {
        var _this = this;
        var delegate$$1 = this.delegate,
            idx = -1;
        if (!interceptors) {
            interceptors = this.getInterceptors(source, key);
        }
        type = type || MethodType.Invoke;
        var invocation = {
            method: key,
            methodType: type,
            source: source,
            args: args,
            useDelegate(value) {
                delegate$$1 = value;
            },
            replaceDelegate(value) {
                _this.delegate = delegate$$1 = value;
            },
            get canProceed() {
                if (interceptors && idx + 1 < interceptors.length) {
                    return true;
                }
                if (delegate$$1) {
                    return $isFunction(delegate$$1[key]);
                }
                return !!method;
            },
            proceed() {
                ++idx;
                if (interceptors && idx < interceptors.length) {
                    var interceptor = interceptors[idx];
                    return interceptor.intercept(invocation);
                }
                if (delegate$$1) {
                    switch (type) {
                        case MethodType.Get:
                            return delegate$$1[key];
                        case MethodType.Set:
                            delegate$$1[key] = args[0];
                            break;
                        case MethodType.Invoke:
                            var invoke = delegate$$1[key];
                            if ($isFunction(invoke)) {
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
    var proxy = this.constructor,
        overrides = arguments.length === 1 ? key : { [key]: value },
        props = getPropertyDescriptors(overrides);
    Reflect.ownKeys(props).forEach(key => {
        var descriptor = props[key];
        if (!descriptor.enumerable) return;
        var { value, get, set } = descriptor,
            baseDescriptor = getPropertyDescriptors(this, key);
        if (!baseDescriptor) return;
        if (value) {
            if ($isFunction(value)) {
                var baseValue = baseDescriptor.value;
                if ($isFunction(value) && value.baseMethod) {
                    baseDescriptor.value = value.baseMethod;
                }
            }
        } else if (get) {
            var baseGet = baseDescriptor.get;
            if (baseGet && get.baseMethod) {
                baseDescriptor.get = get.baseMethod;
            }
        } else if (set) {
            var baseSet = baseDescriptor.set;
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
        var descriptor = props[key];
        if (!descriptor.enumerable) return;
        var { value, get, set } = descriptor;
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

exports.Undefined = Undefined;
exports.Null = Null;
exports.True = True;
exports.False = False;
exports.Package = Package;
exports.Abstract = Abstract;
exports.Module = Module;
exports.pcopy = pcopy;
exports.extend = extend;
exports.getPropertyDescriptors = getPropertyDescriptors;
exports.instanceOf = instanceOf;
exports.typeOf = typeOf;
exports.assignID = assignID;
exports.format = format;
exports.csv = csv;
exports.bind = bind;
exports.partial = partial;
exports.delegate = delegate;
exports.copy = copy;
exports.emptyArray = emptyArray;
exports.nothing = nothing;
exports.MethodType = MethodType;
exports.Variance = Variance;
exports.mixin = mixin;
exports.Initializing = Initializing;
exports.Resolving = Resolving;
exports.Invoking = Invoking;
exports.Parenting = Parenting;
exports.Starting = Starting;
exports.Startup = Startup;
exports.$isClass = $isClass;
exports.$classOf = $classOf;
exports.$decorator = $decorator;
exports.$decorate = $decorate;
exports.$decorated = $decorated;
exports.decorate = decorate;
exports.isDescriptor = isDescriptor;
exports.Delegate = Delegate;
exports.ObjectDelegate = ObjectDelegate;
exports.ArrayDelegate = ArrayDelegate;
exports.design = design;
exports.Disposing = Disposing;
exports.DisposingMixin = DisposingMixin;
exports.$using = $using;
exports.Enum = Enum;
exports.Flags = Flags;
exports.TraversingAxis = TraversingAxis;
exports.Traversing = Traversing;
exports.TraversingMixin = TraversingMixin;
exports.Traversal = Traversal;
exports.inject = inject;
exports.Metadata = Metadata;
exports.$eq = $eq;
exports.$use = $use;
exports.$lazy = $lazy;
exports.$eval = $eval;
exports.$every = $every;
exports.$child = $child;
exports.$optional = $optional;
exports.$promise = $promise;
exports.$instant = $instant;
exports.Modifier = Modifier;
exports.$createModifier = $createModifier;
exports.Policy = Policy;
exports.Protocol = Protocol;
exports.StrictProtocol = StrictProtocol;
exports.DuckTyping = DuckTyping;
exports.$isProtocol = $isProtocol;
exports.$protocols = $protocols;
exports.protocol = protocol;
exports.conformsTo = conformsTo;
exports.Facet = Facet;
exports.Interceptor = Interceptor;
exports.InterceptorSelector = InterceptorSelector;
exports.ProxyBuilder = ProxyBuilder;
exports.ArrayManager = ArrayManager;
exports.IndexedList = IndexedList;
exports.$isString = $isString;
exports.$isSymbol = $isSymbol;
exports.$isFunction = $isFunction;
exports.$isObject = $isObject;
exports.$isPlainObject = $isPlainObject;
exports.$isPromise = $isPromise;
exports.$isNothing = $isNothing;
exports.$isSomething = $isSomething;
exports.$lift = $lift;
exports.$flatten = $flatten;
exports.$equals = $equals;
exports.$debounce = $debounce;

return exports;

}({}));
