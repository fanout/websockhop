import { removeFromArray } from "./utils";

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
        const handlers = this._getHandlersForType(type);
        handlers.push(handler);
    }
    off(type, handler) {
        if (handler != null) {
            const handlers = this._getHandlersForType(type);
            removeFromArray(handlers, handler);
        } else {
            delete this._events[type];
        }
    }
    async trigger(type, ...args) {

        const handlers = this._getHandlersForType(type).slice();

        for (const handler of handlers) {

            const result = await new Promise(async (resolve, reject) => {
                try {

                    let isAsync = false;

                    this._ctx.async = () => {
                        isAsync = true;
                        return (continueLoop = true) => {
                            resolve(continueLoop);
                        };
                    };

                    const handlerResult = await Promise.resolve(handler.call(this._ctx, ...args));

                    delete this._ctx.async;
                    
                    if (isAsync) {
                        // We don't resolve the promise now, but wait til the
                        // thing above is called.
                    } else {
                        resolve(handlerResult);
                    }

                } catch(ex) {
                    
                    reject(ex);
                    
                }
            });
            
            if (typeof result !== "undefined" && !result) {
                break;
            }
            
        }
    }
}

export default Events;