import { Enum } from "./core";

export const HandleResult = Enum(HandleResult => ({
    handled:           HandleResult(true,  false),
    handledAndStop:    HandleResult(true,  true),    
    notHandled:        HandleResult(false, false),
    notHandledAndStop: HandleResult(false, true)
}), {
    constructor(handled, stop) {
        this.extend({
            get handled() { return handled; },
            get stop()    { return stop; }
        });
    },

    toString() {
        return `HandleResult | ${this.handled ? "handled" : "not handled"} ${this.stop ? " and stop" : ""}`;
    }
});