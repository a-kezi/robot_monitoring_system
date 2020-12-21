"use strict";
let report_rest_ip = $("#serverIp").val()
let report_rest_port = $("#serverPort").val()

const REPORT_GET_FEED_API_URL = `http://${report_rest_ip}:${report_rest_port}/rest/reportfeed/list`;
const REPORT_GET_TH_IMG_API_URL = `http://${report_rest_ip}:${report_rest_port}/rest/image/srv_res/thumbnail`;
const REPORT_GET_OR_IMG_API_URL = `http://${report_rest_ip}:${report_rest_port}/rest/image/srv_res/origin`;
const REPORT_GET_THERMAL_IMG_API_URL = `http://${report_rest_ip}:${report_rest_port}/rest/image/srv_res/thermal`;
const REPORT_FEED_REQ_LIMIT = 10;

angular.
module('thermalReport').
component('thermalReport', {  
    templateUrl: '/static/libs/angularjs_modules/thermalReport/templates/thermalReport.html',
    controller: function ($scope, $element, $attrs, $restApiReq) {
        $scope.isFilterIssueCheck=false;

        this.$onInit = function() {
            $scope.initDatepicker();
            $scope.feed = []; // msg feed
            $scope.scrollPos = 0; // 현재 스크롤 pos
            $scope.selectedFeed = {}; // 선택한 피드
            $scope.selectedDoc; // 선택한 피드 document
            $scope.serviceTypeName = "event_temperature";
            $scope.thum_img_url = REPORT_GET_TH_IMG_API_URL;
            $scope.origin_img_url = REPORT_GET_OR_IMG_API_URL;
            $scope.thermal_img_url = REPORT_GET_THERMAL_IMG_API_URL;
            

            $(".report-thermal-feed-body").height($(".report-feed-case").height()-100);
        }

        $(window).resize(function () {
            $(".report-thermal-feed-body").height($(".report-feed-case").height()-100);
        });

        window.addEventListener("zoneChanged", function(e) {
            $scope.feed = [];
        });

        $scope.selectFeed = function(index, $event){
            $scope.selectedFeed = $scope.feed[index];

            if($scope.selectedFeed!=undefined){
                let mvMarkerScope = angular.element($element.find(".activity-feed-static-mv").find(".marker-case")[0]).scope();
                mvMarkerScope.clearMark();
                mvMarkerScope.addMark($scope.selectedFeed.location.pose);

                let opt = {
                    camera: {
                        scale: 1,
                        x: $scope.selectedFeed.location.pose.position.x,
                        y: $scope.selectedFeed.location.pose.position.y
                    }
                };
                
                let mapviewScope = angular.element($element.find(".activity-feed-static-mv").find(".content-wrapper")[0]).scope();
                mapviewScope.takeTargetView(opt);
            }
        }

        $scope.getFormatDate = function(timestamp){
            let date = new Date(timestamp);
            let year = date.getFullYear();
            let month = (1 + date.getMonth());
            month = month >= 10 ? month : '0' + month;
            let day = date.getDate();
            day = day >= 10 ? day : '0' + day;
            return  year+'.'+month + '.' + day;
        }
        $scope.getRobotName = function(id){
            let isGetName =false;
            let name = "";
            $scope.$root.dataShare.robotlist.some(item=>{
                // console.log(item.id);
                if(item.id == id){
                    name = item.name;
                    isGetName =true;
                }
                return isGetName
            })
            return name
        }
        $scope.getRobotType = function(id){
            let isGetType =false;
            let type = "";
            $scope.$root.dataShare.robotlist.some(item=>{
                if(item.id == id){
                    type = item.type;
                    isGetType =true;
                }
                return isGetType
            })
            return type
        }
        $scope.getWholeDateFormat = function(timestamp){
            var date = new Date(timestamp);
            
            var hour = date.getHours();
            hour = hour < 10 ? "0" + hour : hour;
            var min = date.getMinutes();
            min = min < 10 ? "0" + min : min;
            var sec = date.getSeconds();
            sec = sec < 10 ? "0" + sec : sec;

            var time;
            if(hour>12){
                time = `오후 ${hour-12}:${min}:${sec}`;
            }else{
                time = `오전 ${hour}:${min}:${sec}`;
            }

            // var time = `${hour}:${min}:${sec}`;

            var year = date.getFullYear();
            var month = (1 + date.getMonth());
            month = month >= 10 ? month : '0' + month;
            var day = date.getDate();
            day = day >= 10 ? day : '0' + day;

            return `${time}(${year}년 ${month}월 ${day}일)`;
        }
        $scope.getFormatTime = function(timestamp){
            let date = new Date(timestamp);
            let hour = date.getHours();
            hour = hour < 10 ? "0" + hour : hour;
            let min = date.getMinutes();
            min = min < 10 ? "0" + min : min;
            let sec = date.getSeconds();
            sec = sec < 10 ? "0" + sec : sec;
            return  hour + ':' + min+':'+sec; 
        }

        $scope.feedQuery = function(start, end){
            $scope.offsetNum=0;
            $scope.feed = [];
            getQueryOption(start, end);
        }

        function getQueryOption(start, end){
            componentLoadingMask("report-thermal-scrollPage","loading_thrabber_s_ropti.svg");
            let reqInfo = {
                url: REPORT_GET_FEED_API_URL,
                type: 'GET',
                param: {
                    onlyError: $scope.isFilterIssueCheck,
                    gt:start,
                    lt: end,
                    zone: $scope.$root.dataShare.crt_zone.zoneID,
                    service: $scope.serviceTypeName,
                    offset: $scope.offsetNum * REPORT_FEED_REQ_LIMIT,
                    limit: REPORT_FEED_REQ_LIMIT
                }
            }

            $restApiReq.get(reqInfo,function(res){
                console.log(res);
                if(res.length!=0){
                    $scope.$apply(function(){
                        res.forEach(item=>{
                            $scope.feed.push(item);
                        });
                    });
                }else if(res.length==0){
                    console.log("End of data");
                }
                closeComponentLoadingMask("report-thermal-scrollPage");
            })

        }

        $scope.initDatepicker = function(){
            $element.find('.report-datepicker-input').daterangepicker({
                timePicker: true,
                startDate: moment().startOf('hour'),
                endDate: moment().startOf('hour').add(32, 'hour'),
                locale: {
                    format: 'YYYY/MM/DD hh:mm A'
                }
            });
            $('.datepicker-btn-case').on("click",function(){
                $('.report-datepicker-input').trigger("click")
            });
            $('.report-datepicker-input').val("custom");

            // apply event -> query
            $('.report-datepicker-input').on("apply.daterangepicker",function(event){
                console.log(event.currentTarget.value);
                let timerange = getTimeRangeByDatepicker(event.currentTarget.value);
                $scope.feedQuery(timerange.start, timerange.end);
            });
        }

        $scope.onPresetClick=function($event){
            let timenow = Date.now();
            let endDate = getDatePickerFormat(timenow);
            let startDate = getDateByPreset($event.currentTarget.value, timenow);
            $('.report-datepicker-input').data('daterangepicker').setStartDate(startDate.result);
            $('.report-datepicker-input').data('daterangepicker').setEndDate(endDate);
            $scope.feedQuery(startDate.timestamp,timenow);
        }
        $scope.onRefreshClick=function($event){
            let timerange = getTimeRangeByDatepicker($('.report-datepicker-input').val());
            $scope.feedQuery(timerange.start, timerange.end);
        }
        
        function getTimeRangeByDatepicker(str){
            console.log(str);
            let start = str.slice(0,19);
            let end = str.slice(22);
            return {
                start:new Date(start).getTime(),
                end:new Date(end).getTime()
            };
        }

        function getDateByPreset(preset, time){
            let result;
            let target;
            let basetime = new Date(time);
            switch(preset[0]){
                case "m":
                    target = basetime.setMinutes(basetime.getMinutes() - Number(preset.slice(1)));
                    result = getDatePickerFormat(target);
                    break;
                case "h":
                    target = basetime.setHours(basetime.getHours() - Number(preset.slice(1)));
                    result = getDatePickerFormat(target);
                    break;
                case "d":
                    target = basetime.setDate(basetime.getDate() - Number(preset.slice(1)));
                    result = getDatePickerFormat(target);
                    break;
                case "M":
                    target = basetime.setMonth(basetime.getMonth() - Number(preset.slice(1)));
                    result = getDatePickerFormat(target);
                    break;
            }
            return {
                result : result,
                timestamp : target
            }
        }

        function getDatePickerFormat(timestamp){
            let date = new Date(timestamp);
            let hour = date.getHours();
            hour = hour < 10 ? "0" + hour : hour;
            let min = date.getMinutes();
            min = min < 10 ? "0" + min : min;
            let sec = date.getSeconds();
            sec = sec < 10 ? "0" + sec : sec;
            let time;
            if(hour>12){
                time = `${hour-12}:${min} PM`;
            }else{
                time = `${hour}:${min} AM`;
            }
            let year = date.getFullYear();
            let month = (1 + date.getMonth());
            month = month >= 10 ? month : '0' + month;
            let day = date.getDate();
            day = day >= 10 ? day : '0' + day;
            return `${year}/${month}/${day} ${time}`;
        }

        /*
            스크롤 이벤트 처리 부분
        */
        $('#report-thermal-scrollPage').scroll(scrollEvHandler);

        function scrollEvHandler(event){
            let target = $(this);
            let scrollTop = target.scrollTop(); //스크롤바의 상단위치
            let containerHeight = target.height(); //스크롤바를 갖는 div의 높이
            let docHeight = target.prop('scrollHeight'); //스크롤바를 갖는 doc 전체 높이
            let remainingHeight = docHeight-(scrollTop+ containerHeight);
            let posChange = Math.abs(Math.abs($scope.scrollPos)-Math.abs(scrollTop))
            
            if(posChange>200){
                $scope.scrollPos = scrollTop;
                return false;
            }

            function directionCheck(pos){
                if(scrollTop<=$scope.scrollPos) return UPWARD
                if(scrollTop>=$scope.scrollPos) return DOWNWARD
            }

            // 위로 올릴때 이벤트
            if(
                (directionCheck(scrollTop)==UPWARD) &&
                (scrollTop==0))
                {
                    console.log("##위로가는 이벤트###############")
                    
            }
            
            // 아래로 내릴때 이벤트
            if(
                (directionCheck(scrollTop)==DOWNWARD) &&
                (remainingHeight==0))
                {
                    console.log("##아래로가는 이벤트###############3")
                    $scope.offsetNum += 1;
                    
                    let timerange = getTimeRangeByDatepicker($('.report-datepicker-input').val());
                    getQueryOption(timerange.start,timerange.end);
            }
            $scope.scrollPos = scrollTop;
        }

        







































    }
});
