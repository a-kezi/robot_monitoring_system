"use strict";
angular.
module('mvMenuBox').
component('mvMenuBox', {  
    templateUrl: '/static/libs/angularjs_modules/mapview/templates/mvMenuBox.html',
    controller: function ($scope, $element, $attrs) {
        $scope.mvMap = $scope.$parent;
        $scope.mvMap.menuBox = [];
        

        // menu 생성 로직
        // $scope.mvMap.mapElement.bind('mousemove',function(ev){
        //     console.log(ev);
        //     console.log($scope.mvMap.getPose({
        //         left:ev.layerX,
        //         top:ev.layerY
        //     }));
        // })

        

            
        
        
        this.$onInit = function() {
            // console.log("info #############")
        };

        

        $scope.mvMap.$watch("option.camera", function (newValue, oldValue) {
            $scope.mvMap.menuBox = [];
        },true);

        $scope.mvMap.$watch("menuBox", function (newValue, oldValue) {
            if($scope.mvMap.menuBox.length!=0){
                let new_position = $scope.mvMap.getUIPosition($scope.mvMap.menuBox[0].pose.position)
                $scope.mvMap.menuBox[0].boxPosition = {
                    'z-index': '5',
                    'transform': `translate(${new_position.left.toFixed(2)}px,${new_position.top.toFixed(2)}px)`,
                };
            }
        },true);

    }
});