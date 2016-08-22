import { decorate } from './decorate';
import { $meta } from './meta';

export function metadata(...args) {
    return decorate(_metadata, args);
}

function _metadata(target, key, descriptor, [keyMetadata]) {
    if (keyMetadata) {
        const meta = $meta(target);
        if (meta) {
            meta.addMetadata(key, keyMetadata);
        }
    }
}

export default metadata;
