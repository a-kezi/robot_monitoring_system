'use strict'
const yaml = require('js-yaml');
const fs   = require('fs');
const NATS = require('nats');
const request = require('request');
const { v1: uuidv1 } = require('uuid');

class robotInfoCollector {
    constructor(robot, db) {
        try {
            this.monitorConfig = yaml.safeLoad(
                fs.readFileSync(__dirname+'/../../../config/stateMonitorConfig.yaml', 'utf8'));
            this.serverConfig = yaml.safeLoad(
                fs.readFileSync(__dirname+'/../../../config/serverConfig.yaml', 'utf8'));
        } catch (e) {
            console.log("## robotInfoCollector");
            console.log(e);
        }
        this.db = db
        this.monitoringTopics = this.monitorConfig.topics[robot.type]
        this.robot_id = robot.id;
        this.pubInterval = undefined;
        this.intervalGap = 1000;
        this.nc = undefined;
        this.nats_ip = this.serverConfig.nats.ip;
        this.nats_port = this.serverConfig.nats.port;
        this.rest_api_ip = this.serverConfig.server.ip;
        this.rest_api_port = this.serverConfig.server.port;
        this.msgBrokerInit()
        this.connectionCheckInit()

        // robot status
        this.low_battery_criterion = 30
        this.connected = false
        this.context = {
            state: false,
            desc: ""
        }
        this.fault = {
            state: false,
            desc:[]
        }
        this.pose = undefined
        this.globalPlanner = []
        this.site_id = robot.siteID
        this.zone_id = robot.zoneID
        
    }
    // Getter
    get getRobotId(){
        return this.robot_id
    }
    // Method
    pub(){
        let self = this
        this.pubInterval = setInterval(()=>{
            let robot_organized_status = {
                type: "organized_status",
                robot_id: this.robot_id,
                msg_id: uuidv1(),
                timestamp: Date.now(),
                connected: this.connected,
                context: this.context,
                fault: this.fault
            }
            // test
            // let robot_organized_status = {
            //     type: "organized_status",
            //     robot_id: this.robot_id,
            //     timestamp: Date.now(),
            //     msg_id: uuidv1(),
            //     connected: true,
            //     context: {
            //         state:true,
            //         desc:"remote_control"
            //     },
            //     fault: {
            //         state: false,
            //         desc:["err","sensor"]
            //     }
            // }
            let dumpMsg = JSON.stringify(robot_organized_status)
            this.nc.publish(
                `${this.robot_id}.robot_organized_status`,
                dumpMsg)
            this.nc.publish(
                `${this.robot_id}.robot_organized_global_planner`,
                JSON.stringify(self.globalPlanner))
        }, this.intervalGap)
    }
    connectionCheckInit(){
        let self = this
        const options = {
            uri:`http://${self.rest_api_ip}:${self.rest_api_port}/status/robot`, 
            method: 'POST',
            form: {
                robot_id: this.robot_id
            }
        }
        this.connCheckInterval = setInterval(function(){
            request.post(options, function(err,httpResponse,body){
                let temp = self.connected
                self.connected = JSON.parse(body).status =="true" ? true:false;
                if(temp != self.connected){
                    self.pushAlarmMsg("connected", false, self.connected)
                    self.robotFeedUpdatePub("connected", self.connected, "")
                }
            })
        },1000)
    }
    robotFeedUpdatePub(sub_type, data, desc){
        let self = this
        let pub_msg = {
            timestamp: Date.now(),
            robot_id: this.robot_id,
            msg_id: uuidv1(),
            type: "robot_feed_update",
            result:{
                subtype : sub_type,
                data: data,
                desc: desc
            },
            location : {
                site: this.site_id,
                zone: this.zone_id,
                pose: this.pose
            }
        };
        let dumpMsg = JSON.stringify(pub_msg)
        self.nc.publish(
            `${self.robot_id}.robot_feed.update`,
            dumpMsg)
    }
    msgBrokerInit(){
        this.nc = NATS.connect({url: `nats://${this.nats_ip}:${this.nats_port}`});
        this.nc.on('connect', (ev) => {
            this.monitoringTopics.forEach(topic =>{
                let callback = undefined
                let self = this
                switch(topic.type){
                    default:
                        break;
                    case("robot_path"):
                        callback = function (msg) {
                            let parsed_msg = JSON.parse(msg);
                            self.globalPlanner = parsed_msg.result.data
                        }
                        break;
                    case("pose"):
                        callback = function (msg) {
                            let parsed_msg = JSON.parse(msg)
                            self.pose = parsed_msg.location.pose
                        }
                        break;
                    case("context"):
                        callback = function (msg) {
                            let parsed_msg = JSON.parse(msg).result.data
                            // obj to array of [key, value]
                            let result = Object.keys(parsed_msg).map(function (key) { 
                                return [key, parsed_msg[key]]; 
                            }); 
                            let context_state = false
                            let desc = ""
                            result.some( context =>{
                                if(context[1]==false) return false
                                context_state = context[1]
                                desc = context[0]
                                return context_state
                            })
                            let temp = self.context.desc
                            self.context = {
                                state: context_state,
                                desc: desc
                            }
                            if(temp != self.context.desc && self.context.desc!=false){
                                self.robotFeedUpdatePub("context", self.context.desc, "")
                            }
                        }
                        break;
                    case("battery"):
                        callback = function (msg) {
                            let parsed_msg = JSON.parse(msg).result.data
                            if(parsed_msg.charging == true){
                                if(self.fault.state == true){
                                    let idx = self.fault.desc.indexOf("battery")
                                    if (idx > -1) self.fault.desc.splice(idx, 1)
                                    if (self.fault.desc.length==0) self.fault.state = false
                                }else{
                                    let idx = self.fault.desc.indexOf("battery")
                                    if (idx > -1) self.fault.desc.splice(idx, 1)
                                    if (self.fault.desc.length==0) self.fault.state = false
                                }
                                return false
                            } 
                            if(parsed_msg.voltage > self.low_battery_criterion) {
                                if(self.fault.state == true){
                                    let idx = self.fault.desc.indexOf("battery")
                                    if (idx > -1) self.fault.desc.splice(idx, 1)
                                    if (self.fault.desc.length==0) self.fault.state = false
                                }else{
                                    let idx = self.fault.desc.indexOf("battery")
                                    if (idx > -1) self.fault.desc.splice(idx, 1)
                                    if (self.fault.desc.length==0) self.fault.state = false
                                }
                                return false
                            }
                            // error status
                            if(self.fault.state == true){
                                self.fault.state = true
                                let idx = self.fault.desc.indexOf("battery")
                                if (idx < 0) self.fault.desc.push("battery")
                            }else{
                                self.fault.state = true
                                let idx = self.fault.desc.indexOf("battery")
                                if (idx < 0) self.fault.desc.push("battery")
                                // alarm push
                                // self.faultWebsocketPush(self, "battery")
                                self.pushAlarmMsg("battery", true, parsed_msg.voltage)
                                self.robotFeedUpdatePub("fault", "battery", "")
                            }
                        }
                        break;
                    case("platform_status"):
                        callback = function (msg) {
                            
                            let parsed_msg = JSON.parse(msg).result
                            
                            
                            if(parsed_msg.emergency){
                                // emergency true
                                if(self.fault.state == true){
                                    self.fault.state = true
                                    let idx = self.fault.desc.indexOf("emergency")
                                    if (idx < 0) self.fault.desc.push("emergency")
                                }else{
                                    self.fault.state = true
                                    let idx = self.fault.desc.indexOf("emergency")
                                    if (idx < 0) self.fault.desc.push("emergency")
                                    // alarm push
                                    // self.faultWebsocketPush(self, "emergency")
                                    self.pushAlarmMsg("emergency", true, "")
                                    self.robotFeedUpdatePub("fault", "emergency", "")
                                }
                            }else{
                                // emergency false
                                if(self.fault.state == true){
                                    let idx = self.fault.desc.indexOf("emergency")
                                    if (idx > -1) self.fault.desc.splice(idx, 1)
                                    if (self.fault.desc.length==0) self.fault.state = false
                                }else{
                                    let idx = self.fault.desc.indexOf("emergency")
                                    if (idx > -1) self.fault.desc.splice(idx, 1)
                                    if (self.fault.desc.length==0) self.fault.state = false
                                }
                            }

                            if(!parsed_msg.sensor_monitor.state){
                                // sensor fault true
                                if(self.fault.state == true){
                                    self.fault.state = true
                                    let idx = self.fault.desc.indexOf("sensor_fault")
                                    if (idx < 0) self.fault.desc.push("sensor_fault")
                                }else{
                                    self.fault.state = true
                                    let idx = self.fault.desc.indexOf("sensor_fault")
                                    if (idx < 0) self.fault.desc.push("sensor_fault")
                                    // alarm push
                                    // self.faultWebsocketPush(self, "sensor")
                                    self.pushAlarmMsg("sensor", true, "")
                                    self.robotFeedUpdatePub("fault", "sensor", "")
                                }
                            }else{
                                // sensor fault false
                                if(self.fault.state == true){
                                    let idx = self.fault.desc.indexOf("sensor_fault")
                                    if (idx > -1) self.fault.desc.splice(idx, 1)
                                    if (self.fault.desc.length==0) self.fault.state = false
                                }else{
                                    let idx = self.fault.desc.indexOf("sensor_fault")
                                    if (idx > -1) self.fault.desc.splice(idx, 1)
                                    if (self.fault.desc.length==0) self.fault.state = false
                                }
                            }

                        }
                        break;
                    case("nav_status"):
                        callback = function (msg) {
                            let parsed_msg = JSON.parse(msg).result
                            if(parsed_msg.state!=3){
                                self.globalPlanner = []
                            }
                            if(parsed_msg.state==1 && parsed_msg.desc =="LOCALIZATION FAULT"){
                                // nav error true
                                if(self.fault.state == true){
                                    self.fault.state = true
                                    let idx = self.fault.desc.indexOf("localization_fault")
                                    if (idx < 0) self.fault.desc.push("localization_fault")
                                }else{
                                    self.fault.state = true
                                    let idx = self.fault.desc.indexOf("localization_fault")
                                    if (idx < 0) self.fault.desc.push("localization_fault")
                                    // alarm push
                                    // self.faultWebsocketPush(self, "localization")
                                    self.pushAlarmMsg("localization", true, "")
                                    self.robotFeedUpdatePub("fault", "localization", "")
                                }
                            }else{
                                // nav error false
                                if(self.fault.state == true){
                                    let idx = self.fault.desc.indexOf("localization_fault")
                                    if (idx > -1) self.fault.desc.splice(idx, 1)
                                    if (self.fault.desc.length==0) self.fault.state = false
                                }else{
                                    let idx = self.fault.desc.indexOf("localization_fault")
                                    if (idx > -1) self.fault.desc.splice(idx, 1)
                                    if (self.fault.desc.length==0) self.fault.state = false
                                }
                            }
                        }
                        break;
                }
                this.nc.subscribe(`${this.robot_id}.${topic.topicName}`, callback)
            })
        })
    }
    savePushedAlarmMsg(new_msg){
        let self = this
        let save_data = {}
        save_data['msg_id'] = new_msg.msg_id
        save_data['timestamp'] = new_msg.timestamp
        save_data['type'] = new_msg.type
        save_data['error'] = new_msg.error
        save_data['site'] = new_msg.location.site
        save_data['zone'] = new_msg.location.zone
        save_data['location'] = JSON.stringify(new_msg.location)
        save_data['robot_id'] = new_msg.robot_id
        save_data['res_data'] = new_msg.result.data

        let query = 'select * from User;'
        this.db.sequelize.query(query)
        .then(result=>{
            result[0].forEach(user=>{
                let insertData = save_data
                insertData['username'] = user.username
                insertData['checked'] = false
                self.db.pushMsg.create(insertData)
            })
        })
        .catch(err=>{
            console.log("error");
        });

    }
    pushAlarmMsg(type, error, data){
        let self = this
        let new_msg = {
            timestamp: Date.now(),
            robot_id: self.robot_id,
            msg_id: uuidv1(),
            type:  type,
            error: error,
            result: {
                type: ["string"],
                data: data
            },
            location: { 
                site: self.site_id, 
                zone: self.zone_id,
                pose: self.pose
            }
        }
        self.nc.publish(`monitoring.alarm_push`,JSON.stringify(new_msg))
        self.savePushedAlarmMsg(new_msg)
    }

    // faultWebsocketPush(self, subtype){
    //     let pushData = {
    //         result:{
    //             subtype: subtype,
    //             state: true,
    //             data:"",
    //         },
    //         type:'fault',
    //         robot_id: self.robot_id,
    //         msg_id: uuidv1(),
    //         timestamp:Date.now(),
    //         error: true,
    //         location:{
    //             site: self.site_id,
    //             zone: self.zone_id,
    //             pose: JSON.stringify(self.pose)
    //         }
    //     }
    //     const pushOption = {
    //         uri:`http://${self.rest_api_ip}:${self.rest_api_port}/websocket/send/target`, 
    //         method: 'POST',
    //         form: {
    //             site_id: self.site_id,
    //             robot_id: self.robot_id,
    //             msg:JSON.stringify(pushData)
    //         }
    //     }
    //     request.post(pushOption, function(err,httpResponse,body){
    //         // console.log("push requested");
    //     })
        
    // }
}

module.exports = robotInfoCollector
