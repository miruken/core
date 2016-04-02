import { Package } from './base2';
import { $isFunction, $isClass, $isProtocol} from './meta';

Package.implement({
    export(name, member) {
        this.addName(name, member);
    },
    getProtocols() {
        _listContents(this, arguments, $isProtocol);
    },
    getClasses() {
        _listContents(this, arguments, function (member, memberName) {
            return $isClass(member) && (memberName != "constructor");
        });
    },
    getPackages() {
        _listContents(this, arguments, function (member, memberName) {
            return (member instanceof Package) && (memberName != "parent");
        });
    }
});

function _listContents(pkg, args, filter) {
    const cb  = Array.prototype.pop.call(args);
    if ($isFunction(cb)) {
        const names = Array.prototype.pop.call(args) || Object.keys(pkg);
        for (let i = 0; i < names.length; ++i) {
            const name   = names[i],
                  member = pkg[name];
            if (member && (!filter || filter(member, name))) {
                cb({ member: member, name: name});
            }
        }
    }
}
