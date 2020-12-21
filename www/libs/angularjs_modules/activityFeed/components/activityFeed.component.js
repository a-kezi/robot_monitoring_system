"use strict";
let rest_server_ip = $("#serverIp").val()
let rest_server_port = $("#serverPort").val()

const TOP_STATE = 0
const TOP_STATE_READY = 1
const SEARCH_STATE = 2
const LOADING_STATE = 3

const UPWARD = 0
const DOWNWARD = 1
const QUEUE_CHECK_TIME = 300 // ms
const MAX_FEED_NUMBER = 50
const CUT_TOP = 0
const CUT_BOTTOM = 1

const FILTER_STATE_ISSUE = 0
const FILTER_STATE_UNCHECKED_ISSUE = 1
const FILTER_STATE_IMPORTANT = 2
const FILTER_STATE_ALL = 3

const ALL_SERVICE = "0"
const GET_RECENT_FEED_API_URL = `http://${rest_server_ip}:${rest_server_port}/rest/servicefeed/list/recent`;
const GET_PAST_FEED_API_URL = `http://${rest_server_ip}:${rest_server_port}/rest/servicefeed/list/past`;

const REMOVE_UNCHECKED_FEED_API_URL = `http://${rest_server_ip}:${rest_server_port}/rest/servicefeed/remove/unchecked`;
const SET_IMPORTANT_FEED_API_URL = `http://${rest_server_ip}:${rest_server_port}/rest/servicefeed/set/important`;
const RELEASE_IMPORTANT_FEED_API_URL = `http://${rest_server_ip}:${rest_server_port}/rest/servicefeed/release/important`;

const GET_TH_IMG_API_URL = `http://${rest_server_ip}:${rest_server_port}/rest/image/srv_res/thumbnail`;
const GET_OR_IMG_API_URL = `http://${rest_server_ip}:${rest_server_port}/rest/image/srv_res/origin`;

angular.
module('activityFeed').
component('feedtable', {  
    templateUrl: '/static/libs/angularjs_modules/activityFeed/templates/activityFeed.html',
    controller: function ($scope, $element, $attrs, $restApiReq) {

        $scope.feed = []; // msg feed
        $scope.tempQueue = []; // msg가 임시로 담겼다 들어올 queue
        $scope.scrollPos = 0; // 현재 스크롤 pos
        $scope.state = TOP_STATE; // 상태 변경 -> top
        $scope.latestMsg = {}; // 가장 최근 들어온 메세지
        $scope.selectedFeed = {}; // 선택한 피드
        $scope.selectedDoc; // 선택한 피드 document
        $scope.natsInstance = {}; // nats sub 모음
        // $scope.filterState = FILTER_STATE_ISSUE;
        $scope.filterState = FILTER_STATE_UNCHECKED_ISSUE;
        $scope.selectedService = ALL_SERVICE;
        $scope.selectedServiceName = "All"
        $scope.queueTap;
        $scope.thum_img_url = GET_TH_IMG_API_URL;
        $scope.origin_img_url = GET_OR_IMG_API_URL;
        $scope.isDetailOpen = false;
        $(".activity-feed-content").height($(".feed-case").height()-50);
        $(".activity-feed-body").height($(".feed-case").height()-50);
        $(".feed-detail-body").height($(".feed-case").height()-50);
        
        


        /*
            event handle
        */
        window.addEventListener("robotChanged", function(e) {
            if($scope.$root.isSubListReady && $scope.$root.isRobotReady){
                if($scope.$root.dataShare.crt_zone!=null){
                    $scope.feedRefresh();
                }        
            }
        });
        window.addEventListener("subListChanged", function(e) {
            $scope.clearFeed();
            if($scope.$root.isSubListReady && $scope.$root.isRobotReady){
                if($scope.$root.dataShare.crt_zone!=null){
                    $scope.feedRefresh();
                }        
            }
        });

        $(window).resize(function () {
            $(".activity-feed-content").height($(window).height()-164);
            $(".activity-feed-body").height($(".feed-case").height()-50);
            $(".feed-detail-body").height($(".feed-case").height()-50);
            
        });
        $(document).ready(function(){
            $(".activity-feed-body").height($(".feed-case").height()-50);
            $(".feed-detail-body").height($(".feed-case").height()-50);
            $(".activity-feed-content").height($(window).height()-164);
            
        });

        /*
            functions
        */
        $scope.onPopup = function(event){
            console.log("onPopup")
            let url = $scope.origin_img_url
            let msg_id = $scope.selectedFeed.msg_id
            let timestamp = $scope.selectedFeed.timestamp
            let type = $scope.selectedFeed.type
            let modal_content =`
                <div id="modal-content-wrapper">
                    <div id='modal-content-title'>
                        <span>이미지</span>
                    </div>
                    <div id='modal-content-data'>
                        <img src='${url}?id=${msg_id}&timestamp=${timestamp}&type=${type}'/>   
                    </div>
                </div>
            `
            
            //화면에 레이어 추가
            $('#modal-content').append(modal_content)
            $('#modal-content-case').css("display","initial")
        }
        
        $scope.chooseAllService = function(index){
            console.log("choose all service");
            $scope.selectedService = ALL_SERVICE;
            $scope.selectedServiceName = "All"
            if($scope.$root.dataShare.crt_zone!=null){
                $scope.feedRefresh();
            }
        }

        $scope.chooseService = function(index){
            console.log(`choose ${index} service`);
            
            $scope.selectedService = $scope.$root.dataShare.servicelist[index];
            $scope.selectedServiceName = $scope.$root.dataShare.servicelist[index].display_name;
            if($scope.$root.dataShare.crt_zone!=null){
                $scope.feedRefresh();
            }
        }

        $scope.queueOpen = function(){
            $scope.queueTap = setInterval(function(){
                if(
                    ($scope.tempQueue.length!=0) &&
                    ($scope.state === TOP_STATE)
                ){
                    $scope.$apply(function(){
                        $scope.feed.unshift($scope.tempQueue.pop());
                        $scope.cutBottomFeed();
                        // console.log("feed length", $scope.feed.length);
                    })
                }
            },QUEUE_CHECK_TIME)
        }

        $scope.queueClose = function(){
            clearInterval($scope.queueTap);
        }

        $scope.getServiceDisplayName = function(type){
            if(type==undefined) return "";
            if($scope.$root.dataShare.servicelist.length==0) return "";
            let name = "";
            $scope.$root.dataShare.servicelist.forEach(item=>{
                if(type == item.type){
                    name = item.display_name;
                }
            })
            return name            
        }

        $scope.closeFeedDetail = function(){
            // feed detail 닫기
            if($scope.selectedDoc!=undefined){
                $scope.selectedDoc.classList.remove('selected-feed-color');
            }
            $scope.isDetailOpen = false
        }
        $scope.openFeedDetail = function(){
            $scope.selectedDoc.classList.add('selected-feed-color');
            $scope.isDetailOpen = true
        }
        
        $scope.clearFeed = function(){
            // stop subscribing all nats subjects
            $scope.closeFeedDetail();
            $scope.natsSubStopAll();
            $scope.feed=[];
        }

        $scope.feedRefresh = function(){
            $scope.clearFeed();
            $scope.state = LOADING_STATE;
            componentLoadingMask("feed-area","loading_thrabber_s_ropti.svg");

            // query setup
            let queryRobot = [];
            let queryService = [];

            if($scope.$root.dataShare.crt_robot===ALL_ROBOT){
                $scope.$root.dataShare.robotlist.forEach(robot=>{
                    queryRobot.push(robot.id);
                })
            }else{
                queryRobot.push($scope.$root.dataShare.crt_robot.id);
            }
            if($scope.selectedService===ALL_SERVICE){
                $scope.$root.dataShare.servicelist.forEach(service=>{
                    queryService.push(service.type);
                })
            }else{
                queryService.push($scope.selectedService.type);
            }
            
            var reqInfo = {
                url: GET_PAST_FEED_API_URL,
                type: 'GET',
                param: {
                    state: $scope.filterState,
                    lt: Date.now(),
                    zone: $scope.$root.dataShare.crt_zone.zoneID,
                    robot: queryRobot.length==0?0:queryRobot,
                    service: queryService,
                    limit:10
                    
                }
            }
            $restApiReq.get(reqInfo,function(res){
                // console.log(res);
                if(res.length!=0){
                    res.forEach(item=>{
                        $scope.$apply(function(){
                            $scope.feed.push(item);
                        });
                    })
                }else if(res.length==0){
                    console.log("End of data");
                }
                $scope.state = TOP_STATE;
                closeComponentLoadingMask("feed-area");
                $scope.natsSubStart(nats, $scope.$root.dataShare.subList, "robot_service");
            })
        }
        $scope.onClickFeedImportantBtn = function(index, $event){
            $scope.checkImportant($scope.feed[index])
        }
        $scope.onClickDetailImportantBtn = function($event){
            $scope.checkImportant($scope.selectedFeed)
        }
        $scope.checkImportant = function(target){
            // console.log("important clicked", index);
            if(target.important==false){
                // important 등록 api
                var reqInfo = {
                    url: SET_IMPORTANT_FEED_API_URL,
                    type: 'GET',
                    param: {
                        msg_id:target.msg_id
                    }
                }
                $restApiReq.get(reqInfo,function(res){
                    // console.log(res);
                    if(res.status!=undefined && res.status==true){
                        $scope.$apply(function(){
                            target.important = true
                        })
                    }
                })
            }else if(target.important==true){
                // important 해제 api
                var reqInfo = {
                    url: RELEASE_IMPORTANT_FEED_API_URL,
                    type: 'GET',
                    param: {
                        msg_id:target.msg_id
                    }
                }
                $restApiReq.get(reqInfo,function(res){
                    // console.log(res);
                    if(res.status!=undefined && res.status==true){
                        $scope.$apply(function(){
                            target.important = false
                        })
                    }
                })
            }else{
                console.log("can't check important key");
            }
        }

        $scope.filterToIssue = function(){
            if($scope.filterState!=FILTER_STATE_ISSUE){
                console.log("FILTER_STATE_ISSUE");
                $scope.filterState = FILTER_STATE_ISSUE;
                if($scope.$root.dataShare.crt_zone!=null){
                    $scope.feedRefresh();
                }
            }
        }
        $scope.filterToAll = function(){
            if($scope.filterState!=FILTER_STATE_ALL){
                console.log("FILTER_STATE_ALL");
                $scope.filterState = FILTER_STATE_ALL;
                if($scope.$root.dataShare.crt_zone!=null){
                    $scope.feedRefresh();
                }
            }
        }
        $scope.filterToUnchecked = function(){
            if($scope.filterState!=FILTER_STATE_UNCHECKED_ISSUE){
                console.log("FILTER_STATE_UNCHECKED_ISSUE");
                $scope.filterState = FILTER_STATE_UNCHECKED_ISSUE;
                if($scope.$root.dataShare.crt_zone!=null){
                    $scope.feedRefresh();
                }

            }
        }
        $scope.filterToImportant = function(){
            if($scope.filterState!=FILTER_STATE_IMPORTANT){
                console.log("FILTER_STATE_IMPORTANT");
                $scope.filterState = FILTER_STATE_IMPORTANT;
                if($scope.$root.dataShare.crt_zone!=null){
                    $scope.feedRefresh();
                }

            }
        }

        $scope.queueInsert = function(msg){
            let isRobotTrue =false;
            let isServiceTrue =false;
            let isFilterTrue =false;

            // robot check
            if($scope.$root.dataShare.crt_robot=== ALL_ROBOT){
                isRobotTrue = true;
            }else if($scope.$root.dataShare.crt_robot.id=== msg.robot_id){
                isRobotTrue = true;
            }
            
            // service check
            if($scope.selectedService=== ALL_SERVICE){
                isServiceTrue = true;
            }else if($scope.selectedService.type=== msg.type){
                isServiceTrue = true;
            }
            
            // filter check
            switch ($scope.filterState) {
                case FILTER_STATE_ISSUE:
                    if(msg.error==true){
                        isFilterTrue = true;
                    }
                    break;
                case FILTER_STATE_UNCHECKED_ISSUE:
                    if(msg.checked==false && msg.error==true){
                        isFilterTrue = true;
                    }
                    break;
                case FILTER_STATE_IMPORTANT:
                    if(msg.important==true){
                        isFilterTrue = true;
                    }
                    break;
                case FILTER_STATE_ALL:
                    isFilterTrue = true;
                    break;
                default:
                    console.log("");
            }
            
            if(isRobotTrue && isFilterTrue && isServiceTrue){
                $scope.tempQueue.unshift(msg);
            }
        }
        
        $scope.getFormatDate = function(timestamp){
            var date = new Date(timestamp);
            var month = (1 + date.getMonth());
            month = month >= 10 ? month : '0' + month;
            var day = date.getDate();
            day = day >= 10 ? day : '0' + day;
            return  month + '.' + day;
        }
        $scope.getFormatTime = function(timestamp){
            var date = new Date(timestamp);
            var hour = date.getHours();
            hour = hour < 10 ? "0" + hour : hour;
            var min = date.getMinutes();
            min = min < 10 ? "0" + min : min;
            var sec = date.getSeconds();
            sec = sec < 10 ? "0" + sec : sec;
            return  hour + ':' + min+':'+sec; 
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

        $scope.moveScroll = function(pos, ms){
            $('#scrollPage').animate({scrollTop : pos}, ms, function(){
                console.log("## moveScroll to ", pos);
                $scope.scrollPos = pos;
            })
        }

        $scope.checkResultImg = function(typearr){
            let res = false;
            if(typearr){
                if(typearr.includes('img')){
                    res = true;
                    return res
                }
            }else{
                return res
            }
        }

        $scope.cutBottomFeed = function(){
            if($scope.feed.length>MAX_FEED_NUMBER){
                $scope.feed = $scope.feed.slice(0, MAX_FEED_NUMBER);
            }
        }
        
        $scope.cutTopFeed = function(){
            // console.log($scope.feed);
            if($scope.feed.length>MAX_FEED_NUMBER){
                $scope.feed = $scope.feed.slice($scope.feed.length-MAX_FEED_NUMBER,$scope.feed.length);
                // console.log($scope.feed);
            }
        }

        $scope.selectFeed = function(index, $event){
            $scope.selectedFeed = $scope.feed[index];
            // console.log($scope.selectedFeed);
                        
            let opt = {
                camera: {
                    scale: 1,
                    x: $scope.selectedFeed.location.pose.position.x,
                    y: $scope.selectedFeed.location.pose.position.y
                }
            };
            
            // position 이 좌표계에 맞는지 확인 필요
            let mapviewScope = angular.element($element.find(".activity-feed-static-mv").find(".content-wrapper")[0]).scope();
            mapviewScope.takeTargetView(opt);

            let mvMarkerScope = angular.element($element.find(".activity-feed-static-mv").find(".marker-case")[0]).scope();
            mvMarkerScope.clearMark();
            mvMarkerScope.addMark($scope.selectedFeed.location.pose);
            
            if($scope.selectedDoc!=undefined){
                $scope.selectedDoc.classList.remove('selected-feed-color');
            }

            // console.log($event.currentTarget.parentElement);
            $scope.selectedDoc = $event.currentTarget.parentElement
            $scope.openFeedDetail()
            
            if(
                ($scope.selectedFeed.error == true) && 
                ($scope.selectedFeed.checked == false)
                ){
                
                $scope.feed[index].checked = true;
                var reqInfo = {
                    url: REMOVE_UNCHECKED_FEED_API_URL,
                    type: 'GET',
                    param: {
                        msg_id:$scope.selectedFeed.msg_id
                    }
                }
                $restApiReq.get(reqInfo,function(res){
                    console.log(res);
                })
            }

        }

        
        












        /*
            스크롤 이벤트 처리 부분
        */
        $('.activity-feed-body').scroll(scrollEvHandler);

        function scrollEvHandler(event){
            
            if($scope.state==LOADING_STATE){
                event.preventDefault();
                event.stopPropagation();
                return false;
            }

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

            $scope.state = SEARCH_STATE;

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
                    // 로딩 페이지 활성화
                    $scope.state = LOADING_STATE;
                    componentLoadingMask("feed-area","loading_thrabber_s_ropti.svg");
                    let queryRobot = [];
                    let queryService = [];
                    
                    if($scope.$root.dataShare.crt_robot===ALL_ROBOT){
                        $scope.$root.dataShare.robotlist.forEach(robot=>{
                            queryRobot.push(robot.id);
                        })
                    }else{
                        queryRobot.push($scope.$root.dataShare.crt_robot.id);
                    }
                    if($scope.selectedService===ALL_SERVICE){
                        $scope.$root.dataShare.servicelist.forEach(service=>{
                            queryService.push(service.type);
                        })
                    }else{
                        queryService.push($scope.selectedService.type);
                    } 

                    var reqInfo = {
                        url: GET_RECENT_FEED_API_URL,
                        type: 'GET',
                        param: {
                            state: $scope.filterState,
                            gt: new Date($scope.feed[0].timestamp).getTime(),
                            zone: $scope.$root.dataShare.crt_zone.zoneID,
                            robot: queryRobot.length==0?0:queryRobot,
                            service: queryService,
                            limit:10
                        }
                    }

                    $restApiReq.get(reqInfo,function(res){
                        // 응답이 0이 아닌경우
                        console.log("--------------")
                        console.log(res)
                        if(res.length!=0){
                            
                            let list = res;
                            let isLatestMsgInRes =false;
                            res.some(item=>{
                                if(
                                    item.timestamp == $scope.latestMsg.timestamp || 
                                    $scope.latestMsg == {}
                                    ){
                                    isLatestMsgInRes = true;
                                }
                            })
                            
                            if(isLatestMsgInRes==true){
                                // db에서 가져온 결과에 가장 최신 메세지가 있는 경우
                                $scope.state = TOP_STATE_READY;
                                let queryRobot = [];
                                let queryService = [];
                                
                                if($scope.$root.dataShare.crt_robot===ALL_ROBOT){
                                    $scope.$root.dataShare.robotlist.forEach(robot=>{
                                        queryRobot.push(robot.id);
                                    })
                                }else{
                                    queryRobot.push($scope.$root.dataShare.crt_robot.id);
                                }
                                if($scope.selectedService===ALL_SERVICE){
                                    $scope.$root.dataShare.servicelist.forEach(service=>{
                                        queryService.push(service.type);
                                    })
                                }else{
                                    queryService.push($scope.selectedService.type);
                                }

                                var reReqInfo = {
                                    url: GET_RECENT_FEED_API_URL,
                                    type: 'GET',
                                    param: {
                                        state: $scope.filterState,
                                        gt: new Date($scope.feed[0].timestamp).getTime(),
                                        zone: $scope.$root.dataShare.crt_zone.zoneID,
                                        robot: queryRobot.length==0?0:queryRobot,
                                        service: queryService,
                                        limit:100
                                    }
                                }

                                // db에 재요청 후 tempQueue array update하고 state 변환
                                $restApiReq.get(reReqInfo,function(re_res){
                                    if($scope.tempQueue.length!=0){ // tempQueue에 메세지가 있을때
                                        let re_list = re_res;
                                        let temp = [];
                                        re_list.some(ele_res => {
                                            if($scope.tempQueue[0].timestamp !=ele_res.timestamp){
                                                temp.push(ele_res)
                                            }if($scope.tempQueue[0].timestamp ==ele_res.timestamp){
                                                return true
                                            }
                                        });
                                        $scope.tempQueue = temp.concat($scope.tempQueue)
                                        console.log("TOP_STATE");
                                        $scope.state = TOP_STATE;
                                        closeComponentLoadingMask("feed-area");
                                        
                                    }else{ // tempQueue가 비어있을때
                                        re_res.forEach(item=>{
                                            $scope.tempQueue.unshift(item);
                                        })
                                        console.log("TOP_STATE");
                                        $scope.state = TOP_STATE;
                                        closeComponentLoadingMask("feed-area");
                                    }
                                });

                            }else{
                                // db에서 가져온 결과에 가장 최신 메세지가 없을 때
                                $scope.$apply(function(){
                                    res.forEach(item=>{
                                        $scope.feed.unshift(item);
                                    })
                                    $scope.cutBottomFeed();
                                    $scope.moveScroll(20,0);
                                    closeComponentLoadingMask("feed-area");
                                    $scope.state = SEARCH_STATE;
                                })
                                
                            }

                        // 응답이 0인 경우
                        }else if(res.length==0){ 
                            console.log("TOP_STATE");
                            $scope.state = TOP_STATE;
                            closeComponentLoadingMask("feed-area");
                        }
                    })
            }
            
            // 아래로 내릴때 이벤트
            if(
                (directionCheck(scrollTop)==DOWNWARD) &&
                (remainingHeight==0))
                {
                    console.log("## scroll event downward")

                    // 로딩 페이지 활성화
                    $scope.state = LOADING_STATE;
                    componentLoadingMask("feed-area","loading_thrabber_s_ropti.svg");
                    let queryRobot = [];
                    let queryService = [];
                    
                    if($scope.$root.dataShare.crt_robot===ALL_ROBOT){
                        $scope.$root.dataShare.robotlist.forEach(robot=>{
                            queryRobot.push(robot.id);
                        })
                    }else{
                        queryRobot.push($scope.$root.dataShare.crt_robot.id);
                    }
                    if($scope.selectedService===ALL_SERVICE){
                        $scope.$root.dataShare.servicelist.forEach(service=>{
                            queryService.push(service.type);
                        })
                    }else{
                        queryService.push($scope.selectedService.type);
                    }   
                    var reqInfo = {
                        url: GET_PAST_FEED_API_URL,
                        type: 'GET',
                        param: {
                            state: $scope.filterState,
                            lt: new Date($scope.feed[$scope.feed.length-1].timestamp).getTime(), // 과거 받을때 시작점 설정
                            zone: $scope.$root.dataShare.crt_zone.zoneID,
                            robot: queryRobot.length==0?0:queryRobot,
                            service: queryService,
                            limit:10

                        }
                    }
                    
                    $restApiReq.get(reqInfo,function(res){
                        if(res.length!=0){
                            $scope.$apply(function(){
                                res.forEach(item=>{
                                    $scope.feed.push(item);
                                })
                                closeComponentLoadingMask("feed-area");
                                $scope.cutTopFeed();
                                $scope.state = SEARCH_STATE;

                            });
                            
                        }else if(res.length==0){
                            closeComponentLoadingMask("feed-area");
                            $scope.state = SEARCH_STATE;
                            // console.log("End of data");
                        }
                    })
            }
            $scope.scrollPos = scrollTop;
        }

        
        $scope.natsSubStart = function(nats, subList, subjectType){
            subList.typelist.forEach(typeElement=>{
                if($scope.$root.dataShare.robotlist.length!==0){
                    $scope.$root.dataShare.robotlist.forEach(robot=>{
                        if(robot.type===typeElement){
                            subList.subjects[typeElement].forEach(topic=>{
                                if($scope.natsInstance[robot.id]===undefined){
                                    $scope.natsInstance[robot.id] ={}
                                }
                                // console.log(subjectType, topic.type)
                                if(subjectType===topic.type){
                                    $scope.natsInstance[robot.id][topic.name] = 
                                        nats.subscribe(`${robot.id}.${topic.name}`,
                                        robotMsgHandle);
                                }
                            })
                        }
                    })

                }

            })
            $scope.queueOpen();

        }

        $scope.natsSubStop = function(robotID, subject){
            console.log(`stop sub ${robotID}-${subject}`);
            nats.unsubscribe($scope.natsInstance[robotID][subject]);
        }

        $scope.natsSubStopAll = function(){
            for(var i in $scope.natsInstance){
                for(var j in $scope.natsInstance[i]){
                    nats.unsubscribe($scope.natsInstance[i][j]);
                }
            }
            $scope.natsInstance = {};
        }
        
        // nats msg callback functions
        function robotMsgHandle(msg){
            let parsed_msg = MsgPacket.parsePacket(msg);
            // console.log(parsed_msg)
            // if(parsed_msg.result.type.includes('img')){
            //     parsed_msg['thumnail'] = `${GET_TH_IMG_API_URL}?id=${parsed_msg.msgID}`;
            //     parsed_msg['img_origin'] = `${GET_OR_IMG_API_URL}?id=${parsed_msg.msgID}`;
            // }

            if(
                ($scope.state===TOP_STATE) || 
                ($scope.state===TOP_STATE_READY)
                ){  
                    if(parsed_msg.error==true){
                        parsed_msg.checked = false;
                        parsed_msg.important = false;
                        $scope.queueInsert(parsed_msg);
                    }else{
                        parsed_msg.checked = true;
                        parsed_msg.important = false;
                        $scope.queueInsert(parsed_msg);
                    }
                
            }else if($scope.state===SEARCH_STATE){
                if(parsed_msg.error==true){
                    parsed_msg.checked = false;
                    parsed_msg.important = false;
                    $scope.latestMsg = parsed_msg;
                }else{
                    parsed_msg.checked = true;
                    parsed_msg.important = false;
                    $scope.latestMsg = parsed_msg;
                }
            }
        }
    }
});
