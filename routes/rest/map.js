'use strict'
const express = require('express');
const router = express.Router();
const fs   = require('fs');

// map img 받기 
router.get('/file', function(req,res){
    fs.readFile(__dirname+'/../../resource/map/01.png', function(err,data){
        let img = data;
        res.writeHead(200, {'Content-Type':'image/jpg'});
        res.end(img);

    })
})

module.exports = router;