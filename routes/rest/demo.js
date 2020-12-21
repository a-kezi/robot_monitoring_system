'use strict'
const express = require('express');
const Base64 = require("js-base64").Base64;
const router = express.Router();
const yaml = require('js-yaml');
const fs = require('fs');


// camera list
router.get('/list', function (req, res) {
    let resource = yaml.safeLoad(
        fs.readFileSync(
            __dirname + '/../../config/demo.yaml',
            'utf8'));
    console.log(resource)
    var btn;
    resource.btnList.forEach(btn => {

        try {
            if (resource.demo[btn].length != 0 &&
                hasType(resource.demo[btn], "speak")) {
                resource.demo[btn][0].srv.sentence = Base64.encode(resource.demo[btn][0].srv.sentence);
            }

        } catch (e) {
            console.log(e.stack);
            console.log(btn)
            console.log(resource.btnList)
        }
    });


    res.setHeader('Content-Type', 'application/json');
    res.send(resource);
    res.end();
})

function hasType(list, type_name) {
    for (var item in list) {
        if (list[item].type == type_name) return true;
    }
    return false;
}

module.exports = router;