angular.
module("cameraView").
directive('dragItem', ['$parse', '$rootScope', '$compile', 
    function() {
        return {
            restrict: 'A',
            link: function ($scope, $element, $attr, $controller) {

                $element.bind('dragstart', function(evt){
                    console.log("drag started");
                    let element_id = $element.attr('id');
                    let camera_index = element_id.substring(
                        element_id.indexOf(".")+1, 
                        element_id.length);
                    let camera = $scope.cameraList[Number(camera_index)]
                    let data = {
                        camera:camera
                    }
                    evt.originalEvent.dataTransfer.setData('text/plain', JSON.stringify(data));
                })
            }
        }
    }
]);




