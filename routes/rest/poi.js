'use strict'
const express = require('express');
const router = express.Router();
const yaml = require('js-yaml');
const fs   = require('fs');

// poi list 
router.get('/list', function(req,res){
    var resource = yaml.safeLoad(
        fs.readFileSync(
            __dirname+'/../../config/resource.yaml', 
            'utf8'));
    var templist = resource.poi;
    var list =[];

    templist.forEach(item=>{
        if(item.zoneID!==undefined) {
            if(item.zoneID == req.query.zoneID){
                list.push(item);
            }
        } else if(item.zoneID===undefined){
            console.log("resouce file error");
        }
    })
    res.setHeader('Content-Type', 'application/json');
    res.send(list);
    res.end();
    
    
})


module.exports = router;