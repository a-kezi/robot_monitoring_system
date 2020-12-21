angular.module("mvController").directive('canvasTouchEvt', ['$parse', '$rootScope', '$compile', 
    function ($parse, $rootScope, $compile) {
        return {
            restrict: 'A', // html tag의 attribute로서 속성 설정
            link: function ($scope, $element) {
                // console.log("-----touch directive",$scope.$id);
                let touchEventLib = new Hammer.Manager($element[0]);
                let touch_start = $scope.touch_start
                let camera = $scope.$parent.camera
                
                touchEventLib.add(
                    new Hammer.Tap({
                        event: "singletap"
                    })
                );
                touchEventLib.add(
                    new Hammer.Pan({
                        threshold: 0,
                        pointers: 0
                    })
                );
                touchEventLib.add(
                    new Hammer.Rotate({
                        threshold: 10
                    })
                );
                touchEventLib.add(
                    new Hammer.Pinch({
                        threshold: 0.05
                    })
                );
                
                // add events
                touchEventLib.on("singletap",onSingleTap);
                touchEventLib.on("panstart pinchstart rotatestart",onStart);
                touchEventLib.on("panmove pinchmove rotatemove",onMove);
                // touchEventLib.on("panend",onPanEnd);
                // touchEventLib.on("pinchend",onPinchEnd);
                touchEventLib.on("rotateend",onRotateEnd);

                // event handlers
                function onSingleTap(event){
                    // console.log("singletap");
                    // $scope.offset = $($scope.canvas).offset();
                }

                function onPanEnd(event){
                    // console.log("panend");
                }

                function onPinchEnd(event){
                    // console.log("onPinchEnd");
                }

                function onStart(event){
                    // console.log("onStart");
                    // $scope.offset = $($scope.canvas).offset();
                    
                    touch_start.camera.x = camera.x;
                    touch_start.camera.y = camera.y;
                    touch_start.center = {
                        x: event.center.x - $scope.$parent.offset.left,
                        y: event.center.y - $scope.$parent.offset.top
                    };
                    touch_start.camera.scale = $scope.$parent.camera.scale;
                    touch_start.camera.rotate = $scope.$parent.camera.rotate;
                    
                    if (event.pointers.length > 1) {
                        touch_start.rotate = event.rotation;
                    }
                }

                function onMove(event){
                    // console.log("onMove");
                    if (!$scope.$parent.option.enable.pan) return false;
                    if (event.pointers.length > 1) {
                        // console.log("----e.rotation ", event.rotation);
                        if (!touch_start.rotate) touch_start.rotate = event.rotation;
                    } else {
                        touch_start.rotate = null;
                    }
                    //console.log(touch_start.rotate);
                    // console.log("----e.scale ",event.scale);
                    let scale = touch_start.camera.scale * event.scale;
                    let rotate = touch_start.camera.rotate;
                    if (touch_start.rotate)
                        rotate =
                            touch_start.camera.rotate +
                            event.rotation -
                            touch_start.rotate;
                    let rad = (rotate / 180) * Math.PI;
                    let distance = Math.sqrt(
                        event.deltaX * event.deltaX + event.deltaY * event.deltaY
                    );
                    let rad2 = Math.atan2(event.deltaY, event.deltaX);
                    let dx = distance * Math.cos(-rad + rad2);
                    let dy = distance * Math.sin(-rad + rad2);
                    let x =
                        touch_start.camera.x - (dx * $scope.$parent.option.resolution) / scale;
                    let y =
                        touch_start.camera.y + (dy * $scope.$parent.option.resolution) / scale;
                    let opt = {
                        camera: {
                            scale: scale,
                            x: x,
                            y: y,
                            rotate: rotate
                        }
                    };
                    $scope.$parent.setup(opt);
                }

                function onRotateEnd(event){
                    // console.log("rotateend");
                    touch_start.camera.rotate = $scope.$parent.camera.rotate;
                    touch_start.rotate = null;
                }

            },
        }
    }
])

