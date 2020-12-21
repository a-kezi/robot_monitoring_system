"use strict";
const ROBOT_ICON_SIZE = 24;

(function(angular) {
    angular.
    module('mvRobot').
    component('mvRobot', { 
        templateUrl: '/static/libs/angularjs_modules/mapview/templates/mvRobot.html',
        controller: function ($scope, $element, $attrs, $restApiReq) {
            $scope.mapview = $scope.$parent;
            $scope.subList = {};
            $scope.natsInstance = {};
            // $scope.mvMap = $scope.$parent;
            $scope.robotdata = {
                list:[]
            }

            switch($scope.mapview.mapview_mode){
                case MAP_VIEW_MODE_STATIC:
                    break;
                case MAP_VIEW_MODE_DYNAMIC:
                case MAP_VIEW_MODE_CONTROLLER:
                    $scope.isSubListDone = false;
                    $scope.isRobotListDone = false;
                    
                    window.addEventListener("zoneChanged", function(e) {
                        // console.log("zoneChanged");
                        $scope.isSubListDone = false;
                        $scope.isRobotListDone = false;
                        $scope.natsSubStopAll();
                    });

                    window.addEventListener("robotChanged", function(e) {
                        
                        if($scope.$root.isSubListReady && $scope.$root.isRobotReady){
                            
                            $scope.makeRobotList(function(){
                                $scope.natsSubStart(nats, $scope.$root.dataShare.subList, "robot_pose");
                            });
                        }
                    });
                    window.addEventListener("subListChanged", function(e) {
                        if($scope.$root.isSubListReady && $scope.$root.isRobotReady){
                            $scope.makeRobotList(function(){
                                $scope.natsSubStart(nats, $scope.$root.dataShare.subList, "robot_pose");
                            });
                        }
                    });

                    // map 이동 event
                    $scope.$watch("mapview.option.camera", function (newValue, oldValue) {
                        for(let i in $scope.robotdata.list){
                            // console.log(new_orientation, new_position);
                            $scope.robotdata.list[i].iconStyle.pose = {
                                'z-indexwindow.dispatchEvent(event_zoneChanged);':$scope.robotdata.list[i].zIndex,
                                'transform': `translate(${
                                    $scope.mapview.getUIPosition($scope.robotdata.list[i].pose.position).left.toFixed(2)
                                }px,${
                                    $scope.mapview.getUIPosition($scope.robotdata.list[i].pose.position).top.toFixed(2)
                                }px)`
                            };
                            $scope.robotdata.list[i].iconStyle.orientation = {
                                'transform': `translate(-50%,-50%) rotateZ(${
                                    angleTrans($scope.robotdata.list[i].pose.orientation)
                                }deg)`
                            };
                        }
                        
                    },true)
                    setInterval(function(){
                        if($scope.robotdata.list.length!=0&&$scope.robotdata.list.length!=undefined){
                            for(let i in $scope.$root.dataShare.robotlist){
                                $scope.robotdata.list[i]['finalstate'] = $scope.$root.dataShare.robotlist[i].finalstate
                            }
                        }
                    },200)

                    break;
            }

            this.$onInit = function() {
                // if($scope.$root.isRobotReady && $scope.$root.isSubListReady){
                //     $scope.makeRobotList(function(){
                //         $scope.natsSubStart(nats, $scope.$root.dataShare.subList, "robot_pose");
                //     });
                // }

                let event_onMVRobotInit = new CustomEvent(`onMVRobotInit-${$scope.mapview.$id}`,{detail : $scope.$id});
                window.dispatchEvent(event_onMVRobotInit);
            };

            /*
                functions
            */
            $scope.makeRobotList = function(callback){
                $scope.robotdata.list=[];
                if($scope.$root.dataShare.robotlist.length!==0){
                    $scope.$root.dataShare.robotlist.forEach(element=>{
                        $scope.robotdata.list.push(
                            robotListDataForm(element,ROBOT_ICON_SIZE)
                        )
                    })
                    callback();
                }else{
                    // console.log("");
                }
            }

            $scope.natsSubStart = function(nats, subList, subjectType){
                if(subList.typelist!=undefined){
                    subList.typelist.forEach(typeElement=>{
                        if($scope.$root.dataShare.robotlist.length!==0){
                            
                            $scope.$root.dataShare.robotlist.forEach(robot=>{
                                
                                if(robot.type===typeElement){
                                    subList.subjects[typeElement].forEach(topic=>{

                                        if($scope.natsInstance[robot.id]===undefined){
                                            $scope.natsInstance[robot.id] ={}
                                        }
                                        if(subjectType===topic.type){
                                            $scope.natsInstance[robot.id][topic.name] = nats.subscribe(`${robot.id}.${topic.name}`, robotMsgHandle);
                                        }
                                        // console.log($scope.natsInstance[robot.id][topic]);
                                    })
                                }
                            })
                        }
                    })

                    // 나츠 섭 시작하면 이벤트 발생 - 현재 사용 안하고 있고 필요한 경우 사용
                    // let event_natsSubAllStart = new CustomEvent(`natsSubAllStart-${$scope.$id}`);
                    // window.dispatchEvent(event_natsSubAllStart);
                };
            }

            $scope.natsSubStop = function(robotID, subject){
                console.log(`stop sub ${robotID}-${subject}`);
                nats.unsubscribe($scope.natsInstance[robotID][subject]);
            }

            $scope.natsSubStopAll = function(){
                for(let i in $scope.natsInstance){
                    for(let j in $scope.natsInstance[i]){
                        nats.unsubscribe($scope.natsInstance[i][j]);
                    }
                }
                $scope.natsInstance = {};
            }
            
            $scope.getRobotIndex = function(id){
                for(let i in $scope.robotdata.list){
                    if($scope.robotdata.list[i].robotid===id){
                        return i
                    }else if(
                        (i === $scope.robotdata.list.length-1) &&
                        ($scope.robotdata.list[i].robotid!==id) 
                    ){
                        return undefined
                    }
                }
            }

            // nats msg callback functions
            function robotMsgHandle(msg){
                try{
                    let parsed_msg = MsgPacket.parsePacket(msg);
                    let robotIndex = $scope.getRobotIndex(parsed_msg.robot_id);
                    if(
                        $scope.mapview.is_followRobotView.state &&
                        $scope.mapview.is_followRobotView.target == robotIndex
                        ){
                        let opt = {
                            camera: {
                                x: parsed_msg.location.pose.position.x,
                                y: parsed_msg.location.pose.position.y
                            }
                        };
                        $scope.mapview.setup(opt)
                    }
                    // console.log(parsed_msg.robot_id)
                    if(robotIndex !== undefined){
                        let robot = $scope.robotdata.list[robotIndex]
                        if(robot !== undefined){
                            // console.log(parsed_msg.message.location.pose)
                            // robot.pose = parsed_msg.message.location.pose;
                            // console.log(robot.pose)
                            robot.pose = parsed_msg.location.pose;
                            let new_orientation = angleTrans(robot.pose.orientation);
                            let new_position = $scope.mapview.getUIPosition(robot.pose.position)

                            robot.iconStyle.pose = {
                                'z-index':robot.zIndex,
                                'transform': `translate(${new_position.left.toFixed(2)}px,${new_position.top.toFixed(2)}px)`
                            };
                            robot.iconStyle.orientation = {
                                'transform': `translate(-50%,-50%) rotateZ(${new_orientation}deg)`,
                            };
                            
                            if($scope.$root.dataShare.robotlist[robotIndex]!== undefined){
                                $scope.$root.dataShare.robotlist[robotIndex]['pose'] = parsed_msg.pose;
                                
                            }
                        }
                    }
                }catch(e){
                    console.log(e)
                }
            }
        }
    });

})(window.angular);



