'use strict'
const express = require('express');
const router = express.Router();
const yaml = require('js-yaml');
const fs   = require('fs');


// zone list
router.get('/list', function(req,res){
    var resource = yaml.safeLoad(
        fs.readFileSync(
            __dirname+'/../../config/resource.yaml', 
            'utf8'));
    var templist = resource.zone;
    var list =[];
    
    templist.forEach(item=>{
        if(item.siteID!==undefined) {
            if(item.siteID == req.query.siteID){
                list.push(item);
            }
        } else if(item.siteID===undefined){
            console.log("resouce file error");
        }
    })
    res.setHeader('Content-Type', 'application/json');
    res.send(list);
    res.end();
    
    
})

module.exports = router;