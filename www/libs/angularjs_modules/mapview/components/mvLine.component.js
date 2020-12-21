"use strict";
angular.
module('mvLine').
component('mvLine', {
    templateUrl: '/static/libs/angularjs_modules/mapview/templates/mvLine.html',
    controller: function ($scope, $element, $attrs) {
        $scope.mapview = $scope.$parent;
        $scope.globalPath = ""
        $scope.localPath = ""
        $scope.globalArray = []
        $scope.localArray = []
        $scope.natsInstance = []
        $scope.targetRobot = null
        $scope.targetRobotIndex = null
        $scope.targetRobotNavStatus = null
        
        this.$onInit = function() {
            // if($scope.$root.isRobotReady && $scope.$root.isSubListReady){
            //     $scope.mvrobot = $scope.mapview.component_scope['mvRobot'][0]
            // }
        };

        switch($scope.mapview.mapview_mode){
            case MAP_VIEW_MODE_STATIC:
                break;
            case MAP_VIEW_MODE_DYNAMIC:
            case MAP_VIEW_MODE_CONTROLLER:
                // 요기서 작업
                if($scope.mapview.maviewOpt.planner=="true"){
                    $scope.globalLine = $element.find(".global-path")
                    $scope.localLine = $element.find(".local-path")

                    window.addEventListener("zoneChanged", function(e) {
                        $scope.natsSubStop();
                    });
    
                    window.addEventListener("robotChanged", function(e) {
                        $scope.mvrobot = $scope.mapview.component_scope['mvRobot'][0]
                        $scope.natsSubStop();
                        if($scope.$root.dataShare.crt_robot!="99"){
                            $scope.targetRobot = $scope.$root.dataShare.crt_robot
                            $scope.targetRobotIndex = $scope.getRobotIndex($scope.targetRobot.id)
                            $scope.natsSubStart();
                        }
                    });
    
                    $scope.$watch("mapview.option.camera", function (newValue, oldValue) {
                        $scope.drawLocal();
                        $scope.drawGlobal();
                    },true)
                    $scope.$watch("targetRobotNavStatus", function (newValue, oldValue) {
                        if(newValue!=3){
                            $scope.globalPath = ""
                            $scope.localPath = ""
                            $scope.globalArray = []
                            $scope.localArray = []
                        }
                    },true)
                }
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
        $scope.natsSubStart = function(){
            console.log("## planner sub start")
            $scope.natsInstance.push(nats.subscribe(`${$scope.targetRobot.id}.status.nav_status`, navStatusHandle))
            $scope.natsInstance.push(nats.subscribe(`${$scope.targetRobot.id}.robot_organized_global_planner`, globalPlannerHandle))
            $scope.natsInstance.push(nats.subscribe(`${$scope.targetRobot.id}.path.local`, localPlannerHandle))
        }
        $scope.natsSubStop = function(){
            $scope.natsInstance.forEach(element => {
                nats.unsubscribe(element)
            });
            $scope.natsInstance = []
            $scope.globalPath = ""
            $scope.localPath = ""
            $scope.globalArray = []
            $scope.localArray = []
            $scope.targetRobot = null
            $scope.targetRobotIndex = null
            $scope.targetRobotNavStatus = null
        }
        
        function navStatusHandle(msg){
            let parsed_msg = MsgPacket.parsePacket(msg);
            try{
                $scope.targetRobotNavStatus = parsed_msg.result.state
            }catch(error){

            }
        }
        function globalPlannerHandle(msg){
            let parsed_msg = MsgPacket.parsePacket(msg);
            $scope.globalArray = parsed_msg
            try{
                $scope.drawGlobal()
            }catch(error){

            }
        }
        $scope.drawGlobal = function(){
            let new_position = ""
            $scope.globalArray.forEach(point=>{
                // console.log(point)
                let p = $scope.mapview.getUIPosition({
                    x: point[0],
                    y: point[1]
                })
                new_position += ` ${p.left},${p.top}`
            })
            $scope.globalPath = new_position
        }
        function localPlannerHandle(msg){
            let parsed_msg = MsgPacket.parsePacket(msg);
            $scope.localArray = parsed_msg.result.data
            try{
                $scope.drawLocal()
            }catch(error){

            }
        }
        $scope.drawLocal = function(){
            let new_position = ""
            $scope.localArray.forEach(point=>{
                // console.log(point)
                let p = $scope.mapview.getUIPosition({
                    x: point[0],
                    y: point[1]
                })
                new_position += ` ${p.left},${p.top}`
            })
            $scope.localPath = new_position
        }
    }
});
