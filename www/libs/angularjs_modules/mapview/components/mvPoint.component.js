"use strict";
angular.
module('mvPoint').
component('mvPoint', {
    templateUrl: '/static/libs/angularjs_modules/mapview/templates/mvPoint.html',
    controller: function ($scope, $element, $attrs) {
        $scope.mapview = $scope.$parent;
        $scope.points = []
        $scope.targetRobotIndex = null
        $scope.targetRobot = null
        $scope.natsInstance = {}

        switch($scope.mapview.mapview_mode){
            case MAP_VIEW_MODE_STATIC:
                break;
            case MAP_VIEW_MODE_DYNAMIC:
                break;
            case MAP_VIEW_MODE_CONTROLLER:
                $scope.canvas = $element.find("canvas")[0];
                $scope.context = $scope.canvas.getContext("2d");
                /*
                    canvas api setTransform(a, b, c, d, e, f)
                    a: Horizontal scaling
                    b: Horizontal skewing
                    c: Vertical skewing
                    d: Vertical scaling
                    e: Horizontal moving
                    f: Vertical moving
                */
                $scope.context.setTransform(1, 0, 0, 1, 0, 0);

                window.addEventListener("zoneChanged", function(e) {
                    // console.log("zoneChanged");
                    $scope.natsSubStopAll();
                });

                window.addEventListener("robotChanged", function(e) {
                    $scope.mvrobot = $scope.mapview.component_scope['mvRobot'][0]
                    $scope.natsSubStopAll();
                    $scope.targetRobot = $scope.$root.dataShare.crt_robot
                    $scope.targetRobotIndex = $scope.getRobotIndex($scope.targetRobot.id)
                    $scope.natsSubStartById(nats, $scope.targetRobot.id, "robot_lrf");
                });

                $scope.$watch("mapview.option.camera", function (newValue, oldValue) {
                    $scope.draw();
                },true)

                break;
        }

        $scope.getRobotIndex = function(id){
            //get robot type
            for(let i in $scope.mvrobot.robotdata.list){
                if($scope.mvrobot.robotdata.list[i].robotid===id){
                    return i
                }else if(
                    (i === $scope.mvrobot.robotdata.list.length-1) &&
                    ($scope.mvrobot.robotdata.list[i].robotid!==id) 
                ){
                    return undefined
                }
            }
        }

        $scope.natsSubStartById = function(nats, robotid, subjectType){
            let subList = $scope.$root.dataShare.subList
            if(subList.typelist == undefined) return false
            if($scope.$root.dataShare.robotlist.length==0) return false
            
            subList.typelist.forEach(typeElement=>{
                $scope.$root.dataShare.robotlist.forEach(robot=>{
                    if(robot.type==typeElement){

                        subList.subjects[typeElement].forEach(topic=>{

                            if(subjectType==topic.type && robot.id == robotid){
                                if($scope.natsInstance[robot.id]===undefined){
                                    $scope.natsInstance[robot.id] ={}
                                }
                                
                                $scope.natsInstance[robot.id][topic.name] = 
                                    nats.subscribe(`${robot.id}.${topic.name}`, lrfHandle);
                            }
                            // console.log($scope.natsInstance[robot.id][topic]);

                        })
                    }
                })
            })

            // 나츠 섭 시작하면 이벤트 발생 - 현재 사용 안하고 있고 필요한 경우 사용
            // let event_natsSubAllStart = new CustomEvent(`natsSubAllStart-${$scope.$id}`);
            // window.dispatchEvent(event_natsSubAllStart);
        }

        $scope.natsSubStopAll = function(){
            for(let i in $scope.natsInstance){
                for(let j in $scope.natsInstance[i]){
                    nats.unsubscribe($scope.natsInstance[i][j]);
                }
            }
            $scope.natsInstance = {};
            $scope.points = []
        }

        function lrfHandle(msg){
            // console.log("-----")
            let parsed_msg = MsgPacket.parsePacket(msg).result.data;
            // console.log(parsed_msg.angle_increment)

            $scope.points = []
            let lrf_ranges = parsed_msg.ranges;
            // console.log(lrf_ranges)
            try{
                for (let i =0 ;i<lrf_ranges.length;i=i + 1) {
                    let lrf_angle = parsed_msg.angle_max-i*parsed_msg.angle_increment*10;
                    let robot_degree = angleTrans($scope.mvrobot.robotdata.list[$scope.targetRobotIndex].pose.orientation);
                    let robot_radian = (robot_degree / 180)* Math.PI // in radian
                    let angle = lrf_angle + robot_radian - Math.PI*0.5;
                    // console.log("-------")
                    // console.log(robot_radian, robot_degree)
                    let distance = lrf_ranges[i];
                    let dx = Math.cos(angle) * distance;
                    let dy = Math.sin(angle) * distance;
                    
                    let obj = {
                        x: ($scope.mvrobot.robotdata.list[$scope.targetRobotIndex].pose.position.x + dx),
                        y: ($scope.mvrobot.robotdata.list[$scope.targetRobotIndex].pose.position.y - dy),
                        fill: "red"
                    }
                    $scope.points.push(obj);
                }
                
                $scope.draw();

            }catch(error){
                console.log("draw error",error);
            }
        }

        $scope.draw = function(){
            $scope.context.setTransform(1, 0, 0, 1, 0, 0);
            $scope.context.clearRect(0, 0, $scope.canvas.width, $scope.canvas.height);
            for (let i =0 ;i<$scope.points.length;i++) {
                let object = $scope.points[i];
                let p = $scope.mapview.getUIPosition({
                    x: parseFloat(object.x),
                    y: parseFloat(object.y)
                });
                $scope.context.fillRect(p.left,p.top,2,2);
                $scope.context.fillStyle = $scope.points[i].fill;
            }
        }

        this.$onInit = function() {
            // if($scope.$root.isRobotReady && $scope.$root.isSubListReady){
            //     $scope.mvrobot = $scope.mapview.component_scope['mvRobot'][0]
            // }

            let event_onMVPointInit = new CustomEvent(`onMVPointInit-${$scope.mapview.$id}`,{detail : $scope.$id});
            window.dispatchEvent(event_onMVPointInit);
        };
    }
});
