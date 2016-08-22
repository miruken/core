import { decorate } from './decorate';
import { $flatten } from './util';
import { $meta } from './meta';

const injectKey      = Symbol(),
      injectCriteria = { [injectKey]: undefined };

export function inject(...dependencies) {
    return decorate(_inject, dependencies);
}
inject.get = function (source, key) {
    const meta = $meta(source);
    if (meta) {
        const match = meta.getMetadata(key, injectCriteria);
        if (match) {
            return match[injectKey]; 
        }
    }
}

function _inject(target, key, descriptor, dependencies) {
    dependencies = $flatten(dependencies);
    if (dependencies.length > 0) {
        const meta = $meta(target);
        if (meta) {
            meta.addMetadata(key, { [injectKey]: dependencies });
        }
    }
}

export default inject;
