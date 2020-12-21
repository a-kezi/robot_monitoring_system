'use strict'
const express = require('express');
const router = express.Router();
const queryCreateReport = require(__dirname+'/../../libs/queryCreateReport');

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

router.get('/list', 
    async function(req, res){
        let query = await queryCreateReport.make(req.query);

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


module.exports = router;