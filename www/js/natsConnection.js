"use strict";
let server_url = $("#serverIp").val()
console.log("server url :" , server_url);
var nats = NATS.connect({ url: `ws://${server_url}:8088/events/websocket`});
// var nats = NATS.connect({ url: `ws://15.164.145.178:8088/events/websocket`});
