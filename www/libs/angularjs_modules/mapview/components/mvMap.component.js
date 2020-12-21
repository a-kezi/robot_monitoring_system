"use strict";
// const MAP_FILE_URL = `http://${server_ip}:${server_port}/rest/map/file`;

(function(angular) {
    angular.
    module('mvMap').
    component('mvMap', {  
        templateUrl: '/static/libs/angularjs_modules/mapview/templates/mvMap.html',
        controller: function ($scope, $element, $attrs) {
            $scope.mapview = $scope.$parent;
            $scope.context = $element.find("canvas")[0].getContext("2d");
            $scope.imgObj = null;
            $scope.context.setTransform(1, 0, 0, 1, 0, 0); //
            

            this.$onInit = function() {
                let event_onMVMapInit = new CustomEvent(`onMVMapInit-${$scope.mapview.$id}`,{detail : $scope.$id});
                window.dispatchEvent(event_onMVMapInit);
            };
            
            $scope.draw = function () {
                try {
                    if (!$scope.$parent.is_refresh) return;
                    $scope.$parent.is_refresh = false;
    
                    let scale = $scope.$parent.option.camera.scale;
                    let width = scale * $scope.$parent.option.size.width;
                    let height = scale * $scope.$parent.option.size.height;
    
                    if (!$scope.$parent.option.map.path) return;
    
                    // $scope.context.restore();
                    let p = $scope.$parent.convertPose({
                        x: $scope.$parent.option.camera.x,
                        y: $scope.$parent.option.camera.y
                    });
                    
                    let x = -p.left + $scope.$parent.canvas.width() / 2;
                    let y = -p.top + $scope.$parent.canvas.height() / 2;
                    
                    let rad = ($scope.$parent.option.camera.rotate / 180) * Math.PI;

                    if (!$scope.imgObj || $scope.imgObj.src != $scope.$parent.option.map.path) {
                        $scope.imgLoad();
                        let evt = new CustomEvent("map_loading_started");
                        $scope.$parent.canvas[0].dispatchEvent(evt);
                    } else {
                        $scope.context.setTransform(1, 0, 0, 1, 0, 0);
                        $scope.context.clearRect(0, 0, $scope.$parent.canvas.width(), $scope.$parent.canvas.height());
                        $scope.context.translate(x, y);
                        $scope.context.rotate(rad);
                        
                        $scope.context.drawImage($scope.imgObj, 0, 0, width, height);
                        let evt = new CustomEvent("map_draw_completed");
                        $scope.$parent.canvas[0].dispatchEvent(evt);
                    }
                } catch (e) {
                    console.log(e);
                }
            }       
    
            $scope.imgLoad = function() {
                                
                let scale = $scope.$parent.option.camera.scale;
                let width = scale * $scope.$parent.option.size.width;
                let height = scale * $scope.$parent.option.size.height;

                if (!$scope.$parent.option.map.path) return;
                // $scope.context.restore();
                let p = $scope.$parent.convertPose({
                    x: $scope.$parent.option.camera.x,
                    y: $scope.$parent.option.camera.y
                });
                                
                let x = -p.left + $scope.$parent.canvas.width() / 2;
                let y = -p.top + $scope.$parent.canvas.height() / 2;
                let rad = ($scope.$parent.option.camera.rotate / 180) * Math.PI;
                $scope.imgObj = new Image();
                $scope.imgObj.addEventListener("load", function (e) {
                    $scope.context.setTransform(1, 0, 0, 1, 0, 0);
                    $scope.context.clearRect(0, 0, $scope.$parent.canvas.width(), $scope.$parent.canvas.height());
                    $scope.context.translate(x, y);
                    
                    $scope.context.rotate(rad);
                    $scope.context.drawImage($scope.imgObj, 0, 0, width, height);
                    let evt = new CustomEvent("map_load_completed");
                    $scope.$parent.canvas[0].dispatchEvent(evt);
                }, false);
                
                // console.log($scope.$parent.option.map.path);
                $scope.imgObj.src = $scope.$parent.option.map.path;
                // $scope.imgObj.src = `http://330203e0e19f.ngrok.io/rest/map/file`;

                // 전체경로로 업데이트 해주기
                $scope.$parent.option.map.path = $scope.imgObj.src;
            }

        }
    });
})(window.angular);

