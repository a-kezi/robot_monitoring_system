"use strict";
angular.
module('mvInfoBox').
component('mvInfoBox', {  
    templateUrl: '/static/libs/angularjs_modules/mapview/templates/mvInfoBox.html',
    controller: function ($scope, $element, $attrs) {
        $scope.mvMap = $scope.$parent;
        var isInfoBoxListLoaded = false;
        
        this.$onInit = function() {
            // console.log("info #############")
        };
        $scope.onclick = function(index){
            console.log(index);
        }

        
        $.getJSON(`http://${server_ip}:${server_port}/rest/info`, function (data) {
            // console.log(data);
            $scope.mvMap.infoBox = data;

            for(let i =0;i<$scope.mvMap.infoBox.length;i++){

                let new_position = $scope.mvMap.getUIPosition($scope.mvMap.infoBox[i].pose.position)

                $scope.mvMap.infoBox[i].boxPosition = {
                    'z-index': '5',
                    'transform': `translate(${new_position.left.toFixed(2)}px,${new_position.top.toFixed(2)}px)`,
                };

                // $scope.mvMap.poi[i].boxStyle={
                //     'position': 'absolute',
                //     'transform': 'translate(0%,-100%)',
                //     'height':`${$scope.mvMap.poi[i].iconSize.height}px`,
                //     'width':`${$scope.mvMap.poi[i].iconSize.width}px`
                // }
            }




            // $element.append(`
                // <tail-info-box>TEST KEZI</h1>
                // <div class="rec-bubble" >
                //     <div class="" >
                    
                //     <p class="label">
                //         kezitailkezi <br>
                //         tailkezi tailkezi
                //     </p>
                // </div>
                // `)

            
            isInfoBoxListLoaded = true;
        });
        

        

        $scope.mvMap.$watch("option.camera", function (newValue, oldValue) {
            if($scope.$id==30){
                // console.log("camera");
            }
            if(isInfoBoxListLoaded){
                for(let i =0;i<$scope.mvMap.infoBox.length;i++){

                    let new_position = $scope.mvMap.getUIPosition($scope.mvMap.infoBox[i].pose.position)
    
                    $scope.mvMap.infoBox[i].boxPosition = {
                        'z-index': '5',
                        'transform': `translate(${new_position.left.toFixed(2)}px,${new_position.top.toFixed(2)}px)`,
                    };
    
                    // $scope.mvMap.poi[i].boxStyle={
                    //     'position': 'absolute',
                    //     'transform': 'translate(0%,-100%)',
                    //     'height':`${$scope.mvMap.poi[i].iconSize.height}px`,
                    //     'width':`${$scope.mvMap.poi[i].iconSize.width}px`
                    // }
                }
                
            }
           
        },true);


    }
});