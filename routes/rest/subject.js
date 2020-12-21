'use strict'
const express = require('express');
const router = express.Router();
const yaml = require('js-yaml');
const fs   = require('fs');


// nats subject list 
router.get('/list', function(req,res){
    var resource = yaml.safeLoad(
        fs.readFileSync(
            __dirname+'/../../config/resource.yaml', 
            'utf8'));
    var subList ={
        typelist:[],
        subjects:{}
    };
    
    resource.robot.forEach(item=>{
        if(item.zoneID!==undefined) {
            if(item.zoneID == req.query.zoneID&&
                !subList.typelist.includes(item.type)){
                    
                subList.typelist.push(item.type);
            }
        } else if(item.zoneID===undefined){
            console.log("resouce file error");
        }
    })

    resource.natsSubjectList.forEach(item=>{
        subList.typelist.forEach(element=>{
            if(item.type===element){
                subList.subjects[element] = item.topics
            }
        })
        console.log(subList);
    })
    res.setHeader('Content-Type', 'application/json');
    res.send(subList);
    res.end();

    
})



module.exports = router;