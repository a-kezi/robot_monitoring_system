angular.module("mapView").directive('mvRepeat', ['$parse', '$rootScope', '$compile', 
    function() {
        return {
            link: function (scope, element) {
                

                // element.css(
                //     'pointer-events','auto'
                // );
              

                // on the last ng regpeat
                if(scope.$last){
                    // $('img').bind('click', function(evt){
                    //     console.log("kezit");
                    //     console.log(evt);
                    // })
                    // element.bind('click', function(evt){
                    //     console.log("kezit");
                    //     console.log(evt);
                    // });
                }
            },
        }
    }
]);



