"use strict";
let commandPanel_rest_ip = $("#serverIp").val()
let commandPanel_rest_port = $("#serverPort").val()
angular.
module('commandPanel').
component('commandPanel', {  
    templateUrl: '/static/libs/angularjs_modules/commandPanel/templates/commandPanel.html',
    controller: function ($scope, $element, $attrs, $restApiReq) {
        this.$onInit = function() {
            if($attrs.option){
                let temp_opt = JSON.parse($attrs.option);
                // console.log(temp_opt);
            }
            
            $scope.isOpen = false;

            // //demo code
            // $scope.getCameraList()
            // $scope.nats = NATS.connect({ url: `ws://${commandPanel_rest_ip}:8088/events/websocket`});
            // //demo code end

        }

        // demo code
        const DEMO_BTN_LIST = `http://${commandPanel_rest_ip}:${commandPanel_rest_port}/rest/demo/list`;
        $scope.isManualOn = false;
    
        $scope.getCameraList = function(){
            let reqInfo = {
                url: DEMO_BTN_LIST,
                type: 'GET',
            }
            $restApiReq.get(reqInfo,function(res){
                // console.log(res)
                $scope.$apply(function(){
                    if(res.length!=0){
                        $scope.demoList = res;
                    }else if(res.length==0){
                        console.log("there is no demoList");
                    }
                });
            })
        }
        $scope.onClickDemoBtn = function(index){
            let demoName = $scope.demoList.btnList[index]
            let demoReqList = $scope.demoList.demo[demoName]
            // console.log(demoReqList)
            let remote_data = MsgPacket.dumpPacket(
                "addy.demo", 
                {
                    demoReqList: JSON.stringify(demoReqList)
                }, 
                {});
            $scope.nats.publish("addy.demo",remote_data);
        }

        $(window).keydown(function(event){
            var key = event.keyCode;
    
            if($scope.isManualOn){
                if(key==37){
                    //왼쪽
                    let topic_node = "addy.cmd";
                    let message = {
                        linear:{
                            x:0,
                            y:0,
                            z:0
                        },
                        angular:{
                            x:0,
                            y:0,
                            z:0.7
                        }
                    }
                    let header = {}
                    let data = MsgPacket.dumpPacket(
                        topic_node, 
                        message, 
                        header); 
                    $scope.nats.publish(topic_node,data);
                    console.log("left");
                }else if(key==38){
                    //위      
                    let topic_node = "addy.cmd";
                    let message = {
                        linear:{
                            x:0.5,
                            y:0,
                            z:0
                        },
                        angular:{
                            x:0,
                            y:0,
                            z:0
                        }
                    }
                    let header = {}
                    let data = MsgPacket.dumpPacket(
                        topic_node, 
                        message, 
                        header); 
                    $scope.nats.publish(topic_node,data);
                    console.log("up");
                }else if(key==39){
                    //오른쪽    
                    let topic_node = "addy.cmd";
                    let message = {
                        linear:{
                            x:0,
                            y:0,
                            z:0
                        },
                        angular:{
                            x:0,
                            y:0,
                            z:-0.7
                        }
                    }
                    let header = {}
                    let data = MsgPacket.dumpPacket(
                        topic_node, 
                        message, 
                        header); 
                    $scope.nats.publish(topic_node,data);
                    console.log("right");
                }else if(key==40){
                    //아래   
                    let topic_node = "addy.cmd";
                    let message = {
                        linear:{
                            x:-0.5,
                            y:0,
                            z:0
                        },
                        angular:{
                            x:0,
                            y:0,
                            z:0
                        }
                    }
                    let header = {}
                    let data = MsgPacket.dumpPacket(
                        topic_node, 
                        message, 
                        header); 
                    $scope.nats.publish(topic_node,data);
                    
                    console.log("down");
                }
            }
            
        });
        $scope.bodyTempFault = function(){
            console.log("bodytemp fault");
    
            $.post(`http://${commandPanel_rest_ip}:${commandPanel_rest_port}/websocket/send/target`,
            {
                site_id: "site01",
                robot_id: "addy-id1",
                msg:JSON.stringify({
                    result:{
                        type:["string","img"],
                        data:"30",
                        image: "",
                    },
                    type:'bodyTemp',
                    robot_id: "addy-id1",
                    msg_id:Date.now(),
                    timestamp:Date.now(),
                    error: true,
    
                    location:{
                        site:"site01",
                        zone:"1",
                        pose: {
                            orientation: {
                            w: 1,
                            x: 0,
                            y: 0,
                            z: 0
                            },
                            position: {
                            x: 5,
                            y: 5,
                            z: 0
                            }
                        }
                    },
                })
            },
            function(data, status){
                console.log("Data: " + data + "\nStatus: " + status);
            });
        }
        $scope.localizationOn = function(){
            console.log("localizationOn");

            let remote_data = MsgPacket.dumpPacket(
                "addy.localization", 
                {
                    enable: true
                }, 
                {}); 
            $scope.nats.publish("addy.localization",remote_data);

        };
        $scope.localizationOff = function(){
            console.log("localizationOn");

            let remote_data = MsgPacket.dumpPacket(
                "addy.localization", 
                {
                    enable: false
                }, 
                {}); 
            $scope.nats.publish("addy.localization",remote_data);

        };
        $scope.manualOn = function(){
            console.log("수동 ON");
            $scope.isManualOn = true;

            // 수동 on
            let remote_data = MsgPacket.dumpPacket(
                "addy.manualcmd", 
                {
                    enable: true
                }, 
                {}); 
            $scope.nats.publish("addy.manualcmd",remote_data);

        };
        $scope.manualOn = function(){
            console.log("수동 ON");
            $scope.isManualOn = true;

            // 수동 on
            let remote_data = MsgPacket.dumpPacket(
                "addy.manualcmd", 
                {
                    enable: true
                }, 
                {}); 
            $scope.nats.publish("addy.manualcmd",remote_data);

        };
        $scope.manualOff = function(){
            console.log("수동 off");
            // 수동 off
            let remote_data = MsgPacket.dumpPacket(
                "addy.manualcmd", 
                {
                    enable: false
                }, 
                {}); 
            $scope.nats.publish("addy.manualcmd",remote_data);
            $scope.isManualOn = false;
        };
        $scope.serviceOn = function(){
            // service on
            let rsa_data = MsgPacket.dumpPacket(
                "addy.rsacmd", 
                {
                    command: 1
                }, 
                {}); 
            $scope.nats.publish("addy.rsacmd",rsa_data);
        };
        $scope.serviceOff = function(){
            // service 종료
            let rsa_data = MsgPacket.dumpPacket(
                "addy.rsacmd", 
                {
                    command: 0
                }, 
                {}); 
            $scope.nats.publish("addy.rsacmd",rsa_data);
        };


















        // demo code end

        $scope.onOpenBtn = function($event){
            console.log("-------");
            $scope.isOpen = !$scope.isOpen;
            // if($scope.isOpen){
            //     $event.target.classList.add('command-open-btn-case-clicked');
            //     $(".command-component-body-custom").addClass('command-component-body-custom-open');
            //     $(".command-component-body-custom").removeClass('command-component-body-custom-close');
            // }else{
            //     $event.target.classList.remove('command-open-btn-case-clicked');
            //     $(".command-component-body-custom").removeClass('command-component-body-custom-open');
            //     $(".command-component-body-custom").addClass('command-component-body-custom-close');
            // }
        }
    }
});
