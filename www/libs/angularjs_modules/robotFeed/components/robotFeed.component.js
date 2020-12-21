"use strict";
let robotFeed_rest_ip = $("#serverIp").val()
let robotFeed_rest_port = $("#serverPort").val()
const ROBOTFEED_TOP_STATE = 0
const ROBOTFEED_TOP_STATE_READY = 1
const ROBOTFEED_SEARCH_STATE = 2
const ROBOTFEED_LOADING_STATE = 3

const ROBOTFEED_UPWARD = 0
const ROBOTFEED_DOWNWARD = 1
const ROBOTFEED_QUEUE_CHECK_TIME = 300 // ms
const ROBOTFEED_MAX_FEED_NUMBER = 15
const ROBOTFEED_CUT_TOP = 0
const ROBOTFEED_CUT_BOTTOM = 1

const ROBOTFEED_ALL_TYPE = "0"

const GET_RECENT_ROBOTFEED_API_URL = `http://${robotFeed_rest_ip}:${robotFeed_rest_port}/rest/robotfeed/list/recent`;
const GET_PAST_ROBOTFEED_API_URL = `http://${robotFeed_rest_ip}:${robotFeed_rest_port}/rest/robotfeed/list/past`;

angular.
module('robotFeed').
component('robotFeed', {  
    templateUrl: '/static/libs/angularjs_modules/robotFeed/templates/robotFeed.html',
    controller: function ($scope, $element, $attrs, $restApiReq) {
        $scope.type_list = [
            {
                type: "connected",
                display_name: "로봇 연결"
            },
            {
                type: "context",
                display_name: "로봇 상태"
            },
            {
                type: "fault",
                display_name: "로봇 에러"
            }
        ]
        $scope.feed = []; // msg feed
        $scope.tempQueue = []; // msg가 임시로 담겼다 들어올 queue
        $scope.scrollPos = 0; // 현재 스크롤 pos
        $scope.state = ROBOTFEED_TOP_STATE; // 상태 변경 -> top
        $scope.latestMsg = {}; // 가장 최근 들어온 메세지
        $scope.natsInstance = {}; // nats sub 모음
        $scope.selectedType = ROBOTFEED_ALL_TYPE;
        $scope.selectedTypeName = "All"
        $scope.queueTap;
        /*
            event handle
        */
        window.addEventListener("robotChanged", function(e) {
            // console.log("getRobot finished");

            // 로봇 정보 가져올 타이밍 - 추가 필요 작업중.

            $scope.$root.dataShare.robotlist.forEach(robot=>{
                switch(robot.type){
                    default:
                        robot["profile"] = "/static/imgs/icons/p.png"
                        break;
                    case "addy":
                        robot["profile"] = "/static/imgs/robots/profile-addy.png"
                        break;
                    case "cart":
                        // robot["profile"] = "/static/imgs/robots/profile-cart.png"
                        robot["profile"] = "/static/imgs/icons/p.png"
                        break;
                    case "sero":
                        robot["profile"] = "/static/imgs/robots/profile-sero.png"
                        break;
                }
            })
        });

        window.addEventListener("robotChanged", function(e) {
            // console.log("-----getRobot changed");
            $scope.clearFeed();
            if($scope.$root.isRobotReady && $scope.$root.isSubListReady){
                $scope.feedRefresh();
            }
        });

        window.addEventListener("getSubListFinished", function(e) {
            // console.log("get SubList Finished");
            $scope.clearFeed();
            if($scope.$root.isRobotReady && $scope.$root.isSubListReady){
                $scope.feedRefresh();
            }
        });

        window.addEventListener("zoneChanged", function(e) {
            if($scope.$root.isZoneReady){
                $('.robot-feed-body').scroll(scrollEvHandler);
            }
        });
        
        $(window).resize(function () {
            $(".robot-feed-body-case").height($(window).height()-511);
        });
        $(document).ready(function(){
            $(".robot-feed-body-case").height($(window).height()-511);
        });
        
        /*
            functions
        */
        $scope.chooseAllType = function(index){
            console.log("choose all Type");
            $scope.selectedType = ROBOTFEED_ALL_TYPE;
            $scope.selectedTypeName = "All"
            $scope.clearFeed();
            if($scope.$root.dataShare.crt_zone!=null){
                $scope.feedRefresh();
            }
        }

        $scope.chooseType = function(index){
            console.log(`choose ${index} Type`);
            $scope.selectedType = $scope.type_list[index].type;
            $scope.selectedTypeName = $scope.type_list[index].display_name;
            $scope.clearFeed();
            if($scope.$root.dataShare.crt_zone!=null){
                $scope.feedRefresh();
            }
        }

        $scope.queueOpen = function(){
            $scope.queueTap = setInterval(function(){
                if(
                    ($scope.tempQueue.length!=0) &&
                    ($scope.state === ROBOTFEED_TOP_STATE)
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

        $scope.getTypeDisplayName = function(type){
            if(type==undefined) return "";
            if($scope.type_list.length==0) return "";
            let name = "";
            $scope.type_list.forEach(item=>{
                if(type == item.type){
                    name = item.display_name;
                }
            })
            return name            
        }
        $scope.clearFeed = function(){
            // stop subscribing all nats subjects
            $scope.natsSubStopAll();
            $scope.feed=[];
        }

        $scope.feedRefresh = function(){
            // stop subscribing all nats subjects
            $scope.natsSubStopAll();
            $scope.feed=[];
            $scope.tempQueue = [];
            $scope.state = ROBOTFEED_LOADING_STATE;
            componentLoadingMask("robot-feed-area","loading_thrabber_s_ropti.svg");
            let reqInfo = $scope.getQueryInfo("lt",Date.now());
            $restApiReq.get(reqInfo,function(res){
                $scope.$apply(function(){
                    if(res.length!=0){
                        res.forEach(item=>{
                            $scope.feed.push(item);
                        })
                    }else if(res.length==0){
                        console.log("End of data");
                    }
                });
                
                $scope.state = ROBOTFEED_TOP_STATE;
                closeComponentLoadingMask("robot-feed-area");
                // start to subscribe nats subjects
                setTimeout(function(){
                    console.log("####### sub start");
                    $scope.natsSubStart(nats, $scope.$root.dataShare.subList, "robot_status", robotStatusMsgHandle);

                },200)
            })

            
        }

        $scope.queueInsert = function(msg){
            // console.log(msg);
            let isRobotTrue =false;
            let isTypeTrue =false;

            // robot check
            if($scope.$root.dataShare.crt_robot.id=== msg.robot_id){
                isRobotTrue = true;
            }
            
            // feed type check
            if($scope.selectedType=== ROBOTFEED_ALL_TYPE){
                isTypeTrue = true;
            }else if($scope.selectedType=== msg.type){
                isTypeTrue = true;
            }
            
            
            if(isRobotTrue && isTypeTrue){
                $scope.tempQueue.unshift(msg);
            }
            
        }

        $scope.moveScroll = function(target, pos, ms){
            $(`#${target}`).animate({scrollTop : pos}, ms, function(){
                console.log("## moveScroll to ", pos);
                $scope.scrollPos = pos;
            })
        }

        $scope.cutBottomFeed = function(){
            if($scope.feed.length>ROBOTFEED_MAX_FEED_NUMBER){
                $scope.feed = $scope.feed.slice(0, ROBOTFEED_MAX_FEED_NUMBER);
            }
        }

        $scope.cutTopFeed = function(){
            // console.log($scope.feed);
            if($scope.feed.length>ROBOTFEED_MAX_FEED_NUMBER){
                $scope.feed = $scope.feed.slice($scope.feed.length-ROBOTFEED_MAX_FEED_NUMBER,$scope.feed.length);
                // console.log($scope.feed);
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

        $scope.getQueryInfo = function (rage,time){
            // query setup
            let queryRobot = [];
            let queryFeedtype = [];
            queryRobot.push($scope.$root.dataShare.crt_robot.id);
            if($scope.selectedType===ROBOTFEED_ALL_TYPE){
                // console.log($scope.type_list);
                $scope.type_list.forEach(item=>{
                    queryFeedtype.push(item.type);
                })
            }else{
                queryFeedtype.push($scope.selectedType);
            }

            let reqInfo;
            if(rage=="lt"){
                reqInfo = {
                    url: GET_PAST_ROBOTFEED_API_URL,
                    type: 'GET',
                    param: {
                        lt: time,
                        zone: $scope.$root.dataShare.crt_zone.zoneID,
                        robot: queryRobot.length==0?0:queryRobot,
                        feedtype: queryFeedtype,
                        limit:5
                    }
                }

            }else if(rage=="gt"){
                reqInfo = {
                    url: GET_RECENT_ROBOTFEED_API_URL,
                    type: 'GET',
                    param: {
                        gt: time,
                        zone: $scope.$root.dataShare.crt_zone.zoneID,
                        robot: queryRobot.length==0?0:queryRobot,
                        feedtype: queryFeedtype,
                        limit:5
                    }
                }
            }
            return reqInfo
        }



        /*
            스크롤 이벤트 처리 부분
        */
        function scrollEvHandler(event){
            let target = $(this);
            let scrollTop = target.scrollTop(); //스크롤바의 상단위치
            if($scope.state==ROBOTFEED_LOADING_STATE){
                event.preventDefault();
                event.stopPropagation();
                $scope.scrollPos = scrollTop;
                return false;
            }

            
            let containerHeight = target.height(); //스크롤바를 갖는 div의 높이
            let docHeight = target.prop('scrollHeight'); //스크롤바를 갖는 doc 전체 높이
            let remainingHeight = docHeight-(scrollTop+ containerHeight);
            let posChange = Math.abs(Math.abs($scope.scrollPos)-Math.abs(scrollTop))

            if(posChange>200){
                $scope.scrollPos = scrollTop;
                return false;
            }

            $scope.state = ROBOTFEED_SEARCH_STATE;

            function directionCheck(pos){
                if(scrollTop<=$scope.scrollPos) return UPWARD
                if(scrollTop>=$scope.scrollPos) return DOWNWARD
            }


            // 위로 올릴때 이벤트
            
            if(
                (directionCheck(scrollTop)==UPWARD) &&
                (scrollTop==0))
                {
                    console.log("##위로가는 이벤트###############3")
                    // 로딩 페이지 활성화
                    $scope.state = ROBOTFEED_LOADING_STATE;
                    componentLoadingMask("robot-feed-area","loading_thrabber_s_ropti.svg");

                    let time = new Date($scope.feed[0].timestamp).getTime();
                    let reqInfo = $scope.getQueryInfo("gt",time);

                    $restApiReq.get(reqInfo,function(res){
                        console.log("#################")
                        console.log(res);
                        closeComponentLoadingMask("robot-feed-area");







                        // 응답이 0이 아닌경우
                        if(res.length!=0){
                            
                            let list = res;
                            let isLatestMsgInRes =false;
                            console.log($scope.latestMsg);
                            list.some(item=>{
                                if(
                                    item.msg_id == $scope.latestMsg.msg_id || 
                                    $scope.latestMsg == {}
                                    ){
                                    isLatestMsgInRes = true;
                                }
                                return isLatestMsgInRes
                            })
                            
                            if(isLatestMsgInRes==true){
                                // db에서 가져온 결과에 가장 최신 메세지가 있는 경우
                                $scope.state = ROBOTFEED_TOP_STATE_READY;
                                //TODO: getTime 시 utc 타임으로 가져와 db에서 못가져옴
                                let time = new Date($scope.feed[0].timestamp).getTime();
                                let reReqInfo = $scope.getQueryInfo("gt",time);

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
                                        console.log("ROBOTFEED_TOP_STATE");
                                        $scope.state = ROBOTFEED_TOP_STATE;
                                        closeComponentLoadingMask("robot-feed-area");
                                        
                                    }else{ // tempQueue가 비어있을때
                                        re_res.forEach(item=>{
                                            $scope.tempQueue.unshift(item);
                                        })
                                        console.log("ROBOTFEED_TOP_STATE");
                                        $scope.state = ROBOTFEED_TOP_STATE;
                                        closeComponentLoadingMask("robot-feed-area");
                                    }
                                });
                            }else{
                                // db에서 가져온 결과에 가장 최신 메세지가 없을 때
                                $scope.$apply(function(){
                                    list.forEach(item=>{
                                        $scope.feed.unshift(item);
                                    })
                                    $scope.cutBottomFeed();
                                    $scope.moveScroll("robot-feed-area",20,0);
                                    closeComponentLoadingMask("robot-feed-area");
                                    $scope.state = ROBOTFEED_SEARCH_STATE;
                                })
                                
                            }

                        // 응답이 0인 경우
                        }else if(res.length==0){ 
                            console.log("TOP_STATE");
                            $scope.state = TOP_STATE;
                            closeComponentLoadingMask("robot-feed-area");
                        }
                    })
            }

            // 아래로 내릴때 이벤트
            if(
                (directionCheck(scrollTop)==DOWNWARD) &&
                (remainingHeight==0))
                {
                    console.log("##아래로가는 이벤트###############3")

                    // 로딩 페이지 활성화
                    $scope.state = ROBOTFEED_LOADING_STATE;
                    componentLoadingMask("feed-area","loading_thrabber_s_ropti.svg");

                    let time = new Date($scope.feed[$scope.feed.length-1].timestamp).getTime();
                    let reqInfo = $scope.getQueryInfo("lt",time);
                    
                    $restApiReq.get(reqInfo,function(res){
                        if(res.length!=0){
                            $scope.$apply(function(){
                                res.forEach(item=>{
                                    $scope.feed.push(item);
                                })
                                closeComponentLoadingMask("robot-feed-area");
                            });
                            $scope.cutTopFeed();
                            $scope.state = SEARCH_STATE;
                        }else if(res.length==0){
                            closeComponentLoadingMask("robot-feed-area");
                            $scope.state = SEARCH_STATE;
                            // console.log("End of data");
                        }
                    })
            }
            $scope.scrollPos = scrollTop;
        }

        /*
            nats communication
        */
        
        $scope.natsSubStart = function(nats, subList, subjectType, msghandlefunc){
            // console.log(subList);
            subList.typelist.forEach(typeElement=>{
                // console.log(typeElement);
                if($scope.$root.dataShare.robotlist.length!==0){
                    $scope.$root.dataShare.robotlist.forEach(robot=>{
                        if(robot.type===typeElement){
                            subList.subjects[typeElement].forEach(topic=>{
                                if($scope.natsInstance[robot.id]===undefined){
                                    $scope.natsInstance[robot.id] ={}
                                }
                                // console.log(subjectType, topic.type, topic.name);
                                if(subjectType===topic.type){
                                    $scope.natsInstance[robot.id][topic.name] = nats.subscribe(`${robot.id}.${topic.name}`, msghandlefunc);
                                }
                                // console.log($scope.natsInstance[robot.id][topic]);
                                // console.log($scope.natsInstance);
                            })
                        }
                    })
                }
            })
            $scope.queueOpen();
            // console.log($scope.natsInstance);


        }

        $scope.natsSubStop = function(robotID, subject){
            // console.log(`stop sub ${robotID}-${subject}`);
            // nats.unsubscribe($scope.natsInstance[robotID][subject]);
        }

        $scope.natsSubStopAll = function(){
            for(var i in $scope.natsInstance){
                // console.log(i, $scope.natsInstance[i]);
                for(var j in $scope.natsInstance[i]){
                    nats.unsubscribe($scope.natsInstance[i][j]);
                }
            }
            $scope.natsInstance = {};
        }
        $scope.getFeedDesc = function(txt){
            if(txt==1)return "로봇 연결"
            if(txt==0)return "연결 해제"
            return txt
        }
        
        // nats msg callback functions
        function robotStatusMsgHandle(msg){
            // console.log("STATUS");
            let parsed_msg = MsgPacket.parsePacket(msg);
            // console.log(parsed_msg);
            switch(parsed_msg.type){
                default:
                    break;
                case "robot_feed_update":
                    if(
                        ($scope.state===ROBOTFEED_TOP_STATE) || 
                        ($scope.state===ROBOTFEED_TOP_STATE_READY)
                        ){  
                            $scope.queueInsert(parsed_msg);
        
                    }else if($scope.state===ROBOTFEED_SEARCH_STATE){
                        $scope.latestMsg = parsed_msg;
                        
                    }
                    break;
            }
        }

    }
});
