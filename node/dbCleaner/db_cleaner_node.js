'use strict'
const yaml = require('js-yaml');
const path = require('path');
const fs   = require('fs');
const dotenv = require('dotenv');
dotenv.config({ path: path.dirname(__dirname)+'/../.env'});
const db = require(__dirname+'/../../models');

let dbCleanerConfig;

// 설정파일 내용 저장
try {
    dbCleanerConfig = yaml.safeLoad(
        fs.readFileSync(
            __dirname+'/../../config/dbCleanerConfig.yaml', 'utf8'));
} catch (e) {
    console.log(e);
}

// DB authentication
db.sequelize.authenticate()
.then(() => {
    console.log('Connection has been established successfully.');
    return db.sequelize.sync();
})
.then(() => {
    console.log('DB Sync complete.');
})
.catch(err => {
    console.error('Unable to connect to the database:', err);
});

// db cleaner
const DB_CLEANER = require('./dbCleaner');
let dbCleaner = new DB_CLEANER();
dbCleaner.init(db,dbCleanerConfig);
dbCleaner.start();
// process.send({ msg: 'db cleaner started' });