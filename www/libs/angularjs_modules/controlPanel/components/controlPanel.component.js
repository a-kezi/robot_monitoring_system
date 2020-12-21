"use strict";

angular.
module('controlPanel').
component('controlPanel', {  
    templateUrl: '/static/libs/angularjs_modules/controlPanel/templates/controlPanel.html',
    controller: function ($scope, $element, $attrs, $restApiReq) {
        $scope.snapshotSrc =undefined;
        $scope.isRemoteOn =false;
        $scope.isMoveModeOn =true;
        $scope.isSpeakModeOn =false;
        $scope.isChargingModeOn = false;
        $scope.isManualOn = false;
        $scope.isNetworkOn = false;
        $scope.isMoveToOn = false;
        $scope.isInitPoseOn = false;
        $scope.moveToBtnTxt = "지정위치 이동"
        $scope.initPoseBtnTxt = "초기위치 설정"
        $scope.manualPatrolBtnTxt = "지정위치 순찰"
        $scope.isEventActive = false
        $scope.isFowllowRobot = false
        $scope.nats = undefined;
        $scope.connectionCheckPing = undefined;
        $scope.chargingStatus = undefined

        $scope.remoteBtnTime = Date.now()
        


        /*
            connection functions
        */
        $scope.onRemoteBtn = async function(ev){
            let now = Date.now()
            if((now-$scope.remoteBtnTime)<3000) return false
            if(!$scope.isRemoteOn){
                // try connect
                $scope.remoteBtnTime = Date.now()
                if($scope.$root.dataShare.crt_robot=="99"){
                    alert("로봇을 선택해주세요")
                }else{
                    if(await $scope.connectNats()){
                        console.log("## nats connected")
                        if(await $scope.changeRemoteMode()){
                            console.log("## robot state changed to remote_control")
                            $scope.isRemoteOn = !$scope.isRemoteOn;
                        }else{
                            alert("로봇 상태를 변경할 수 없습니다.")
                            console.error("## can't chnage robot state")
                            await $scope.disconnectNats()
                            return false
                        }
                    }else{
                        alert("로봇에 연결을 할 수 없습니다.")
                        console.error("## can't connect to nats")
                        return false
                    }
                }
            }else{
                // try disconnect
                $scope.remoteBtnTime = Date.now()
                $scope.manualOff()
            }
            
        }
        $scope.manualOff = async function(){
            // try disconnect
            await $scope.changeRemoteMode()
            await $scope.disconnectNats()
            $scope.isRemoteOn = !$scope.isRemoteOn;
        }
        $scope.changeRemoteMode = function(){
            console.log("## try to disconnect nats")
            return new Promise(async (resolve, reject) => {
                if(!$scope.isRemoteOn){
                    // 수동 변경 요청
                    let topic_node = `${$scope.$root.dataShare.crt_robot.id}.remote.context_change`;
                    let new_msg = { 
                        timestamp: Date.now(),
                        target_robot: $scope.$root.dataShare.crt_robot.id,
                        msg_id: Date.now(),
                        type: "cmd_contex_change",
                        data: { 
                            req : 1
                        }
                    }
                    $scope.nats.request(
                        topic_node, 
                        MsgPacket.dumpPacket(new_msg), 
                        { max: 1, timeout: 3000 }, (msg) => {
                            if (msg instanceof NATS.NatsError && msg.code === NATS.REQ_TIMEOUT) {
                                console.log('request timed out')
                                alert("로봇 수동모드 변경요청 시간초과")
                                resolve(false)
                            } else {
                                let parsed_msg = JSON.parse(msg)
                                if(parsed_msg.success){
                                    console.log("수동 변경 성공")
                                    resolve(true)
                                }else{
                                    console.log("수동 변경 실패")
                                    resolve(false)
                                }
                            }
                        }
                    )
                }else{
                    // 수동 종료 요청
                    let topic_node = `${$scope.$root.dataShare.crt_robot.id}.remote.context_change`;
                    let new_msg = { 
                        timestamp: Date.now(),
                        target_robot: $scope.$root.dataShare.crt_robot.id,
                        msg_id: Date.now(),
                        type: "cmd_contex_change",
                        data: { 
                            req : 0
                        }
                    }
                    $scope.nats.request(
                        topic_node, 
                        MsgPacket.dumpPacket(new_msg), 
                        { max: 1, timeout: 3000 }, (msg) => {
                            if (msg instanceof NATS.NatsError && msg.code === NATS.REQ_TIMEOUT) {
                                console.log('request timed out')
                                alert("로봇 수동모드 변경요청 시간초과")
                                resolve(false)
                            } else {
                                let parsed_msg = JSON.parse(msg)
                                if(!parsed_msg.success){
                                    console.log("수동 변경 성공")
                                    resolve(true)
                                }else{
                                    console.log("수동 변경 실패")
                                    resolve(false)
                                }
                            }
                        }
                    )
                }
            });
        }
        $scope.connectNats = function() {
            return new Promise(async (resolve, reject) => {
                console.log("## try to connect to nats")
                console.log(`ws://${nats_ip}:${nats_relay_port}/events/websocket`)
                $scope.nats = NATS.connect({ url: `ws://${nats_ip}:${nats_relay_port}/events/websocket`});
                $scope.nats.on('connect', () => {
                    $scope.photo_result = $scope.nats.subscribe(`${$scope.$root.dataShare.crt_robot.id}.remote.take_photo.result`,function(msg){
                        let parsed_msg = JSON.parse(msg)
                        // $scope.snapshotSrc = parsed_msg.result.image[0]
                        $scope.snapshotSrc = `data:image/jpeg;base64,`+parsed_msg.result.image[0]
                    });
                    $scope.chargingStatus_msg = $scope.nats.subscribe(`${$scope.$root.dataShare.crt_robot.id}.status.battery`,function(msg){
                        let parsed_msg = JSON.parse(msg)
                        if(parsed_msg.result.data.charging){
                            $scope.chargingStatus = true
                        }else{
                            $scope.chargingStatus = false
                        }
                    });
                    $scope.nav_status_msg = $scope.nats.subscribe(`${$scope.$root.dataShare.crt_robot.id}.status.nav_status`,function(msg){
                        let parsed_msg = JSON.parse(msg)
                        if(parsed_msg.result.act_status=="DockingToStationActionHandler"){
                            $scope.dockingActionStatus = true
                        }else if(parsed_msg.result.act_status=="EjectFromStationActionHandler"){
                            $scope.ejectingActionStatus = true
                        }else{
                            $scope.dockingActionStatus = false
                            $scope.ejectingActionStatus = false
                        }
                    });
                    $scope.connectionCheckPing = setInterval(function(){
                        let topic_node = `${$scope.$root.dataShare.crt_robot.id}.remote.check`
                        $scope.nats.publish(topic_node,"");
                    },1000)
                    resolve(true);
                })
            });
        }
        $scope.disconnectNats = function() {
            console.log("## try to disconnect nats")
            return new Promise(async (resolve, reject) => {
                clearInterval($scope.connectionCheckPing)
                $scope.nats.unsubscribe($scope.photo_result);
                $scope.nats.unsubscribe($scope.chargingStatus_msg);
                $scope.nats.unsubscribe($scope.nav_status_msg);
                $scope.nats = undefined
                resolve(true);
            });
        }
        $scope.disconnectNatsAsync = function() {
            console.log("## try to disconnect nats")
            clearInterval($scope.connectionCheckPing)
            $scope.nats.unsubscribe($scope.photo_result);
            $scope.nats.unsubscribe($scope.chargingStatus_msg);
            $scope.nats.unsubscribe($scope.nav_status_msg);
            $scope.nats = undefined
        }

        /*
            event handle
        */
        window.addEventListener("siteChanged", function(e) {
            // try disconnect
            if($scope.isRemoteOn){
                $scope.disconnectNatsAsync()
                $scope.isRemoteOn = false
            }
        });

        window.addEventListener("zoneChanged", function(e) {
            // try disconnect
            if($scope.isRemoteOn){
                $scope.disconnectNatsAsync()
                $scope.isRemoteOn = false
            }
        });
        window.addEventListener("robotChanged", function(e) {
            // try disconnect
            if($scope.isRemoteOn){
                $scope.disconnectNatsAsync()
                $scope.isRemoteOn = false
            }
        });

        $scope.$watch("$root.dataShare.crt_robot.context", function (newValue, oldValue) {
            console.log(newValue, oldValue)
            if(newValue!="control"){
                if($scope.isRemoteOn){
                    $scope.disconnectNatsAsync()
                    $scope.isRemoteOn = false
                }
            }
        },true)
        $scope.$watch("$root.dataShare.crt_robot.connected", function (newValue, oldValue) {
            if(newValue==false){
                if($scope.isRemoteOn){
                    $scope.disconnectNatsAsync()
                    
                }
            }
        },true)
        $scope.$watch("isMoveToOn", function (newValue, oldValue) {
            if(newValue){
                $scope.moveToBtnTxt = "CANCEL"
            }else{
                $scope.moveToBtnTxt = "지정위치 이동"
            }
        },true)
        $scope.$watch("isInitPoseOn", function (newValue, oldValue) {
            if(newValue){
                $scope.initPoseBtnTxt = "CANCEL"
            }else{
                $scope.initPoseBtnTxt = "초기위치 설정"
            }
        },true)
        
        
        /*
            functions
        */
        $scope.eulerToQt = function (rad) {
            let yaw = -rad
            let pitch = 0
            let roll = 0

            let qx = Math.sin(roll/2) * Math.cos(pitch/2) * Math.cos(yaw/2) - Math.cos(roll/2) * Math.sin(pitch/2) * Math.sin(yaw/2)
            let qy = Math.cos(roll/2) * Math.sin(pitch/2) * Math.cos(yaw/2) + Math.sin(roll/2) * Math.cos(pitch/2) * Math.sin(yaw/2)
            let qz = Math.cos(roll/2) * Math.cos(pitch/2) * Math.sin(yaw/2) - Math.sin(roll/2) * Math.sin(pitch/2) * Math.cos(yaw/2)
            let qw = Math.cos(roll/2) * Math.cos(pitch/2) * Math.cos(yaw/2) + Math.sin(roll/2) * Math.sin(pitch/2) * Math.sin(yaw/2)
            
            return {
                qx: qx,
                qy: qy,
                qz: qz,
                qw: qw
            }
        }
        $scope.downEvCallback = function(ev){
            console.log("DOWN - EvCallback")
            // console.log(ev);
            // console.log(ev.offsetX, ev.offsetY);
            let x = ev.offsetX;
            let y = ev.offsetY;
            
            if ($scope.isInitPoseOn) {
                $scope.init_pose = {
                    start: {
                        x: x,
                        y: y
                    }
                }
            }
            if ($scope.isMoveToOn) {
                $scope.move_pose = {
                    start: {
                        x: x,
                        y: y
                    }
                }
            }
        }
        $scope.upEvCallback = function(ev){
            console.log("UP - EvCallback")
            console.log("------------------");
            // console.log($scope.move_pose);
            // console.log(ev.offsetX, ev.offsetY);

            let x = ev.offsetX;
            let y = ev.offsetY;
            
            if ($scope.isInitPoseOn || $scope.isMoveToOn) {
                let dx = 0;
                let dy = 0;
                let pose;
                if ($scope.isInitPoseOn) {
                    dx = x - $scope.init_pose.start.x;
                    dy = y - $scope.init_pose.start.y;
                    // console.log($scope.init_pose.start);
                }
                if ($scope.isMoveToOn) {
                    dx = x - $scope.move_pose.start.x;
                    dy = y - $scope.move_pose.start.y;
                    // console.log($scope.move_pose.start);
                }
                
                // console.log(e);
                // console.log(dx, dy);
                let qt = $scope.eulerToQt(Math.atan2(dy, dx))
                if ($scope.isInitPoseOn) {
                    pose = $scope.$root.mapview_scope.getPose({
                        left: $scope.init_pose.start.x,
                        top: $scope.init_pose.start.y
                    })
                    console.log(pose.x, pose.y)
                    let topic_node = `${$scope.$root.dataShare.crt_robot.id}.remote.initial_pose`;
                    let message = {
                        timestamp:Date.now(),
                        msg_id:Date.now().toString(),
                        data:{
                            x: pose.x,
                            y: pose.y,
                            qx: qt.qx,
                            qy: qt.qy,
                            qz: qt.qz,
                            qw: qt.qw
                        }
                    }
                    console.log("init pose pub");
                    $scope.nats.publish(topic_node,MsgPacket.dumpPacket(message));
                }
    
                if ($scope.isMoveToOn) {
                    pose = $scope.$root.mapview_scope.getPose({
                        left: $scope.move_pose.start.x,
                        top: $scope.move_pose.start.y
                    })
                    // console.log(pose.x, pose.y)
                    let topic_node = `${$scope.$root.dataShare.crt_robot.id}.remote.move_to`;
                    let message = {
                        timestamp:Date.now(),
                        msg_id:Date.now().toString(),
                        data:{
                            x: pose.x,
                            y: pose.y,
                            qx: qt.qx,
                            qy: qt.qy,
                            qz: qt.qz,
                            qw: qt.qw
                        }
                    }
                    console.log("move to pub");
                    $scope.nats.publish(topic_node,MsgPacket.dumpPacket(message));
                }
            }
            $(".controller-mv").find(".content-wrapper").unbind("touchstart mousedown")
            $(".controller-mv").find(".content-wrapper").unbind("touchend mouseup")
            $scope.isEventActive = false
            $scope.isMoveToOn = false;
            $scope.isInitPoseOn = false;
            let opt = {
                enable: {
                    pan: true
                }
            }
            $scope.$root.mapview_scope.setup(opt)
        }
        $scope.onPopup = function(event){
            console.log("onPopup")
            let modal_content =`
                <div id="modal-content-wrapper">
                    <div id='modal-content-title'>
                        <span>이미지</span>
                    </div>
                    <div id='modal-content-data'>
                        <img src='${$scope.snapshotSrc}'/>   
                    </div>
                </div>
            `
            //화면에 레이어 추가
            $('#modal-content').append(modal_content)
            $('#modal-content-case').css("display","initial")
        }
        $scope.onMoveModeBtn = function(ev){
            $scope.isMoveModeOn = true;
            $scope.isSpeakModeOn = false;
            $scope.isChargingModeOn = false;
        }
        $scope.onSpeakModeBtn = function(ev){
            $scope.isMoveModeOn = false;
            $scope.isSpeakModeOn = true;
            $scope.isChargingModeOn = false;
        }
        $scope.onChargingModeBtn = function(ev){
            $scope.isMoveModeOn = false;
            $scope.isSpeakModeOn = false;
            $scope.isChargingModeOn = true;
        }
        $scope.followRobotView = function(){
            // TODO: robot follow 만들기
            $scope.isFowllowRobot = !$scope.isFowllowRobot

        }


        /*
            remote cmd
        */
        $scope.onDocking = function(){
            console.log("## onDocking")
            if(!$scope.isRemoteOn) return false
            if($scope.dockingActionStatus) return false
            if($scope.chargingStatus) return false
            $scope.nats.publish(`${$scope.$root.dataShare.crt_robot.id}.remote.docking`,"")
        }
        $scope.onDockingCancel = function(){
            console.log("## onDockingCancel")
            if(!$scope.isRemoteOn) return false
            if($scope.ejectingActionStatus) return false
            if($scope.chargingStatus) return false
            $scope.nats.publish(`${$scope.$root.dataShare.crt_robot.id}.remote.docking.cancel`,"")
        }
        $scope.onUndocking = function(){
            console.log("## onUndocking")
            if(!$scope.isRemoteOn) return false
            if($scope.ejectingActionStatus) return false
            if(!$scope.chargingStatus) return false
            $scope.nats.publish(`${$scope.$root.dataShare.crt_robot.id}.remote.eject`,"")
        }
        $scope.onSnapshotBtn = function(ev){
            console.log("## snapshot")
            if(!$scope.isRemoteOn) return false
            $scope.nats.publish(`${$scope.$root.dataShare.crt_robot.id}.remote.take_photo`,"")
            
        }
        $scope.onSpeakCmd = function(ev){
            console.log("## speak")
            if(!$scope.isRemoteOn) return false
            let topic_node = `${$scope.$root.dataShare.crt_robot.id}.remote.speak`
            let sentence = $element.find("#speak").val()
            let speak_data = {
                sentence: sentence,
                lang_code: "KOR"
            };
            console.log(speak_data)
            $scope.nats.publish(topic_node, MsgPacket.dumpPacket(speak_data));
        }
        $scope.onMoveCancel = function(){
            console.log("## move cancel")
            if(!$scope.isRemoteOn) return false
            let topic_node = `${$scope.$root.dataShare.crt_robot.id}.remote.move_to.cancel`;
            let message = {}
            $scope.nats.publish(topic_node,MsgPacket.dumpPacket(message));
        }
        $scope.onMoveToBtn = function(){
            console.log("onMoveToBtn")
            if(!$scope.isRemoteOn) return false
            if(!$scope.isMoveToOn){
                // moveto 활성화
                if(!$scope.isEventActive){
                    $(".controller-mv").find(".content-wrapper").bind("touchstart mousedown", $scope.downEvCallback)
                    $(".controller-mv").find(".content-wrapper").bind("touchend mouseup", $scope.upEvCallback)
                    $scope.isEventActive = true
                }
                $scope.isMoveToOn = true;
                $scope.isInitPoseOn = false;
                let opt = {
                    enable: {
                        pan: false
                    }
                }
                $scope.$root.mapview_scope.setup(opt)
            }else{
                // moveto 취소
                $(".controller-mv").find(".content-wrapper").unbind("touchstart mousedown")
                $(".controller-mv").find(".content-wrapper").unbind("touchend mouseup")
                $scope.isEventActive = false
                $scope.isMoveToOn = false;
                let opt = {
                    enable: {
                        pan: true
                    }
                }
                $scope.$root.mapview_scope.setup(opt)
            }
        }
        $scope.onLocalizationFaultResetBtn = function(){
            console.log("onLocalizationFaultResetBtn")
            if(!$scope.isRemoteOn) return false
            let topic_node = `${$scope.$root.dataShare.crt_robot.id}.remote.localization_fault.refresh`
            $scope.nats.publish(topic_node, "");
        }
        $scope.onInitPoseBtn = function(){
            console.log("onInitPoseBtn")
            if(!$scope.isRemoteOn) return false
            if(!$scope.isInitPoseOn){
                // init pose 활성화
                if(!$scope.isEventActive){
                    $(".controller-mv").find(".content-wrapper").bind("touchstart mousedown", $scope.downEvCallback)
                    $(".controller-mv").find(".content-wrapper").bind("touchend mouseup", $scope.upEvCallback)
                    $scope.isEventActive = true
                }
                $scope.isInitPoseOn = true;
                $scope.isMoveToOn = false;
                let opt = {
                    enable: {
                        pan: false
                    }
                }
                $scope.$root.mapview_scope.setup(opt)
            }else{
                // init pose 취소
                $(".controller-mv").find(".content-wrapper").unbind("touchstart mousedown")
                $(".controller-mv").find(".content-wrapper").unbind("touchend mouseup")
                $scope.isEventActive = false
                $scope.isInitPoseOn = false;
                let opt = {
                    enable: {
                        pan: true
                    }
                }
                $scope.$root.mapview_scope.setup(opt)
            }
        }


        /*
            control key events
        */
        $(window).keydown(function(event){
            if(!$scope.isRemoteOn) return false
            let key = event.keyCode;
            let topic_node="";
            let message ={};
            switch(key){
                case 49: // keyboard "1"
                    topic_node = `${$scope.$root.dataShare.crt_robot.id}.remote.head_control`;
                    message = {
                        timestamp:Date.now(),
                        msg_id:Date.now().toString(),
                        data:{
                            angle:10.0
                        }
                    }
                    $scope.nats.publish(topic_node,MsgPacket.dumpPacket(message));
                    console.log("## head control");
                    break;
                case 50: // keyboard "2"
                    topic_node = `${$scope.$root.dataShare.crt_robot.id}.remote.head_control`;
                    message = {
                        timestamp:Date.now(),
                        msg_id:Date.now().toString(),
                        data:{
                            angle:0.0
                        }
                    }
                    $scope.nats.publish(topic_node,MsgPacket.dumpPacket(message));
                    console.log("## head control");
                    break;
                case 51: // keyboard "3"
                    topic_node = `${$scope.$root.dataShare.crt_robot.id}.remote.head_control`;
                    message = {
                        timestamp:Date.now(),
                        msg_id:Date.now().toString(),
                        data:{
                            angle:-10.0
                        }
                    }
                    $scope.nats.publish(topic_node,MsgPacket.dumpPacket(message));
                    console.log("## head control");
                    break;
                case 32: // keyboard "space"
                    console.log("## snapshot");
                    $scope.onSnapshotBtn()
                    break;
                case 191: // keyboard "/"
                    $scope.followRobotView()
                    console.log("## follow robot view");
                    break;
                case 37:
                    if(!$scope.isMoveModeOn) break;
                    //왼쪽
                    topic_node = `${$scope.$root.dataShare.crt_robot.id}.remote.cmd_vel`;
                    message = {
                        timestamp:Date.now(),
                        msg_id:Date.now().toString(),
                        data:{
                            linear:{
                                x:0.0,
                                y:0.0,
                                z:0.0
                            },
                            angular:{
                                x:0.0,
                                y:0.0,
                                z:0.4
                            }
                        }
                    }
                    $scope.nats.publish(topic_node,MsgPacket.dumpPacket(message));
                    console.log("left");
                    $("#move-key-btn-left").css({
                        opacity:"50%"
                    });
                    break;
                case 38:
                    if(!$scope.isMoveModeOn) break;
                    //위      
                    topic_node = `${$scope.$root.dataShare.crt_robot.id}.remote.cmd_vel`;
                    message = {
                        timestamp:Date.now(),
                        msg_id:Date.now().toString(),
                        data:{
                            linear:{
                                x:0.4,
                                y:0.0,
                                z:0.0
                            },
                            angular:{
                                x:0.0,
                                y:0.0,
                                z:0.0
                            }
                        }
                    }
                    $scope.nats.publish(topic_node,MsgPacket.dumpPacket(message));
                    console.log("up");
                    $("#move-key-btn-up").css({
                        opacity:"50%"
                    });
                    break;
                case 39:
                    if(!$scope.isMoveModeOn) break;
                    //오른쪽    
                    topic_node = `${$scope.$root.dataShare.crt_robot.id}.remote.cmd_vel`;
                    message = {
                        timestamp:Date.now(),
                        msg_id:Date.now().toString(),
                        data:{
                            linear:{
                                x:0.0,
                                y:0.0,
                                z:0.0
                            },
                            angular:{
                                x:0.0,
                                y:0.0,
                                z:-0.4
                            }
                        }
                    }
                    $scope.nats.publish(topic_node,MsgPacket.dumpPacket(message));
                    console.log("right");
                    $("#move-key-btn-right").css({
                        opacity:"50%"
                    });
                    break;
                case 40:
                    if(!$scope.isMoveModeOn) break;
                    //아래   
                    topic_node = `${$scope.$root.dataShare.crt_robot.id}.remote.cmd_vel`;
                    message = {
                        timestamp:Date.now(),
                        msg_id:Date.now().toString(),
                        data:{
                            linear:{
                                x:-0.4,
                                y:0.0,
                                z:0.0
                            },
                            angular:{
                                x:0.0,
                                y:0.0,
                                z:0.0
                            }
                        }
                    }
                    $scope.nats.publish(topic_node,MsgPacket.dumpPacket(message));
                    
                    console.log("down");
                    $("#move-key-btn-down").css({
                        opacity:"50%"
                    });
                    break;
            }
        });

        $(window).keyup(function(event){
            let key = event.keyCode;
            switch(key){
                case 37:
                    //왼쪽
                    $("#move-key-btn-left").css({
                        opacity:"100%"
                    });
                    break;
                case 38:
                    //위      
                    $("#move-key-btn-up").css({
                        opacity:"100%"
                    });
                    break;
                case 39:
                    //오른쪽  
                    $("#move-key-btn-right").css({
                        opacity:"100%"
                    });  
                    break;
                case 40:
                    //아래  
                    $("#move-key-btn-down").css({
                        opacity:"100%"
                    }); 
                    break;
            }
        });
    }
});
