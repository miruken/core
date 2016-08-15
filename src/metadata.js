import { decorate } from './decorate';
import { $meta } from './meta';

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
