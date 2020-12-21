'use strict'
const express = require('express');
const router = express.Router();
const yaml = require('js-yaml');
const fs   = require('fs');

// service list
router.get('/list', function(req,res){
    var resource = yaml.safeLoad(
        fs.readFileSync(
            __dirname+'/../../config/resource.yaml', 
            'utf8'));
    var list = resource.service;
    list.forEach(service => {
        service
    });
    res.setHeader('Content-Type', 'application/json');
    res.send(list);
    res.end();
    
    
    
})


module.exports = router;