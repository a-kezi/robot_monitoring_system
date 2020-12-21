angular.
module("cameraView").
directive('dropItem', ['$parse', '$rootScope', '$compile', 
    function() {
        return {
            restrict: 'A',
            link: function ($scope, $element, $attr, $controller) {
                $scope.dragoverstate = false;

                $element.on('dragover', function(evt){
                    // let id = $element.attr
                    evt.preventDefault();  
                    evt.stopPropagation();

                    if(!$scope.dragoverstate){
                        console.log("drag over");    
                        $element.css({
                            'border':'solid var(--ui-red) 6px',
                            'border-radius': '6px'
                        });

                    }
                    $scope.dragoverstate = true;
                })

                $element.bind('drop', function(evt){
                    console.log("drop");
                    evt.preventDefault();  
                    evt.stopPropagation();
                    $scope.dragoverstate = false;
                    $element.css({
                        'border':'none'
                    });

                    let data = JSON.parse(evt.originalEvent.dataTransfer.getData('text/plain'));
                    let dropitem_id = $element.attr('id');
                    let player;
                    $scope.$root.dataShare.playerInfo[dropitem_id].state = false
                    $scope.$root.dataShare.playerInfo[dropitem_id].camera = undefined
                    $scope.$root.dataShare.playerInfo[dropitem_id].player = undefined
                    
                    switch(dropitem_id){
                        default:
                            break;
                        case "cameraone_1":
                            $scope.cameraOne_name = "["+data.camera.position+"]";
                            player = document.getElementById('videoOne-1');
                            
                            break;
                        case "camerafour_1":
                            $scope.cameraFour_name1 = "["+data.camera.position+"]";
                            player = document.getElementById('videoFour-1');
                            break;
                        case "camerafour_2":
                            $scope.cameraFour_name2 = "["+data.camera.position+"]";
                            player = document.getElementById('videoFour-2');
                            break;
                        case "camerafour_3":
                            $scope.cameraFour_name3 = "["+data.camera.position+"]";
                            player = document.getElementById('videoFour-3');
                            break;
                        case "camerafour_4":
                            $scope.cameraFour_name4 = "["+data.camera.position+"]";
                            player = document.getElementById('videoFour-4');
                            break;
                    }
                    $scope.$root.dataShare.playerInfo[dropitem_id] = {
                        state: true,
                        camera: data.camera,
                        player: player
                    }
                    $scope.startVideo(dropitem_id)
                    
                })
                $scope.startVideo = function(dropitem_id){
                    console.log("## start video : ", dropitem_id)
                    let rootPlayerInfo = $scope.$root.dataShare.playerInfo[dropitem_id]
                    let camera_data = rootPlayerInfo.camera
                    let reqUrl = `http://${camera_rest_ip}:${camera_rest_port}/rest/camera/get/url?id=${camera_data.id}&robottype=${camera_data.robot}`
                    switch(camera_data.type){
                        case "ip":
                            reqUrl = reqUrl + "&type=ip"
                            break;
                        case "usb":
                            reqUrl = reqUrl + "&type=usb"
                            break;
                        default:
                            break;
                    }
                    $.getJSON(reqUrl, function (data) {
                        console.log(data)
                        if(data.state==true){
                            rootPlayerInfo.player.setAttribute('src',data.url);
                            let retry_id = dropitem_id
                            let playerInfo = $scope.$root.dataShare.playerInfo
                            setTimeout(function(){
                                console.log(
                                    "## camera reconnection : ", 
                                    retry_id)
                                if(playerInfo[retry_id].state==true){
                                    $scope.startVideo(retry_id)
                                }
                            },3600000)
                        }else{
                            alert("카메라 url을 받을 수 없습니다. 네트워크 환경을 확인하세요.")
                        }
                    })
                }
                $element.bind('dragleave', function(evt){
                    console.log("drag leave");
                    evt.preventDefault();  
                    evt.stopPropagation();
                    if($scope.dragoverstate){
                        $element.css({
                            'border':'none'
                        });
                        $scope.dragoverstate = false;

                    }
                })

                
            },
        }
    }
]);




