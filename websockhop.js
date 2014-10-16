/**
 * WebSockHop JavaScript Library v1.0.0
 * Copyright 2014 Fanout, Inc.
 * Released under the MIT license (see COPYING file in source distribution)
 */

(function(factory) {
    "use strict";
    var DEBUG = true;
    var isWindow = function(variable) {
        return variable && variable.document && variable.location && variable.alert && variable.setInterval;
    };
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
        /*
        if (Function.prototype.bind) {
            debug = {
                log: window.console.log.bind(window.console),
                error: window.console.error.bind(window.console),
                info: window.console.info.bind(window.console),
                warn: window.console.warn.bind(window.console)
            };
        }
        */
        var log = function(output) { window.console.log(new Date().toTimeString() + " - " + output); };

        debug = {
            log: log,
            error: log,
            warn: log,
            info: log
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

    // Browser workaround for FireFox, prevent Esc from canceling
    (function() {
        var body = window.document.body;
        if (body.addEventListener) {
            // If addEventListener is not there then this is IE, so
            // we don't have to worry about it.
            body.addEventListener("keydown", function(e) {
                if (e.keyCode == 27) {
                    e.preventDefault();
                }
            }, false);
        }
    })();

    // UserAgent detection, borrowed from jQuery migrate
    // https://github.com/jquery/jquery-migrate
    var uaMatch = function( ua ) {
        ua = ua.toLowerCase();

        var match = /(chrome)[ \/]([\w.]+)/.exec( ua ) ||
            /(webkit)[ \/]([\w.]+)/.exec( ua ) ||
            /(opera)(?:.*version|)[ \/]([\w.]+)/.exec( ua ) ||
            /(msie) ([\w.]+)/.exec( ua ) ||
            ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec( ua ) ||
            [];

        return {
            browser: match[ 1 ] || "",
            version: match[ 2 ] || "0"
        };
    };

    var browser;
    (function() {

        var matched = uaMatch( window.navigator.userAgent );
        browser = {};

        if ( matched.browser ) {
            browser[ matched.browser ] = true;
            browser.version = matched.version;
        }

        // Chrome is Webkit, but Webkit is also Safari.
        if ( browser.chrome ) {
            browser.webkit = true;
        } else if ( browser.webkit ) {
            browser.safari = true;
        }

    })();

    // WebSockets unavailable under certain conditions

    var isInvalidSafari = (function() {
        return (
            browser.safari &&
            !browser.chrome &&
            parseFloat(browser.version) < 534.54
        );
    })();

    var isMobile = (function() {
        var result = false;
        (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))result=true})(navigator.userAgent||navigator.vendor||window.opera);
        return result;
    })();

    var copyArray = function (array) {
        var args = Array.prototype.slice.call(arguments, 1);
        return Array.prototype.slice.apply(array, args);
    };

    var shallowCopy = function (obj) {
        var copy = {};
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                copy[key] = obj[key];
            }
        }
        return copy;
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

    var isObject = function(obj) {
        return obj != null && obj === Object(obj);
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

    var MessageFormatterBase = function() {};
    MessageFormatterBase.prototype.toMessage = function(obj) {
        throw "Not Implemented";
    };
    MessageFormatterBase.prototype.fromMessage = function(message) {
        throw "Not Implemented";
    };
    MessageFormatterBase.prototype.trackRequest = function(requestObject, handler) {
        throw "Not Implemented";
    };
    MessageFormatterBase.prototype.getHandlerForResponse = function(responseObject) {
        return null;
    };
    MessageFormatterBase.prototype.getPendingHandlerIds = function() {
        return null;
    };
    MessageFormatterBase.prototype.pingMessage = null;
    MessageFormatterBase.prototype.pingRequest = null;
    MessageFormatterBase.prototype.handlePing = null;
    MessageFormatterBase.prototype.handlePong = null;

    var StringFormatter = function() {};
    StringFormatter.prototype = new MessageFormatterBase();
    StringFormatter.prototype.toMessage = function(obj) {
        return obj.toString();
    };
    StringFormatter.prototype.fromMessage = function(message) {
        return message;
    };

    var JsonFormatter = function() {
        this._requestMap = {};
        this._nextId = 0;
    };
    JsonFormatter.prototype = new MessageFormatterBase();
    JsonFormatter.prototype.toMessage = function(obj) {
        return JSON.stringify(obj);
    };
    JsonFormatter.prototype.fromMessage = function(message) {
        return JSON.parse(message);
    };
    JsonFormatter.prototype.trackRequest = function(requestObject, handler) {
        requestObject.id = ++this._nextId;
        this._requestMap[requestObject.id.toString()] = handler;
        return requestObject;
    };
    JsonFormatter.prototype.getHandlerForResponse = function(responseObject) {
        if (!("id" in responseObject)) {
            return null;
        }
        var id = responseObject.id.toString();
        if (!(id in this._requestMap)) {
            return null;
        }
        var handler = this._requestMap[id];
        delete this._requestMap[id];
        return handler;
    };
    JsonFormatter.prototype.getPendingHandlerIds = function() {
        var ids = [];
        for(var key in this._requestMap) {
            if (this._requestMap.hasOwnProperty(key)) {
                ids.push(key);
            }
        }
        return ids;
    };

    var ErrorEnumValue = {
        "None": 0,
        "Disconnect": 1,
        "Timeout": 2
    };

    var WebSockHop = function(url, protocol) {
        if (!(this instanceof WebSockHop)) {
            throw new window.Error("Constructor called as a function");
        }

        if (!WebSockHop.isAvailable()) {
            throw new window.Error("WebSockHop cannot be instantiated because one or more validity checks failed.");
        }

        this._socket = null;
        this._url = url;
        this._protocol = protocol;
        this._events = new Events(this);
        this._timer = null;
        this._tries = 0;
        this._aborted = false;
        this._closing = false;
        this.formatter = null;

        this.connectionTimeoutMsecs = 10000; // 10 seconds default connection timeout

        this._pingTimer = null;
        this._lastSentPing = null;
        this._lastReceivedPongId = 0;
        this.pingIntervalMsecs = 60000; // 60 seconds default ping timeout
        this.pingResponseTimeoutMsecs = 10000; // 10 seconds default ping response timeout

        this.defaultRequestTimeoutMsecs = null; // Unless specified, request() calls use this value for timeout
        this.defaultDisconnectOnRequestTimeout = false; // If specified, request "timeout" events will handle as though socket was dropped

        this._attemptConnect();
    };
    WebSockHop.disable = { oldSafari: true, mobile: true };
    WebSockHop.isAvailable = function() {
        if (this.disable.oldSafari && isInvalidSafari) {
            return false;
        }

        if (this.disable.mobile && isMobile) {
            return false;
        }

        return true;
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
        this._aborted = true;
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
        if (this.formatter == null) {
            throw "A message formatter must be specified before using WebSockHop.";
        }
        var _this = this;
        this._raiseEvent("opening", function() {
            if (!_this._aborted) {
                var socket = _this._socket = _this._protocol ? new WebSocket(_this._url, _this._protocol) : new WebSocket(_this._url);
                var connectionTimeout = null;
                if (_this.connectionTimeoutMsecs) {
                    connectionTimeout = setTimeout(function() {
                        debug.log("WebSockHop: Connection timeout exceeded.");
                        _this._raiseErrorEvent(false);
                    }, _this.connectionTimeoutMsecs);
                    debug.log("WebSockHop: Setting connection timeout (" + _this.connectionTimeoutMsecs + " msecs).");
                }
                var clearConnectionTimeout = function() {
                    if (connectionTimeout != null) {
                        debug.log("WebSockHop: Clearing connection timeout.");
                        window.clearTimeout(connectionTimeout);
                        connectionTimeout = null;
                    }
                };
                socket.onopen = function(event) {
                    debug.log("WebSockHop: WebSocket::onopen");
                    clearConnectionTimeout();
                    _this._tries = 0;
                    _this._raiseEvent("opened");
                    _this._resetPingTimer();
                };
                socket.onclose = function(event) {
                    debug.log("WebSockHop: WebSocket::onclose { wasClean: " + (event.wasClean ? "true" : "false") + ", code: " + event.code + " }");
                    clearConnectionTimeout();
                    var closing = _this._closing;

                    if (event.wasClean) {
                        nextUpdate(function() {
                            _this._raiseEvent("closed", function() {
                                _this._socket = null;
                            });
                        });
                    } else {
                        nextUpdate(function() {
                            _this._raiseErrorEvent(closing);
                        });
                    }
                    _this._clearPingTimers();
                };
                socket.onmessage = function(event) {
                    var onMessage = function() {
                        debug.log("WebSockHop: WebSocket::onmessage { data: " + event.data + " }");
                        _this._dispatchMessage(event.data);
                    };
                    if (isMobile) {
                        nextUpdate(onMessage);
                    } else {
                        onMessage();
                    }
                };
            }
        });
    };
    WebSockHop.prototype._raiseErrorEvent = function(isClosing) {
        var _this = this;
        var willRetry = !isClosing;
        this._raiseEvent("error", willRetry, function() {
            _this._socket = null;
            if (_this.formatter != null) {
                var pendingRequestIds = _this.formatter.getPendingHandlerIds();
                if (pendingRequestIds != null) {
                    for (var i = 0; i < pendingRequestIds.length; i++) {
                        var requestId = pendingRequestIds[i];
                        _this._dispatchErrorMessage(requestId, {type: ErrorEnumValue.Disconnect});
                    }
                }
            }
            if (willRetry) {
                _this._attemptConnect();
            }
        });
    };

    WebSockHop.prototype._clearPingTimers = function() {
        debug.log("WebSockHop: clearing ping timers.");
        if (this._pingTimer) {
            window.clearTimeout(this._pingTimer);
            this._pingTimer = null;
        }
    };

    WebSockHop.prototype._resetPingTimer = function() {
        debug.log("WebSockHop: resetting ping timer.");
        this._clearPingTimers();
        var _this = this;
        this._pingTimer = setTimeout(function() {
            this.sendPingRequest();
        }, this.pingIntervalMsecs, this);
        debug.log("WebSockHop: attempting ping in " + this.pingIntervalMsecs + " ms");
    };
    WebSockHop.prototype.sendPingRequest = function() {
        var _this = this;
        if (this.formatter != null) {
            if (isObject(this.formatter.pingRequest)) {
                var ping = shallowCopy(this.formatter.pingRequest);
                var request = this.request(ping, function (obj) {
                    _this._lastReceivedPongId = obj.id;
                }, function (error) {
                    if (error.type == ErrorEnumValue.Timeout) {
                        debug.log("WebSockHop: no ping response, handling as disconnected");
                    }
                }, this.pingResponseTimeoutMsecs, true);
                this._lastSentPing = request;
                debug.log("WebSockHop: > PING [" + ping.id + "], requiring response in " + this.pingResponseTimeoutMsecs + " ms");
            } else if (this.formatter.pingMessage != null) {
                var ping = this.formatter.pingMessage;
                var pingMessage = this._sendPingMessage(ping, this.pingResponseTimeoutMsecs);
                this._lastSentPing = pingMessage;
                debug.log("WebSockHop: > PING, requiring response in " + this.pingResponseTimeoutMsecs + " ms");
            } else {
                debug.log("WebSockHop: No ping set up for message formatter, not performing ping.");
            }
        } else {
            debug.log("WebSockHop: Time for ping, but no formatter selected, not performing ping.");
        }
    };

    WebSockHop.prototype.send = function(obj) {
        if (this._socket) {
            var message = this.formatter.toMessage(obj);
            this._socket.send(message);
        }
    };
    WebSockHop.prototype.close = function() {
        var _this = this;
        if (this._socket) {
            this._closing = true;
            this._socket.close();
        } else {
            this._abortConnect();
            this._clearPingTimers();
            nextUpdate(function() {
                _this._raiseErrorEvent(true);
            });
        }
    };
    WebSockHop.prototype.abort = function () {
        if (this._socket) {
            debug.log("WebSockHop: abort() called on live socket, performing forceful shutdown.  Did you mean to call close() ?");
            this._clearPingTimers();
            this._lastSentPing = null;
            this._lastReceivedPongId = 0;
            this._socket.onclose = null;
            this._socket.onmessage = null;
            this._socket.onerror = null;
            this._socket.close();
            this._socket = null;
        }
        this._abortConnect();
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
    WebSockHop.prototype.request = function (obj, callback, errorCallback, timeoutMsecs, disconnectOnTimeout) {
        var request = {
            obj: obj,
            requestTimeoutTimer: null,
            requestTimeoutMsecs: typeof timeoutMsecs !== 'undefined' ? timeoutMsecs : this.defaultRequestTimeoutMsecs,
            requestDisconnectOnTimeout: typeof disconnectOnTimeout !== 'undefined' ? disconnectOnTimeout : this.defaultDisconnectOnRequestTimeout,
            clearTimeout: function() {
                if (this.requestTimeoutTimer != null) {
                    window.clearTimeout(this.requestTimeoutTimer);
                    this.requestTimeoutTimer = null;
                }
            }
        };

        this.formatter.trackRequest(obj, {
            callback: function (o) {
                request.clearTimeout();
                if (callback != null) {
                    callback(o);
                }
            },
            errorCallback: function (err) {
                if (errorCallback != null) {
                    errorCallback(err);
                }
            }
        });
        this.send(obj);
        if (request.requestTimeoutMsecs > 0) {

            this._startRequestTimeout(request);

        }

        return request;
    };
    WebSockHop.prototype._startRequestTimeout = function(request) {

        var obj = request.obj;
        request.clearTimeout();
        request.requestTimeoutTimer = setTimeout(function() {
            debug.log("WebSockHop: timeout exceeded [" + obj.id + "]");
            this._dispatchErrorMessage(obj.id, {type: ErrorEnumValue.Timeout});
            if (request.requestDisconnectOnTimeout) {
                this._raiseErrorEvent(false);
            }
        }, request.requestTimeoutMsecs, this);

    };
    WebSockHop.prototype._sendPingMessage = function(message, timeoutMsecs) {
        var pingMessage = {
            obj: message,
            messageTimeoutTimer: null,
            messageTimeoutMsecs: typeof timeoutMsecs !== 'undefined' ? timeoutMsecs : this.defaultRequestTimeoutMsecs,
            clearTimeout: function() {
                if (this.messageTimeoutTimer != null) {
                    window.clearTimeout(this.messageTimeoutTimer);
                    this.messageTimeoutTimer = null;
                }
            }
        };
        this.send(message);
        if (pingMessage.messageTimeoutMsecs > 0) {
            this._startPingMessageTimeout(pingMessage);
        }
        return pingMessage;
    };
    WebSockHop.prototype._startPingMessageTimeout = function(pingMessage) {

        var obj = pingMessage.obj;
        pingMessage.clearTimeout();
        pingMessage.messageTimeoutTimer = setTimeout(function() {
            debug.log("WebSockHop: timeout exceeded");
            this._raiseErrorEvent(false);
        }, pingMessage.messageTimeoutMsecs, this);

    };
    WebSockHop.prototype._dispatchMessage = function (message) {
        var isHandled = false;
        var obj = this.formatter.fromMessage(message);
        if (this.formatter != null) {
            var isPong = false;
            var pongId = 0;

            if (isObject(this.formatter.pingRequest)) {

                // Check for request-based ping response

                // See if this object is a response to a request().
                var handler = isObject(obj) ? this.formatter.getHandlerForResponse(obj) : null;
                if (handler != null) {
                    handler.callback(obj);
                    if (this._lastSentPing != null &&
                        this._lastSentPing.obj != null &&
                        this._lastSentPing.obj.id == this._lastReceivedPongId
                    ) {
                        this._lastSentPing = null;
                        this._lastReceivedPongId = 0;
                        isPong = true;
                        pongId = obj.id;
                    }
                    isHandled = true;
                }

                // If this is NOT a pong then just extend the response timer, if any
                if (!isPong && this._lastSentPing != null) {
                    debug.log("WebSockHop: Non-pong received during pong response period, extending delay...");
                    this._startRequestTimeout(this._lastSentPing);
                }

            } else if (this.formatter.pingMessage != null) {

                // Check for message-based ping response

                if (this.formatter.handlePong != null) {
                    isPong = this.formatter.handlePong(obj);
                    if (isPong) {
                        isHandled = true;
                    }
                } else {
                    // If handlePong is null, then any message counts as a pong,
                    // but we don't eat the message.
                    isPong = true;
                }

                if (this._lastSentPing != null) {
                    if (isPong) {
                        // If this is a pong then clear the pong timer.
                        this._lastSentPing.clearTimeout();
                        this._lastSentPing = null;
                    } else {
                        // If this is NOT a pong then just extend the response timer, if any
                        debug.log("WebSockHop: Non-pong received during pong response period, extending delay...");
                        this._startPingMessageTimeout(this._lastSentPing);
                    }
                }
            }

            if (isPong) {
                if (pongId > 0) {
                    debug.log("WebSockHop: < PONG [" + pongId + "]");
                } else {
                    debug.log("WebSockHop: < PONG");
                }
                this._resetPingTimer();
            }
            if (!isHandled && this.formatter.handlePing != null) {
                var isPing = this.formatter.handlePing(obj);
                if (isPing) {
                    debug.log("WebSockHop: Received PING message, handled.");
                    isHandled = true;
                }
            }
        }
        if (!isHandled) {
            this._raiseEvent("message", obj);
        }
    };
    WebSockHop.prototype._dispatchErrorMessage = function (id, error) {
        if (this.formatter != null) {
            var handler = this.formatter.getHandlerForResponse({id:id});
            if (handler != null) {
                handler.errorCallback(error);
            }
        }
    };

    WebSockHop.ErrorEnumValue = ErrorEnumValue;
    WebSockHop.StringFormatter = StringFormatter;
    WebSockHop.JsonFormatter = JsonFormatter;

    return WebSockHop;
});
