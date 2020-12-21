angular.module("mvLine").directive('mvX1', 
    function() {
        return function(scope, element, attrs){
            scope.$watch(attrs.mvX1, function(value) {
                element.attr('x1', value);
            });
        }
    }
);
angular.module("mvLine").directive('mvY1', 
    function() {
        return function(scope, element, attrs){
            scope.$watch(attrs.mvY1, function(value) {
                // console.log(element);
                element.attr('y1', value);
            });
        }
    }
);
angular.module("mvLine").directive('mvX2', 
    function() {
        return function(scope, element, attrs){
            scope.$watch(attrs.mvX2, function(value) {
                element.attr('x2', value);
            });
        }
    }
);
angular.module("mvLine").directive('mvY2', 
    function() {
        return function(scope, element, attrs){
            scope.$watch(attrs.mvY2, function(value) {
                element.attr('y2', value);
            });
        }
    }
);
angular.module("mvLine").directive('mvSvgWidth', 
    function() {
        return function(scope, element, attrs){
            scope.$watch(attrs.mvSvgWidth, function(value) {
                element.attr('width', value);
            });
        }
    }
);
angular.module("mvLine").directive('mvSvgHeight', 
    function() {
        return function(scope, element, attrs){
            scope.$watch(attrs.mvSvgHeight, function(value) {
                element.attr('height', value);
            });
        }
    }
);











