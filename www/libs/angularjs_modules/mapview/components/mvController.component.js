"use strict";
(function(angular) {
    angular.
    module('mvController').
    component('mvController', { 
        templateUrl: '/static/libs/angularjs_modules/mapview/templates/mvController.html',
        controller: function ($scope, $element, $attrs, $restApiReq) {
            $scope.mapview = $scope.$parent
            let event_onMVControllerInit = new CustomEvent(`onMVControllerInit-${$scope.mapview.$id}`,{detail : $scope.$id});
            this.$onInit = function() {
                window.dispatchEvent(event_onMVControllerInit);
                if($scope.mapview.isBtnzoomOn==false){
                    $element.find(".map-view-control-panel-zoom").css("display","none");
                }
            };
            $scope.onZoomIn = function (ev) {
                console.log("zoom in")
                let scale = $scope.$parent.camera.scale * 1.1;
                let opt = {
                    camera: {
                        scale: scale
                    }
                };
                $scope.$parent.setup(opt);
            };
            $scope.onZoomOut = function (ev) {
                console.log("zoom out")
                let scale = $scope.$parent.camera.scale / 1.1;
                let opt = {
                    camera: {
                        scale: scale
                    }
                };
                $scope.$parent.setup(opt);
            };
            
            $scope.touch_start = {
                camera: {
                    x: 0.0,
                    y: 0.0,
                    scale: 1.0,
                    rotate: 0.0
                },
                center: {
                    x: 0.0,
                    y: 0.0
                },
                rotate: 0.0
            };

            
        }
    });

})(window.angular);



