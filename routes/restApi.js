'use strict'
const express = require('express');
const router = express.Router();

const rest_robot = require(__dirname+'/rest/robot');
router.use('/robot', rest_robot);
const rest_map = require(__dirname+'/rest/map');
router.use('/map', rest_map);
const rest_poi = require(__dirname+'/rest/poi');
router.use('/poi', rest_poi);
const rest_service = require(__dirname+'/rest/service');
router.use('/service', rest_service);
const rest_site = require(__dirname+'/rest/site');
router.use('/site', rest_site);
const rest_subject = require(__dirname+'/rest/subject');
router.use('/subject', rest_subject);
const rest_zone = require(__dirname+'/rest/zone');
router.use('/zone', rest_zone);
const rest_servicefeed = require(__dirname+'/rest/servicefeed');
router.use('/servicefeed', rest_servicefeed);
const rest_robotfeed = require(__dirname+'/rest/robotfeed');
router.use('/robotfeed', rest_robotfeed);
const camera = require(__dirname+'/rest/camera');
router.use('/camera', camera);
const image = require(__dirname+'/rest/image');
router.use('/image', image);
const rest_reportfeed = require(__dirname+'/rest/reportfeed');
router.use('/reportfeed', rest_reportfeed);
const rest_alarm = require(__dirname+'/rest/alarm');
router.use('/alarm', rest_alarm);


module.exports = router;