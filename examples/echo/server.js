var http = require('http');
var WebSocketServer = require('ws').Server;
var sockjs = require('sockjs');
var engineio = require('engine.io');
var express = require('express');

var app = express();

var server = http.createServer(app);

var wss = new WebSocketServer({
  server: server,
  path: '/echo'
});
wss.on('connection', function (ws) {
  ws.on('message', function (message) {
    ws.send(message);
  });
});

/*server.addListener('upgrade', function(req,res) {
  res.end();
});*/
var sockjs_echo = sockjs.createServer({
  sockjs_url: "http://cdn.jsdelivr.net/sockjs/0.3.4/sockjs.min.js"
});
sockjs_echo.on('connection', function(conn) {
  conn.on('data', function(message) {
    conn.write(message);
  });
});
sockjs_echo.installHandlers(server, { prefix: '/echo/sockjs' });

var io = engineio.attach(server, {
  path: '/echo/engine.io'
});
io.on('connection', function (socket) {
  socket.on('message', function (message) {
    socket.send(message);
  });
});

app.use(express.static(__dirname));
app.get('/', function(req, res, next) {
  res.sendfile('index.html');
});

var port = process.env.PORT || 3000;
server.listen(port, function () {
  console.log('\033[96mlistening on localhost:' + port + ' \033[39m');
});
