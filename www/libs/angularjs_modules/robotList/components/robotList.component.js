"use strict";
// const ALL_ROBOT = "99";

angular.
module('robotList').
component('robotList', {  
    templateUrl: '/static/libs/angularjs_modules/robotList/templates/robotList.html',
    controller: function ($scope, $element, $attrs, $restApiReq) {
        $scope.robotlist = [];
        $scope.natsInstance = {};
        $scope.isInit = false;


        /*
            addEventListener
        */
        window.addEventListener("zoneChanged", function(e) {
            $scope.natsSubStopAll();
        });

        window.addEventListener("robotChanged", function(e) {
            if($scope.$root.isRobotReady && $scope.$root.isSubListReady){
                if($scope.$root.dataShare.crt_robot==ALL_ROBOT){
                    $scope.natsSubStart(nats, $scope.$root.dataShare.subList, "robot_status");
                }else{
                    $scope.natsSubStopAll();
                }
            }
        });

        window.addEventListener("subListChanged", function(e) {
            if($scope.$root.isRobotReady && $scope.$root.isSubListReady){
                if($scope.$root.dataShare.crt_robot==ALL_ROBOT){
                    $scope.natsSubStart(nats, $scope.$root.dataShare.subList, "robot_status");
                }else{
    
                }
            }
        });
        
        $(window).resize(function () {
            $(".robot-list-wrapper-case").height($(window).height()-180);
        });
        $(document).ready(function(){
            $(".robot-list-wrapper-case").height($(window).height()-180);
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
        let event_robotChanged = new CustomEvent("robotChanged");
        $scope.dispatchRobotChangedEvent = function(){
            $scope.$root.isRobotReady = true;
            window.dispatchEvent(event_robotChanged);
        }
        $scope.onClickRobot = function(index, $event){
            console.log("## chooseRobot");
            $(".robot-selector").find('.selected').removeClass('selected');
            $(".robot-selector-robotbtn-case")
            .find(".robot-selector-robotbtn-name")[index].classList.add('selected');

            // "99" = All robot state
            if($scope.$root.dataShare.crt_robot=== "99"){
                $('#view-btn').css("display","initial")

                $("#robot-list").removeClass('component-open');
                $("#robot-list").addClass('component-close');
                $("#robot-detail").removeClass('component-close');
                $("#robot-detail").addClass('component-open');
            }
            $scope.$root.dataShare.crt_robot = $scope.$root.dataShare.robotlist[index];
            $scope.dispatchRobotChangedEvent()

        }


        /*
            nats communication
        */
        
        $scope.natsSubStart = function(nats, subList, subjectType){
            if(subList.typelist!=undefined){
                subList.typelist.forEach(typeElement=>{
                    // console.log(typeElement);
                    if($scope.$root.dataShare.robotlist.length!==0){
                        $scope.$root.dataShare.robotlist.forEach(robot=>{
                            if(robot.type===typeElement){
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
                // console.log($scope.natsInstance);
            }
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
            // console.log($scope.$root.dataShare.robotlist);
            let parsed_msg = MsgPacket.parsePacket(msg);
            let robotIndex = $scope.getRobotIndex(parsed_msg.robot_id);
            switch (parsed_msg.type) {
                default:
                    // console.log("");
                    break;
                case "organized_status":
                    if(robotIndex!=undefined){
                        let state = getFinalState(parsed_msg)
                        $scope.$root.dataShare.robotlist[robotIndex]['context'] = parsed_msg.context.desc;
                        $scope.$root.dataShare.robotlist[robotIndex]['finalstate'] = state;
                        let target_doc = `.robot-list-case:eq(${robotIndex})`
                        switch(state){
                            default:
                                console.log("");
                                break;
                            case 0: // normal
                                $(target_doc).removeClass("state-error")
                                $(target_doc).removeClass("state-manual")
                                $(target_doc).removeClass("state-disconnected")
                                $(target_doc).addClass("state-normal")
                                break;
                            case 1: // error
                                $(target_doc).removeClass("state-normal")
                                $(target_doc).removeClass("state-manual")
                                $(target_doc).removeClass("state-disconnected")
                                $(target_doc).addClass("state-error")
                                break;
                            case 2: // manual
                                $(target_doc).removeClass("state-normal")
                                $(target_doc).removeClass("state-error")
                                $(target_doc).removeClass("state-disconnected")
                                $(target_doc).addClass("state-manual")
                                break;
                            case 3: // disconnected
                                $(target_doc).removeClass("state-normal")
                                $(target_doc).removeClass("state-manual")
                                $(target_doc).removeClass("state-error")
                                $(target_doc).addClass("state-disconnected")
                                break;
                        }
                    }
                    break;
                case "robot_battery":
                    if(robotIndex!=undefined){
                        let battery_data = parsed_msg.result.data.voltage;
                        $scope.$root.dataShare.robotlist[robotIndex]['battery'] = (battery_data<10)?"0"+battery_data:battery_data;
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
