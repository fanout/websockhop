export class AsyncFor {
    constructor(init, check, after) {
        this.init = init;
        this.check = check;
        this.after = after;
        this.loopBody = null;
    }
    runLoop(callback) {
        if (this.init) {
            this.init();
        }
        this._runMainLoop(false, callback);
    }
    _runMainLoop(endLoop, callback) {
        const check = !endLoop && (this.check ? this.check() : true);
        if (check) {
            var next = (exit) => {
                if (!exit) {
                    if (this.after) {
                        this.after();
                    }
                }
                this._runMainLoop(exit, callback);
            };
            if (this.loopBody) {
                var asyncMode = false;
                var async = () => {
                    asyncMode = true;
                    return next;
                };
                var result = this.loopBody(async);
                if (!asyncMode) {
                    next(result !== undefined && !result);
                }
            }
        } else {
            if (callback) {
                callback();
            }
        }
    }
}

export function asyncfor(init, check, after) {
    return new AsyncFor(init, check, after);
}
