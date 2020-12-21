"use strict";

angular.
module('mvMarker').
component('mvMarker', {  
    templateUrl: '/static/libs/angularjs_modules/mapview/templates/mvMarker.html',
    controller: function ($scope, $element, $attrs, $restApiReq) {
        this.$onInit = function() {
            $scope.mapview = $scope.$parent;
            $scope.isPoiListLoaded = false;
            // $scope.mvMap = $scope.$parent;
            $scope.poi=[]

            switch($scope.mapview.mapview_mode){
                case MAP_VIEW_MODE_STATIC:
                    
                    
                    break;
                case MAP_VIEW_MODE_DYNAMIC:
                case MAP_VIEW_MODE_CONTROLLER:
                    window.addEventListener("robotChanged", function(e) {
                        if($scope.$root.dataShare.crt_zone!=null){
                            $scope.getPoi($scope.$root.dataShare.crt_zone.zoneID)
                        }
                    });
                    window.addEventListener("zoneChanged", function(e) {
                        $scope.clearPoiList();
                    });
                    window.addEventListener("getPoiFinished", function(e) {
                        $scope.isPoiListLoaded = true;
                    });
                    $scope.clearPoiList = function(){
                        $scope.poi = [];
                    };
            
                    $scope.getPoi = function(id){
                        // console.log(`get zone : siteID=${id}`);
                        $restApiReq.get({
                            url: `http://${server_ip}:${server_port}/rest/poi/list`,
                            type: 'GET',
                            param: {
                                zoneID: id
                            }
                        },function(res){
                            $scope.$apply(function(){
                                
                                $scope.poi = res;
                                $scope.poi.forEach(element => {
                                    let new_position = $scope.mapview.getUIPosition(element.pose.position);
            
                                    // icon 위치 ui 좌표로 변경
                                    element.iconPosition = {
                                        'transform': `translate(${new_position.left.toFixed(2)}px,${new_position.top.toFixed(2)}px)`,
                                    };
            
                                    // icon src 설정 -> 타입별로 다르게 되는거 추가하기
                                    if(!element.iconSrc){
                                        element.iconSrc ={}
                                    }
                                    element.iconSrc['position']="/static/imgs/icons/p.png"
            
                                    // icon style 변경
                                    if(!element.iconStyle){
                                        element.iconStyle ={}
                                    }
                                    element.iconStyle['position']={
                                        'position': 'absolute',
                                        'transform': 'translate(-50%,-50%)',
                                        'height':`30px`,
                                        'width':`30px`
                                    }
            
                                    // icon check cross를 위한 반지름 설정
                                    element.iconRadius = getRadius(30,30)
            
                                    // let targetRadius = $scope.poi[0].iconRadius
                                    // let targetLocation ={
                                    //     x:new_position.left,
                                    //     y:new_position.top
                                    // }
                    
                                    // // mapView size
                                    // let mapViewGeo = $scope.mapViewGeo
                                    // let extraLength = 0;
                    
                                    // if(checkIsTargetInCircle(targetRadius, targetLocation, mapViewGeo, extraLength)){
                                        
                                    //     element.display = true;
                                    // }else{
                                        
                                    //     element.display = false;
                                    // }
                                });
                                let event_getPoiFinished = new CustomEvent("getPoiFinished");
                                window.dispatchEvent(event_getPoiFinished);
                            });
            
                            if(res.length==0){
                                console.log("Empty poi list");
                            }
                        });
                    }
                    
                    

                    break;
            }
            
            let event_onMVMarkerInit = new CustomEvent(`onMVMarkerInit-${$scope.mapview.$id}`,{detail : $scope.$id});
            window.dispatchEvent(event_onMVMarkerInit);
        };











        
        $scope.clearMark = function(pose){
            $scope.poi = []
        }
        $scope.addMark = function(pose){
            let new_position = $scope.mapview.getUIPosition(pose.position);
            let markItem = {
                pose:pose,
                iconPosition : {
                    'transform': `translate(${new_position.left.toFixed(2)}px,${new_position.top.toFixed(2)}px)`,
                },
                iconSrc:{
                    // position:"/static/imgs/icons/lamp-issue-selected.png"
                    position:"/static/imgs/icons/robot-pin-issue.svg",
                    orientation:"/static/imgs/icons/robot-pin-issue-select-direction.svg"
                    // orientation:"/static/imgs/icons/robot-pin-report.png"
                },
                iconStyle:{
                    position:{
                        'position': 'absolute',
                        'transform': `translate(-50%,-50%)`,
                        'height':`30px`,
                        'width':`30px`
                    },
                    orientation:{
                        'position': 'absolute',
                        'transform': `translate(-50%,-50%) rotateZ(${
                            angleTrans(pose.orientation)
                        }deg)`,
                        'height':`56px`,
                        'width':`56px`
                    },
                },
                iconRadius:getRadius(30,30)
            }
            $scope.poi.push(markItem);
        }
        $scope.$watch("mapview.option.camera", function (newValue, oldValue) {
            if($scope.poi.length!=0){
                for(let i =0;i<$scope.poi.length;i++){
                    let new_position = $scope.mapview.getUIPosition($scope.poi[i].pose.position)
                    
                    $scope.poi[i].iconPosition = {
                        'transform': `translate(${new_position.left.toFixed(2)}px,${new_position.top.toFixed(2)}px)`,
                        
                    };

                    // ?????????
                    // let targetRadius = $scope.poi[0].iconRadius
                    // let targetLocation ={
                    //     x:new_position.left,
                    //     y:new_position.top
                    // }

                    // let mapViewGeo = $scope.mapViewGeo
                    // let extraLength = 0;
                    // if(checkIsTargetInCircle(targetRadius, targetLocation, mapViewGeo, extraLength)){
                    //     $scope.poi[i].display = true;
                    // }else{
                    //     $scope.poi[i].display = false;
                    // }
                    
                }
            }
        },true);

        

        







    }
});