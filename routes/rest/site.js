'use strict'
const express = require('express');
const router = express.Router();
const yaml = require('js-yaml');
const fs   = require('fs');

// site list
router.get('/list', function(req,res){
    var resource = yaml.safeLoad(
        fs.readFileSync(
            __dirname+'/../../config/resource.yaml', 
            'utf8'));
    var list = resource.site;
    res.setHeader('Content-Type', 'application/json');
    res.send(list);
    res.end();   
    
})


module.exports = router;