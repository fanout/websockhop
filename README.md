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

```javascript
// try to keep a connection open to this URI as best we can
var wsh = new WebSockHop('ws://echo.websocket.org');

wsh.on('opened', function () {
  // every time the websocket connects, send a test message
  wsh.request({type: 'echo', value: 'hello world'}, function (reply) {
    console.log(reply.value);
  }
});
```
