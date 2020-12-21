'use strict'

const express = require('express');
const router = express.Router();
const queryCreatePast = require(__dirname+'/../../libs/queryCreatePast');
const queryCreateRecent = require(__dirname+'/../../libs/queryCreateRecent');

// db 관련
const db = require('../../models');

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


// important feed 설정하기
router.get('/set/important', 
    function(req, res){
        let username = req.session.passport.user.username;
        let msg_id = req.query.msg_id;
        let query = `
        update ${process.env.TABLENAME_USE_CUSTOMIZING}
        set	important = 1
        where (
            msg_id = '${msg_id}' and
            username = '${username}'
        );
        `;

        db.sequelize.query(query)
        .then(result=>{
            if(result[0].affectedRows<1){
                let custom_data = {
                    msg_id: msg_id,
                    username: username,
                    checked: true,
                    important: true,
                }
                db.UserCustomizing.create(custom_data)
                .then( create_res => {
                    res.send({
                        status:true,
                        result : create_res
                    });
                    res.end();
                }).catch(err=>{
                    console.log("create error", err);
                    res.status(500).send(err);
                    res.end();
                });

            }else{
                res.send({
                    status:true,
                    result : result[0]
                });
                res.end();
            }
            
        })
        .catch(err=>{
            console.log("update error", err);
            res.status(500).send(err);
            res.end();
        });
    }
);

// important feed 해제하기
router.get('/release/important', 
    function(req, res){
        let username = req.session.passport.user.username;
        let msg_id = req.query.msg_id;
        let query = `
        select * from ${process.env.TABLENAME_USE_CUSTOMIZING}
        where (
            msg_id = '${msg_id}' and
            username = '${username}'
        );
        `;
        db.sequelize.query(query)
        .then(result=>{
            if(result[0].length<1){
                // if can't find one
                res.status(500).send({
                    status: false,
                    result : "cant't find one"
                });
                res.end();
            }else{
                // if there is one and didn't checked
                // update
                if(result[0][0].checked==0){
                    let query = `
                    update ${process.env.TABLENAME_USE_CUSTOMIZING}
                    set	important = 0
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

                }else{
                    // if there is one and already checked
                    // delete
                    let query = `
                    delete from ${process.env.TABLENAME_USE_CUSTOMIZING}
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
                }
            }
            
        })
        .catch(err=>{
            console.log("update error", err);
            res.status(500).send(err);
            res.end();
        });
    }
);


// unchecked feed 지우기
router.get('/remove/unchecked', 
    function(req, res){
        let username = req.session.passport.user.username;
        let msg_id = req.query.msg_id;
        let query = `
        select * from ${process.env.TABLENAME_USE_CUSTOMIZING}
        where (
            msg_id = '${msg_id}' and
            username = '${username}'
        );
        `;
        
        db.sequelize.query(query)
        .then(result=>{
            if(result[0].length<1){
                // if can't find one
                res.send({
                    status: false,
                    result : "cant't find one"
                });
                res.end();
            }else{
                // if there is one and important is true
                // update
                if(result[0][0].checked==1){
                    let query = `
                    update ${process.env.TABLENAME_USE_CUSTOMIZING}
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

                }else{
                    // if there is one and important is false
                    // delete
                    let query = `
                    delete from ${process.env.TABLENAME_USE_CUSTOMIZING}
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
                }
            }
            
        })
        .catch(err=>{
            console.log("update error", err);
            res.status(500).send(err);
            res.end();
        });
    }
);

router.get('/list/past', 
    async function(req, res){
        console.log("############################")
        console.log(req)
        console.log("############################")
        console.log(req.session)
        let query = await queryCreatePast.make({
            state:Number(req.query.state),
            lt: getDateFormat(req.query.lt),
            zone: req.query.zone,
            robot: req.query.robot,
            service: req.query.service,
            limit: req.query.limit,
            username : req.session.passport.user.username
        });
        db.sequelize.query(query)
        .then(result=>{
            result[0].forEach(item=>{
                item.location = JSON.parse(item.location);
                item['result']={
                    type: item.res_type.split(","),
                    data: item.res_data
                }
                
                if(item.checked==null){
                    item.checked=true;
                }else if(item.checked==1){
                    item.checked=true;
                }else if(item.checked==0){
                    item.checked=false;
                }

                if(item.important==null){
                    item.important=false;
                }else if(item.important==1){
                    item.important=true;
                }else if(item.important==0){
                    item.important=false;
                }
                
            })

            res.send(result[0]);
            res.end();
        })
        .catch(err=>{
            console.log(err);
            res.send(err);
            res.end();
        });
    }
);

router.get('/list/recent', 
    async function(req, res){
        let query = await queryCreateRecent.make({
            state:Number(req.query.state),
            gt: getDateFormat(req.query.gt),
            zone: req.query.zone,
            robot: req.query.robot,
            service: req.query.service,
            limit: req.query.limit,
            username : req.session.passport.user.username
        });
        db.sequelize.query(query)
        .then(result=>{

            console.log(result[0]);
            result[0].forEach(item=>{
                item.location = JSON.parse(item.location);
                item['result']={
                    type: item.res_type.split(","),
                    data: item.res_data
                }

                if(item.checked==null){
                    item.checked=true;
                }else if(item.checked==1){
                    item.checked=true;
                }else if(item.checked==0){
                    item.checked=false;
                }

                if(item.important==null){
                    item.important=false;
                }else if(item.important==1){
                    item.important=true;
                }else if(item.important==0){
                    item.important=false;
                }

            })

            res.send(result[0]);
            res.end();
        })
        .catch(err=>{
            console.log(err);
            res.send(err);
            res.end();
        });
    }
);

function getDateFormat(input_date) {

    var date = new Date(Number(input_date));
    var aaaa = date.getFullYear();
    var gg = date.getDate();
    var mm = (date.getMonth() + 1);

    if (gg < 10)
        gg = "0" + gg;

    if (mm < 10)
        mm = "0" + mm;

    var cur_day = aaaa + "-" + mm + "-" + gg;

    var hours = date.getHours()
    var minutes = date.getMinutes()
    var seconds = date.getSeconds();

    if (hours < 10)
        hours = "0" + hours;

    if (minutes < 10)
        minutes = "0" + minutes;

    if (seconds < 10)
        seconds = "0" + seconds;

    return cur_day + " " + hours + ":" + minutes + ":" + seconds;

}



module.exports = router;