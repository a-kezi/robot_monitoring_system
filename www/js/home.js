'use strict'
dashboardApp.controller('homeCtrl', function ($scope, $restApiReq) {
    /*
        addEventListener
    */
    window.addEventListener("siteChanged", function(e) {
        closePageLoadingMask();
        $scope.$root.isZoneReady = false;
        $scope.$root.isRobotReady = false;
        $scope.$root.isSubListReady = false;
    });
});
