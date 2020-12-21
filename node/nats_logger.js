'use strict'
const yaml = require('js-yaml');
const fs   = require('fs');
const assert = require('assert');
const path = require('path');
const NATS = require('nats');
const request = require('request');
const mkdirp = require('mkdirp');
const message_packet   = require(__dirname+'/../libs/natsDataConverter');
const sharp = require('sharp');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '/../.env') }); //LOAD CONFIG
console.log(process.env.NATS_IP);
const NATS_URL = `nats://${process.env.NATS_IP}:${process.env.NATS_PORT}`

var natsSubList = {};
var resource;
var robotList;
var natsLoggingList;

try {
    // 리소스 리스트 가져오기
    resource = yaml.safeLoad(fs.readFileSync(__dirname+'/../config/resource.yaml', 'utf8'));
    robotList = resource.robot;
    natsLoggingList = resource.natsLoggingList;

} catch (e) {
    console.log("config file load error");
    console.log(e);
}



// db 관련
const db = require(__dirname+'/../models');

// DB authentication
db.sequelize.authenticate()
.then(() => {
    console.log('Connection has been established successfully.');
    return db.sequelize.sync();
})
.then(() => {
    console.log('DB Sync complete.');
    // let thumnail_path = `${process.env.IMG_STORE_PATH}/resultImg/thumnail`;
    // let origin_path = `${process.env.IMG_STORE_PATH}/resultImg/origin`;

    let thumnail_path = `${__dirname}/../db/resultImg/thumnail`;
    let origin_path = `${__dirname}/../db/resultImg/origin`;
    let thermal_path = `${__dirname}/../db/resultImg/thermal`;

    mkdirp(thumnail_path)
    .then(made =>{
        console.log(`made directories, starting with ${made}`)
    });
    mkdirp(origin_path)
    .then(made =>{
        console.log(`made directories, starting with ${made}`)
    });
    mkdirp(thermal_path)
    .then(made =>{
        console.log(`made directories, starting with ${made}`)
    });

})
.catch(err => {
    console.error('Unable to connect to the database:', err);
});







// NATS 연결
var nc = NATS.connect({url: NATS_URL})

nc.on('connect', () => {
    console.log(`## NATS : connected to ${NATS_URL}`);
    nc.on('error', (err) => {
        console.log(err)
    })
    
    // console.log(natsLoggingList);
    robotList.some(robot => {
        natsLoggingList.some(item =>{
            if(item.type===robot.type){
                item.topics.forEach(element => {
                    console.log(element);
                    let subject = `${robot.id}.${element}`;
                    natsSubList[robot.id] = nc.subscribe(subject,storeSubMsg)
                });
                // console.log(natsSubList);
                return true;
            }
        })
    });

})



function storeSubMsg(msg){
    let parsedData = message_packet.parseMsg(msg);
    console.log(parsedData)
    let service_result_data = {}
    service_result_data['msg_id'] = parsedData.msg_id
    service_result_data['timestamp'] = parsedData.timestamp
    service_result_data['type'] = parsedData.type
    if(parsedData.result.type) service_result_data['res_type'] = parsedData.result.type.toString()
    if(parsedData.result.subtype) service_result_data['res_subtype'] = parsedData.result.subtype.toString()
    if(parsedData.error != undefined) service_result_data['error'] = parsedData.error
    if((typeof parsedData.result.data)=="object"){
        service_result_data['res_data'] = JSON.stringify(parsedData.result.data)
    }else{
        service_result_data['res_data'] = parsedData.result.data
    }
    service_result_data['site'] = parsedData.location.site
    service_result_data['zone'] = parsedData.location.zone
    service_result_data['location'] = JSON.stringify(parsedData.location)
    service_result_data['robot_id'] = parsedData.robot_id

    switch (parsedData.type) {
        default:
            break;
        case 'remote_snapshot':
            service_result_data['img_store_flag'] = 0; // false
            
            db.RemoteSnapshot.create(service_result_data).then( () => {
                if(parsedData.result.type.includes('img')){
                    saveImg(
                        parsedData.result.image,
                        parsedData.msg_id,
                        parsedData.timestamp,
                        false,
                        function(){
                            db.RemoteSnapshot.update({img_store_flag:1},{where:{msg_id:parsedData.msg_id}})
                            .then(result=>{
                                console.log(result);
                            })
                            .catch(err=>{
                                console.log(err);
                            });
                    });
                }
            });
            break;
        case 'event_emergency':
            pushMsg(msg)
            savePushMsg(service_result_data)
            service_result_data['img_store_flag'] = 0; // false
            db.EmergencyCall.create(service_result_data).then( () => {
                if(parsedData.result.type.includes('img')){
                    saveImg(
                        parsedData.result.image,
                        parsedData.msg_id,
                        parsedData.timestamp,
                        false,
                        function(){
                            db.EmergencyCall.update({img_store_flag:1},{where:{msg_id:parsedData.msg_id}})
                            .then(result=>{
                                console.log(result);
                            })
                            .catch(err=>{
                                console.log(err);
                            });
                    });
                }
            });
            break;
        case 'event_snapshot':
            service_result_data['img_store_flag'] = 0; // false
            db.PatrolSnapshot.create(service_result_data).then( () => {
                if(parsedData.result.type.includes('img')){
                    saveImg(
                        parsedData.result.image,
                        parsedData.msg_id,
                        parsedData.timestamp,
                        false,
                        function(){
                            db.PatrolSnapshot.update({img_store_flag:1},{where:{msg_id:parsedData.msg_id}})
                            .then(result=>{
                                console.log(result);
                            })
                            .catch(err=>{
                                console.log(err);
                            });
                    });
                }
            });
            break;
        case 'event_code':
            service_result_data['img_store_flag'] = 0; // false
            db.CodeDetect.create(service_result_data).then( () => {
                if(parsedData.result.type.includes('img')){
                    saveImg(
                        parsedData.result.image,
                        parsedData.msg_id,
                        parsedData.timestamp,
                        false,
                        function(){
                            db.CodeDetect.update({img_store_flag:1},{where:{msg_id:parsedData.msg_id}})
                            .then(result=>{
                                console.log(result);
                            })
                            .catch(err=>{
                                console.log(err);
                            });
                    });
                }
            });
            break;
        case 'event_fire':
            pushMsg(msg)
            savePushMsg(service_result_data)
            service_result_data['img_store_flag'] = 0; // false
            db.FireDetect.create(service_result_data).then( () => {
                if(parsedData.result.type.includes('img')){
                    saveImg(
                        parsedData.result.image,
                        parsedData.msg_id,
                        parsedData.timestamp,
                        false,
                        function(){
                            db.FireDetect.update({img_store_flag:1},{where:{msg_id:parsedData.msg_id}})
                            .then(result=>{
                                console.log(result);
                            })
                            .catch(err=>{
                                console.log(err);
                            });
                    });
                }
            });
            break;
        case 'event_people':
            pushMsg(msg)
            savePushMsg(service_result_data)
            service_result_data['img_store_flag'] = 0; // false
            db.PeopleDetect.create(service_result_data).then( () => {
                // console.log("stored");
                if(parsedData.result.type.includes('img')){
                    saveImg(
                        parsedData.result.image,
                        parsedData.msg_id,
                        parsedData.timestamp,
                        false,
                        function(){
                            db.PeopleDetect.update({img_store_flag:1},{where:{msg_id:parsedData.msg_id}})
                            .then(result=>{
                                console.log(result);
                            })
                            .catch(err=>{
                                console.log(err);
                            });
                    });
                }
            });
            break;
        case 'event_fallen':
            pushMsg(msg)
            savePushMsg(service_result_data)
            service_result_data['img_store_flag'] = 0; // false
            db.FallenInspec.create(service_result_data).then( () => {
                // console.log("stored");
                if(parsedData.result.type.includes('img')){
                    saveImg(
                        parsedData.result.image,
                        parsedData.msg_id,
                        parsedData.timestamp,
                        false,
                        function(){
                            db.FallenInspec.update({img_store_flag:1},{where:{msg_id:parsedData.msg_id}})
                            .then(result=>{
                                console.log(result);
                            })
                            .catch(err=>{
                                console.log(err);
                            });
                    });
                }
                
            });
            break;
        case 'event_temperature':
            pushMsg(msg)
            savePushMsg(service_result_data)
            service_result_data['img_store_flag'] = 0; // false
            db.TemperatureInspec.create(service_result_data).then( () => {
                // console.log("stored");
                if(parsedData.result.type.includes('img')){
                    saveImg(
                        parsedData.result.image,
                        parsedData.msg_id,
                        parsedData.timestamp,
                        false,
                        function(){
                            db.TemperatureInspec.update({img_store_flag:1},{where:{msg_id:parsedData.msg_id}})
                            .then(result=>{
                                console.log(result);
                            })
                            .catch(err=>{
                                console.log(err);
                            });
                    });
                }
                
            });
            break;
        case 'robot_feed_update':
            console.log("----------------------------")
            console.log(parsedData)
            db.RobotFeedUpdate.create(service_result_data).then( () => {
                // console.log("stored");
            });
            break;
    }





    if(parsedData.error===true){
        // 이슈인경우 해당 user 수 만큼 
        
        let query = 'select * from User;'
        db.sequelize.query(query)
        .then(result=>{
            result[0].forEach(user=>{
                let custom_data = {
                    msg_id:parsedData.msg_id,
                    username:user.username,
                    checked: false,
                    important: false,
                }
                db.UserCustomizing.create(custom_data).then( () => {
                    
                });
            })
        })
        .catch(err=>{
            console.log("error");
        });
    }
}

function pushMsg(msg){
    nc.publish(`monitoring.alarm_push`,msg)
}
function savePushMsg(parsed_msg){
    let query = 'select * from User;'
    db.sequelize.query(query)
    .then(result=>{
        result[0].forEach(user=>{
            let insertData = parsed_msg
            insertData['username'] = user.username
            insertData['checked'] = false
            db.pushMsg.create(insertData)
        })
    })
    .catch(err=>{
        console.log("error");
    });
}

function saveImg(img, id, timestamp, crop, cb){
    let date = new Date(timestamp);
    let year = date.getFullYear();
    let month = (1 + date.getMonth());
    month = month >= 10 ? month : '0' + month;
    let day = date.getDate();
    day = day >= 10 ? day : '0' + day;
    let wholedate = `${year}${month}${day}`;

    if(!fs.existsSync(`${__dirname}/../db/resultImg/thumnail/${wholedate}`)){
        fs.mkdirSync(`${__dirname}/../db/resultImg/thumnail/${wholedate}`)
    }
    if(!fs.existsSync(`${__dirname}/../db/resultImg/origin/${wholedate}`)){
        fs.mkdirSync(`${__dirname}/../db/resultImg/origin/${wholedate}`)
    }
    if(!fs.existsSync(`${__dirname}/../db/resultImg/thermal/${wholedate}`)){
        fs.mkdirSync(`${__dirname}/../db/resultImg/thermal/${wholedate}`)
    }    

    let img_base64 = img;
    let origin_img_buffer = new Buffer(img_base64[0], 'base64');

    if(crop){
        sharp(origin_img_buffer)
        // .resize(320, 240)
        .extract({left:crop.left, top:crop.top, width:crop.width, height:crop.height})
        .toFile(`${__dirname}/../db/resultImg/thumnail/${wholedate}/${id}.jpg`, (err, info) => {
            fs.writeFile(
                `${__dirname}/../db/resultImg/origin/${wholedate}/${id}.jpg`, 
                img_base64[0], 
                'base64', 
                function(err) {
                    if(img_base64[1] != undefined){
                        fs.writeFile(
                            `${__dirname}/../db/resultImg/thermal/${wholedate}/${id}.jpg`, 
                            img_base64[1], 
                            'base64', 
                            function(err) {
                                cb();
                                
                        });
                    }else{
                        cb();
                    }
            });
        });
    }else{
        fs.writeFile(
            `${__dirname}/../db/resultImg/origin/${wholedate}/${id}.jpg`, 
            img_base64[0], 
            'base64', 
            function(err) {
                if(img_base64[1] != undefined){
                    fs.writeFile(
                        `${__dirname}/../db/resultImg/thermal/${wholedate}/${id}.jpg`, 
                        img_base64[1], 
                        'base64', 
                        function(err) {
                            cb();
                    });
                }else{
                    cb();
                }
        });
    }
}

