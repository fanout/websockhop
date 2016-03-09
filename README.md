WebSockHop
==========
Author: Katsuyuki Ohmuro <harmony7@pex2.jp>  
Mailing List: http://lists.fanout.io/mailman/listinfo/fanout-users

WebSockHop is a convenience library for WebSocket clients that provides automatic reconnect, periodic pinging, and request/response interactions. This is the kind of core functionality that every WebSocket application needs, isolated into a reusable library. The name comes from "sock hop", a type of dance.

The project is inspired by https://github.com/joewalnes/reconnecting-websocket and taken further.

License
-------

WebSockHop is offered under the MIT license. See the COPYING file.

Dependencies
------------

  * json2.js

Features
--------

  * Automatic reconnect. WebSockHop tries its best to maintain a connection. If it fails to connect or gets disconnected, it will retry connecting on an interval, with exponentially increasing delays between attempts.
  * Request/response interactions. In addition to simple sending and receiving of messages, WebSockHop lets you send messages for the purpose of making requests, and have reply messages matched to the requests. The serialization and matching policy of replies to requests is defined in a message formatter class. Two formatters are provided: StringFormatter and JsonFormatter.
  * Periodic pinging. WebSockHop can periodically send pings to the server, and fail the connection if a pong is not received after a timeout. This helps keep the connection fresh and resilient to network failures. How WebSockHop should send a ping is defined by the message formatter class or must be specified in the application.
  * Browser workarounds. This library includes consideration for the various issues Arnout Kazemier discusses in his "WebSuckets" presentation. https://speakerdeck.com/3rdeden/websuckets

Usage
-----

Here's an example of sending a message to websocket.org's echo service, receiving a reply, and closing the connection:

```javascript
var wsh = new WebSockHop('ws://echo.websocket.org');

wsh.formatter = new WebSockHop.StringFormatter();

console.log('connecting...');

wsh.on('opened', function () {
  console.log('connected');

  // we're connected, send a message
  wsh.send('test message');
});

wsh.on('message', function (message) {
  console.log(message);

  // we've received a reply, now disconnect
  wsh.close();
});

wsh.on('closed', function() {
  console.log('finished');
  wsh = null;
});
```

WebSockHop tries to keep the underlying WebSocket connection open until the application explicitly closes it. If there is a failure connecting to the server, or if an existing connection is unexpectedly disconnected, then WebSockHop will automatically attempt to reconnect. Anytime the connection is successfully established or reestablished, the "opened" event will be triggered. The above code will only finish once the entire transaction of connect->send->receive->close has executed successfully.

Requests
--------

WebSockHop can perform request/response interactions. Whether this feature works or not depends on the formatter in use. JsonFormatter supports it. The main reason to have WebSockHop track requests is to simplify your code, and also so it can handle timing out requests. If the connection is lost, then all outstanding requests are automatically failed.

You can even configure WebSockHop to kill the connection if a request times out. Often if one request doesn't work, none are going to work, since the problem is almost always network related.

Here's how to use a request:

```javascript
var wsh = new WebSockHop('ws://echo.websocket.org');

wsh.formatter = new WebSockHop.JsonFormatter();

// timeout request after 8 seconds with no reply
wsh.defaultRequestTimeoutMsecs = 8000;

// disconnect & reconnect if the request times out
wsh.defaultDisconnectOnRequestTimeout = true;

console.log('connecting...');

wsh.on('opened', function () {
  console.log('connected');

  // we're connected, send a test request
  wsh.request({hello: 'world'}, function (response) {
    console.log('got response');
  });
});
```

Pings
-----

For additional durability, pings should be enabled. Pings allow WebSockHop to detect connection unresponsiveness quickly so that it may forcibly reconnect. Ping behavior is dependent on the formatter being used. Use with StringFormatter and JsonFormatter are described below. Special-purpose formatters may not require any setup for pings.

Suppose you're using StringFormatter, and you want the client and the server to be able to ping each other by sending the string "ping" and replying with the string "pong":

```javascript
wsh.formatter = new WebSockHop.StringFormatter();

// the message to periodically send
wsh.formatter.pingMessage = 'ping';

// incoming messages to eat because they are considered responses to a ping
wsh.formatter.handlePong = function (message) {
  return (message == 'pong'); // return true if message was a pong
};

// code to handle incoming pings
wsh.formatter.handlePing = function (message) {
  if (message == 'ping') {
    wsh.send('pong');
    return true; // message was a ping, and we've handled it
  } else {
    return false; // message wasn't a ping. continue processing the message normally
  }
};
```

If handlePong is null, then any incoming message will count as a pong, and the message will be processed normally as well (not eaten). If handlePing is null, then there will be no special handling for incoming pings.

It is possible to use a request/response interaction for pinging instead of plain messages. In this case, handlePong is not used, and instead ping responses will be matched to requests using the formatter's normal behavior. This will only work with formatters that support requests, such as JsonFormatter. Suppose you want to send requests of {type: 'ping'} for pings:

```javascript
wsh.formatter = new WebSockHop.JsonFormatter();

// the request to periodically send
wsh.formatter.pingRequest = {type: 'ping'};

// code to handle incoming pings
wsh.formatter.handlePing = function (message) {
  if (message.type == 'ping') {
    wsh.send({id: message.id});
    return true; // message was a ping, and we've handled it
  } else {
    return false; // message wasn't a ping. continue processing the message normally
  }
};
```

Examples
--------

Here's how to connect to a Meteor server using the DDP protocol. The code tries its best to maintain a subscription at all times and it uses pings to detect for unresponsive connections quickly.

```javascript
var wsh = new WebSockHop('ws://localhost:3000/websocket');

wsh.formatter = new WebSockHop.JsonFormatter();

// the request to periodically send
wsh.formatter.pingRequest = {msg: 'ping'};

// code to handle incoming pings
wsh.formatter.handlePing = function (message) {
  if (message.msg == 'ping') {
    wsh.send({id: message.id});
    return true;
  } else {
    return false;
  }
};

wsh.on('opened'), function () {
  // connect
  wsh.request({msg: 'connect', version: 'pre2',"support":["pre2"]}, function (reply) {
    // set up subscription
    wsh.request({msg: 'sub', name: 'all-players', params: []}, function (reply) {
      console.log('subscription success');
    });
  });
});

wsh.on('message', function (message) {
  if (message.msg == 'added') {
    // handle added event
  } else if (message.msg == 'changed') {
    // handle changed event
  } else if (message.msg == 'removed') {
    // handle removed event
  } else if (message.msg == 'ready') {
    // handle ready event
  }
});
```

Browser Conditions
------------------

Unfortunately, WebSockets are not always usable under all conditions. For example,
attempting to use WebSockets in Safari versions before 5.1.4 with HTTP proxies will
crash the entire browser tab.  Additionally, some mobile providers block the use of
WebSockets.

In these situations, WebSockets cannot be used.  WebSockHop provides a method to
detect when this is the case. Additionally, its constructor will throw an error
if an instance is created.

```javascript
if (WebSockHop.isAvailable()) {
    // Use WebSockHop
    var wsh = new WebSockHop('ws://localhost:3000/websocket');
    ...
} else {
    // Fall back from WebSockets to XHR/JSONP/etc.
}
```

Currently WebSockHop will fail the creation under the following conditions:

* When running on Safari versions before 5.1.4.
* When running on mobile browsers.

These conditions can be suppressed by setting the following values:

```javascript
// true by default, set to false to skip Safari version check
WebSockHop.disable.oldSafari = false;

// true by default, set to false to skip mobile browser check
WebSockHop.disable.mobile = false;
```
