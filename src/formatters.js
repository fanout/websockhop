export class MessageFormatterBase {
    constructor() {
        this.pingMessage = null;
        this.pingRequest = null;
        this.handlePing = null;
        this.handlePong = null;
    }
    toMessage(obj) {
        throw "Not Implemented";
    }
    fromMessage(message) {
        throw "Not Implemented";
    }
    trackRequest(requestObject, handler) {
        throw "Not Implemented";
    }
    getHandlerForResponse(responseObject) {
        return null;
    }
    getPendingHandlerIds() {
        return null;
    }
}

export class StringFormatter extends MessageFormatterBase {
    toMessage(obj) {
        return obj.toString();
    }
    fromMessage(message) {
        return message;
    }
}

export class JsonFormatter extends MessageFormatterBase {
    constructor() {
        super();
        this._requestMap = new Map();
        this._nextId = 0;
    }
    toMessage(obj) {
        return JSON.stringify(obj);
    }
    fromMessage(message) {
        return JSON.parse(message);
    }
    trackRequest(requestObject, handler) {
        requestObject.id = ++this._nextId;
        this._requestMap.set(requestObject.id, handler);
        return requestObject;
    }
    getHandlerForResponse({ id }) {
        if (id == null) {
            return null;
        }
        const handler = this._requestMap.get(id);
        if (handler == null) {
            return null;
        }
        this._requestMap.delete(id);
        return handler;
    }
    getPendingHandlerIds() {
        return this._requestMap.keys();
    }
}
