const ALL_ROBOT = "99";

dashboardApp.controller('suvnavCtrl', function ($scope, $restApiReq) {

    let event_zoneChanged = new CustomEvent("zoneChanged");
    let event_robotChanged = new CustomEvent("robotChanged");
    let event_getRobotFinished = new CustomEvent("getRobotFinished");
    let event_getSubListFinished = new CustomEvent("getSubListFinished");
    
    /*
        functions
    */

    $scope.initSubNav = function(){

    }

    $scope.getCrtZoneName = function(crt_zone){
        return crt_zone!=null?crt_zone.name:"없음"
    }

    $scope.chooseZone = function(index){
        pageLoadingMask("loading_thrabber_ropti.svg");
        $scope.$root.dataShare.crt_zone = $scope.$root.dataShare.zonelist[index];

        window.dispatchEvent(event_zoneChanged);
        
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
                
                window.dispatchEvent(event_zoneChanged);
                // setTimeout(function(){
                //     window.dispatchEvent(event_zoneChanged);

                // },1000)
                

            })
            if(res.length==0){
                console.log("Empty zone list");
            }
        });
    }

    $scope.chooseRobot = function(index, ev){
        console.log("## chooseRobot");
        $(".robot-selector").find('.selected').removeClass('selected');
        ev.target.classList.add('selected');
        if($scope.$root.dataShare.crt_robot=== ALL_ROBOT){
            $("#main-mapview").removeClass('component-open');
            $("#main-mapview").addClass('component-close');
            $("#camera-view").removeClass('component-close');
            $("#camera-view").addClass('component-open');
        }
        $scope.$root.dataShare.crt_robot = $scope.$root.dataShare.robotlist[index];
        window.dispatchEvent(event_robotChanged);
    }
    $scope.chooseAllRobot = function(ev){
        $(".robot-selector").find('.selected').removeClass('selected');
        ev.target.classList.add('selected');
        if($scope.$root.dataShare.crt_robot!== ALL_ROBOT){
            $("#camera-view").removeClass('component-open');
            $("#camera-view").addClass('component-close');
            $("#main-mapview").removeClass('component-close');
            $("#main-mapview").addClass('component-open');
        }
        $scope.$root.dataShare.crt_robot = ALL_ROBOT;
        window.dispatchEvent(event_robotChanged);
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
                    
                    window.dispatchEvent(event_getRobotFinished);
                    closePageLoadingMask();
                })
                if(res.length==0){
                    console.log("Empty robot list");
                }
            });
        }else{
            $scope.$root.dataShare.crt_robot = ALL_ROBOT;
            $scope.$root.dataShare.robotlist = [];
            window.dispatchEvent(event_getRobotFinished);
            closePageLoadingMask();
            console.log("Empty robot list");
        }
    }

    /*
        addEventListener
    */
    window.addEventListener("siteChanged", function(e) {
        // console.log("siteChanged");
        $scope.getZone($scope.$root.dataShare.crt_site.siteID);
    });

    window.addEventListener("zoneChanged", function(e) {

        $scope.getRobots($scope.$root.dataShare.crt_zone)
        $scope.getSubList($scope.$root.dataShare.crt_zone, function(){
            // console.log($scope.$root.dataShare);
        })
        if($scope.$root.dataShare.crt_robot!== ALL_ROBOT){
            $("#camera-view").removeClass('component-open');
            $("#camera-view").addClass('component-close');
            $("#main-mapview").removeClass('component-close');
            $("#main-mapview").addClass('component-open');
        }

    });

    $scope.getSubList = function(crt_zone, callback){
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
                    window.dispatchEvent(event_getSubListFinished);
                    callback();
                })
                if(res.length==0){
                    console.log("Empty sub list");
                }
            });
        }else{
            window.dispatchEvent(event_getSubListFinished);
            console.log("Empty sub list");
        }
    }

    /*
        init
    */
    $scope.initSubNav()

});
