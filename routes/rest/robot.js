'use strict'
const express = require('express');
const router = express.Router();
const yaml = require('js-yaml');
const fs   = require('fs');

/*
    get 함수 post로 변경 필요
*/
// robot list
router.get('/list', function(req,res){
    var resource = yaml.safeLoad(
        fs.readFileSync(
            __dirname+'/../../config/resource.yaml',
            'utf8'));
    var templist = resource.robot;
    var list =[];
    
    templist.forEach(item=>{
        if(item.zoneID!==undefined) {
            if(item.zoneID == req.query.zoneID){
                list.push(item);
                item.manualStatus = false;
                if(item.type=="addy"){
                    item.connected = true;
                }else{
                    item.connected = false;
                }
            }
        } else if(item.zoneID===undefined){
            console.log("resouce file error");
        }
    })
    res.setHeader('Content-Type', 'application/json');
    res.send(list);
    res.end();
})

// robot devices
router.get('/devices', 
    function(req, res){
        var resource = yaml.safeLoad(fs.readFileSync(__dirname+'/../../config/resource.yaml', 'utf8'));
        var templist = resource.robotDevices;
        var list =[];
        var isThereDevice = false;
        templist.some(item=>{
            if(item.type!==undefined) {
                if(item.type == req.query.type){
                    list=item.device
                    list.forEach(element =>{
                        element['state']="disconnected";
                    })
                    isThereDevice = true;
                }
            } else if(item.type===undefined){
                console.log("resouce file error");
            }
            return isThereDevice
        })
        res.setHeader('Content-Type', 'application/json');
        res.send(list);
        res.end();
        
        
    }
);


// robot location
router.post('/location', function(req,res){
    let resource = yaml.safeLoad(
        fs.readFileSync(
            __dirname+'/../../config/resource.yaml',
            'utf8'));
    let robot_id = req.body.robot_id
    let result = {
        robot_id : robot_id,
        site : {
            id:"",
            display_name:""
        },
        zone : {
            id:"",
            display_name:""
        },
    }

    //get robot site & zone id
    resource.robot.some( robot =>{
        if(robot.id===undefined) return false;
        if(robot.type===undefined) return false;
        if(robot.id == robot_id){
            result.site.id = robot.siteID;
            result.zone.id = robot.zoneID;
        }
        return robot.id == robot_id
    })

    // get site
    resource.site.some( site =>{
        if(site.siteID===undefined) return false;
        if(site.name===undefined) return false;
        if(site.siteID == result.site.id){
            result.site.display_name = site.name;
        }
        return site.siteID == result.site.id
    })

    // get zone
    resource.zone.some( zone =>{
        if(zone.zoneID===undefined) return false;
        if(zone.name===undefined) return false;
        if(zone.zoneID == result.zone.id){
            result.zone.display_name = zone.name;
        }
        return zone.zoneID == result.zone.id
    })

    res.setHeader('Content-Type', 'application/json');
    res.send(result);
    res.end();
})

// robot displayname
router.post('/displayname', function(req,res){
    let resource = yaml.safeLoad(
        fs.readFileSync(
            __dirname+'/../../config/resource.yaml',
            'utf8'));
    let robot_id = req.body.robot_id
    let result = {
        robot_id : robot_id,
        robot_type : "",
        displayname : ""
    }

    //get display name
    resource.robot.some( robot =>{
        if(robot.id===undefined) return false;
        if(robot.type===undefined) return false;
        if(robot.id == robot_id){
            result.robot_type = robot.type;
            result.displayname = robot.name;
        }
        return robot.id == robot_id
    })

    res.setHeader('Content-Type', 'application/json');
    res.send(result);
    res.end();
})

module.exports = router;