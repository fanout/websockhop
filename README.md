WebSockHop
==========
Author: Katsuyuki Ohmuro <harmony7@pex2.jp>  
Mailing List: http://lists.fanout.io/listinfo.cgi/fanout-users-fanout.io

WebSockHop is a general-purpose WebSocket client library that provides automatic reconnect, periodic pinging, and request/response interactions. Basically this is the kind of code that anyone using WebSockets would have to write, isolated into a reusable library. The name comes from "sock hop", a type of dance.

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
  * Request/response interactions. In addition to simple sending and receiving of messages, WebSockHop lets you explicitly send messages for the purpose of making requests, and have reply messages matched to the requests. The serializatio and matching policy of replies to requests is defined in a message formatter class. The default formatter uses JSON serialization, and an "id" field within the JSON object for matching. This is completely overridable though, for supporting non-JSON protocols, or JSON protocols with alternative matching policies.
  * Periodic pinging. WebSockHop can periodically send pings to the server, and fail the connection if a reply is not received after a timeout. This helps keep the connection fresh and resilient to network failures. The way WebSockHop should go about sending a ping is defined by the message formatter class. By default, this is by sending a message with format {"type": "ping"}, but again this is completely overridable.

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
