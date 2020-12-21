"use strict";
const ALL_ROBOT = "99";
let test_rest_ip = "127.0.0.1"
let test_rest_port = "53300"
dashboardApp.controller('suvnavCtrl', function ($scope, $restApiReq) {
    let event_zoneChanged = new CustomEvent("zoneChanged");
    let event_robotChanged = new CustomEvent("robotChanged");
    let event_subListChanged = new CustomEvent("subListChanged");
    
    
    this.$onInit = function() {
        let robot_id = "addy-18"
        nats.subscribe(`${robot_id}.head_img`, robotMsgHandle);
        nats.subscribe(`${robot_id}.http_img`, httphandle);
        $scope.imgMonitor = $("#ros-monitor");
        $scope.httpMonitor = $("#http-monitor");
        


        setInterval(function(){
            nats.publish(`${robot_id}.http_img_req`, JSON.stringify({
                req: true
            }));
        },1000)
    }
    function httphandle(msg){
        console.log("--------------")
        let parsed_msg = JSON.parse(msg)
        // console.log(parsed_msg)
        $("#http-screen").html(JSON.stringify(parsed_msg.header, "null", 2));
        
        let imgurl = parsed_msg.data;
        // console.log(imgurl)
        $scope.httpMonitor.attr("src", imgurl);
    }
    function robotMsgHandle(msg){
        // console.log("--------------")
        let parsed_msg = JSON.parse(msg)
        // console.log(parsed_msg)
        $("#data-screen").html(JSON.stringify(parsed_msg.header, "null", 2));
        
        // let imgurl = `data:image/jpeg;base64,`+parsed_msg.data;
        let imgurl = parsed_msg.data;
        $scope.imgMonitor.attr("src", imgurl);
    }



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
    $scope.viewControlBtnEnable = function(){
        $('#view-btn').css("display","initial")
    }
    $scope.viewControlBtnDisable = function(){
        $('#view-btn').css("display","none")
    }
    
    $scope.chooseRobot = function(index, ev){
        $(".robot-selector").find('.selected').removeClass('selected');
        // console.log(ev.target)
        ev.target.classList.add('selected');
        if($scope.$root.dataShare.crt_robot=== ALL_ROBOT){
            $scope.viewControlBtnEnable()
        }
        $scope.$root.dataShare.crt_robot = $scope.$root.dataShare.robotlist[index];
        $scope.dispatchRobotChangedEvent()
    }
    $scope.chooseAllRobot = function(ev){
        $(".robot-selector").find('.selected').removeClass('selected');
        ev.target.classList.add('selected');
        if($scope.$root.dataShare.crt_robot!== ALL_ROBOT){
            $scope.onClickMapView()
            $scope.viewControlBtnDisable()
        }
        $scope.$root.dataShare.crt_robot = ALL_ROBOT;
        $scope.dispatchRobotChangedEvent()
        
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








    $scope.siteBtn1 = function(){
        console.log("site push");
        
        $.post(`http://${test_rest_ip}:${test_rest_port}/websocket/send/site`,
        {
            site_id: "mmc-masan",
            robot_id: "addy-18",
            msg:JSON.stringify({
                result:{
                    state:true,
                    image: `http://${test_rest_ip}:${test_rest_port}/rest/image/srv_res/origin?id=0bb60d91-e556-11ea-afc9-3d6c665e74e5&timestamp=2020-08-24T00:33:51.000Z`,
                },
                type:'event_emergency',
                robot_id: "addy-18",
                msg_id:Date.now(),
                timestamp:Date.now(),

                location:{
                    site:"mmc-masan",
                    zone:"mmc-masan_1f",
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
    $scope.postTest = function(){
        console.log("post test");
        $.post(`http://${test_rest_ip}:${test_rest_port}/rest/topics/test`,
        {
            num_int : 12354,
            num_float : 1.0216,
            num_float_long : 1.0021565216581651,
            string: "addy-id1",
            list_str: ["a","a","a","a"],
            list_int: [1,2,3,4,5,6],
            list_fl_short: [1.012,1.012,1.012,1.012,1.012,1.012],
            list_fl_long: [1.0021565216581651,1.0021565216581651,1.0021565216581651,1.0021565216581651,1.0021565216581651]
        },
        function(data, status){
            console.log("Data: " + data + "\nStatus: " + status);
        });
    }

    $scope.testBtn1 = function(){
        console.log("client call");
        $.post(`http://${test_rest_ip}:${test_rest_port}/websocket/send/target`,
        {
            site_id: "mmc-masan",
            robot_id: "addy-18",
            msg:JSON.stringify({
                result:{
                    state:true,
                    image: `http://${test_rest_ip}:${test_rest_port}/rest/image/srv_res/origin?id=0bb60d91-e556-11ea-afc9-3d6c665e74e5&timestamp=2020-08-24T00:33:51.000Z`,
                },
                type:'event_emergency',
                robot_id: "addy-18",
                msg_id:Date.now(),
                timestamp:Date.now(),

                location:{
                    site:"mmc-masan",
                    zone:"mmc-masan_1f",
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

    $scope.testBtn2 = function(){
        console.log("localization fault");

        $.post(`http://${test_rest_ip}:${test_rest_port}/websocket/send/target`,
        {
            site_id: "mmc-masan",
            robot_id: "addy-18",
            msg:JSON.stringify({
                result:{
                    subtype: "localization",
                    state:true,
                    data:"",
                },
                type:'localization',
                robot_id: "addy-18",
                msg_id:Date.now(),
                timestamp:Date.now(),
                error: true,

                location:{
                    site:"mmc-masan",
                    zone:"mmc-masan_1f",
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

    $scope.testBtn3 = function(){
        console.log("sensor fault");

        $.post(`http://${test_rest_ip}:${test_rest_port}/websocket/send/target`,
        {
            site_id: "mmc-masan",
            robot_id: "addy-18",
            msg:JSON.stringify({
                result:{
                    subtype: "sensor",
                    state:true,
                    data:"",
                    devices:["l1","l2"]
                },
                type:'sensor',
                robot_id: "addy-18",
                msg_id:Date.now(),
                timestamp:Date.now(),
                error: true,

                location:{
                    site:"mmc-masan",
                    zone:"mmc-masan_1f",
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
    
    $scope.testBtn4 = function(){
        console.log("emergency fault");

        $.post(`http://${test_rest_ip}:${test_rest_port}/websocket/send/target`,
        {
            site_id: "mmc-masan",
            robot_id: "addy-18",
            msg:JSON.stringify({
                result:{
                    subtype: "emergency",
                    state:true,
                    data:"",
                },
                type:'emergency',
                robot_id: "addy-18",
                msg_id:Date.now(),
                timestamp:Date.now(),
                error: true,

                location:{
                    site:"mmc-masan",
                    zone:"mmc-masan_1f",
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

    $scope.testBtn5 = function(){
        console.log("battery fault");

        $.post(`http://${test_rest_ip}:${test_rest_port}/websocket/send/target`,
        {
            site_id: "mmc-masan",
            robot_id: "addy-18",
            msg:JSON.stringify({
                result:{
                    subtype: "battery",
                    state:true,
                    data:"30",
                },
                type:'battery',
                robot_id: "addy-18",
                msg_id:Date.now(),
                timestamp:Date.now(),
                error: true,

                location:{
                    site:"mmc-masan",
                    zone:"mmc-masan_1f",
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

    $scope.testBtn6 = function(){
        console.log("bodytemp fault");

        $.post(`http://${test_rest_ip}:${test_rest_port}/websocket/send/target`,
        {
            site_id: "mmc-masan",
            robot_id: "addy-18",
            msg:JSON.stringify({
                result:{
                    type:["string","img"],
                    data:"30",
                    image: "",
                },
                type:'event_temperature',
                robot_id: "addy-18",
                msg_id:Date.now(),
                timestamp:Date.now(),
                error: true,

                location:{
                    site:"mmc-masan",
                    zone:"mmc-masan_1f",
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

    $scope.testBtn7 = function(){
        console.log("people detect");

        $.post(`http://${test_rest_ip}:${test_rest_port}/websocket/send/target`,
        {
            site_id: "mmc-masan",
            robot_id: "addy-18",
            msg:JSON.stringify({
                result:{
                    type:["string","img"],
                    data:"",
                    image: `http://${test_rest_ip}:${test_rest_port}/rest/image/srv_res/origin?id=0bb60d91-e556-11ea-afc9-3d6c665e74e5&timestamp=2020-08-24T00:33:51.000Z`,
                },
                type:'event_people',
                robot_id: "addy-18",
                msg_id:Date.now(),
                timestamp:Date.now(),
                error: true,

                location:{
                    site:"mmc-masan",
                    zone:"mmc-masan_1f",
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

    $scope.testBtn8 = function(){
        console.log("mandown detect");

        $.post(`http://${test_rest_ip}:${test_rest_port}/websocket/send/target`,
        {
            site_id: "mmc-masan",
            robot_id: "addy-18",
            msg:JSON.stringify({
                result:{
                    type:["string","img"],
                    data:"",
                    image: `http://${test_rest_ip}:${test_rest_port}/rest/image/srv_res/origin?id=0bb60d91-e556-11ea-afc9-3d6c665e74e5&timestamp=2020-08-24T00:33:51.000Z`,
                },
                type:'event_fallen',
                robot_id: "addy-18",
                msg_id:Date.now(),
                timestamp:Date.now(),
                error: true,

                location:{
                    site:"mmc-masan",
                    zone:"mmc-masan_1f",
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

    $scope.testBtn9 = function(){
        console.log("qrRecognize error");

        $.post(`http://${test_rest_ip}:${test_rest_port}/websocket/send/target`,
        {
            site_id: "mmc-masan",
            robot_id: "addy-18",
            msg:JSON.stringify({
                result:{
                    type:["string","img"],
                    data:"",
                    image: `http://${test_rest_ip}:${test_rest_port}/rest/image/srv_res/origin?id=0bb60d91-e556-11ea-afc9-3d6c665e74e5&timestamp=2020-08-24T00:33:51.000Z`,
                },
                type:'event_code',
                robot_id: "addy-18",
                msg_id:Date.now(),
                timestamp:Date.now(),
                error: true,

                location:{
                    site:"mmc-masan",
                    zone:"mmc-masan_1f",
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

    $scope.testBtn10 = function(){
        console.log("fireDetection error");

        $.post(`http://${test_rest_ip}:${test_rest_port}/websocket/send/target`,
        {
            site_id: "mmc-masan",
            robot_id: "addy-18",
            msg:JSON.stringify({
                result:{
                    type:["string","img"],
                    data:"",
                    image: `http://${test_rest_ip}:${test_rest_port}/rest/image/srv_res/origin?id=0bb60d91-e556-11ea-afc9-3d6c665e74e5&timestamp=2020-08-24T00:33:51.000Z`,
                },
                type:'event_fire',
                robot_id: "addy-18",
                msg_id:Date.now(),
                timestamp:Date.now(),
                error: true,

                location:{
                    site:"mmc-masan",
                    zone:"mmc-masan_1f",
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

});
