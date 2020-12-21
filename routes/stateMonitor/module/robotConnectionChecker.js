'use strict'
const NATS = require('nats');
const emitter = require(__dirname+'/emitter')
const request = require('request')

function robotConnectionChecker(){

    this.init = function(natsInfo, robotList){
        robotConnectionChecker.prototype.natsIP = natsInfo.ip
        robotConnectionChecker.prototype.nats = NATS.connect({url: `nats://${natsInfo.ip}:${natsInfo.port}`});
        let nc = robotConnectionChecker.prototype.nats
        let proto_ = robotConnectionChecker.prototype
        
        // make checking list
        robotList.forEach(robot => {
            proto_.needToCheckRobotList.push({
                status:false,
                robot_id: robot.id
            })
        });

        // set nats subscribe
        nc.on('connect', () => {
            // console.log(`## NATS : connected`);
            nc.on('error', (err) => {
                // console.log(err)
            })
        
            nc.subscribe('robot.connection.registration', function (msg) {
                // console.log('## robot connected : ' + parsed_msg.robot_id)
                let parsed_msg = JSON.parse(msg)
                let index = proto_.getRobotIndexByRobotId(parsed_msg.robot_id)

                if(index!=null){
                    if(proto_.getConnectionStateByIndex(index)){
                        // record = true
                        // pass
                    }else{
                        //record = false
                        proto_.setRobotConnected(parsed_msg.robot_id)
                    }
                }else{
                    console.log("## robot connection registration: can't find requested robot")
                }
            })
        
            nc.subscribe('robotDisconnected', function (msg) {
                let parsed_msg = JSON.parse(msg)
                // console.log('robot disconnected : ' + parsed_msg)
                proto_.setRobotDisconnected(parsed_msg.robot_id)
                
            })

            setInterval(function(){
                proto_.connectionMonitoring();
            },1000)
        })
    }

    this.getRobotConnectionList = function(){
        return robotConnectionChecker.prototype.checkingList
    }
    this.setDisconnectedCallback = function(callback){
        let proto_ = robotConnectionChecker.prototype;
        proto_.emitter.eventBus.on('robotDisconnected', callback)
    }
    this.setConnectedCallback = function(callback){
        let proto_ = robotConnectionChecker.prototype;
        proto_.emitter.eventBus.on('robotConnected', callback)
    }
}




robotConnectionChecker.prototype.connectionMonitoring = function(){
    let proto_ = robotConnectionChecker.prototype

    request(`http://${proto_.natsIP}:8222/connz`, function (error, response, body) {
        // console.log(JSON.parse(body).connections)
        if(error == null){
            let connectionList = JSON.parse(body).connections
            let connectedNameList = [];
            connectionList.forEach(item=>{
                if(item.name){
                    connectedNameList.push(item.name)
                }
            })
            proto_.connectionCheckInterval(connectedNameList)
        }
    });
};
robotConnectionChecker.prototype.connectionCheckInterval = function(connectedNameList){
    let proto_ = robotConnectionChecker.prototype
    for( let i = 0 ; i < proto_.needToCheckRobotList.length; i++ ){
        let id = proto_.needToCheckRobotList[i].robot_id
        if(connectedNameList.includes(id)){
            // NATS에서 확인할 때 있는 경우
            if(proto_.getConnectionStateByIndex(i)){
                //nats_check = true , record = true
                // pass
            }else{
                //nats_check = true , record = false
                // update state to true
                proto_.setRobotConnected(id)
                
            }
        }else{
            // NATS에서 확인할 때 없는 경우
            if(proto_.getConnectionStateByIndex(i)){
                //nats_check = false , record = true
                // update state to false
                proto_.setRobotDisconnected(id)
            }else{
                //nats_check = false , record = false
                // pass
            }
        }
    }
}
robotConnectionChecker.prototype.setRobotDisconnected = function(robot_id){
    let proto_ = robotConnectionChecker.prototype
    let index = proto_.getRobotIndexByRobotId(robot_id)

    if(index!=null){
        proto_.needToCheckRobotList[index].status = false
        proto_.emitter.eventBus.sendEvent('robotDisconnected', robot_id)
        console.log(proto_.needToCheckRobotList[index])
    }
};
robotConnectionChecker.prototype.setRobotConnected = function(robot_id){
    let proto_ = robotConnectionChecker.prototype
    let index = proto_.getRobotIndexByRobotId(robot_id)

    if(index!=null){
        proto_.needToCheckRobotList[index].status = true
        proto_.emitter.eventBus.sendEvent('robotConnected', robot_id)
        console.log(proto_.needToCheckRobotList[index])
    }
};
robotConnectionChecker.prototype.getConnectionStateByIndex = function(index){
    let proto_ = robotConnectionChecker.prototype
    return proto_.needToCheckRobotList[index].status
}
robotConnectionChecker.prototype.getRobotIndexByRobotId = function(id){
    let proto_ = robotConnectionChecker.prototype
    let index
    let isFound = false
    let num = 0
    proto_.needToCheckRobotList.some(robot => {
        if(robot.robot_id == id){
            isFound = true
            index = num
        }
        num += 1
        return isFound
    })
    return (isFound ? index : null)
}

robotConnectionChecker.prototype.emitter = emitter;
robotConnectionChecker.prototype.nats = null;
robotConnectionChecker.prototype.needToCheckRobotList = [];


module.exports = robotConnectionChecker;