import { removeFromArray } from "./utils";
import { asyncfor } from "./asyncfor";

class Events {
    constructor(ctx) {
        this._events = {};
        this._ctx = ctx;
    }
    _getHandlersForType(type) {
        if (!(type in this._events)) {
            this._events[type] = [];
        }
        return this._events[type];
    }
    on(type, handler) {
        var handlers = this._getHandlersForType(type);
        handlers.push(handler);
    }
    off(type, handler) {
        if (handler != null) {
            var handlers = this._getHandlersForType(type);
            removeFromArray(handlers, handler);
        } else {
            delete this._events[type];
        }
    }
    trigger(type, args, callback) {

        const handlers = this._getHandlersForType(type).slice();
        const n = handlers.length;

        // The following is the async way to write:
        // for (var i = 0; i < n; i = i + 1) {
        //     var handler = handlers[i];
        //     handler.apply(ctx, args);
        // }

        let i;
        const loop = asyncfor(
            () => i = 0,
            () => i < n,
            () => i = i + 1
        );
        loop.loopBody = (async) => {
            const handler = handlers[i];
            this._ctx.async = () => {
                delete this._ctx.async;
                return async();
            };
            handler.apply(this._ctx, args);
        };
        loop.runLoop(() => {
            if (callback) {
                callback();
            }
        });

    }
}

export default Events;