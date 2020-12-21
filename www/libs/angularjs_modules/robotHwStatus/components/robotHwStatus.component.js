"use strict";

angular.
module('robotHwStatus').
component('robotHwStatus', {  
    templateUrl: '/static/libs/angularjs_modules/robotHwStatus/templates/robotHwStatus.html',
    controller: function ($scope, $element, $attrs, $restApiReq) {
        this.$onInit = function() {
            if($attrs.option){
                let temp_opt = JSON.parse($attrs.option);
                // console.log(temp_opt);
            }
            $scope.natsInstance = {};
            $scope.isInit = false;
            $scope.isOpen = false;

        }

        window.addEventListener("zoneChanged", function(e) {
            // $scope.natsSubStopAll();
        });

        window.addEventListener("robotChanged", function(e) {
            // console.log("getRobot finished");

            // 로봇 정보 가져올 타이밍
            $scope.$root.dataShare.robotlist.forEach(robot=>{
                // switch(robot.type){
                //     default:
                //         robot["profile"] = "/static/imgs/icons/p.png"
                //         break;
                //     case "addy":
                //         robot["profile"] = "/static/imgs/robots/profile-addy.png"
                //         break;
                //     case "cart":
                //         // robot["profile"] = "/static/imgs/robots/profile-cart.png"
                //         robot["profile"] = "/static/imgs/icons/p.png"
                //         break;
                //     case "sero":
                //         robot["profile"] = "/static/imgs/robots/profile-sero.png"
                //         break;
                // }
            })
        });

        window.addEventListener("robotChanged", function(e) {
            // console.log("getRobot changed");
            $scope.natsSubStopAll();
            if($scope.$root.dataShare.crt_robot!=ALL_ROBOT && $scope.isInit==true){
                // get robot device
                let dataShare = $scope.$root.dataShare;
                $scope.getRobotDevices(dataShare.crt_robot.type);
                // update
                $scope.natsSubStartOneRobot(nats, dataShare.subList, "robot_status", dataShare.crt_robot.id);
            }
        });
        
        window.addEventListener("getSubListFinished", function(e) {
            // console.log($scope.$root.dataShare.subList);
            // console.log("get SubList Finished");
            $scope.isInit = true;
        });
        $(window).resize(function () {

        });
        
        /*
            functions
        */

        $scope.onOpenBtn = function($event){
            $scope.isOpen = !$scope.isOpen;
            if($scope.isOpen){
                $event.target.classList.add('hwstatus-open-btn-case-clicked');
                $(".hwstatus-component-body-custom").addClass('hwstatus-component-body-custom-open');
                $(".hwstatus-component-body-custom").removeClass('hwstatus-component-body-custom-close');
            }else{
                $event.target.classList.remove('hwstatus-open-btn-case-clicked');
                $(".hwstatus-component-body-custom").removeClass('hwstatus-component-body-custom-open');
                $(".hwstatus-component-body-custom").addClass('hwstatus-component-body-custom-close');
            }
        }
        

        $scope.getRobotDevices = function(robottype){
            // console.log(`get robot devices : type=${robottype}`);
            $scope.$root.dataShare.crt_robot_device = [];
            $restApiReq.get({
                url: `http://${server_ip}:${server_port}/rest/robot/devices`,
                type: 'GET',
                param: {
                    type: robottype
                }
            },function(res){
                $scope.$apply(function(){
                    $scope.$root.dataShare.crt_robot_device = res;
                })
                if(res.length==0){
                    console.log("Empty robot device");
                }
            });
        }

        $scope.getDeviceStateNum = function(state){
            let resNum = 0;
            let list = $scope.$root.dataShare.crt_robot_device;
            switch(state){
                default:
                    break;
                case("error"):
                    for(var i in list){
                        console.log();
                        if(list[i].state=="error"){
                            resNum +=1;
                        }
                    }
                    break;
                case("normal"):
                    for(var i in list){
                        console.log();
                        if(list[i].state=="normal"){
                            resNum +=1;
                        }
                    }
                    break;
                case("disconnected"):
                    for(var i in list){
                        console.log();
                        if(list[i].state=="disconnected"){
                            resNum +=1;
                        }
                    }
                    break;
            }
            return resNum
        }
        

        $scope.getRobotIndex = function(id){
            for(let i in $scope.$root.dataShare.robotlist){
                if($scope.$root.dataShare.robotlist[i].id===id){
                    return i
                }else if(
                    (i === $scope.$root.dataShare.robotlist.length-1) &&
                    ($scope.mvMap.robotdata.list[i].robotid!==id) 
                ){
                    return undefined
                }
            }
        }
        
        $scope.getPoseCoordTxt = function(position){
            // console.log(position);
            if(position==undefined) return null;
            return `${position.x.toFixed(1)}, ${position.y.toFixed(1)}, ${position.z.toFixed(1)}`
        }
        $scope.getDirCoordTxt = function(orientation){
            // console.log(orientation);
            if(orientation==undefined) return null;
            return `${orientation.x.toFixed(1)}, ${orientation.y.toFixed(1)}, ${orientation.z.toFixed(1)}, ${orientation.w.toFixed(1)}`
        }
        $scope.emptyObjCheck = function(obj){
            return Object.keys(obj).length==0
        }

        
        




        /*
            nats communication
        */
        
        $scope.natsSubStartOneRobot = function(nats, subList, subjectType, robotID){
            // console.log(subList);
            subList.typelist.forEach(typeElement=>{
                // console.log(typeElement);
                if($scope.$root.dataShare.robotlist.length!==0){
                    $scope.$root.dataShare.robotlist.forEach(robot=>{

                        if(robot.type===typeElement && robot.id ===robotID){
                            subList.subjects[typeElement].forEach(topic=>{

                                if($scope.natsInstance[robot.id]===undefined){
                                    $scope.natsInstance[robot.id] ={}
                                }
                                // console.log(subjectType, topic.type, topic.name);
                                if(subjectType===topic.type){
                                    $scope.natsInstance[robot.id][topic.name] = nats.subscribe(`${robot.id}.${topic.name}`, robotMsgHandle);
                                }
                                // console.log($scope.natsInstance[robot.id][topic]);
                                // console.log($scope.natsInstance);

                            })
                        }
                    })
                }
            })
            console.log($scope.natsInstance);


        }

        $scope.natsSubStop = function(robotID, subject){
            // console.log(`stop sub ${robotID}-${subject}`);
            // nats.unsubscribe($scope.natsInstance[robotID][subject]);
        }

        $scope.natsSubStopAll = function(){
            for(var i in $scope.natsInstance){
                // console.log(i, $scope.natsInstance[i]);
                for(var j in $scope.natsInstance[i]){
                    nats.unsubscribe($scope.natsInstance[i][j]);
                }
            }
            $scope.natsInstance = {};
        }
        
        // nats msg callback functions
        function robotMsgHandle(msg){
            // console.log(msg);
            let parsed_msg = MsgPacket.parsePacket(msg);
            let sender_id = parsed_msg.robot_id
            let robotIndex = $scope.getRobotIndex(sender_id);
            let msgtype = parsed_msg.topic_node.substring(
                parsed_msg.topic_node.indexOf(".")+1, 
                parsed_msg.topic_node.length);
            // console.log(msgtype);
            
            switch (msgtype) {
                default:
                    // console.log("");
                    break;
                case "finalstate":
                    $scope.$root.dataShare.robotlist[robotIndex]['finalstate'] = parsed_msg.message.data;
                    break;
                case "devicestate":
                    // console.log(parsed_msg.message.data);
                    let isUpdated = false;
                    $scope.$root.dataShare.crt_robot_device.some(item=>{
                        if(item.id == parsed_msg.message.data.id){
                            item.state = parsed_msg.message.data.state;
                            isUpdated = true;
                        }
                        return isUpdated
                    })
                    break;
                case "battery":
                    let battery_data = parsed_msg.message.data;
                    $scope.$root.dataShare.robotlist[robotIndex]['battery'] = (battery_data<10)?"0"+battery_data:battery_data;
                    
                    break;
            }
        }










































    }
});
