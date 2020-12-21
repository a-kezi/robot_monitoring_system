"use strict";
let cameraSub_rest_ip = $("#serverIp").val()
let cameraSub_rest_port = $("#serverPort").val()
const CV_SUB_GET_CAMERA_LIST_URL = `http://${cameraSub_rest_ip}:${cameraSub_rest_port}/rest/camera/list`;

angular.
module('cameraViewSub').
component('cameraViewSub', {  
    templateUrl: '/static/libs/angularjs_modules/cameraViewSub/templates/cameraViewSub.html',
    controller: function ($scope, $element, $attrs, $restApiReq) {
        $scope.$root.dataShare.playerInfo = {
            cameraone: {
                state: false,
                camera: undefined,
                player: undefined
            },
            cameratwo: {
                state: false,
                camera: undefined,
                player: undefined
            },
        }

        $scope.viewState = ONE_CAMERA_VIEW;
        $scope.cameraList = [];
        $scope.cameraOne_name = "[지정 안됨]";
        $scope.cameraTwo_name = "[지정 안됨]";
        
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
                url: CV_SUB_GET_CAMERA_LIST_URL,
                type: 'GET',
                param: {
                    robottype: $scope.$root.dataShare.crt_robot.type,
                }
            }
            return reqInfo
        }
        

        window.addEventListener("robotChanged", function(e) {
            // console.log("-----getRobot changed");
            $scope.videoInit();
            $scope.getCameraList();
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
            $(".camera-view-content-body").height($(window).height()-120);
        });
        $(document).ready(function(){
            // init 하면서 프레임 사이즈 맞추기
            $(".camera-view-content-body").height($(window).height()-120);
            $(".camera-list-body").height($(".camera-list-case").height()-40);
            let event_cameraViewInit = new CustomEvent("cameraViewInit");
            window.dispatchEvent(event_cameraViewInit);
        });

        $scope.videoClose = function(){
            $scope.$root.dataShare.playerInfo.cameraone.state = false
            $scope.$root.dataShare.playerInfo.cameratwo.state = false
        }
        $scope.videoInit = function(){
            $scope.videoClose()
            let videoOne = document.getElementById('videoOne');
            let videoTwo = document.getElementById('videoTwo');
            if(videoOne!=null){
                videoOne.setAttribute('src',"");
            }
            
            if(videoTwo!=null){
                videoTwo.setAttribute('src',"");
            }
            $("#cameraOne_name").html("[지정 안됨]")
            $("#cameraTwo_name").html("[지정 안됨]")
            $scope.cameraOne_name = "[지정 안됨]";
            $scope.cameraTwo_name = "[지정 안됨]";
            
            let event_videoInit = new CustomEvent("videoInit");
            window.dispatchEvent(event_videoInit);
        }
        

        



        $scope.onOneView = function(){
            console.log(ONE_CAMERA_VIEW);
            $scope.viewState = ONE_CAMERA_VIEW;
            $("#oneview").removeClass('camera-view-btn-off');
            $("#oneview").addClass('camera-view-btn-on');
            $("#fourview").removeClass('camera-view-btn-on');
            $("#fourview").addClass('camera-view-btn-off');

        }

        $scope.onFourView = function(){
            console.log(FOUR_CAMERA_VIEW);
            $scope.viewState = FOUR_CAMERA_VIEW;
            $("#oneview").removeClass('camera-view-btn-on');
            $("#oneview").addClass('camera-view-btn-off');
            $("#fourview").removeClass('camera-view-btn-off');
            $("#fourview").addClass('camera-view-btn-on');

        }



        /*
            init
        */
        // get options from attrs
        if($attrs.option){
            let temp_opt = JSON.parse($attrs.option);
            // console.log(temp_opt);
        }

    }
});
