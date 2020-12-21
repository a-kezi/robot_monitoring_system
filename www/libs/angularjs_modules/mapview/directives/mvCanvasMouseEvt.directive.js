angular.module("mvController").directive('canvasMouseEvt', ['$parse', '$rootScope', '$compile', '$exceptionHandler',
    function ($parse, $rootScope, $compile) {
        return {
            restrict: 'A', // html tag의 attribute로서 속성 설정
            link: function ($scope, $element) {
                // console.log("--controller----mouse directive",$scope.$id);
                $element.on("wheel",function(event){
                    // console.log("wheel event");
                    // $scope.canvas.addEventListener('wheel', function(event){
                    // console.log(_camera);
                    event.originalEvent.preventDefault();
                    let scale;
                    let x;
                    let y;
                    // let centerV = new Vector($scope.canvas.width / 2, $scope.canvas.height / 2);
                    // let mousePointX = parseInt(event.originalEvent.offsetX);
                    // let mousePointY = parseInt(event.originalEvent.offsetY);
                    // let mousePointV = new Vector(mousePointX, mousePointY);
            
                    if (event.originalEvent.deltaY < 0) {//scroll up, getting bigger
                        // console.log("## wheel event: zoom-in");
                        if ($scope.$parent.camera.scale >= 100) {
                            // console.log("## maximum size");
                            scale = $scope.$parent.camera.scale;
                        } else {
                            scale = $scope.$parent.camera.scale * 1.05;
            
                            // var A =mousePointV.subtract(centerV);
                            // var B =A.multiply(1.05);
                            // var C = B.subtract(A);
                            // x=_camera.x+C.x/(1/_option.resolution)*scale;
                            // y=_camera.y-C.y/((1/_option.resolution)*scale);
                            
                            var pose = $scope.$parent.getPose({
                                left: event.originalEvent.offsetX,
                                top: event.originalEvent.offsetY
                            })
            
                            x = $scope.$parent.camera.x - ($scope.$parent.camera.x - pose.x) * 5/105
                            y = $scope.$parent.camera.y - ($scope.$parent.camera.y - pose.y) * 5/105
                        }
                    } else {
                        // //scroll down, getting smaller
                        // console.log("wheel event: zoom-out");
                        if ($scope.$parent.camera.scale <= 0.001) {
                            // console.log("## maximum size");
                            scale = $scope.$parent.camera.scale;
                        } else {
                            scale = $scope.$parent.camera.scale / 1.05;
                            
                            // var A =mousePointV.subtract(centerV);
                            // var B =A.divide(1.05);
                            // var C = A.subtract(B);
                            // x=_camera.x-C.x/((1/_option.resolution)*scale);
                            // y=_camera.y+C.y/((1/_option.resolution)*scale);
            
                            var pose = $scope.$parent.getPose({
                                left: event.originalEvent.offsetX,
                                top: event.originalEvent.offsetY
                            })
            
                            x = $scope.$parent.camera.x + ($scope.$parent.camera.x - pose.x) * 5/100
                            y = $scope.$parent.camera.y + ($scope.$parent.camera.y - pose.y) * 5/100
                        }
                    }
            
                    let opt = {
                        camera: {
                            scale: scale,
                            x: x,
                            y: y
                        }
                    };
                    
                    $scope.$parent.setup(opt);
                    
                })
            },
            
        }
    }
])

