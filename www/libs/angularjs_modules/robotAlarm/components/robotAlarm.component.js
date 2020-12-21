"use strict";
let alarm_rest_ip = $("#serverIp").val()
let alarm_rest_port = $("#serverPort").val()
angular.
module('robotAlarm').
component('robotAlarm', {  
    templateUrl: '/static/libs/angularjs_modules/robotAlarm/templates/robotAlarm.html',
    controller: function ($scope, $element, $attrs, $restApiReq, $compile) {

        window.addEventListener("alarmCheckAll", function(e) {
            $scope.toastAlarmList = []
            $scope.popupAlarmList = []
            $('#toast-content').remove();
            $('#popup-content').remove();
        });


        $scope.origin_img_url = `http://${alarm_rest_ip}:${alarm_rest_port}/rest/image/srv_res/origin`;

        this.$onInit = async function() {
            if($attrs.width){
                $element.find(".alarm-main-icon").width($attrs.width);
            }
            if($attrs.height){
                $element.find(".alarm-main-icon").height($attrs.height);
            }
            if($attrs.img){
                $element.find(".alarm-main-icon").attr("src",$attrs.img);
            }
            // 알람 컴포넌트 위치 세팅
            $scope.toastAlarmCase = $(`<div id="toast-content-case"></div>`);
            $scope.popupCase = $(`<div id="popup-content-case"></div>`);
            angular.element(document.body).prepend($compile($scope.toastAlarmCase)($scope))
            angular.element(document.body).prepend($compile($scope.popupCase)($scope))

            $scope.isAlarmHistoryOpen = false; // 알람 히스토리 닫힘
            $scope.scrollPos = 0;
            
            // $scope.connectWebsocket();
            $scope.subscribeNats();
            // 셋팅 정보 가져오기 & 필터 세팅하기
            $scope.alarmSetting = (await $scope.getAlarmSetting()).result;
            $scope.audio = new Audio('/static/sound/alarm.wav');

            $scope.blinkFlag = false
            $scope.isPopupOn = false

            // 안읽은 리스트 받아서 각 알림 리스트에 정리하기
            $scope.toastAlarmList = []
            $scope.popupAlarmList = []
            $scope.alarmHistoryList = []
            await $scope.fillAlarmList();
            $scope.lastToastAlarmListLength = $scope.toastAlarmList.length;
            $scope.lastPopupAlarmListLength = $scope.popupAlarmList.length;
            $scope.isToastListMoreThanOne = $scope.checkListNumMoreThanOne($scope.toastAlarmList);
            $scope.insertToastAlarmContent();
            $scope.insertPopupAlarmContent();
        };
        
        // websocket 관련 functions
        $scope.subscribeNats = function(){
            nats.subscribe('monitoring.alarm_push',$scope.pushMsgHandler)
        }
        
        $scope.alarmSoundPlay = function(){
            $scope.audio.play();
        }
        
        $scope.pushMsgHandler = function(data){
            if($scope.$root.alarmState==false || $scope.$root.alarmState==undefined) return false
            let parsed_msg = JSON.parse(data)
            // alarm sound
            $scope.alarmSoundPlay()
            switch($scope.alarmSetting[parsed_msg.type].component){
                default:
                    break;
                case 0:
                    break;
                case 1:
                    parsed_msg['alarmIconSrc'] = $scope.getAlarmIconSrc(parsed_msg)
                    parsed_msg['alarmComment'] = $scope.getAlarmComment(parsed_msg)
                    // parsed_msg['timeForm'] = $scope.getTimeForm(parsed_msg.timestamp)
                    $scope.toastAlarmList.push(parsed_msg);
                    $scope.insertToastAlarmContent();
                    break;
                case 2:
                    parsed_msg['alarmIconSrc'] = $scope.getAlarmIconSrc(parsed_msg)
                    parsed_msg['alarmComment'] = $scope.getAlarmComment(parsed_msg)
                    // parsed_msg['timeForm'] = $scope.getTimeForm(parsed_msg.timestamp)
                    $scope.popupAlarmList.push(parsed_msg);
                    $scope.insertPopupAlarmContent();
                    break;
            }
            
        }
        $scope.onClickIcon=async function($event){
            
            if($scope.isAlarmHistoryOpen){
                // 닫을 때
                $scope.alarmHistoryList = []
                $scope.scrollPos = 0;
            }else{
                // 열 때
                
                let list = await $scope.getAlarmHistory()
                list.forEach(msg => {
                    msg['historyIconSrc'] = $scope.getHistoryIconSrc(msg)
                    msg['alarmComment'] = $scope.getAlarmComment(msg)
                    // msg['timeForm'] = $scope.getTimeForm(msg.timestamp)
                    $scope.alarmHistoryList.push(msg)
                })
            }
            $('#alarm-list-box').animate({scrollTop : 0}, 0);
            $scope.isAlarmHistoryOpen = !$scope.isAlarmHistoryOpen;
            setTimeout(function(){
                $scope.$apply(function(){
                })
            },1)
        }
        $scope.checkListNumMoreThanOne=function(list){
            return (list.length>1)?true:false
        }
        $scope.getUncheckedAlarm = function(){
            return new Promise((resolve, reject) => {
                $.post(`http://${alarm_rest_ip}:${alarm_rest_port}/rest/alarm/list/uncheck`,
                {},
                function(data, status){
                    // console.log("Data: " + data + "\nStatus: " + status);
                    resolve(data)
                });
            }); 
        }
        $scope.getAlarmHistory = function(){
            return new Promise((resolve, reject) => {
                $.post(`http://${alarm_rest_ip}:${alarm_rest_port}/rest/alarm/list/all`,
                {
                    timestamp:($scope.alarmHistoryList.length==0)
                    ?Date.now()
                    :$scope.alarmHistoryList[$scope.alarmHistoryList.length-1].timestamp
                },
                function(data, status){
                    // console.log("Data: " + data + "\nStatus: " + status);
                    resolve(data)
                });
            }); 
        }

        $scope.getAlarmSetting = function(){
            return new Promise((resolve, reject) => {
                $.post(`http://${alarm_rest_ip}:${alarm_rest_port}/rest/alarm/setting/info`,
                {},
                function(data, status){
                    // console.log("Data: " + data + "\nStatus: " + status);
                    
                    resolve(data)
                });
            }); 
        }

        $scope.fillAlarmList = function(){
            return new Promise(async (resolve, reject) => {
                let temp_list = (await $scope.getUncheckedAlarm()).result;
                temp_list.forEach(element => {
                    if($scope.alarmSetting[element.type]==undefined){
                        $scope.alarmSetting[element.type] = {
                            component : null
                        }
                    }
                    // element.res_data = JSON.parse(element.res_data)
                    element.location = JSON.parse(element.location)
                    element['alarmIconSrc'] = $scope.getAlarmIconSrc(element)
                    element['alarmComment'] = $scope.getAlarmComment(element)
                    // element['timeForm'] = $scope.getTimeForm(element.timestamp)
                    switch($scope.alarmSetting[element.type].component){
                        default:
                            break;
                        case 0:
                            break;
                        case 1:
                            $scope.toastAlarmList.push(element)
                            break;
                        case 2:

                            $scope.popupAlarmList.push(element)
                            break;
                    }
                });
                resolve(true)
            }); 
        }

        $scope.removeToastAlarm = function(){
            console.log("## remove toast alarm")
            if($scope.toastAlarmList.length<=0) return false
            let index = $scope.toastAlarmList.length-1
            let msg = $scope.toastAlarmList[index]
            $.post(`http://${alarm_rest_ip}:${alarm_rest_port}/rest/alarm/check`,
            {
                msg_id : msg.msg_id
            },
            function(data, status){
                $scope.toastAlarmList.splice(index,1);
                if($scope.toastAlarmList.length<=0){
                    $('#toast-content').remove();
                }
                $scope.lastToastAlarmListLength = $scope.toastAlarmList.length;
                $scope.isToastListMoreThanOne = $scope.checkListNumMoreThanOne($scope.toastAlarmList);
            });
        }
        $scope.insertToastAlarmContent = function(){
            if($scope.lastToastAlarmListLength==0&&
                $scope.toastAlarmList.length ==0) return false
            switch($scope.toastAlarmList.length){
                default:
                    if(!$scope.blinkFlag){
                        $('#toast-content').remove();
                        $('#toast-content-case').prepend($compile($scope.toastAlarmTemplate)($scope));
                        $('#toast-content').addClass("alarm-ani-blink");
                        $scope.blinkFlag = true;
                        setTimeout(function(){
                            $scope.blinkFlag = false;
                        },2000)
                    }
                    break;
                case 1:
                    $('#toast-content-case').prepend($compile($scope.toastAlarmTemplate)($scope));
                    $('#toast-content').addClass("alarm-ani-blink");
                    break;
            }
            $scope.lastToastAlarmListLength = $scope.toastAlarmList.length;
            $scope.isToastListMoreThanOne = $scope.checkListNumMoreThanOne($scope.toastAlarmList);
        }
        $scope.insertPopupAlarmContent = function(){
            if($scope.lastPopupAlarmListLength==0&&
                $scope.popupAlarmList.length ==0) return false
            if(!$scope.isPopupOn){
                
                $scope.$apply(function(){
                    $('#popup-content-case').prepend($compile($scope.popupTemplate)($scope))
                    setTimeout(function(){
                        let _scopeTarget = $('#popup-content-case').find(".report-thermal-static-mv")
                        let mvMarkerScope = angular.element(_scopeTarget.find(".marker-case")[0]).scope();
                        let pose = $scope.popupAlarmList[$scope.popupAlarmList.length-1].location.pose
                        mvMarkerScope.clearMark();
                        mvMarkerScope.addMark(pose);

                        let opt = {
                            camera: {
                                scale: 1,
                                x: pose.position.x,
                                y: pose.position.y
                            }
                        };
                        let mapviewScope = angular.element(_scopeTarget.find(".content-wrapper")[0]).scope();
                        mapviewScope.takeTargetView(opt);
                    },500)
                });
                $scope.isPopupOn = true;

                
                
                
            }
            $scope.lastPopupAlarmListLength = $scope.popupAlarmList.length;
        }

        $scope.removePopupAlarm = function(){
            console.log("## remove popup alarm")
            if($scope.popupAlarmList.length<=0) return false
            let index = $scope.popupAlarmList.length-1
            let msg = $scope.popupAlarmList[index]

            if(msg.type != undefined && msg.type == "event_emergency"){
                nats.publish(`${msg.robot_id}.emergency_call.quit`,"quit")
            }
            
            $.post(`http://${alarm_rest_ip}:${alarm_rest_port}/rest/alarm/check`,
            {
                msg_id : msg.msg_id
            },
            function(data, status){
                $scope.popupAlarmList.splice(index,1);
                if($scope.popupAlarmList.length<=0){
                    $('#popup-content').remove();
                    $scope.isPopupOn = false;
                }
                $scope.lastPopupAlarmListLength = $scope.popupAlarmList.length;
            });
        }


        $('#alarm-list-box').scroll(scrollEvHandler);

        async function scrollEvHandler(event){
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
                    console.log("## scroll event upward")
                    
            }
            
            // 아래로 내릴때 이벤트
            if(
                (directionCheck(scrollTop)==DOWNWARD) &&
                (remainingHeight==0))
                {
                    console.log("## scroll event downward")
                    let list = await $scope.getAlarmHistory()
                    list.forEach(msg => {
                        msg['historyIconSrc'] = $scope.getHistoryIconSrc(msg)
                        msg['alarmComment'] = $scope.getAlarmComment(msg)
                        // msg['timeForm'] = $scope.getTimeForm(msg.timestamp)
                        $scope.alarmHistoryList.push(msg)
                    })
                    
            }
            $scope.scrollPos = scrollTop;
        }
        $scope.getRoundOff = function(num){
            if(num==undefined) return false
            return num.toFixed(2)
        }
        $scope.getTimeForm = function(timestamp){
            if(!timestamp) return
            let date;
            let now = new Date(Date.now());
            if(timestamp.toString().includes("T")){
                timestamp = timestamp.replace("T"," ")
                timestamp = timestamp.slice(0, 19)
                date = new Date(timestamp);
                date.setHours(date.getHours()+9)
            }else{
                date = new Date(timestamp);
            }
            let sec_gap = (now.getTime() - date.getTime())/1000;
            let min_gap = sec_gap/60;

            let yyyy = date.getFullYear();
            let dd = date.getDate();
            let mm = (date.getMonth() + 1);

            if (dd < 10)
                dd = "0" + dd;

            if (mm < 10)
                mm = "0" + mm;

            let cur_day = yyyy + "." + mm + "." + dd;

            let hours = date.getHours()
            let minutes = date.getMinutes()
            let seconds = date.getSeconds();

            if (hours < 10)
                hours = "0" + hours;

            if (minutes < 10)
                minutes = "0" + minutes;

            if (seconds < 10)
                seconds = "0" + seconds;
                
            

            if(min_gap<1){
                return `${Math.floor(sec_gap)}초 전`;
                
            }else if(min_gap<60&&min_gap>=1){
                return `${Math.floor(min_gap)}분 전`;
            }
            else{
                return cur_day + " " + hours + ":" + minutes + ":" + seconds;
            }

            
        }

        $scope.getAlarmComment = function(msg){
            if(msg==undefined || msg== null) return false
            let res
            switch(msg.type){
                case "connected":
                    // console.log("##############")
                    // console.log(typeof msg.res_data)
                    // console.log(msg.res_data)
                    if(msg.res_data=="1"){
                        res = `${msg.robot_id}가 연결되었습니다.`
                    }else{
                        res = `${msg.robot_id}가 연결 해지되었습니다.`
                    }
                    break;
                case "battery":
                    if(msg.res_data!=undefined){
                        res = `배터리가 ${msg.res_data}% 입니다. 충전이 필요합니다.`    
                    }else{
                        res = `배터리가 위험 상태입니다. 충전이 필요합니다.`
                    }
                    
                    break;
                case "emergency":
                    res = `비상정지 버튼이 눌렸습니다. 모든 동작이 정지됩니다.`
                    break;
                case "localization":
                    res = `로봇이 위치 탐색에 실패하였습니다. 수동 조작이 필요합니다.`
                    break;
                case "sensor":
                    res = `센서 이상이 발생했습니다. 점검이 필요합니다.`
                    break;
                ///////////////////////////////////////////////////////////////    
                case "event_temperature":
                    res = `고온체온자가 발견되었습니다.`
                    break;
                case "event_people":
                    res =  `사람이 발견되었습니다.`
                    break;
                case "event_fallen":
                    res = `쓰러진 사람이 발견되었습니다. 현장 대응이 필요합니다.`
                    break;
                case "event_code":
                    res = `코드 인식이 불가합니다.`
                    break;
                case "event_fire":
                    res = `화재가 감지되었습니다. 현장 대응이 필요합니다.`
                    break;
                case "event_emergency":
                    res = `비상호출이 요청되었습니다. 현장 모니터링이 필요합니다.`
                    break;
            }
            return res
        }
        $scope.getAlarmIconSrc = function(msg){
            if(msg==undefined || msg== null) return undefined
            let res
            switch(msg.type){
                case "connected":
                    if(msg.res_data=="1"){
                        res = `/static/imgs/robots/img-profile-addy_5.png`
                    }else{
                        res = `/static/imgs/robots/img-profile-addy_2.png`
                    }
                    break;
                case "battery":
                    res = `/static/imgs/icons/alarm-battery-g-1.svg`
                    break;
                case "emergency":
                    res = `/static/imgs/icons/alarm-emergency-g-1.svg`
                    break;
                case "localization":
                    res = `/static/imgs/icons/alarm-local-g-1.svg`
                    break;
                case "sensor":
                    res = `/static/imgs/icons/alarm-sensor-g-1.svg`
                    break;
                ///////////////////////////////////////////////////////////////    
                case "event_temperature":
                    res = `/static/imgs/icons/alarm-thermal-g-1.svg`
                    break;
                case "event_people":
                    res = `/static/imgs/icons/alarm-person-1.svg`
                    break;
                case "event_code":
                    res = `/static/imgs/icons/alarm-codescan-g-1.svg`
                    break;
                ///////////////////////////////////////////////////////////////    
                case "event_emergency":
                    res = `/static/imgs/icons/image.svg`
                    break;
                case "event_fallen":
                    res = `/static/imgs/icons/image.svg`
                    break;
                case "event_fire":
                    res = `/static/imgs/icons/image.svg`
                    break;
            }
            return res
        }
        $scope.getHistoryIconSrc = function(msg){
            if(msg==undefined || msg== null) return undefined
            let res
            switch(msg.type){
                case "connected":
                    if(msg.res_data=="1"){
                        res = `/static/imgs/robots/img-profile-addy_5.png`
                    }else{
                        res = `/static/imgs/robots/img-profile-addy_2.png`
                    }
                    break;
                case "battery":
                    res = `/static/imgs/icons/alarm-battery-g-6.svg`
                    break;
                case "emergency":
                    res = `/static/imgs/icons/alarm-emergency-g-6.svg`
                    break;
                case "localization":
                    res = `/static/imgs/icons/alarm-local-g-6.svg`
                    break;
                case "sensor":
                    res = `/static/imgs/icons/alarm-sensor-g-6.svg`
                    break;
                ///////////////////////////////////////////////////////////////    
                case "event_temperature":
                    res = `/static/imgs/icons/alarm-thermal-g-6.svg`
                    break;
                case "event_people":
                    res = `/static/imgs/icons/alarm-person-6.svg`
                    break;
                case "event_code":
                    res = `/static/imgs/icons/alarm-codescan-g-6.svg`
                    break;
                ///////////////////////////////////////////////////////////////    
                case "event_emergency":
                    res = `/static/imgs/icons/alarm-emergencycall-g-6.svg`
                    break;
                case "event_fallen":
                    res = `/static/imgs/icons/alarm-person-6.svg`
                    break;
                case "event_fire":
                    res = `/static/imgs/icons/alarm-fire-g-6.svg`
                    break;
            }
            return res
        }

        $scope.toastAlarmTemplate = $(`
        <div id="toast-content" class="">
            <div class="toast-show-card" >
                <div class="toast-icon-case " >
                    <div class="toast-img-box" >
                        <img width="40px" height="40px"
                            ng-src ="{{toastAlarmList[toastAlarmList.length-1].alarmIconSrc}}"
                            alt="">
                    </div>
                </div>
                <div class="toast-info-case " >
                    <div class="toast-info-case-top " >
                        <span data-ng-bind="toastAlarmList[toastAlarmList.length-1].alarmComment"></span>
                    </div>
                    <div class="toast-info-case-bottom" >
                        <div class="toast-info-case-bottom-location" >
                            <span data-ng-bind="toastAlarmList[toastAlarmList.length-1].robot_id"></span>
                            <span class="dot-custom-alarm">&nbsp<i class="fa fa-circle " aria-hidden="true"></i>&nbsp</span>
                            <span data-ng-bind="toastAlarmList[toastAlarmList.length-1].zone"></span>
                        </div>
                        <div class="toast-info-case-bottom-time" >
                            <span data-ng-bind="getTimeForm(toastAlarmList[toastAlarmList.length-1].timestamp)"></span>
                        </div>
                    </div>
                </div>
                <div class="toast-btn-case" ng-click="removeToastAlarm()">
                    <span>확인</span>
                </div>
            </div>
            <div class="toast-show-num-case" ng-show="isToastListMoreThanOne">
                <div class="toast-show-num-txtbox" >
                    <span>확인 안한 알람</span>
                </div>
                <div class="toast-show-num-circle" >
                    <span data-ng-bind="toastAlarmList.length"></span>
                </div>
            </div>
        </div>
        `);
        $scope.popupTemplate = $(`
        <div id="popup-content">
            <div class="popup-content-backlight"></div>
            
            <div class="popup-content-center-box ">
                <div class="popup-content-top-case ">
                    <div class="popup-content-top-left-case ">
                        <div class="popup-content-top-left-wrapper">
                            <div class="popup-content-sign">
                                <img src="/static/imgs/icons/error.svg"></img>
                            </div>
                            <div class="popup-content-title">
                                <span>WARNING</span>
                            </div>
                            <div class="popup-content-uncheckedcase ">
                                <div class="popup-show-num-case">
                                    <div class="popup-show-num-txtbox" >
                                        <span>확인 안한 비상알람</span>
                                    </div>
                                    <div class="popup-show-num-circle" >
                                        <span data-ng-bind="popupAlarmList.length"></span>
                                    </div>
                                </div>    
                            </div>
                        </div>
                    </div>

                    <div class="popup-content-top-mid-case ">
                        <img src="/static/imgs/icons/warning-diviver.svg"></img>
                    </div>
                    
                    <div class="popup-content-top-right-case ">
                        <div class="popup-content-time ">
                            <span data-ng-bind="getTimeForm(popupAlarmList[popupAlarmList.length-1].timestamp)"></span>
                        </div>
                        
                        <div class="popup-content-commentcase ">
                            <span data-ng-bind="popupAlarmList[popupAlarmList.length-1].alarmComment"></span>
                        </div>

                        <div class="popup-content-locationcase ">
                            <span>위치&nbsp&nbsp&nbsp</span>
                            <span data-ng-bind="popupAlarmList[popupAlarmList.length-1].zone"></span>    
                            <svg height="3" width="3" class="dot-custom-popup">
                                <circle cx="1.5" cy="1.5" r="1.5" fill="var(--grey-0)" />
                            </svg> 
                            
                            <span>&nbsp(X: &nbsp</span>
                            <span data-ng-bind="getRoundOff(popupAlarmList[popupAlarmList.length-1].location.pose.position.x)"></span>    
                            <span>,&nbsp&nbsp</span>
                            <span>Y: &nbsp</span>
                            <span data-ng-bind="getRoundOff(popupAlarmList[popupAlarmList.length-1].location.pose.position.y)"></span>    
                            <span>)</span>
                            
                            
                            
                        </div>
                        <div class="popup-content-photocase">
                            <div class="popup-content-map">
                                <map-view class="report-thermal-static-mv" mode="static" title="false" btnzoom="false"></map-view>
                            </div>
                            <div class="popup-content-img ">
                                <img ng-src="{{origin_img_url}}?id={{popupAlarmList[popupAlarmList.length-1].msg_id}}&timestamp={{popupAlarmList[popupAlarmList.length-1].timestamp}}&type={{popupAlarmList[popupAlarmList.length-1].type}}" >
                            </div>
                        </div>
                    </div>
                </div>
                <div class="popup-content-mid-case "></div>
                <div class="popup-content-btm-case ">
                    <div class="popup-content-btn" ng-click="removePopupAlarm()">
                        <span>알람을 확인했습니다.</span>
                    </div>    
                </div>
            </div>
            
            
            
        </div>
        `);
        
        

    }
});
