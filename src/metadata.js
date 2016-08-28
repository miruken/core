import { decorate } from './decorate';
import { $isFunction } from './util';
import { Metadata, $meta } from './meta';

/**
 * Registers metadata for properties and methods.
 * @method metadata
 */
export function metadata(...args) {
    return decorate(_metadata, args);
}

metadata.getOwn = function (metaKey, criteria, source, key, fn) {
    return metadata.get(metaKey, criteria, source, key, fn, true);
}

metadata.get = function (metaKey, criteria, source, key, fn, own) {
    if (!fn && $isFunction(key)) {
        [key, fn] = [null, key];
    }
    if (!fn) return;
    const meta = source instanceof Metadata
               ? source
               : $meta(source);
    if (meta) {
        const match = own
              ? meta.getOwnMetadata(key, criteria)
              : meta.getMetadata(key, criteria);
        if (match) {
            if (key) {
                fn(match[metaKey], Metadata.getExternalKey(key));
            } else {
                Reflect.ownKeys(match).forEach(
                    k => fn(match[k][metaKey], Metadata.getExternalKey(k)));
            }
        }
    }
}

function _metadata(target, key, descriptor, [keyMetadata]) {
    if (keyMetadata) {
        const meta = $meta(target);
        if (meta) {
            meta.defineMetadata(key, keyMetadata);
        }
    }
}

export default metadata;
