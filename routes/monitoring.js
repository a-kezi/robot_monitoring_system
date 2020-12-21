'use strict'
const yaml = require('js-yaml');
const fs   = require('fs');
const express = require('express');
const router = express.Router();
const loginRequired = require(__dirname+'/../libs/account/loginRequired');

let serverConfig;
try {
    serverConfig = yaml.safeLoad(fs.readFileSync(__dirname+'/../config/serverConfig.yaml', 'utf8'));
} catch (e) {
    console.log(e);
}

// service
router.get('/service', loginRequired, function(req, res){
    res.render('monitoring/serviceMonitoring', { 
        SERVER_IP: serverConfig.server.ip,
        SERVER_PORT: serverConfig.server.port,
        NATS_IP: serverConfig.nats.ip,
        NATS_PORT: serverConfig.nats.port,
        USER_DISPLAYNAME: req.user.displayname,
        USER_ID: req.user.username,
        URL_HOME: `http://${serverConfig.server.ip}:${serverConfig.server.port}`,
        URL_REPORT: `http://${serverConfig.server.ip}:${serverConfig.server.port}/report/thermal_img_inspec`,
        URL_MONITORING_SERVICE: `http://${serverConfig.server.ip}:${serverConfig.server.port}/monitoring/service`,
        URL_MONITORING_ROBOT: `http://${serverConfig.server.ip}:${serverConfig.server.port}/monitoring/robot`,
        URL_CONTROLLER: `http://${serverConfig.server.ip}:${serverConfig.server.port}/controller`,
        URL_BACKOFFICE: `http://${serverConfig.server.ip}:${serverConfig.server.port}/backoffice`,
        URL_SETTING_ALARM: `location.href ='http://${serverConfig.server.ip}:${serverConfig.server.port}/setting/alarm'`,
        URL_TEST_PAGE: `http://${serverConfig.server.ip}:${serverConfig.server.port}/testpg/feed`
    });
});

// robot
router.get('/robot', loginRequired, function(req, res){
    res.render('monitoring/robotMonitoring', { 
        SERVER_IP: serverConfig.server.ip,
        SERVER_PORT: serverConfig.server.port,
        NATS_IP: serverConfig.nats.ip,
        NATS_PORT: serverConfig.nats.port,
        USER_DISPLAYNAME: req.user.displayname,
        USER_ID: req.user.username,
        URL_HOME: `http://${serverConfig.server.ip}:${serverConfig.server.port}`,
        URL_REPORT: `http://${serverConfig.server.ip}:${serverConfig.server.port}/report/thermal_img_inspec`,
        URL_MONITORING_SERVICE: `http://${serverConfig.server.ip}:${serverConfig.server.port}/monitoring/service`,
        URL_MONITORING_ROBOT: `http://${serverConfig.server.ip}:${serverConfig.server.port}/monitoring/robot`,
        URL_CONTROLLER: `http://${serverConfig.server.ip}:${serverConfig.server.port}/controller`,
        URL_BACKOFFICE: `http://${serverConfig.server.ip}:${serverConfig.server.port}/backoffice`,
        URL_SETTING_ALARM: `location.href ='http://${serverConfig.server.ip}:${serverConfig.server.port}/setting/alarm'`,
        URL_TEST_PAGE: `http://${serverConfig.server.ip}:${serverConfig.server.port}/testpg/feed`
    });
});

module.exports = router;