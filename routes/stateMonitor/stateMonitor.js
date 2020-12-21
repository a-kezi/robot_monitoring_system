'use strict'
const yaml = require('js-yaml');
const fs   = require('fs');
const request = require('request');
const redis = require('redis')
const RobotConnectionChecker = require(__dirname+'/module/robotConnectionChecker');
const robotInfoCollector = require(__dirname+'/module/robotInfoCollector');

class StateMonitor {
    constructor(natsInfo, app, db) {
        let self = this
        this.natsInfo = natsInfo;
        this.app = app;
        this.db = db;
        try {
            // 리소스 리스트 가져오기
            this.resource = yaml.safeLoad(fs.readFileSync(__dirname+'/../../config/resource.yaml', 'utf8'));
            this.robotList = this.resource.robot;
        } catch (e) {
            console.log("config file load error");
            console.log(e);
        }

        this.redisClient = redis.createClient()
        this.redisInit()

        // rest api
        
        this.app.post('/status/robot', async function(req, res) {
            
            if(!req.body.robot_id){
                res.status(400).send({
                    status:false,
                    result : "parameter error"
                });
                res.end();
            }
            res.send({
                robot_id : req.body.robot_id,
                status : await self.getRobotConnectionStatus(req.body.robot_id)
            })
            res.end()
        })

        this.app.post('/status/allrobot', async function(req, res) {
            res.send(await self.getAllRobotConnectionStatus(redisClient, robotList))
            res.end()
        })

        // connection checker
        this.connChecker = new RobotConnectionChecker();
        this.connChecker.init(this.natsInfo, this.robotList);

        // robot information collector
        this.intervalList = []
        
        if(this.robotList){
            this.robotList.forEach(robot =>{
                this.intervalList.push(new robotInfoCollector(robot, this.db))
            })
            this.intervalList.forEach(collector =>{
                collector.pub()
            })
        }

        // connection event callback -> push through websocket
        this.connChecker.setDisconnectedCallback(function(robot_id){
            console.log("## disconnected :", robot_id )
            self.updateRedisRobotConnection(self.redisClient, robot_id, false)
        })
        this.connChecker.setConnectedCallback(function(robot_id){
            console.log("## connected :", robot_id)
            self.updateRedisRobotConnection(self.redisClient, robot_id, true)
        })

    }
    // Getter
    get getIntervalList(){
        return this.intervalList
    }
    // Method
    redisInit(){
        // connection value init
        this.robotList.forEach(robot => {
            let key_connection = `${robot.id}.connection`
            console.log("## redisInit :: key_connection : ", key_connection)
            this.redisClient.del(key_connection)
            this.redisClient.set(key_connection, false)
            this.redisClient.get(key_connection, (err, reply)=>{
                if(err==null){
                    console.log(reply)
                }
            })
        });
    }
    getRobotConnectionStatus(robot_id){
        return new Promise((resolve, reject) => {
            let key_connection = `${robot_id}.connection`
            if(robot_id == null || robot_id == undefined){
                reject()
            }
            this.redisClient.get(key_connection, (err, reply)=>{
                if(err==null){
                    resolve(reply)
                }else{
                    reject()
                }
            })
        });
    }
    getAllRobotConnectionStatus(robotList){
        return new Promise(async (resolve, reject) => {
            let result = []
    
            for(let i=0 ; i < robotList.length;i++){
                let key_connection = `${robotList[i].id}.connection`
                console.log(key_connection)
                this.redisClient.get(key_connection, (err, reply)=>{
                    if(err==null){
                        console.log(reply)
                        result.push({
                            robot_id : robotList[i].id,
                            status : reply
                        })
                        if(i==robotList.length-1){
                            resolve(result)    
                        }
                    }else{
                        reject()
                    }
                })
            }
        });
    }
    updateRedisRobotConnection(redisClient, robot_id, value){
        let key_connection = `${robot_id}.connection`
        if(typeof value != "boolean"){
            return false
        }
        redisClient.set(key_connection, value)
        return true
    }
}
module.exports = StateMonitor



























