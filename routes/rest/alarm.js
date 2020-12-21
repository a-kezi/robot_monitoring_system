'use strict'

const express = require('express');
const yaml = require('js-yaml');
const fs   = require('fs');
const router = express.Router();

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

// 확인하지 않은 리스트 받기
router.post('/list/uncheck', function(req, res){
    let username = req.session.passport.user.username;
    let query = `
    select * from push_msg
    where(
        username ="${username}" &&
        checked = 0
    )order by timestamp asc
    `;

    db.sequelize.query(query)
    .then(result=>{
        res.send({
            status:true,
            result : result[0]
        });
        res.end();
    })
    .catch(err=>{
        console.log("update error", err);
        res.status(500).send({
            status:false,
            result : err
        });
        res.end();
    });
});

// 전체 리스트 받기
router.post('/list/all', function(req, res){
    let username = req.session.passport.user.username;

    let timestamp = getDateFormat(req.body.timestamp);

    console.log(username, timestamp)
    let query = `
    select * from push_msg
    where(
        username ="${username}" &&
        timestamp < "${timestamp}"
    )order by timestamp desc
    limit 10
    `;

    db.sequelize.query(query)
    .then(result=>{
        res.send(result[0]);
        res.end();
    })
    .catch(err=>{
        console.log("update error", err);
        res.status(500).send({
            status:false,
            result : err
        });
        res.end();
    });
});
function getDateFormat(input_date) {

    let date;
    let isNeedConvertLocalTime = false;
    if(input_date.includes("T")){
        input_date = input_date.replace("T"," ")
        input_date = input_date.slice(0, 19)
        date = new Date(input_date);
        date.setHours(date.getHours()+9)
        isNeedConvertLocalTime = true
    }else{
        date = new Date(Number(input_date));
    }

    let yyyy = date.getFullYear();
    let gg = date.getDate();
    let mm = (date.getMonth() + 1);

    if (gg < 10)
        gg = "0" + gg;

    if (mm < 10)
        mm = "0" + mm;

    let cur_day = yyyy + "-" + mm + "-" + gg;

    let hours = date.getHours()
    if(isNeedConvertLocalTime){
        hours = hours
    }
    let minutes = date.getMinutes()
    let seconds = date.getSeconds();

    if (hours < 10)
        hours = "0" + hours;

    if (minutes < 10)
        minutes = "0" + minutes;

    if (seconds < 10)
        seconds = "0" + seconds;

    return cur_day + " " + hours + ":" + minutes + ":" + seconds;

}

// 알람 세팅 정보 받기
router.post('/setting/info', function(req, res){
    let alarmConfig = yaml.safeLoad(
        fs.readFileSync(
            __dirname+'/../../config/alarmConfig.yaml', 
            'utf8'));

    res.send({
        status:true,
        result : alarmConfig.setting
    });
    res.end();
});


// 알람 확인 완료
router.post('/check', function(req, res){
    let username = req.session.passport.user.username;
    let msg_id = req.body.msg_id;
    let query = `
    update push_msg
    set	checked = 1
    where (
        msg_id = '${msg_id}' and
        username = '${username}'
    );
    `;

    db.sequelize.query(query)
    .then(result=>{
        res.send({
            status:true,
            result : result[0]
        });
        res.end();
    })
    .catch(err=>{
        console.log("update error", err);
        res.status(500).send(err);
        res.end();
    });
});

// 알람 전체 확인 
router.get('/check/all', function(req, res){
    let query = `
    update push_msg
    set	checked = 1
    where (
        checked = 0
    );
    `;

    db.sequelize.query(query)
    .then(result=>{
        res.send({
            status:true,
            result : result[0]
        });
        res.end();
    })
    .catch(err=>{
        console.log("update error", err);
        res.status(500).send(err);
        res.end();
    });
});

// 알람 상태 받기
router.get('/get/alarmstate', function(req, res){
    let username = req.session.passport.user.username;
    let query = `
    select alarm_on from User
    where (
        username = '${username}'
    );
    `;
    db.sequelize.query(query)
    .then(result=>{
        res.send({
            status:true,
            result : result[0][0]
        });
        res.end();
    })
    .catch(err=>{
        console.log("update error", err);
        res.status(500).send({
            status:false,
            desc : err
        });
        res.end();
    });
    
});
// 알람 켜기
router.get('/setting/on', function(req, res){
    let username = req.session.passport.user.username;
    let query = `
    update User
    set	alarm_on = 1
    where (
        username = '${username}'
    );
    `;
    db.sequelize.query(query)
    .then(result=>{
        res.send({
            status:true,
            desc : "alarm_on"
        });
        res.end();
    })
    .catch(err=>{
        console.log("update error", err);
        res.status(500).send({
            status:false,
            desc : err
        });
        res.end();
    });
    
});

// 알람 끄기
router.get('/setting/off', function(req, res){
    let username = req.session.passport.user.username;
    let query = `
    update User
    set	alarm_on = 0
    where (
        username = '${username}'
    );
    `;
    db.sequelize.query(query)
    .then(result=>{
        res.send({
            status:true,
            desc : "alarm_off"
        });
        res.end();
    })
    .catch(err=>{
        console.log("update error", err);
        res.status(500).send({
            status:false,
            desc : err
        });
        res.end();
    });
    
});





module.exports = router;