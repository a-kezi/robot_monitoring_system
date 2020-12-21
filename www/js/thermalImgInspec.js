const ALL_ROBOT = "99";

dashboardApp.controller('suvnavCtrl', function ($scope, $restApiReq) {

    let event_zoneChanged = new CustomEvent("zoneChanged");
    let event_robotChanged = new CustomEvent("robotChanged");
    let event_robotListChanged = new CustomEvent("robotListChanged");
    let event_subListChanged = new CustomEvent("subListChanged");

    window.addEventListener("siteChanged", function(e) {
        $scope.getZone($scope.$root.dataShare.crt_site.siteID);
    });
    window.addEventListener("zoneChanged", function(e) {
        $scope.getRobots($scope.$root.dataShare.crt_zone)
        $scope.getSubList($scope.$root.dataShare.crt_zone)
    });
    window.addEventListener("robotListChanged", function(e) {
    
    });

    $(window).resize(function () {
        $("#mapview").height($(window).height()-120);
    });
    $(document).ready(function(){
        $("#mapview").height($(window).height()-120);
    });
    
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
    $scope.dispatchRobotListChangedEvent = function(){
        $scope.$root.isRobotReady = true;
        window.dispatchEvent(event_robotListChanged);
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
        $restApiReq.get({
            url: `http://${server_ip}:${server_port}/rest/zone/list`,
            type: 'GET',
            param: {
                siteID: id
            }
        },function(res){
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

    $scope.getRobots = function(crt_zone){
        let id;
        if(crt_zone!=null){
            id = crt_zone.zoneID;
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
                    
                    $scope.dispatchRobotListChangedEvent()////////////////////////////////////////////
                    $scope.dispatchRobotChangedEvent()
                    closePageLoadingMask();
                })
                if(res.length==0){
                    console.log("Empty robot list");
                }
            });
        }else{
            $scope.$root.dataShare.crt_robot = ALL_ROBOT;
            $scope.$root.dataShare.robotlist = [];
            $scope.dispatchRobotListChangedEvent()///////////////////////////////////////////
            $scope.dispatchRobotChangedEvent()
            closePageLoadingMask();
            console.log("Empty robot list");
        }
    }

    

    $scope.getSubList = function(crt_zone){
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
