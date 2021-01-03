import { Handler } from "callback/handler";
import { ContextualHelper } from "./context-helper";

Handler.implement({
    /**
     * Establishes broadcast invocation semantics.
     * @method $broadcast
     * @returns {Handler} broadcast semantics.
     * @for Handler
     */
    $broadcast() {
        let   composer = this;
        const context  = ContextualHelper.resolveContext(composer);
        if (context) {
            composer = context.$selfOrDescendant();
        }
        return composer.$notify();
    },
    $broadcastFromRoot() {
        let   composer = this;
        const context  = ContextualHelper.resolveContext(composer);
        if (context) {
            composer = context.root.$selfOrDescendant();
        }
        return composer.$notify();
    }
});
