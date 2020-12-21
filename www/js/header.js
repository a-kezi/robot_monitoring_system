let server_ip = $("#serverIp").val()
let server_port = $("#serverPort").val()
let nats_ip = $("#natsIp").val()
let nats_port = $("#natsPort").val()
let nats_relay_port = $("#natsRelayPort").val()
let user_displayname = $("#user_displayname").val()
let user_id = $("#user_id").val()

console.log("## header.js :: server  url :", `${server_ip}:${server_port}`)

dashboardApp.controller('navCtrl', function ($scope, $restApiReq, $element) {
    /*
        variables
    */
    $scope.user_displayname = user_displayname
    $scope.user_id = user_id
    $scope.$root.isZoneReady = false;
    $scope.$root.isRobotReady = false;
    $scope.$root.isSubListReady = false;
    
    $scope.$root.dataShare = {
        crt_site: {},
        crt_zone: {},
        crt_service: {},
        crt_robot: {},
        crt_robot_device:[],
        servicelist:[],
        sitelist:[],
        robotlist:[],
        poilist:[],
        subList:{}
    }

    /*
        custom events
    */
    let event_siteChanged = new CustomEvent("siteChanged");
    let event_alarmCheckAll = new CustomEvent("alarmCheckAll");

    /*
        functions
    */
    $scope.onPopupClose = function(event){
        console.log("onPopupClose")
        $('#modal-content-case').css("display","none")
        $('#modal-content-wrapper').remove();
    }
    $scope.onAlarmCheckAll = function(ev){
        $restApiReq.get({
            url: `http://${server_ip}:${server_port}/rest/alarm/check/all`,
            type: 'GET'
        },function(res){
            if(res.status==true){
                window.dispatchEvent(event_alarmCheckAll);
            }else{
                console.log("## alarm check all error")
            }
        });

    }
    $scope.onAlarmSwitch = function(ev){
        if($scope.$root.alarmState==true){
            // off 하기
            $restApiReq.get({
                url: `http://${server_ip}:${server_port}/rest/alarm/setting/off`,
                type: 'GET'
            },function(res){
                console.log(res)
                if(res.status==true){
                    $element.find("#someSwitchOptionDefault")[0].checked = true
                    $scope.$root.alarmState = false
                    console.log("## alarm state : ", false)
                }else{
                    console.log("## alarm setting error")
                }
            });
        }else{
            // on 하기
            $restApiReq.get({
                url: `http://${server_ip}:${server_port}/rest/alarm/setting/on`,
                type: 'GET'
            },function(res){
                if(res.status==true){
                    $element.find("#someSwitchOptionDefault")[0].checked = false
                    $scope.$root.alarmState = true
                    console.log("## alarm state : ", true)
                }else{
                    console.log("## alarm setting error")
                }
            });

        }
        ev.stopPropagation();
        ev.preventDefault();
    }
    $scope.chooseSite = function(index){
        pageLoadingMask("loading_thrabber_ropti.svg");
        $scope.$root.dataShare.crt_site = $scope.$root.dataShare.sitelist[index];
        window.dispatchEvent(event_siteChanged);
    }

    $scope.getSite = function(){
        $scope.$root.dataShare.sitelist = [];
        $restApiReq.get({
            url: `http://${server_ip}:${server_port}/rest/site/list`,
            type: 'GET'
        },function(res){
            if(res.length!=0){
                $scope.$apply(function(){
                    $scope.$root.dataShare.sitelist = res
                    $scope.$root.dataShare.crt_site = $scope.$root.dataShare.sitelist[0];
                    window.dispatchEvent(event_siteChanged);
                })
            }else{
                console.log("Empty site list");
            }
        });
    }

    // user로 요청하는 부분 추가 필요 -> 세션 정보로 서버에서 처리 하는 부분 추가하면 될듯
    $scope.getService = function(){
        $restApiReq.get({
            url: `http://${server_ip}:${server_port}/rest/service/list`,
            type: 'GET'
        },function(res){
            if(res.length!=0){
                $scope.$apply(function(){
                    $scope.$root.dataShare.servicelist = res;
                })
            }else{
                console.log("Empty service list");
            }
        });
    }

    this.$onInit = function() {
        pageLoadingMask("loading_thrabber_ropti.svg");
        $scope.getSite();
        $scope.getService();

        // get alarm setting
        $restApiReq.get({
            url: `http://${server_ip}:${server_port}/rest/alarm/get/alarmstate`,
            type: 'GET'
        },function(res){
            
            if(res.status==true){
                
                if(res.result.alarm_on==1){
                    $scope.$root.alarmState = true;
                    $element.find("#someSwitchOptionDefault")[0].checked = false
                }else{
                    $scope.$root.alarmState = false;
                    $element.find("#someSwitchOptionDefault")[0].checked = true
                }
                
            }else{
                $scope.$root.alarmState = true;
            }
        });
    }
});