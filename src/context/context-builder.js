import { $isNothing } from "../core/base2";
import { InferenceHandler } from "../callback/inference-handler";
import { HandlerBuilder } from "../callback/handler-builder";
import { Context } from "./context";

export class ContextBuilder extends HandlerBuilder {
    constructor(parent) {
        super();
        _(this).parent = parent;
    }

    createHandler(selectedTypes, explicitHandlers) {
        const parent  = _(this).parent,
              context = $isNothing(parent) ? new Context() : parent.newChild();
        return context
            .addHandlers(explicitHandlers)
            .addHandlers(new InferenceHandler(selectedTypes));
    }    
}