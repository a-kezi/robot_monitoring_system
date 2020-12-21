"use strict";
let camera_rest_ip = $("#serverIp").val()
let camera_rest_port = $("#serverPort").val()

const ONE_CAMERA_VIEW = 1;
const FOUR_CAMERA_VIEW = 4;
const GET_CAMERA_LIST_URL = `http://${camera_rest_ip}:${camera_rest_port}/rest/camera/list`;

angular.
module('cameraView').
component('cameraView', {  
    templateUrl: '/static/libs/angularjs_modules/cameraView/templates/cameraview.html',
    controller: function ($scope, $element, $attrs, $restApiReq) {
        $scope.$root.dataShare.playerInfo = {
            cameraone_1: {
                state: false,
                camera: undefined,
                player: undefined
            },
            camerafour_1: {
                state: false,
                camera: undefined,
                player: undefined
            },
            camerafour_2: {
                state: false,
                camera: undefined,
                player: undefined
            },
            camerafour_3: {
                state: false,
                camera: undefined,
                player: undefined
            },
            camerafour_4: {
                state: false,
                camera: undefined,
                player: undefined
            },
        }


        let event_cameraViewInit = new CustomEvent("cameraViewInit");
        let event_videoInit = new CustomEvent("videoInit");
        
        /*
            addEventListener
        */
        window.addEventListener("robotChanged", function(e) {
            // console.log("-----getRobot changed");
            $scope.videoInit();
            $scope.getCameraList();

            if($scope.$root.dataShare.crt_robot!="99"){
                let index = $scope.getRobotIndex($scope.$root.dataShare.crt_robot.id)
                let mapviewScope = angular.element($element.find(".camera-view-static-mv").find(".content-wrapper")[0]).scope();
                mapviewScope.followRobotViewOn(Number(index));
            }
            window.dispatchEvent(new Event('resize'));
        });
        window.addEventListener("zoneChanged", function(e) {
            // console.log("-----zoneChanged");
            $scope.videoInit();
            $scope.getCameraList();
            window.dispatchEvent(new Event('resize'));
        });
        window.addEventListener("cameraViewInit", function(e) {
            // console.log("-----cameraViewInit");
            $scope.getCameraList();
            window.dispatchEvent(new Event('resize'));
        });
        
        $(window).resize(function () {
            $(".camera-view-wrapper").height($(window).height()-120);
            $(".camera-list-body").height(
                $(".camera-view-left-case").height()-$(".small-mapview-case").height()-140);
        });
        $(document).ready(function(){
            $(".camera-view-wrapper").height($(window).height()-120);
            $(".camera-list-body").height(
                $(".camera-view-left-case").height()-$(".small-mapview-case").height()-140);
        });
        $scope.videoClose = function(){
            $scope.$root.dataShare.playerInfo.cameraone_1.state = false
            $scope.$root.dataShare.playerInfo.camerafour_1.state = false
            $scope.$root.dataShare.playerInfo.camerafour_2.state = false
            $scope.$root.dataShare.playerInfo.camerafour_3.state = false
            $scope.$root.dataShare.playerInfo.camerafour_4.state = false
        }
        $scope.videoInit = function(){
            $scope.videoClose()
            let videoOne = document.getElementById('videoOne-1');
            let videoFour1 = document.getElementById('videoFour-1');
            let videoFour2 = document.getElementById('videoFour-2');
            let videoFour3 = document.getElementById('videoFour-3');
            let videoFour4 = document.getElementById('videoFour-4');

            if(videoOne!=null){
                videoOne.setAttribute('src',"");
            }
            if(videoFour1!=null){
                videoFour1.setAttribute('src',"");
            }
            if(videoFour2!=null){
                videoFour2.setAttribute('src',"");
            }
            if(videoFour3!=null){
                videoFour3.setAttribute('src',"");
            }
            if(videoFour4!=null){
                videoFour4.setAttribute('src',"");
            }
            // $("#cameraOne_name").html("지정 안됨")
            // $("#cameraFour_name1").html("지정 안됨")
            // $("#cameraFour_name2").html("지정 안됨")
            // $("#cameraFour_name3").html("지정 안됨")
            // $("#cameraFour_name4").html("지정 안됨")

            $scope.cameraOne_name = "[지정 안됨]";
            $scope.cameraFour_name1 = "[지정 안됨]";
            $scope.cameraFour_name2 = "[지정 안됨]";
            $scope.cameraFour_name3 = "[지정 안됨]";
            $scope.cameraFour_name4 = "[지정 안됨]";
            
            $scope.onOneView()
            window.dispatchEvent(event_videoInit);
        }
        

        $scope.getCameraList = function(){
            let reqInfo = $scope.getQueryInfo();
            $restApiReq.get(reqInfo,function(res){
                $scope.$apply(function(){
                    // console.log(res);
                    if(res.length!=0){
                        $scope.cameraList = res;
                    }else if(res.length==0){
                        console.log("there is no camera");
                    }
                });
            })
            window.dispatchEvent(new Event('resize'));
        }

        $scope.getQueryInfo = function (){
            let reqInfo = {
                url: GET_CAMERA_LIST_URL,
                type: 'GET',
                param: {
                    robottype: $scope.$root.dataShare.crt_robot.type,
                }
            }
            return reqInfo
        }
        // setInterval(function(){
        //     $scope.onOneView()
        // },2000)
        $scope.onOneView = function(){
            $scope.viewState = ONE_CAMERA_VIEW;
            $("#oneview").removeClass('camera-view-btn-off');
            $("#oneview").addClass('camera-view-btn-on');
            $("#fourview").removeClass('camera-view-btn-on');
            $("#fourview").addClass('camera-view-btn-off');

        }
        
        

        $scope.onFourView = function(){
            $scope.viewState = FOUR_CAMERA_VIEW;
            $("#oneview").removeClass('camera-view-btn-on');
            $("#oneview").addClass('camera-view-btn-off');
            $("#fourview").removeClass('camera-view-btn-off');
            $("#fourview").addClass('camera-view-btn-on');

        }

        $scope.getRobotIndex = function(id){
            for(let i in $scope.$root.dataShare.robotlist){
                if($scope.$root.dataShare.robotlist[i].id==id){
                    return i
                }else if(
                    (i === $scope.$root.dataShare.robotlist-1) &&
                    ($scope.$root.dataShare.robotlist[i].id!==id) 
                ){
                    return undefined
                }
            }
        }



    }
});
