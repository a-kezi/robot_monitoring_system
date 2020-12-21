'use strict'
const express = require('express');
const router = express.Router();
const fs   = require('fs');

// db 관련
const db = require(__dirname+'/../../models');

// DB authentication
db.sequelize.authenticate()
.then(() => {
    console.log('Connection has been established successfully.');
    return db.sequelize.sync();
})
.then(() => {
    console.log('DB Sync complete.');
})
.catch(err => {
    console.error('Unable to connect to the database:', err);
});



// thumbnail img 받기 
router.get('/srv_res/thumbnail', function(req,res){
    // console.log(date_dir_name);
    // console.log(img_dir);

    let id = req.query.id;
    let timestamp = req.query.timestamp;
    let type = req.query.type;

    checkImgStoreFlag(0, id, timestamp, type)
    .then(result=>{
        if(result[1]==true){
            getWholeDate(timestamp, function(wholedate){
                let file_path = `${__dirname}/../../db/resultImg/thumnail/${wholedate}/${id}.jpg`
                console.log(file_path);
                fs.readFile(file_path, function(err,data){
                    let img = data;
                    res.writeHead(200, {'Content-Type':'image/jpg'});
                    res.end(img);
                })
            });
        }else{
            res.send();
            res.end();
        }
        
    })
})

// origin img 받기 
router.get('/srv_res/origin', async function(req,res){
    // console.log(date_dir_name);
    // console.log(img_dir);

    let id = req.query.id;
    let timestamp = req.query.timestamp;
    let type = req.query.type;

    checkImgStoreFlag(0, id, timestamp, type)
    .then(result=>{
        if(result[1]==true){
            getWholeDate(timestamp, function(wholedate){
                let file_path = `${__dirname}/../../db/resultImg/origin/${wholedate}/${id}.jpg`
                console.log(file_path);
                fs.readFile(file_path, function(err,data){
                    let img = data;
                    res.writeHead(200, {'Content-Type':'image/jpg'});
                    res.end(img);
                })
            });
        }else{
            res.send();
            res.end();
        }
        
    })
})

// thermal img 받기 
router.get('/srv_res/thermal', async function(req,res){
    // console.log(date_dir_name);
    // console.log(img_dir);

    let id = req.query.id;
    let timestamp = req.query.timestamp;
    let type = req.query.type;

    checkImgStoreFlag(0, id, timestamp, type)
    .then(result=>{
        if(result[1]==true){
            getWholeDate(timestamp, function(wholedate){
                let file_path = `${__dirname}/../../db/resultImg/thermal/${wholedate}/${id}.jpg`
                console.log("--------------------")
                console.log(file_path);
                console.log(__dirname);
                console.log(wholedate);
                console.log(id);
                console.log("--------------------")
                fs.readFile(file_path, function(err,data){
                    let img = data;
                    res.writeHead(200, {'Content-Type':'image/jpg'});
                    res.end(img);
                })
            });
        }else{
            res.send();
            res.end();
        }
        
    })
})


function checkImgStoreFlag(n, id, timestamp, type) {
    return new Promise ((resolve, reject)=>{
        // console.log(timestamp);
        let db_obj = undefined
        switch(type){
            default:
                break;
            case("event_temperature"):
                db_obj = db.TemperatureInspec
                break;
            case("event_fallen"):
                db_obj = db.FallenInspec
                break;
            case("event_people"):
                db_obj = db.PeopleDetect
                break;
            case("event_fire"):
                db_obj = db.FireDetect
                break;
            case("event_code"):
                db_obj = db.CodeDetect
                break;
            case("event_snapshot"):
                db_obj = db.PatrolSnapshot
                break;
            case("event_emergency"):
                db_obj = db.EmergencyCall
                break;
            case("remote_snapshot"):
                db_obj = db.RemoteSnapshot
                break;
        }
        db_obj.findAll({
            where: {
                msg_id: id,
                // timestamp: timestamp
            }
        }).then(result=>{
            
            if(result.length!=0){
                // resolve([n, result[0]])
                // console.log("##########################3")
                // console.log(result[0])
                if(result[0].img_store_flag==true){
                    resolve([n, true])
                }else{
                    if(n<3){
                        console.log("retry", n);
                        setTimeout(function(){
                            checkImgStoreFlag(n+1, id, timestamp, type).then(resolve).catch(reject)
                        },1000)
                        
                    }else{
                        resolve([n, false])
                    }
                }
            }else{
                if(n<3){
                    console.log("retry", n);
                    setTimeout(function(){
                        checkImgStoreFlag(n+1, id, timestamp, type).then(resolve).catch(reject)
                    },200)
                    
                }else{
                    resolve([n, false])
                }
            }
        })
        .catch(error=>{
            reject(error);
        })
    })
}

function getWholeDate (timestamp, callback) {
    let wholedate;
    if(timestamp.includes(":")){
        let date = new Date(timestamp);
        let year = date.getFullYear();
        let month = (1 + date.getMonth());
        month = month >= 10 ? month : '0' + month;
        let day = date.getDate();
        day = day >= 10 ? day : '0' + day;
        wholedate = `${year}${month}${day}`;
    }else{
        let date = new Date(Number(timestamp));
        let year = date.getFullYear();
        let month = (1 + date.getMonth());
        month = month >= 10 ? month : '0' + month;
        let day = date.getDate();
        day = day >= 10 ? day : '0' + day;
        wholedate = `${year}${month}${day}`;
    }
    callback(wholedate);
}


module.exports = router;