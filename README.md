WebSockHop
==========
Author: Katsuyuki Ohmuro <harmony7@pex2.jp>  
Mailing List: http://lists.fanout.io/listinfo.cgi/fanout-users-fanout.io

WebSockHop is a convenience library for WebSocket clients that provides automatic reconnect, periodic pinging, and request/response interactions. This is the kind of code that everyone using WebSockets needs, isolated into a reusable library. Multi-transport libraries like Socket.io, SockJS, Primus, etc tend to provide these kinds of facilities already, but WebSockHop is smaller and designed for native WebSockets only. The name comes from "sock hop", a type of dance.

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
  * Request/response interactions. In addition to simple sending and receiving of messages, WebSockHop lets you explicitly send messages for the purpose of making requests, and have reply messages matched to the requests. The serialization and matching policy of replies to requests is defined in a message formatter class. The default formatter uses JSON serialization and an "id" field for matching. This is completely overridable, to support alternative matching policies or even non-JSON protocols.
  * Periodic pinging. WebSockHop can periodically send pings to the server, and fail the connection if a pong is not received after a timeout. This helps keep the connection fresh and resilient to network failures. How WebSockHop should send a ping is defined by the message formatter class. By default, this is a message with format {"type": "ping"}. Again, this is completely overridable.

Usage
-----

Here's an example of sending a message to websocket.org's echo service, receiving a reply, and closing the connection:

```javascript
var wsh = new WebSockHop('ws://echo.websocket.org');

// we'll use the string formatter (this is the default)
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

WebSockHop tries to keep the connection open until the application explicitly closes it. If the underlying WebSocket fails to connect to the server, or if an existing connection is unexpectedly disconnected, then WebSockHop will automatically attempt to reconnect. Anytime the connection is successfully established or reestablished, the "opened" event will be triggered. The above code will only finish once the entire transaction of connect->send->receive->close has executed successfully.

For additional durability, pings should be enabled. Pings allow WebSockHop to detect connection unresponsiveness quickly so that it may forcibly reconnect. Ping behavior is dependent on the formatter being used. Use with StringFormatter and JsonFormatter are described below. Special-purpose formatters may not require any setup for pings.

Suppose you're using StringFormatter, and you want the client and the server to be able to ping each other by sending the string "ping" and replying with the string "pong":

```javascript
wsh.formatter = new WebSockHop.StringFormatter();

// the message to periodically send
wsh.formatter.pingMessage = 'ping';

// incoming messages to eat because they are considered responses to a ping
wsh.formatter.isPong = function (message) {
  return (message == 'pong');
};

wsh.formatter.handlePing = function (message) {
  if (message == 'ping') {
    wsh.send('pong');
    return True; // message was a ping, and we've handled it
  } else {
    return False; // message wasn't a ping. continue processing the message normally
  }
};
```
