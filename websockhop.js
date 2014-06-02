/**
 * WebSockHop JavaScript Library v0.1.0
 * Copyright 2014 Fanout, Inc.
 * Released under the MIT license (see COPYING file in source distribution)
 */

(function(factory) {
    "use strict";
    var DEBUG = true;
    var isWindow = function(variable) {
        return variable && variable.document && variable.location && variable.alert && variable.setInterval;
    }
    if (!isWindow(window)) {
        throw "The current version of WebSockHop may only be used within the context of a browser.";
    }
    var debugMode = DEBUG && typeof(window.console) !== "undefined";
    if (typeof define === 'function' && define['amd']) {
        // AMD anonymous module
        define(['module'], function(module) { module.exports = factory(window, debugMode); });
    } else {
        // No module loader (plain <script> tag) - put directly in global namespace
        window['WebSockHop'] = factory(window, debugMode);
    }
})(function(window, debugMode) {

    var debug;

    if (debugMode) {
        if (Function.prototype.bind) {
            debug = {
                log: window.console.log.bind(window.console),
                error: window.console.error.bind(window.console),
                info: window.console.info.bind(window.console),
                warn: window.console.warn.bind(window.console)
            };
        } else {
            var log = function(output) { window.console.log(output); };

            debug = {
                log: log,
                error: log,
                warn: log,
                info: log
            }
        }
    } else {
        var __no_op = function() {};

        debug = {
            log: __no_op,
            error: __no_op,
            warn: __no_op,
            info: __no_op
        }
    }

    var copyArray = function (array) {
        var args = Array.prototype.slice.call(arguments, 1);
        return Array.prototype.slice.apply(array, args);
    };

    var indexOfItemInArray = function (array, item) {
        for (var i = 0, length = array.length; i < length; i = i + 1) {
            if (array[i] === item) {
                return i;
            }
        }
        return -1;
    };

    var removeFromArray = function (array, item) {
        var again = true;
        while (again) {
            var index = indexOfItemInArray(array, item);
            if (index != -1) {
                array.splice(index, 1);
            } else {
                again = false;
            }
        }
    };

    var setTimeout = function(predicate, delay, ctx) {
        return window.setTimeout(function() {
            predicate.apply(ctx);
        }, delay);
    };

    var nextUpdate = function(predicate, ctx) {
        return setTimeout(predicate, 0, ctx);
    };

    var isArray = Array.isArray || function(obj) {
        return Object.prototype.toString.call(obj) == '[object Array]';
    };

    var isFunction = function(obj) {
        return Object.prototype.toString.call(obj) == '[object Function]';
    };

    var AsyncFor = function(init, check, after) {
        this.init = init;
        this.check = check;
        this.after = after;
        this.loopBody = null;
    };
    AsyncFor.prototype.runLoop = function(callback) {
        if (this.init) {
            this.init();
        }
        this._runMainLoop(false, callback);
    };
    AsyncFor.prototype._runMainLoop = function(endLoop, callback) {
        var check = !endLoop && (this.check ? this.check() : true);
        if (check) {
            var _this = this;
            var next = function(exit) {
                if (!exit) {
                    if (_this.after) {
                        _this.after();
                    }
                }
                _this._runMainLoop(exit, callback);
            };
            if (this.loopBody) {
                var asyncMode = false;
                var async = function() {
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
    };

    var asyncfor = function(init, check, after) {
        return new AsyncFor(init, check, after);
    };

    var Events = function (ctx) {
        this._events = {};
        this._ctx = ctx;
    };
    Events.prototype._getHandlersForType = function (type) {
        if (!(type in this._events)) {
            this._events[type] = [];
        }
        return this._events[type];
    };
    Events.prototype.on = function (type, handler) {
        var handlers = this._getHandlersForType(type);
        handlers.push(handler);
    };
    Events.prototype.off = function (type) {
        if (arguments.length > 1) {
            var handler = arguments[1];
            var handlers = this._getHandlersForType(type);
            removeFromArray(handlers, handler);
        } else {
            delete this._events[type];
        }
    };
    Events.prototype.trigger = function (type, args, callback) {

        var handlers = copyArray(this._getHandlersForType(type));
        var n = handlers.length;
        var ctx = this._ctx;

        // The following is the async way to write:
        // for (var i = 0; i < n; i = i + 1) {
        //     var handler = handlers[i];
        //     handler.apply(ctx, args);
        // }

        var i;
        var loop = asyncfor(
            function() { i = 0; },
            function() { return i < n; },
            function() { i = i + 1; }
        );
        loop.loopBody = function(async) {
            var handler = handlers[i];
            ctx.async = function() {
                delete ctx.async;
                return async();
            };
            handler.apply(ctx, args);
        };
        loop.runLoop(function() {
            if (callback) {
                callback();
            }
        });

    };

    var WebSockHop = function(url, protocol) {
        if (!(this instanceof WebSockHop)) {
            throw new window.Error("Constructor called as a function");
        }

        this._socket = null;
        this._url = url;
        this._protocol = protocol;
        this._events = new Events(this);
        this._timer = null;
        this._tries = 0;
        this._closing = false;

        this._attemptConnect();
    };
    WebSockHop.prototype._attemptConnect = function() {
        if (!this._timer) {
            var delay = 0;
            if (this._tries > 0) {
                var timeCap = 1 << Math.min(6, (this._tries - 1));
                delay = timeCap * 1000 + Math.floor(Math.random() * 1000);
                debug.info("WebSockHop: Trying again in " + delay + "ms");
            }
            this._tries = this._tries + 1;

            this._timer = setTimeout(function() {
                this._timer = null;
                this._start();
            }, delay, this);
        }
    };
    WebSockHop.prototype._abortConnect = function() {
        if (this._timer) {
            window.clearTimeout(this._timer);
            this._timer = null;
        }
    };
    WebSockHop.prototype._raiseEvent = function(event, args, callback) {
        if (isFunction(args) && !callback) {
            callback = args;
            args = [];
        }
        if (!isArray(args)) {
            args = [args];
        }
        debug.log("WebSockHop: " + event + " event start");
        this._events.trigger(event, args, function () {
            debug.log("WebSockHop: " + event + " event end");
            if (callback) {
                callback();
            }
        });
    };
    WebSockHop.prototype._start = function() {
        var _this = this;
        this._raiseEvent("opening", function() {
            var socket = _this._socket = new WebSocket(_this._url, _this._protocol);
            socket.onopen = function(event) {
                debug.log("WebSockHop: WebSocket::onopen");
                _this._tries = 0;
                _this._raiseEvent("opened");
            };
            socket.onclose = function(event) {
                debug.log("WebSockHop: WebSocket::onclose { wasClean: " + (event.wasClean ? "true" : "false") + ", code: " + event.code + " }");
                var closing = _this._closing;

                if (event.wasClean) {
                    _this._raiseEvent("closed", function() {
                        _this._socket = null;
                    });
                } else {
                    var willRetry = !closing;
                    _this._raiseEvent("error", willRetry, function() {
                        _this._socket = null;
                        if (closing) {
                            debug.log("WebSockHop: closed by close(), foregoing reconnect.");
                        } else {
                            _this._attemptConnect();
                        }
                    });
                }
            };
            socket.onmessage = function(event) {
                debug.log("WebSockHop: WebSocket::onmessage { data: " + event.data + " }");
                _this._raiseEvent("message", event.data);
            }
        });
    };

    WebSockHop.prototype.send = function(data) {
        if (this._socket) {
            this._socket.send(data);
        }
    };
    WebSockHop.prototype.close = function() {
        if (!this._closing) {
            this._closing = true;
            if (this._socket) {
                this._socket.close();
            } else if (this._timer) {
                debug.log("WebSockHop: close() called on reconnecting WebSockHop, aborting reconnect.");
                this._abortConnect();
            }
        }
    };

    WebSockHop.prototype.on = function (type, handler) {
        this._events.on(type, handler);
    };
    WebSockHop.prototype.off = function (type) {
        if (arguments.length > 1) {
            this._events.off(type, arguments[1]);
        } else {
            this._events.off(type);
       }
    };

    return WebSockHop;
});