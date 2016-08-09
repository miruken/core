import { decorate } from './decorator';

export function metadata(...args) {
    return decorate(handleMetadata, args);
}

function handleMetadata(target, key, descriptor, [keyMeta]) {
    if (keyMeta.length > 0) {
        const meta = $meta(target);
        if (meta) {
            meta.addMetadata(key, keyMeta[0]);
        }
    }
    return descriptor;
}
