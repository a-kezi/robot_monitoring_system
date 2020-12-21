'use strict'
const ALL_ROBOT = "99";
dashboardApp.controller('suvnavCtrl', function ($scope, $restApiReq) {
    let event_zoneChanged = new CustomEvent("zoneChanged");
    let event_robotChanged = new CustomEvent("robotChanged");
    let event_subListChanged = new CustomEvent("subListChanged");
    
    /*
        addEventListener
    */
    window.addEventListener("siteChanged", function(e) {
        
        $scope.getZone($scope.$root.dataShare.crt_site.siteID);
    });

    window.addEventListener("zoneChanged", function(e) {
        $scope.getRobots($scope.$root.dataShare.crt_zone)
        $scope.getSubList($scope.$root.dataShare.crt_zone)
    });

    $(window).resize(function () {
        $("#mapview").height($(window).height()-120);
    });
    $(document).ready(function(){
        $("#mapview").height($(window).height()-120);
    });
    
    ////////////////////////////////////////////////////////////////////////////////////////
    let event_robotListChanged = new CustomEvent("robotListChanged");
    $scope.robotStatusSub = []
    window.addEventListener("robotListChanged", function(e) {
        $scope.unSubRobotStatus(function(){
            $scope.subRobotStatus()
        })
    });
    $scope.subRobotStatus = function(){
        $scope.$root.dataShare.robotlist.forEach(robot => {
            $scope.robotStatusSub.push(nats.subscribe(`${robot.id}.robot_organized_status`, robotStatusHandle))
        });
    }
    $scope.unSubRobotStatus = function(cb){
        $scope.robotStatusSub.forEach(element => {
            nats.unsubscribe(element)
        });
        cb()
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
    function robotStatusHandle(msg){
        let parsed_msg = MsgPacket.parsePacket(msg);
        let robotIndex = $scope.getRobotIndex(parsed_msg.robot_id);
        let state = getFinalState(parsed_msg)
        $scope.$root.dataShare.robotlist[robotIndex]['context'] = parsed_msg.context.desc;
        $scope.$root.dataShare.robotlist[robotIndex]['finalstate'] = state;
    }
    $scope.dispatchRobotListChangedEvent = function(){
        $scope.$root.isRobotReady = true;
        window.dispatchEvent(event_robotListChanged);
    }
    ////////////////////////////////////////////////////////////////////////////////////////

    /*
        functions
    */
   
    
    $scope.dispatchZoneChangedEvent = function(){
        $scope.$root.isZoneReady = true;
        window.dispatchEvent(event_zoneChanged);
    }
    $scope.dispatchRobotChangedEvent = function(){
        $scope.$root.isRobotReady = true;
        window.dispatchEvent(event_robotChanged);
    }
    $scope.dispatchSubListChangedEvent = function(){
        $scope.$root.isSubListReady = true;
        window.dispatchEvent(event_subListChanged);
    }
    $scope.readyFlagInit = function(){
        $scope.$root.isZoneReady = false;
        $scope.$root.isRobotReady = false;
        $scope.$root.isSubListReady = false;
    }

    $scope.getCrtZoneName = function(crt_zone){
        return crt_zone!=null?crt_zone.name:"없음"
    }

    $scope.chooseZone = function(index){
        $scope.readyFlagInit()
        pageLoadingMask("loading_thrabber_ropti.svg");
        $scope.$root.dataShare.crt_zone = $scope.$root.dataShare.zonelist[index];
        $scope.dispatchZoneChangedEvent()
    }

    $scope.getZone = function(id){
        // console.log(`get zone : siteID=${id}`);
        $scope.readyFlagInit()
        $restApiReq.get({
            url: `http://${server_ip}:${server_port}/rest/zone/list`,
            type: 'GET',
            param: {
                siteID: id
            }
        },function(res){
            // console.log(res);
            $scope.$apply(function(){
                $scope.$root.dataShare.zonelist = res;
                if($scope.$root.dataShare.zonelist.length==0){
                    $scope.$root.dataShare.crt_zone = null;    
                }else{
                    $scope.$root.dataShare.crt_zone = $scope.$root.dataShare.zonelist[0];
                }
                $scope.dispatchZoneChangedEvent()
            })
            if(res.length==0){
                console.log("Empty zone list");
            }
        });
    }

    $scope.chooseRobot = function(index, ev){
        $(".robot-selector").find('.selected').removeClass('selected');
        ev.target.classList.add('selected');
        $scope.$root.dataShare.crt_robot = $scope.$root.dataShare.robotlist[index];
        $scope.dispatchRobotChangedEvent()
    }
    
    $scope.getRobots = function(crt_zone){
        let id;
        if(crt_zone!=null){
            id = crt_zone.zoneID;
            // console.log(`get robots : zoneID=${id}`);
            $scope.$root.dataShare.robotlist = [];
            $restApiReq.get({
                url: `http://${server_ip}:${server_port}/rest/robot/list`,
                type: 'GET',
                param: {
                    zoneID: id
                }
            },function(res){
                $scope.$apply(function(){
                    if(res.length!==0){
                        $scope.$root.dataShare.crt_robot = ALL_ROBOT;
                        $scope.$root.dataShare.robotlist = res;
                    }
                    $scope.dispatchRobotListChangedEvent()
                    $scope.dispatchRobotChangedEvent()
                    closePageLoadingMask();
                })
                if(res.length==0){
                    console.log("Empty robot list");
                }
            });
        }else{
            $scope.$root.dataShare.crt_robot = undefined;
            $scope.$root.dataShare.robotlist = [];
            $scope.dispatchRobotListChangedEvent()
            $scope.dispatchRobotChangedEvent()
            closePageLoadingMask();
            console.log("Empty robot list");
        }
    }

    $scope.getSubList = function(crt_zone){
        // console.log(`get SubList : zoneID=${id}`);
        let id;
        if(crt_zone!=null){
            id = crt_zone.zoneID;
            $restApiReq.get({
                url: `http://${server_ip}:${server_port}/rest/subject/list`,
                type: 'GET',
                param: {
                    zoneID: id
                }
            },function(res){
                // console.log(res);
                $scope.$apply(function(){
                    $scope.$root.dataShare['subList'] = res;
                    $scope.dispatchSubListChangedEvent()
                })
                if(res.length==0){
                    console.log("Empty sub list");
                }
            });
        }else{
            $scope.dispatchSubListChangedEvent()
            console.log("Empty sub list");
        }
    }
});
