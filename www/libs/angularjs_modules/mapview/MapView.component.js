"use strict";
let map_rest_server_ip = $("#serverIp").val()
let map_rest_server_port = $("#serverPort").val()

const MAP_FILE_URL = `http://${map_rest_server_ip}:${map_rest_server_port}/rest/map/file`;
const MAP_VIEW_MODE_STATIC = 0;
const MAP_VIEW_MODE_DYNAMIC = 1;
const MAP_VIEW_MODE_CONTROLLER = 2;
const MAP_VIEW_DRAW_INTERVAL = 50; // ms

(function(angular) {
    angular.
    module('mapView').
    component('mapView', {  
        templateUrl: '/static/libs/angularjs_modules/mapview/MapView.html',
        controller: function ($scope, $element, $attrs) {
            
            $scope.$root.mapview_scope = $scope
            $scope.maviewOpt = $attrs
            $scope.component_scope ={}
            $scope.element = $element;
            $scope.drawInterval;
            $scope.option = {
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
                // offset: { // 판교 4f
                //     x: -101.11,
                //     y: -103.28
                // },
                // offset: { // ttower
                //     x: -99.5625,
                //     y: -98.7453
                // },
                // offset: { // 판교 1f new
                //     x: -99.5625,
                //     y: -98.7453
                // },
                offset: { // 판교 1f old
                    x: -100.0,
                    y: -100.0
                },
                // offset: { // 마산 1f
                //     x: -100.0,
                //     y: -100.0
                // },
                resolution: 0.05,
                size: {
                    width: 4000.0,
                    height: 4000.0
                },
                enable: {
                    pan: true
                },
                map: {
                    path: MAP_FILE_URL
                },
                canvas:{
                    width : 0.0,
                    height :0.0
                }
            };
            $scope.camera=$scope.option.camera;
            $scope.is_refresh = false;
            $scope.is_followRobotView = {
                state: false,
                target: 0
            };

            switch($attrs.mode){
                default:
                    $scope.mapview_mode = MAP_VIEW_MODE_DYNAMIC;
                    console.log("MAP_VIEW_MODE_DYNAMIC : ",$scope.$id);
                    break;
                case "static":
                    $scope.mapview_mode = MAP_VIEW_MODE_STATIC;
                    console.log("MAP_VIEW_MODE_STATIC : ",$scope.$id);
                    break;
                case "dynamic":
                    $scope.mapview_mode = MAP_VIEW_MODE_DYNAMIC;
                    console.log("MAP_VIEW_MODE_DYNAMIC : ",$scope.$id);
                    break;
                case "controller":
                    $scope.mapview_mode = MAP_VIEW_MODE_CONTROLLER;
                    console.log("MAP_VIEW_MODE_CONTROLLER : ",$scope.$id);
                    break;
            }
            
            if($attrs.width){
                $element.find(".mapview-case").width($attrs.width);
            }else{
                $element.find(".mapview-case").css("width","100%");
            }
            if($attrs.height){
                $element.find(".mapview-case").height($attrs.height);
            }else{
                $element.find(".mapview-case").height("100%");
            }
            if($attrs.title && $attrs.title=="false"){
                $element.find(".mapview-component-title").css("height",0);
                $element.find(".mapview-component-title").css("border","none");
            }
            
            if($attrs.btnzoom && $attrs.btnzoom=="false"){
                
                $scope.isBtnzoomOn = false
            }

            // get and set map view size
            $scope.viewSize = {
                width: $element.find(".mapview-case").width(),
                height: $element.find(".mapview-case").height()
            }
            $scope.option.canvas = $scope.viewSize;

            window.addEventListener("zoneChanged", function(e) {
                // 존 바뀌면 맵 바꾸고 메타 데이터 변경하고 option업데이트 해야함
                // 작업중
                $scope.setup($scope.option)
            });
            window.addEventListener(`onMVControllerInit-${$scope.$id}`, function(event) {
                $scope.component_scope['mvController'] = getScopeByScopeId(event.detail,"map-view-control-panel");
                $scope.control_panel = $element.find(".map-view-control-panel");
                window.dispatchEvent(new Event('resize'));
            });
            window.addEventListener(`onMVMapInit-${$scope.$id}`, function(event) {
                $scope.component_scope['mvMap'] = getScopeByScopeId(event.detail,"map-view-canvas");
                $scope.canvas = $element.find("mv-map").find("canvas");
                $scope.offset = $($scope.canvas).offset();
                $scope.canvas[0].width = $scope.viewSize.width;
                $scope.canvas[0].height = $scope.viewSize.height;
                $scope.drawIntervalStart();
            });
            window.addEventListener(`onMVRobotInit-${$scope.$id}`, function(event) {
                $scope.component_scope['mvRobot'] = getScopeByScopeId(event.detail,"robot-icon-case");
            });
            window.addEventListener(`onMVMarkerInit-${$scope.$id}`, function(event) {
                $scope.component_scope['mvMarker'] = getScopeByScopeId(event.detail,"marker-case");
                
            });
            window.addEventListener(`onMVPointInit-${$scope.$id}`, function(event) {
                $scope.component_scope['mvPoint'] = getScopeByScopeId(event.detail,"points-canvas");
                $scope.canvas_points = $element.find("mv-point").find("canvas");
                $scope.canvas_points[0].width = $scope.viewSize.width;
                $scope.canvas_points[0].height = $scope.viewSize.height;
                
            });
            
            $(window).resize(function () {
                if($scope.canvas){
                    $scope.offset = $($scope.canvas).offset();
                    $scope.viewSize = {}
                    if($scope.control_panel){
                        $scope.viewSize = {
                            width: $scope.control_panel.width(),
                            height: $scope.control_panel.height()
                        }
                    }
                    $scope.option.canvas = $scope.viewSize;
                                    
                    $scope.canvas[0].width = $scope.viewSize.width;
                    $scope.canvas[0].height = $scope.viewSize.height;
                    $scope.canvas_points[0].width = $scope.viewSize.width;
                    $scope.canvas_points[0].height = $scope.viewSize.height;

                    $scope.is_refresh = true;
                    $scope.component_scope['mvMap'][0].draw();
                }
            });

            this.$onInit = function() {
                let event_onMapViewInit = new CustomEvent("onMapViewInit");
                window.dispatchEvent(event_onMapViewInit);
                if($scope.$root.isZoneReady){
                    $scope.setup($scope.option)
                }
            };
            
            function getScopeByScopeId(scopeId, className){
                return Array.from(document.querySelectorAll(`.${className}`))
                .map(el => angular.element(el).scope())
                .filter(scope =>scope.$id == scopeId)
            }

            $scope.drawIntervalStart = function () {
                $scope.drawInterval = setInterval(function(){
                    $scope.$apply(function() {
                        $scope.component_scope['mvMap'][0].draw();
                    });
                },MAP_VIEW_DRAW_INTERVAL)
            };
            $scope.drawIntervalStop = function () {
                clearInterval($scope.drawInterval);
            };

            $scope.takeTargetView = function (opt) {
                $scope.setup(opt)
                $scope.is_refresh = true;
                $scope.component_scope['mvMap'][0].draw();
            };

            $scope.followRobotViewOn = function (index) {
                $scope.is_followRobotView = {
                    state: true,
                    target: index
                };
            };
            $scope.followRobotViewOff = function (index) {
                $scope.is_followRobotView = {
                    state: false,
                    target: index
                };
            };

            $scope.setup = function (opt) {
                if (!opt) return;
    
                $scope.is_refresh = true;
    
                //
                if (opt.enable) {
                    if (opt.enable.pan != null) $scope.option.enable.pan = opt.enable.pan;
                }
    
                //
                if (opt.camera) {
                    if (opt.camera.x != null)
                        $scope.option.camera.x = parseFloat(opt.camera.x);
                    if (opt.camera.y != null)
                        $scope.option.camera.y = parseFloat(opt.camera.y);
                    if (opt.camera.scale != null)
                        $scope.option.camera.scale = parseFloat(opt.camera.scale);
                    if (opt.camera.rotate != null)
                        $scope.option.camera.rotate = parseFloat(opt.camera.rotate);
                }
    
                //
                if (opt.resolution != null)
                    $scope.option.resolution = parseFloat(opt.resolution);
    
                //
                if (opt.offset) {
                    if (opt.offset.x != null)
                        $scope.option.offset.x = parseFloat(opt.offset.x);
                    if (opt.offset.y != null)
                        $scope.option.offset.y = parseFloat(opt.offset.y);
                }
    
                //
                if (opt.size) {
                    if (opt.size.width != null)
                        $scope.option.size.width = parseInt(opt.size.width);
                    if (opt.size.height != null)
                        $scope.option.size.height = parseInt(opt.size.height);
                }
    
                //
                if (opt.map) {
                    if (opt.map.path != null) {
                        $scope.option.map.path = opt.map.path;
                    }
                }
                
            };
            
            $scope.getPose = function (position) {
                let scale = $scope.option.camera.scale;
                let cx = $scope.viewSize.width / 2;
                let cy = $scope.viewSize.height / 2;
                // console.log(cx,cy);
                let dx = position.left - cx;
                let dy = cy - position.top;
                let rad = ($scope.option.camera.rotate / 180) * Math.PI;
                let x = Math.cos(rad) * dx - Math.sin(rad) * dy;
                let y = Math.sin(rad) * dx + Math.cos(rad) * dy;
                let x1 = (x * $scope.option.resolution) / scale + $scope.option.camera.x;
                let y1 = (y * $scope.option.resolution) / scale + $scope.option.camera.y;
                // console.log(x1, y1, this.$scope.option.camera);
                return {
                    x: x1,
                    y: y1
                };
            };

            $scope.convertPose = function (pose) {
                let scale = $scope.option.camera.scale;
                let left = (pose.x - $scope.option.offset.x) / $scope.option.resolution;
                let top =
                    $scope.option.size.height +
                    (-pose.y + $scope.option.offset.y) / $scope.option.resolution;
                let x = left * scale;
                let y = top * scale;
                let rad = ($scope.option.camera.rotate / 180) * Math.PI;
                let x1 = Math.cos(rad) * x - Math.sin(rad) * y;
                let y1 = Math.sin(rad) * x + Math.cos(rad) * y;

                return {
                    left: x1,
                    top: y1
                };
            };
    
            $scope.getUIPosition = function (pose) {
                var p0 = $scope.convertPose({
                    x: $scope.option.camera.x,
                    y: $scope.option.camera.y
                });
                var p1 = $scope.convertPose(pose);
                var x = p1.left - p0.left + $scope.viewSize.width / 2;
                var y = p1.top - p0.top + $scope.viewSize.height / 2;
                return {
                    left: x,
                    top: y
                };
            };

            $scope.kezitest = function(){
                console.log("###################################")
            }
        }
    });
})(window.angular);

