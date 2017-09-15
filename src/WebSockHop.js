import { isFunction, isObject, nextUpdate } from "./utils";
import { isWebSocketUnavailable, isInvalidSafari, isMobile } from "./browserDetection";

import Events from "./Events";
import ErrorEnumValue from "./ErrorEnumValue";
import { StringFormatter, JsonFormatter, MessageFormatterBase } from "./formatters";

function defaultCreateSocket(url, protocols) {
    if (!WebSockHop.isAvailable()) {
        throw "WebSockHop cannot be instantiated because one or more validity checks failed.";
    }
    return protocols != null ? new WebSocket(url, protocols) : new WebSocket(url);
}

function extractProtocolsFromOptions({protocol, protocols} = {}) {
    if (Array.isArray(protocols)) {
        return protocols;
    }

    if (typeof protocols === "string" || protocols instanceof String) {
        return [protocols];
    }

    if (typeof protocol === "string" || protocol instanceof String) {
        return [protocol];
    }

    return null;
}

class WebSockHop {
    constructor(url, opts) {
        const protocols = extractProtocolsFromOptions(opts);

        const combinedOptions = Object.assign({}, opts,
            protocols != null ? { protocols } : null
        );

        this._opts = combinedOptions;

        this.socket = null;
        this._url = url;
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

        this.protocol = null; // This will eventually hold the protocol that we successfully connected with

        this._attemptConnect();
    }
    _attemptConnect() {
        if (!this._timer) {
            let delay = 0;
            if (this._tries > 0) {
                const timeCap = 1 << Math.min(6, (this._tries - 1));
                delay = timeCap * 1000 + Math.floor(Math.random() * 1000);
                WebSockHop.log("info", `Trying again in ${delay}ms`);
            }
            this._tries = this._tries + 1;

            this._timer = setTimeout(async () => {
                this._timer = null;
                await this._start();
            }, delay);
        }
    }
    _abortConnect() {
        if (this._timer) {
            clearTimeout(this._timer);
            this._timer = null;
        }
        this._aborted = true;
    }
    async _raiseEvent(event, ...args) {
        WebSockHop.log("info", `${event} event start`);
        await this._events.trigger(event, ...args);
        WebSockHop.log("info", `${event} event end`);
    }
    async _start() {
        if (this.formatter == null) {
            WebSockHop.log("info", "No message formatter had been specified, creating a StringFormatter instance as formatter.");
            this.formatter = new StringFormatter();
        }
        await this._raiseEvent("opening");
        if (!this._aborted) {
            const { createSocket = defaultCreateSocket, protocols } = this._opts;
            this.socket = createSocket(this._url, protocols);
            let connectionTimeout = null;
            if (this.connectionTimeoutMsecs) {
                connectionTimeout = setTimeout(() => {
                    WebSockHop.log("warn", "Connection timeout exceeded.");
                    this._raiseErrorEvent(false);
                }, this.connectionTimeoutMsecs);
                WebSockHop.log("info", `Setting connection timeout (${this.connectionTimeoutMsecs} msecs).`);
            }
            const clearConnectionTimeout = () => {
                if (connectionTimeout != null) {
                    WebSockHop.log("info", "Clearing connection timeout.");
                    clearTimeout(connectionTimeout);
                    connectionTimeout = null;
                }
            };
            this.socket.onopen = async () => {
                WebSockHop.log("info", "WebSocket::onopen");
                clearConnectionTimeout();
                this.protocol = this.socket.protocol;
                this._tries = 0;
                await this._raiseEvent("opened");
                this._resetPingTimer();
            };
            this.socket.onclose = ({wasClean, code}) => {
                WebSockHop.log("info", `WebSocket::onclose { wasClean: ${wasClean ? "true" : "false"}, code: ${code} }`);
                clearConnectionTimeout();
                const closing = this._closing;

                if (wasClean) {
                    nextUpdate(async () => {
                        await this._raiseEvent("closed");
                        this.socket = null;
                    });
                } else {
                    nextUpdate(() => {
                        this._raiseErrorEvent(closing);
                    });
                }
                this._clearPingTimers();
            };
            this.socket.onmessage = ({data}) => {
                nextUpdate(() => {
                    WebSockHop.log("info", `WebSocket::onmessage { data: ${data} }`);
                    this._dispatchMessage(data);
                });
            };
        }
    }
    async _raiseErrorEvent(isClosing) {
        const willRetry = !isClosing;
        await this._raiseEvent("error", willRetry);
        this._clearSocket();
        if (this.formatter != null) {
            const pendingRequestIds = this.formatter.getPendingHandlerIds();
            if (Array.isArray(pendingRequestIds)) {
                for (const requestId of pendingRequestIds) {
                    await this._dispatchErrorMessage(requestId, {type: ErrorEnumValue.Disconnect});
                }
            }
        }
        if (willRetry) {
            this._attemptConnect();
        }
    }
    // Clear the current this.socket and all state dependent on it.
    _clearSocket() {
        this._lastSentPing = null;
        this._lastReceivedPongId = 0;
        this.socket.onclose = () => WebSockHop.log("info", "closed old socket that had been cleared()");
        this.socket.onmessage = null;
        this.socket.onerror = (error) => WebSockHop.log("info", "error in old socket that had been cleared()", error);;
        this.socket.close();
        this.protocol = null;
        this.socket = null;
    }
    _clearPingTimers() {
        WebSockHop.log("info", "clearing ping timers.");
        if (this._pingTimer) {
            clearTimeout(this._pingTimer);
            this._pingTimer = null;
        }
    }
    _resetPingTimer() {
        WebSockHop.log("info", "resetting ping timer.");
        this._clearPingTimers();
        this._pingTimer = setTimeout(() => {
            this.sendPingRequest();
        }, this.pingIntervalMsecs);
        WebSockHop.log("info", `attempting ping in ${this.pingIntervalMsecs} ms`);
    }
    sendPingRequest() {
        if (this.formatter != null) {
            const { pingRequest, pingMessage } = this.formatter;

            if (isObject(pingRequest)) {
                const ping = Object.assign({}, pingRequest);
                this._lastSentPing = this.request(ping, obj => {
                    this._lastReceivedPongId = obj.id;
                }, error => {
                    if (error.type == ErrorEnumValue.Timeout) {
                        WebSockHop.log("info", "no ping response, handling as disconnected");
                    }
                }, this.pingResponseTimeoutMsecs, true);
                WebSockHop.log("info", `> PING [${ping.id}], requiring response in ${this.pingResponseTimeoutMsecs} ms`);
            } else if (pingMessage != null) {
                this._lastSentPing = this._sendPingMessage(pingMessage, this.pingResponseTimeoutMsecs);
                WebSockHop.log("info", `> PING, requiring response in ${this.pingResponseTimeoutMsecs} ms`);
            } else {
                WebSockHop.log("info", "No ping set up for message formatter, not performing ping.");
            }
        } else {
            WebSockHop.log("info", "Time for ping, but no formatter selected, not performing ping.");
        }
    }
    send(obj) {
        if (this.socket) {
            const message = this.formatter.toMessage(obj);
            this.socket.send(message);
        }
    }
    close() {
        if (this.socket) {
            this._closing = true;
            this.socket.close();
        } else {
            this._abortConnect();
            this._clearPingTimers();
            nextUpdate(() => {
                this._raiseErrorEvent(true);
            });
        }
    }
    abort() {
        if (this.socket) {
            WebSockHop.log("warn", "abort() called on live socket, performing forceful shutdown.  Did you mean to call close() ?");
            this._clearPingTimers();
            this._lastSentPing = null;
            this._lastReceivedPongId = 0;
            this.socket.onclose = null;
            this.socket.onmessage = null;
            this.socket.onerror = null;
            this.socket.close();
            this.socket = null;
            this.protocol = null;
        }
        this._abortConnect();
    }
    on(type, handler) {
        this._events.on(type, handler);
    }
    off(type, ...args) {
        this._events.off(type, ...args);
    }
    request(obj, callback, errorCallback, timeoutMsecs, disconnectOnTimeout) {
        const request = {
            obj,
            requestTimeoutTimer: null,
            requestTimeoutMsecs: typeof timeoutMsecs !== 'undefined' ? timeoutMsecs : this.defaultRequestTimeoutMsecs,
            requestDisconnectOnTimeout: typeof disconnectOnTimeout !== 'undefined' ? disconnectOnTimeout : this.defaultDisconnectOnRequestTimeout,
            clearTimeout() {
                if (this.requestTimeoutTimer != null) {
                    clearTimeout(this.requestTimeoutTimer);
                    this.requestTimeoutTimer = null;
                }
            }
        };

        this.formatter.trackRequest(obj, {
            callback(o) {
                request.clearTimeout();
                if (callback != null) {
                    callback(o);
                }
            },
            errorCallback(err) {
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
    }
    _startRequestTimeout(request) {

        const { obj: { id } } = request;
        request.clearTimeout();
        request.requestTimeoutTimer = setTimeout(async () => {
            WebSockHop.log("info", `timeout exceeded [${id}]`);
            await this._dispatchErrorMessage(id, {type: ErrorEnumValue.Timeout});
            if (request.requestDisconnectOnTimeout) {
                await this._raiseErrorEvent(false);
            }
        }, request.requestTimeoutMsecs);

    }
    _sendPingMessage(message, timeoutMsecs) {
        const pingMessage = {
            obj: message,
            messageTimeoutTimer: null,
            messageTimeoutMsecs: typeof timeoutMsecs !== 'undefined' ? timeoutMsecs : this.defaultRequestTimeoutMsecs,
            clearTimeout() {
                if (this.messageTimeoutTimer != null) {
                    clearTimeout(this.messageTimeoutTimer);
                    this.messageTimeoutTimer = null;
                }
            }
        };
        this.send(message);
        if (pingMessage.messageTimeoutMsecs > 0) {
            this._startPingMessageTimeout(pingMessage);
        }
        return pingMessage;
    }
    _startPingMessageTimeout(pingMessage) {

        pingMessage.clearTimeout();
        pingMessage.messageTimeoutTimer = setTimeout(() => {
            WebSockHop.log("info", "timeout exceeded");
            this._raiseErrorEvent(false);
        }, pingMessage.messageTimeoutMsecs);

    }
    async _dispatchMessage(message) {
        let isHandled = false;
        const obj = this.formatter.fromMessage(message);
        if (this.formatter != null) {
            let isPong = false;
            let pongId = 0;
            
            const { pingRequest, pingMessage } = this.formatter;

            if (isObject(pingRequest)) {

                // Check for request-based ping response

                // See if this object is a response to a request().
                const handler = isObject(obj) ? this.formatter.getHandlerForResponse(obj) : null;
                if (handler != null) {
                    await Promise.resolve(handler.callback(obj));
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
                    WebSockHop.log("info", "Non-pong received during pong response period, extending delay...");
                    this._startRequestTimeout(this._lastSentPing);
                }

            } else if (pingMessage != null) {

                // Check for message-based ping response

                if (isFunction(this.formatter.handlePong)) {
                    isPong = await Promise.resolve(this.formatter.handlePong(obj));
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
                        WebSockHop.log("info", "Non-pong received during pong response period, extending delay...");
                        this._startPingMessageTimeout(this._lastSentPing);
                    }
                }
            }

            if (isPong) {
                if (pongId > 0) {
                    WebSockHop.log("info", "< PONG [" + pongId + "]");
                } else {
                    WebSockHop.log("info", "< PONG");
                }
                this._resetPingTimer();
            }
            if (!isHandled && isFunction(this.formatter.handlePing)) {
                const isPing = await Promise.resolve(this.formatter.handlePing(obj));
                if (isPing) {
                    WebSockHop.log("info", "Received PING message, handled.");
                    isHandled = true;
                }
            }
        }
        if (!isHandled) {
            await this._raiseEvent("message", obj);
        }
    }
    async _dispatchErrorMessage(id, error) {
        if (this.formatter != null) {
            const handler = this.formatter.getHandlerForResponse({id});
            if (handler != null) {
                await Promise.resolve(handler.errorCallback(error));
            }
        }
    }
    static isAvailable() {
        if (isWebSocketUnavailable()) {
            return false;
        }

        if (this.disable.oldSafari && isInvalidSafari()) {
            return false;
        }

        if (this.disable.mobile && isMobile()) {
            return false;
        }

        return true;
    }
}
WebSockHop.logger = null;
if (process.env.NODE_ENV === 'development') {
    WebSockHop.logger = (type, ...message) => {
        console.log(`WebSockHop: ${type} -`, ...message);
    };
}

WebSockHop.log = (type, ...message) => {
    if (WebSockHop.logger != null) {
        WebSockHop.logger(type, ...message);
    }
};

WebSockHop.disable = { oldSafari: true, mobile: true };
WebSockHop.ErrorEnumValue = ErrorEnumValue;
WebSockHop.StringFormatter = StringFormatter;
WebSockHop.JsonFormatter = JsonFormatter;
WebSockHop.MessageFormatterBase = MessageFormatterBase;

export default WebSockHop;
