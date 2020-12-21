'use strict'
const express = require('express');
const router = express.Router();
const yaml = require('js-yaml');
const fs   = require('fs');
const request = require('request');


// camera list
router.get('/list', function(req,res){
    let resource = yaml.safeLoad(
        fs.readFileSync(
            __dirname+'/../../config/resource.yaml',
            'utf8'));
    let list = resource.cameraList[req.query.robottype];
    res.setHeader('Content-Type', 'application/json');
    res.send(list);
    res.end();
})

// get camera token url
router.get('/get/url', async function(req,res){
    let camera_id = req.query.id
    let camera_type = req.query.type
    let robottype = req.query.robottype
    let camera_info = await getVideoUrl(camera_id, robottype)
    if(camera_type=="usb"){
        res.setHeader('Content-Type', 'application/json');
        res.send({
            state: true,
            url: camera_info.url
        });
        res.end();
    }else if(camera_type=="ip"){
        let getOpt = {
            uri: camera_info.url, 
            method: 'GET',
            auth: {
                user: 'root',
                pass: 'root',
                sendImmediately: false
            }
        }
        request.get(getOpt, function(err,httpResponse,body){
            if(err){
                console.log(err)
                res.setHeader('Content-Type', 'application/json');
                res.send({
                    state: false,
                    desc: err
                });
                res.end();
            }else{
                res.setHeader('Content-Type', 'application/json');
                res.send({
                    state: true,
                    url: "http://"+camera_info.ip+JSON.parse(body).path
                });
                res.end();
            }
            
        })
    }
})

function getVideoUrl(camera_id, robottype){
    return new Promise( (resolve, reject) => {
        let url = undefined
        let ip = undefined
        let resource = yaml.safeLoad(
            fs.readFileSync(
                __dirname+'/../../config/resource.yaml',
                'utf8'));
        let list = resource.cameraList[robottype];
        list.some(item=>{
            if(camera_id==item.id){
                url = item.videoUrl
                ip = item.static_ip
            }
            return (camera_id==item.id)
        })
        resolve({
            url:url,
            ip:ip
        });
    });
}

module.exports = router;