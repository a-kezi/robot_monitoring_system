'use strict';
/** 
Robot Monitoring DB Cleaner

Node.js service to find data which is expired and delete those data.
Only applicable to mysql and sequelize.
@author Zihun Kye(2020.10.22) <zihun.kye@wonik.com>
@requires express
@requires js-yaml
@requires fs
@requires sequelize
@requires path
How To Use
from main.js node file
</pre>
    const DB_CLEANER = require('./routes/dbCleaner/dbCleaner');
    let dbCleaner = new DB_CLEANER();
    dbCleaner.init(db, dbCleanerConfig);
    dbCleaner.start();
</pre>
@namespace
**/

const yaml = require('js-yaml');
const fs   = require('fs');
const path   = require('path');

/**
    @description
    config file path : config/dbCleanerConfig.yaml
    <pre>
        timeset :
            hour : 7 # 24hours
            min : 0
            sec : 0

        cleanVolume: 1000
        retentionPeriod: 1 # days

        tables:
            - name : Auto_Patrol_Photo_Result
                img : true
            - name : Mask_Detect_Result
                img : true
            - name : People_Detect_Result
                img : true
            - name : User_Customizing
                img : false

        targetColumn: updatedAt
    </pre>
**/
let dbCleanerConfig;
try {
    // 리소스 리스트 가져오기
    dbCleanerConfig = yaml.safeLoad(fs.readFileSync(__dirname+'/../../config/dbCleanerConfig.yaml', 'utf8'));
    console.log(dbCleanerConfig)
} catch (e) {
    console.log("config file load error");
    console.log(e);
}

/**
    @method deleteFile
    @description
    delete a file of given path
    @param {string} path the path of the file that a user wants to delete
    @param {string} filename the name of the file that a user wants to delete
**/
function deleteFile(path,filename){
    fs.unlink(`${path}/${filename}.jpg`, function(err) {
        if (err){
            console.log(`## file delete fail : ${path}/${filename}.jpg`)
            console.log(err)
            switch(err.syscall){
                case "unlink":
                    break;
                default:
                    throw err;
                    break
            }
        }else{
            console.log(`## file deleted : ${path}/${filename}.jpg`)
        }
    });
}
/**
    @method getDateDir
    @description
    ...    
    @param {string} dateStr date string
**/
function getDateDir(dateStr){
    return new Promise(async resolve => {
        let result
        let date = new Date(dateStr);
        let yyyy = date.getFullYear();
        let mm = (date.getMonth() + 1);
        let dd = date.getDate();
        if (mm < 10) mm = "0" + mm;
        if (dd < 10) dd = "0" + dd;
        result = `${yyyy}${mm}${dd}`;
        resolve(result)
    })
}
/**
    @method getQueryDate
    @description
    get date applied the retention period
    @param {number} retentionPeriod retention period (day unit)
**/
function getQueryDate(retentionPeriod){
    
    return new Promise(async resolve => {
        let result
        let date = new Date();

        // # minute unit
        // date.setMinutes(date.getMinutes()-retentionPeriod)
        // # day unit
        date.setDate(date.getDate()-retentionPeriod)

        let yyyy = date.getFullYear();
        let mm = (date.getMonth() + 1);
        let dd = date.getDate();
        let hours = date.getHours()
        let minutes = date.getMinutes()
        let seconds = date.getSeconds();

        if (mm < 10) mm = "0" + mm;
        if (dd < 10) dd = "0" + dd;
        if (hours < 10) hours = "0" + hours;
        if (minutes < 10) minutes = "0" + minutes;
        if (seconds < 10) seconds = "0" + seconds;

        result = `${yyyy}-${mm}-${dd} ${hours}:${minutes}:${seconds}`;
        resolve(result)
    })
}
/**
    @method makeInternalIterator
    @description
    ..
    @param {number} arr ..
**/
function makeInternalIterator(arr){
    return {
        from: 0,
        to: arr.length,

        async *[Symbol.asyncIterator]() { // [Symbol.asyncIterator]: async function*()와 동일
            for(let value = this.from; value <= this.to; value++) {
                // 값 사이 사이에 10ms 공백을 줌
                await new Promise(resolve => setTimeout(resolve, 10));
                yield (value==this.to)?{index: value, data:arr[value], done: true}:{index: value, data:arr[value], done: false};
            }
        }
    }
}
/**
    @method makeTableIter
    @description
    ..
**/
function makeTableIter(start = 0, end = Infinity, step = 1) {
    var nextIndex = start;
    var n = 0;
    
    var rangeIterator = {
        next: function() {
            var result;
            if (nextIndex < end) {
                result = { value: nextIndex, done: false }
            } else if (nextIndex == end) {
                result = { value: n, done: true }
            } else {
                result = { done: true };
            }
            nextIndex += step;
            n++;
            return result;
        }
    };
    return rangeIterator;
}



function dbCleaner(){

    this.init = function(db, config){
        dbCleaner.prototype.db = db
        dbCleaner.prototype.config = config
    }

    this.start = function(){
        let proto_ = dbCleaner.prototype;
        proto_.timeCheckInterval = setInterval(function(){
            console.log("---",proto_.table_iter_flag,"#################################################" )
            if(!proto_.table_iter_flag){
                let time = new Date()
                if(
                    time.getHours() == proto_.config.timeset.hour &&
                    time.getMinutes() == proto_.config.timeset.min
                    ){
                        proto_.table_iter_flag = true
                        proto_.table_iter = makeTableIter(0, proto_.config.tables.length);
                        proto_.table_iter_result = proto_.table_iter.next();
                        proto_.cleanerDelegator()
                }
            }
        },1000)
    }

    this.stop = function(){
        let proto_ = dbCleaner.prototype;
        clearInterval(proto_.timeCheckInterval)
    }
}


dbCleaner.prototype.cleanerDelegator = async function(){
    let proto_ = dbCleaner.prototype;
    
    if(!proto_.table_iter_result.done){
        await proto_.dataClean(proto_.table_iter_result)
        proto_.table_iter_result = proto_.table_iter.next();
        proto_.cleanerDelegator()
    }else{
        console.log("## table iteration finished :")
        console.log("## the operated size of iteration : ", proto_.table_iter_result.value)
        proto_.table_iter_flag = false
    }
};

dbCleaner.prototype.dataClean = function(table_index){
    return new Promise(async resolve => {
        let proto_ = dbCleaner.prototype;
        
        // table iterator 만들기
        let tableName = proto_.config.tables[table_index.value].name
        let isImgCleanNeed = proto_.config.tables[table_index.value].img
        let cleanVolume = proto_.config.cleanVolume
        let queryDate = await getQueryDate(proto_.config.retentionPeriod)

        let query =`
            select * from ${tableName}
            where(
                updatedAt < "${queryDate}"
            )
            order by updatedAt desc
            limit ${cleanVolume};
        `

        switch(isImgCleanNeed){
            case true:
                proto_.db.sequelize.query(query)
                .then(async result=>{
                    let internal_iter = makeInternalIterator(result[0]);
                    for await (let value of internal_iter) {
                        if(!value.done){
                            // image 지우기
                            proto_.imgClean(value.data)
                        }else{
                            console.log("## imgClen iter finish")
                            // image 지우기 완료 후 DB data 지우기
                            let delete_query = `
                                delete from ${tableName}
                                where (
                                    updatedAt < "${queryDate}"
                                )
                                order by updatedAt desc
                                limit ${cleanVolume};
                            `;
                            proto_.db.sequelize.query(delete_query)
                            .then(result=>{
                                console.log("## db cleaned")
                                setTimeout(function(){
                                    resolve()
                                },10)
                            })
                            .catch(err=>{
                                console.log(err);
                            });
                        }
                    }
                })
                .catch(err=>{
                    console.log(err);
                });
                break;
            case false:
                let delete_query = `
                    delete from ${tableName}
                    where (
                        updatedAt < "${queryDate}"
                    )
                    order by updatedAt desc
                    limit ${cleanVolume};
                `;
                proto_.db.sequelize.query(delete_query)
                .then(result=>{
                    console.log("## db cleaned")
                    setTimeout(function(){
                        resolve()
                    },10)
                })
                .catch(err=>{
                    console.log(err);
                });
                break;
            default:
                break;
        }
    })
};

dbCleaner.prototype.imgClean = async function(data){
    let date = data.updatedAt
    let filename = data.msg_id
    let type = data.type
    let dateDirPath = await getDateDir(date)
    let thumnail_img_path = `${path.dirname(__dirname)}/../db/resultImg/thumnail/${dateDirPath}`
    let origin_img_path = `${path.dirname(__dirname)}/../db/resultImg/origin/${dateDirPath}`

    deleteFile(thumnail_img_path, filename)
    deleteFile(origin_img_path, filename)
    if(type == "thermal_img_inspec"){
        let thermal_img_path = `${path.dirname(__dirname)}/../db/thermal/${dateDirPath}`
        deleteFile(thermal_img_path, filename)
    }

};

dbCleaner.prototype.db = null;
dbCleaner.prototype.config = null;

dbCleaner.prototype.timeCheckInterval = null;

dbCleaner.prototype.table_iter_flag = false;
dbCleaner.prototype.table_iter = null;
dbCleaner.prototype.table_iter_result = null;

module.exports = dbCleaner;




