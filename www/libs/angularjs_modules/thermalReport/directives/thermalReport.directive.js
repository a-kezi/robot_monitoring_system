angular.module("thermalReport").directive('nonamed', ['$parse', '$rootScope', '$compile', 
    function() {
        return {
            link: function (scope, element) {
                console.log("TESTS");
                

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




