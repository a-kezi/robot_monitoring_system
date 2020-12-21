'use strict'

const express = require('express');
const router = express.Router();
const queryCreatePast = require(__dirname+'/../../libs/queryCreateRobotFeedPast');
const queryCreateRecent = require(__dirname+'/../../libs/queryCreateRobotFeedRecent');


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

router.get('/list/past', 
    async function(req, res){
        let query = await queryCreatePast.make({
            lt: getDateFormat(req.query.lt),
            zone: req.query.zone,
            robot: req.query.robot,
            feedtype: req.query.feedtype,
            limit: req.query.limit,
        });
        db.sequelize.query(query)
        .then(result=>{
            result[0].forEach(item=>{
                item.location = JSON.parse(item.location);
                item['result']={
                    subtype:item.res_subtype,
                    data:item.res_data,
                    desc:item.res_desc
                }
            })
            res.send(result[0]);
            res.end();
        })
        .catch(err=>{
            console.log(err);
            res.status(500).send(err);
            res.end();
        });
    }
);

router.get('/list/recent', 
    async function(req, res){
        let query = await queryCreateRecent.make({
            gt: getDateFormat(req.query.gt),
            zone: req.query.zone,
            robot: req.query.robot,
            feedtype: req.query.feedtype,
            limit: req.query.limit
        });
        db.sequelize.query(query)
        .then(result=>{
            console.log(result[0]);
            result[0].forEach(item=>{
                item.location = JSON.parse(item.location);
                item['result']={
                    subtype:item.res_subtype,
                    data:item.res_data,
                    desc:item.res_desc
                }
            })

            res.send(result[0]);
            res.end();
        })
        .catch(err=>{
            console.log(err);
            res.status(500).send(err);
            res.end();
        });
    }
);

function getDateFormat(input_date) {
    //TODO: 한국 시간으로만 변경됨 -> 지역별 시간에 맞춰 변경필요
    let date = new Date(Number(input_date));
    let yyyy = date.getFullYear();
    let gg = date.getDate();
    let mm = (date.getMonth() + 1);

    if (gg < 10){
        gg = "0" + gg;
    }
    if (mm < 10){
        mm = "0" + mm;
    }

    let cur_day = yyyy + "-" + mm + "-" + gg;
    let hours = date.getHours()
    let minutes = date.getMinutes()
    let seconds = date.getSeconds();

    if (hours < 10){
        hours = "0" + hours;
    }

    if (minutes < 10){
        minutes = "0" + minutes;
    }

    if (seconds < 10){
        seconds = "0" + seconds;
    }

    return cur_day + " " + hours + ":" + minutes + ":" + seconds;

}



module.exports = router;