"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

exports.copy = copy;
exports.pcopy = pcopy;
exports.getPropertyDescriptors = getPropertyDescriptors;
exports.typeOf = typeOf;
exports.assignID = assignID;
exports.format = format;
exports.csv = csv;
exports.bind = bind;
exports.delegate = delegate;
var Undefined = exports.Undefined = K(),
    Null = exports.Null = K(null),
    True = exports.True = K(true),
    False = exports.False = K(false);

var __prototyping,
    _counter = 1;

var _IGNORE = K(),
    _BASE = /\bbase\b/,
    _HIDDEN = ["constructor", "toString"],
    _slice = Array.prototype.slice;

var _subclass = function _subclass(_instance, _static) {
  __prototyping = this.prototype;
  var _prototype = new this();
  if (_instance) _extend(_prototype, _instance);
  _prototype.base = function () {};
  __prototyping = undefined;

  var _constructor = _prototype.constructor;
  function _class() {
    if (!__prototyping) {
      if (this && (this.constructor == _class || this.__constructing)) {
        this.__constructing = true;
        var instance = _constructor.apply(this, arguments);
        delete this.__constructing;
        if (instance) return instance;
      } else {
        var target = arguments[0];
        if (target instanceof _class) return target;
        var cls = _class;
        do {
          if (cls.coerce) {
            var cast = cls.coerce.apply(_class, arguments);
            if (cast) return cast;
          }
        } while ((cls = cls.ancestor) && cls != Base);
        return _extend(target, _prototype);
      }
    }
    return this;
  };
  _prototype.constructor = _class;

  for (var i in Base) {
    _class[i] = this[i];
  }if (_static) _extend(_class, _static);
  _class.ancestor = this;
  _class.ancestorOf = Base.ancestorOf;
  _class.base = _prototype.base;
  _class.prototype = _prototype;
  if (_class.init) _class.init();

  return _class;
};

var Base = exports.Base = _subclass.call(Object, {
  constructor: function constructor() {
    if (arguments.length > 0) {
      this.extend(arguments[0]);
    }
  },

  extend: delegate(_extend),

  toString: function toString() {
    if (this.constructor.toString == Function.prototype.toString) {
      return "[object base2.Base]";
    } else {
      return "[object " + this.constructor.toString().slice(1, -1) + "]";
    }
  }
}, exports.Base = Base = {
  ancestorOf: function ancestorOf(klass) {
    return _ancestorOf(this, klass);
  },

  extend: _subclass,

  implement: function implement(source) {
    if (typeof source == "function") {
      source = source.prototype;
    }

    _extend(this.prototype, source);
    return this;
  }
});

var Package = exports.Package = Base.extend({
  constructor: function constructor(_private, _public) {
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

      var packageName = pkg.toString().slice(1, -1);
      _private["_label_" + pkg.name] = function () {
        for (var name in nsPkg) {
          var object = nsPkg[name];
          if (object && object.ancestorOf == Base.ancestorOf && name != "constructor") {
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
    };
  },

  exports: "",
  imports: "",
  name: "",
  namespace: "",
  parent: null,

  open: function open(_private, _public) {
    _public.name = this.name;
    _public.parent = this.parent;
    return new Package(_private, _public);
  },

  addName: function addName(name, value) {
    if (!this[name]) {
      this[name] = value;
      this.exports += "," + name;
      this.namespace += format("var %1=%2.%1;", name, this.name);
      if (value && value.ancestorOf == Base.ancestorOf && name != "constructor") {
        value.toString = K("[" + this.toString().slice(1, -1) + "." + name + "]");
      }
      if (this.exported) this.exported([name]);
    }
  },

  addPackage: function addPackage(name) {
    var pkg = new Package(null, { name: name, parent: this });
    this.addName(name, pkg);
    return pkg;
  },

  package: function _package(_private, _public) {
    _public.parent = this;
    return new Package(_private, _public);
  },

  toString: function toString() {
    return format("[%1]", this.parent ? this.parent.toString().slice(1, -1) + "." + this.name : this.name);
  }
});

var Abstract = exports.Abstract = Base.extend({
  constructor: function constructor() {
    throw new TypeError("Abstract class cannot be instantiated.");
  }
});

var _moduleCount = 0;

var Module = exports.Module = Abstract.extend(null, {
  namespace: "",

  extend: function extend(_interface, _static) {
    var module = this.base();
    var index = _moduleCount++;
    module.namespace = "";
    module.partial = this.partial;
    module.toString = K("[base2.Module[" + index + "]]");
    Module[index] = module;

    module.implement(this);

    if (_interface) module.implement(_interface);

    if (_static) {
      _extend(module, _static);
      if (module.init) module.init();
    }
    return module;
  },

  implement: function implement(_interface) {
    var module = this;
    var id = module.toString().slice(1, -1);
    if (typeof _interface == "function") {
      if (!_ancestorOf(_interface, module)) {
        this.base(_interface);
      }
      if (_ancestorOf(Module, _interface)) {
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
      _extend(module, _interface);

      _extendModule(module, _interface);
    }
    return module;
  },

  partial: function partial() {
    var module = Module.extend();
    var id = module.toString().slice(1, -1);

    module.namespace = this.namespace.replace(/(\w+)=b[^\)]+\)/g, "$1=" + id + ".$1");
    this.forEach(function (method, name) {
      module[name] = _partial(bind(method, module));
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
};

function _createStaticModuleMethod(module, name) {
  return function () {
    return module[name].apply(module, arguments);
  };
};

function _createModuleMethod(module, name) {
  return function () {
    var args = _slice.call(arguments);
    args.unshift(this);
    return module[name].apply(module, args);
  };
};

function copy(object) {
  var copy = {};
  for (var i in object) {
    copy[i] = object[i];
  }
  return copy;
};

function pcopy(object) {
  _dummy.prototype = object;
  return new _dummy();
};

function _dummy() {};

function _extend(object, source) {
  if (object && source) {
    var useProto = __prototyping;
    if (arguments.length > 2) {
      var key = source;
      source = {};
      source[key] = arguments[2];
      useProto = true;
    }
    var proto = (typeof source == "function" ? Function : Object).prototype;

    if (useProto) {
      var i = _HIDDEN.length,
          key;
      while (key = _HIDDEN[--i]) {
        var desc = getPropertyDescriptors(source, key);
        if (!desc || desc.value != proto[key]) {
          desc = _override(object, key, desc);
          if (desc) Object.defineProperty(object, key, desc);
        }
      }
    }

    var props = getPropertyDescriptors(source);
    Reflect.ownKeys(props).forEach(function (key) {
      if (typeof proto[key] == "undefined" && key !== "base") {
        var desc = _override(object, key, props[key]);
        if (desc) Object.defineProperty(object, key, desc);
      }
    });
  }
  return object;
}exports.extend = _extend;
;

function _ancestorOf(ancestor, fn) {
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
  if (typeof value !== "function" && "value" in desc) {
    return desc;
  }
  var ancestor = getPropertyDescriptors(object, key);
  if (!ancestor) return desc;
  var superObject = __prototyping;
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
          this.base = Undefined;
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
          this.base = Undefined;
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
          this.base = Undefined;
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
};

function getPropertyDescriptors(obj, key) {
  var props = key ? null : {},
      prop;
  do {
    if (key) {
      prop = Reflect.getOwnPropertyDescriptor(obj, key);
      if (prop) return prop;
    } else {
      Reflect.ownKeys(obj).forEach(function (key) {
        if (!Reflect.has(props, key)) {
          prop = Reflect.getOwnPropertyDescriptor(obj, key);
          if (prop) props[key] = prop;
        }
      });
    }
  } while (obj = Object.getPrototypeOf(obj));
  return props;
}

function instanceOf(object, klass) {

  if (typeof klass != "function") {
    throw new TypeError("Invalid 'instanceOf' operand.");
  }

  if (object == null) return false;

  if (object.constructor == klass) return true;
  if (klass.ancestorOf) return klass.ancestorOf(object.constructor);

  if (object instanceof klass) return true;

  if (Base.ancestorOf == klass.ancestorOf) return false;

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
      return typeOf(object) == _typeof(klass.prototype.valueOf());
    case Object:
      return true;
  }

  return false;
};

var _toString = Object.prototype.toString;

function typeOf(object) {
  var type = typeof object === "undefined" ? "undefined" : _typeof(object);
  switch (type) {
    case "object":
      return object == null ? "null" : typeof object.constructor == "function" && _toString.call(object) != "[object Date]" ? _typeof(object.constructor.prototype.valueOf()) : type;
    case "function":
      return typeof object.call == "function" ? type : "object";
    default:
      return type;
  }
};

function assignID(object, name) {
  if (!name) name = object.nodeType == 1 ? "uniqueID" : "base2ID";
  if (!object[name]) object[name] = "b2_" + _counter++;
  return object[name];
};

function format(string) {
  var args = arguments;
  var pattern = new RegExp("%([1-" + (arguments.length - 1) + "])", "g");
  return (string + "").replace(pattern, function (match, index) {
    return args[index];
  });
};

function csv(string) {
  return string ? (string + "").split(/\s*,\s*/) : [];
};

function bind(fn, context) {
  var lateBound = typeof fn != "function";
  if (arguments.length > 2) {
    var args = _slice.call(arguments, 2);
    return function () {
      return (lateBound ? context[fn] : fn).apply(context, args.concat.apply(args, arguments));
    };
  } else {
    return function () {
      return (lateBound ? context[fn] : fn).apply(context, arguments);
    };
  }
};

function _partial(fn) {
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
      return _partial.apply(null, specialised);
    }
    return fn.apply(this, specialised);
  };
}exports.partial = _partial;
;

function delegate(fn, context) {
  return function () {
    var args = _slice.call(arguments);
    args.unshift(this);
    return fn.apply(context, args);
  };
};

function K(k) {
  return function () {
    return k;
  };
};