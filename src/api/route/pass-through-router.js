import { Handler } from "callback/handler";
import { handles, $unhandled } from "callback/callback-policy";
import { unmanaged } from "callback/unmanaged";
import { skipFilters } from "callback/filter/filter";
import { Routed } from "./routed";
import "../handler-api";

@unmanaged
export class PassThroughRouter extends Handler {
    @skipFilters
    @handles(Routed)
    route(routed, { composer }) {
        return routed.route === PassThroughRouter.scheme
             ? composer.$send(routed.message)
             : $unhandled;
    }

    static get scheme() { return "pass-through"; }
}