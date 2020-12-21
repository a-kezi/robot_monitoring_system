// console.log("## socketConnection.js");
// const SOCKET_CONNECTION_GET_SITE_URL = `http://${server_ip}:${server_port}/rest/site/list`

// let sitelit
// crt_site




// $.getJSON(SOCKET_CONNECTION_GET_SITE_URL, function (list) {
//     console.log(list)
    
// });


// var socket1 = io('/nc');
// // var socket2 = io('/songdo');
// // var socket3 = io('/pangyo');


// var id1;
// var id2;

// // site 이름으로 socket 접속
// // 해당 site 로봇 리스트로 모두 room 접속
// // ---->
// // room 별 메세지 받는 구조
// // 접속 socket id 로 메세지 받는 구조


// socket1.on('connect', () => {
//     // console.log("default",socket1.id);
//     // console.log(socket1);
//     id1 = socket1.id;
//     socket1.emit('joinRoom', "cart");
//     socket1.emit('joinRoom', "addy");
    
// });

// // setInterval(function(){
// //     socket1.emit('joinRoom', "addy");
// // },1000)

// // setTimeout(function(){
// //     socket1.emit('leaveRoom', "cart");
// // },1000)


// // socket2.on('connect', () => {
// //     console.log("default",socket2.id);
// //     console.log(socket2);
// //     id2 = socket2.id;
// // });

// socket1.on('roomMsg', function(data){
//     console.log(data);
// });


// // socket.on('connect', () => {
// //     console.log(socket);
// //     console.log(socket.id);
// //     id = socket.id;
// //     console.log(socket.connected);
// // });


// socket1.on('joinRoom res', function(data){
//     console.log(data);
// });

// // socket1.on('server message', function(data){
// //     console.log(data);
// // });
// // socket2.on('server message', function(data){
// //     console.log(data);
// // });

// // setInterval(function(){
// //     socket1.emit('kezi', { message : id1});
// // },2000)

// // setInterval(function(){
// //     socket2.emit('kezi', { message : id2});
// // },500)