"use strict";

angular.
module('robotStatusSub').
component('robotStatusSub', {  
    templateUrl: '/static/libs/angularjs_modules/robotStatusSub/templates/robotStatusSub.html',
    controller: function ($scope, $element, $attrs, $restApiReq) {
        // get options from attrs
        if($attrs.option){
            let temp_opt = JSON.parse($attrs.option);
            // console.log(temp_opt);
        }
        $scope.guideTxt = "로봇을 선택해주세요"
        $scope.natsInstance = {};

        // setInterval(function(){
        //     console.log("-----")
        //     console.log($scope.$root.dataShare.crt_robot)
            
        // },1000)
        /*
            event handle
        */
        window.addEventListener("zoneChanged", function(e) {
            // $scope.natsSubStopAll();
        });

        window.addEventListener("robotChanged", function(e) {
            $scope.natsSubStopAll();
            if($scope.$root.isRobotReady && $scope.$root.isSubListReady){
                if($scope.$root.dataShare.crt_robot!=ALL_ROBOT){
                    let dataShare = $scope.$root.dataShare;
                    $scope.natsSubStartOneRobot(nats, dataShare.subList, "robot_status", dataShare.crt_robot.id);
                }
            }
        });
        
        window.addEventListener("subListChanged", function(e) {
            $scope.natsSubStopAll();
            if($scope.$root.isRobotReady && $scope.$root.isSubListReady){
                if($scope.$root.dataShare.crt_robot!=ALL_ROBOT){
                    let dataShare = $scope.$root.dataShare;
                    $scope.natsSubStartOneRobot(nats, dataShare.subList, "robot_status", dataShare.crt_robot.id);
                }
            }
        });
        
        /*
            functions
        */
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
        
        // $scope.getPoseCoordTxt = function(position){
        //     // console.log(position);
        //     if(position==undefined) return null;
        //     return `${position.x.toFixed(1)}, ${position.y.toFixed(1)}, ${position.z.toFixed(1)}`
        // }
        // $scope.getDirCoordTxt = function(orientation){
        //     // console.log(orientation);
        //     if(orientation==undefined) return null;
        //     return `${orientation.x.toFixed(1)}, ${orientation.y.toFixed(1)}, ${orientation.z.toFixed(1)}, ${orientation.w.toFixed(1)}`
        // }
        // $scope.emptyObjCheck = function(obj){
        //     return Object.keys(obj).length==0
        // }


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
            let parsed_msg = MsgPacket.parsePacket(msg);
            let robotIndex = $scope.getRobotIndex(parsed_msg.robot_id);
            if(robotIndex==undefined) return false
            switch (parsed_msg.type) {
                default:
                    // console.log("");
                    break;
                case "organized_status":
                    let state = getFinalState(parsed_msg)
                    $scope.$root.dataShare.robotlist[robotIndex]['finalstate'] = state;
                    if($scope.$root.dataShare.robotlist[robotIndex]['id']==$scope.$root.dataShare.crt_robot['id']){
                        $scope.$root.dataShare.crt_robot['context'] = parsed_msg.context.desc
                    }
                    if(parsed_msg.fault.state==true){
                        $scope.$root.dataShare.crt_robot['fault'] = parsed_msg.fault.desc
                    }else{
                        $scope.$root.dataShare.crt_robot['fault'] = ""
                    }
                    break;
                case "robot_battery":
                    let battery_data = parsed_msg.result.data.voltage;
                    $scope.$root.dataShare.robotlist[robotIndex]['battery'] = (battery_data<10)?"0"+battery_data:battery_data;
                    if($scope.$root.dataShare.robotlist[robotIndex]['id']==$scope.$root.dataShare.crt_robot['id']){
                        $scope.$root.dataShare.crt_robot['battery'] = $scope.$root.dataShare.robotlist[robotIndex]['battery']
                    }
                    
                    break;
            }
        }
        function getFinalState(msg){
            /*
                0 = normal
                1 = error
                2 = manual
                3 = disconnected
            */
            if(!msg.connected) return 3
            if(msg.fault.state) return 1
            if(msg.context.desc == "control") return 2
            return 0
        }










































    }
});
