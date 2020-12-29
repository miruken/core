import { $isNothing, $flatten } from "../../core/base2";
import { Handler } from "../../callback/handler";
import "../handler-api";

import { 
    Concurrent, Sequential, ScheduledResult
} from "./scheduled";


Handler.implement({
    concurrent(...requests) {
        const reqs = $flatten(requests, true);
        return $isNothing(reqs) || reqs.length === 0
             ? new ScheduledResult()
             : this.send(new Concurrent(reqs));
    },
    sequential(...requests) {
        const reqs = $flatten(requests, true);
        return $isNothing(reqs) || reqs.length === 0
             ? new ScheduledResult()
             : this.send(new Sequential(reqs));
    }   
});
