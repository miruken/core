import { $isNothing } from "../core/base2";
import { Handler } from "../callback/handler";
import { Command } from "../callback/command";
import { Stash } from "./stash";
import { NotHandledError } from "../callback/errors";

Handler.implement({
    send(request) {
        if ($isNothing(request)) return;
        const command = new Command(request);
        if (!(new Stash().$chain(this)).handle(command, false)) {
            throw new NotHandledError(request);
        }
        return command.callbackResult;
    },
    publish(notification) {
        if ($isNothing(notification)) return;
        const command = new Command(notification, true);
        if (!(new Stash().$chain(this)).handle(command, true)) {
            throw new NotHandledError(notification);
        }
        return command.callbackResult;
    }    
});
