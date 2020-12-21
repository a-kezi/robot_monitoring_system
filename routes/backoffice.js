'use strict'
const yaml = require('js-yaml');
const fs   = require('fs');
const multer = require('multer');
const path = require('path');
const zip = require('express-zip');
const express = require('express');
const router = express.Router();
const { v1: uuidv1 } = require('uuid');
const dotenv = require('dotenv');
const mkdirp = require('mkdirp');
dotenv.config({ path: path.join(__dirname, '/../.env') }); //LOAD CONFIG

const DOCTOR_IMG_FILE_PATH_CONSTANT = "/img/department_list/doctors"
const DEPARTMENT_IMG_FILE_PATH_CONSTANT = "/img/department_list"

let serverConfig;
try {
    serverConfig = yaml.safeLoad(fs.readFileSync('./config/serverConfig.yaml', 'utf8'));
} catch (e) {
    console.log(e);
}

// db 관련
const db = require(__dirname+'/../models');
// DB authentication
db.sequelize.authenticate()
.then(() => {
    console.log('Connection has been established successfully.');
    return db.sequelize.sync();
})
.then(() => {
    console.log('DB Sync complete.');
    let query = `
    select * from Bo_UdateCheck
    `;
    db.sequelize.query(query)
    .then(async (result) => {
        if(result[0].length==0){
            db.boUdateCheck.create({
                update_id: uuidv1()
            })
        }
    })
    .catch(err=>{
        console.log(err)
    })

    let department_path = `${__dirname}/../resource/uploads/department`;
    let doctor_path = `${__dirname}/../resource/uploads/doctor`;

    mkdirp(department_path)
    .then(made =>{
        console.log(`made directories, starting with ${made}`)
    });
    mkdirp(doctor_path)
    .then(made =>{
        console.log(`made directories, starting with ${made}`)
    });

    
})
.catch(err => {
    console.error('Unable to connect to the database:', err);
});

const loginRequired = require(__dirname+'/../libs/account/loginRequired');

//이미지 저장되는 위치 설정
const uploadDir = path.join( __dirname , '/../resource/uploads' ); // 루트의 uploads위치에 저장한다.
//multer 의 diskStorage를 정의
let storage = multer.diskStorage({
    //경로 설정
    destination : function(req, file, cb){    
        if(req.body.data_type=="department"){
            cb(null, uploadDir+"/department");
        }else if(req.body.data_type=="doctor"){
            cb(null, uploadDir+"/doctor");
        }else{
            cb(null, uploadDir );
        }
    },
    //실제 저장되는 파일명 설정
    filename : function(req, file, cb){
        let name = req.body.name;
        let mimeType;
        switch (file.mimetype) {
            case "image/jpeg":
            mimeType = "jpg";
            break;
            case "image/png":
            mimeType = "png";
            break;
            case "image/gif":
            mimeType = "gif";
            break;
            case "image/bmp":
            mimeType = "bmp";
            break;
            default:
            mimeType = "jpg";
            break;
        }
        cb(null, `${file.originalname}`);
    }
});
let upload = multer({ storage: storage });


// backoffice page
router.get('/', loginRequired, function(req, res){
    res.render('backoffice/backoffice', { 
        SERVER_IP: serverConfig.server.ip,
        SERVER_PORT: serverConfig.server.port,
        NATS_IP: serverConfig.nats.ip,
        NATS_PORT: serverConfig.nats.port,
        NATS_RELAY_PORT: serverConfig.nats.relay_port,
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


/*
    api related to department
*/

// create department
router.post('/api/create/department', function (req, res) {
    let create_data = {}
    create_data['data_id'] = req.body.data_id
    create_data['ord'] = Number(req.body.ord)
    create_data['default_opt'] = Number(req.body.default_opt)
    create_data['type'] = req.body.type
    create_data['img_flag'] = Number(req.body.img_flag)
    create_data['check_flag'] = Number(req.body.check_flag)
    create_data['title_korean'] = req.body.title_korean
    create_data['description'] = req.body.description
    create_data['location'] = req.body.location
    create_data['img'] = req.body.img
    create_data['position_x'] = Number(req.body.position_x)
    create_data['position_y'] = Number(req.body.position_y)
    create_data['doctors'] = ''

    // update updatecheck
    let updatecheck_id = uuidv1()
    let query_updatecheck = `update Bo_UdateCheck set update_id = "${updatecheck_id}"`;
    db.sequelize.query(query_updatecheck)

    db.BoDepartment.create(create_data)
    .then((result) => {
        res.status(200).send({
            state: true,
            desc: result
        });
        res.end();
    })
    .catch(err=>{
        res.status(400).send({
            state: false,
            desc: err
        });
        res.end();
    })
});
// get department & doctor list data
router.post('/api/get/all',
    async function (req, res) {
        let allData = {
            department:[]
        }
        let query = `
        select * from Bo_Department
        order by ord asc
        `;
        db.sequelize.query(query)
        .then(async (result) => {
            if(result[0].length!=0){
                let department_list = result[0]
                allData.department = await makeDoctorArray(department_list)
                res.status(200).send({
                    state: true,
                    desc: allData
                });
                res.end();
            }else{
                res.status(200).send({
                    state: true,
                    desc: allData
                });
                res.end();
            }
        })
        .catch(err=>{
            res.status(400).send({
                state: false,
                desc: err
            });
            res.end();
        })
    }
);

// delete department
router.post('/api/delete/department', function (req, res) {
    // update updatecheck
    let updatecheck_id = uuidv1()
    let query_updatecheck = `update Bo_UdateCheck set update_id = "${updatecheck_id}"`;
    db.sequelize.query(query_updatecheck)

    let query = `
    select * from Bo_Department
    where (
        data_id = '${req.body.data_id}'
    );
    `;
    db.sequelize.query(query)
    .then(result=>{

        if(result[0].length!=0){
            // 지우는 작업
            let query_department = `
            delete from Bo_Department
            where (
                data_id = '${req.body.data_id}'
            );
            `;
            if(result[0][0].doctors!=''){
                let doctors = result[0][0].doctors.split("!");
                doctors.forEach( id =>{
                    let query = `
                        delete from Bo_Doctor
                        where (
                            data_id = '${id}'
                        )
                    `;
                    db.sequelize.query(query)
                })
            }
            
            db.sequelize.query(query_department)
            .then(result=>{
                res.status(200).send({
                    state: true,
                    desc: result
                });
                res.end();
            })
            .catch(err=>{
                console.log("update error", err);
                res.status(400).send({
                    state: false,
                    desc: err
                });
                res.end();
            });


            // 순서 변경하는 작업
            let query_order_change = `
            update Bo_Department
            set
                ord = ord - 1
            where (
                ord > '${result[0][0].ord}'
            );
            `;
            db.sequelize.query(query_order_change)
        }

        
    })
    .catch(err=>{
        console.log("update error", err);
        res.status(400).send({
            status:false,
            result : err
        });
        res.end();
    });
});
// default opt set
router.post('/api/department/default', function (req, res) {
    // update updatecheck
    let updatecheck_id = uuidv1()
    let query_updatecheck = `update Bo_UdateCheck set update_id = "${updatecheck_id}"`;
    db.sequelize.query(query_updatecheck)

    let update_query = undefined
    if(Number(req.body.set)==1){
        update_query = 1
    }else{
        update_query = 0
    }
    let query = `
        update Bo_Department
        set 
        default_opt=${update_query}
        where (
            data_id = '${req.body.data_id}' 
        )
    `;
    db.sequelize.query(query)
    .then(result=>{
        res.status(200).send({
            state: true,
            desc: result
        });
        res.end();
    })
    .catch(err=>{
        console.log("update error", err);
        res.status(400).send({
            state: false,
            desc: err
        });
        res.end();
    });

    
});

// save department 
router.post('/api/department/save', upload.single('IMG_FILE'), function (req, res) {
    // update updatecheck
    let updatecheck_id = uuidv1()
    let query_updatecheck = `update Bo_UdateCheck set update_id = "${updatecheck_id}"`;
    db.sequelize.query(query_updatecheck)

    let title_korean = req.body.title_korean
    let type = req.body.type
    let location = req.body.location
    let description = req.body.description
    let img_name = undefined
    let img_flag = undefined
    let check_flag = req.body.check_flag
    if(req.file!= undefined){
        img_name = req.file.originalname
        img_flag = 1
    } 
    

    let title_korean_query = (title_korean!=undefined)?`title_korean='${title_korean}'`:'';
    let type_query = (type!=undefined)?`type='${type}'`:'';
    let location_query = (location!=undefined)?`location='${location}'`:'';
    let description_query = (description!=undefined)?`description='${description}'`:'';
    let img_name_query = (img_name!=undefined)?`img='${img_name}'`:'';
    let img_flag_query = (img_flag!=undefined)?`img_flag='${img_flag}'`:'';
    let check_flag_query = (check_flag=="true")?`check_flag=1`:`check_flag=0`;

    let temp_arr = new Array(
        title_korean_query,
        type_query,
        location_query,
        description_query,
        img_name_query,
        img_flag_query,
        check_flag_query)
    let update_query = ""
    temp_arr.forEach(item =>{
        if(item!=""){
            update_query += item +","
        }
    })
    update_query = update_query.slice(0,-1)
    // db업데이트
    let query = `
        update Bo_Department
        set 
        ${update_query}
        where (
            data_id = '${req.body.data_id}' 
        )
    `;
    db.sequelize.query(query)
    .then(result=>{
        res.status(200).send({
            state: true,
            desc: {
                title_korean : title_korean,
                type : type,
                location : location,
                description : description,
                img_name : img_name
            }
        });
        res.end();
    })
    .catch(err=>{
        console.log("update error", err);
        res.status(400).send({
            state: false,
            desc: err
        });
        res.end();
    });
});


/*
    api related to doctor
*/
// create doctor
router.post('/api/create/doctor', function (req, res) {
    // update updatecheck
    let updatecheck_id = uuidv1()
    let query_updatecheck = `update Bo_UdateCheck set update_id = "${updatecheck_id}"`;
    db.sequelize.query(query_updatecheck)

    // doctor db에 uuid 업데이트 하기
    
    let department_id = req.body.department_id
    let doctor_id = req.body.data_id
    let create_data = {}
    create_data['department_id'] = department_id
    create_data['data_id'] = doctor_id
    create_data['ord'] = Number(req.body.ord)
    create_data['img_flag'] = Number(req.body.img_flag)
    create_data['check_flag'] = Number(req.body.check_flag)
    create_data['picture'] = req.body.picture
    create_data['name'] = req.body.name
    create_data['title'] = req.body.title
    create_data['major'] = req.body.major
    create_data['education'] = ''
    create_data['career'] = ''
    create_data['academy'] = ''

    
    db.BoDoctor.create(create_data)
    .then((result) => {
        // department db의 doctor 받아서 uuid 추가해서 업데이트 하기
        // 다되면 return 하기
        let query = `
        select * from Bo_Department
        where (
            data_id = '${department_id}'
        );
        `;
        db.sequelize.query(query)
        .then(result=>{
            if(result[0].length!=0){

                let doctors = (result[0][0].doctors=='')?'':result[0][0].doctors+'!';
                let query = `
                    update Bo_Department
                    set	doctors = '${doctors}${doctor_id}'
                    where (
                        data_id = '${department_id}'
                    );
                `;
                    
                db.sequelize.query(query)
                .then(result=>{
                    res.status(200).send({
                        state: true,
                        desc: result
                    });
                    res.end();
                })
                .catch(err=>{
                    console.log("update error", err);
                    res.status(400).send({
                        state: false,
                        desc: err
                    });
                    res.end();
                });
            }
        })
        .catch(err=>{
            console.log("update error", err);
            res.status(400).send({
                status:false,
                result : err
            });
            res.end();
        });
    })
    .catch(err=>{
        console.log("update error", err);
        res.status(400).send({
            status:false,
            result : err
        });
        res.end();
    })
});
// update doctor data
router.post('/api/doctor/save', upload.single('IMG_FILE'), function (req, res) {
    // update updatecheck
    let updatecheck_id = uuidv1()
    let query_updatecheck = `update Bo_UdateCheck set update_id = "${updatecheck_id}"`;
    db.sequelize.query(query_updatecheck)

    let check_flag = req.body.check_flag
    let name = req.body.name
    let title = req.body.title
    let major = req.body.major
    let education = req.body.education
    let career = req.body.career
    let academy = req.body.academy

    let img_name = undefined
    let img_flag = undefined
    if(req.file!= undefined){
        img_name = req.file.originalname
        img_flag = 1
    } 
    function stringBoolean(txt){
        if(txt=="true") return 1
        if(txt=="false") return 0
    }
    let check_flag_query = (check_flag!=undefined)?`check_flag=${stringBoolean(check_flag)}`:'';
    let name_query = (name!=undefined)?`name='${name}'`:'';
    let title_query = (title!=undefined)?`title='${title}'`:'';
    let major_query = (major!=undefined)?`major='${major}'`:'';
    let education_query = (education!=undefined)?`education='${education.join("!")}'`:'';
    let career_query = (career!=undefined)?`career='${career.join("!")}'`:'';
    let academy_query = (academy!=undefined)?`academy='${academy.join("!")}'`:'';
    let img_name_query = (img_name!=undefined)?`picture='${img_name}'`:'';
    let img_flag_query = (img_flag!=undefined)?`img_flag='${img_flag}'`:'';

    let temp_arr = new Array(
        check_flag_query,
        name_query,
        title_query,
        major_query,
        education_query,
        career_query,
        academy_query,
        img_name_query,
        img_flag_query)
    let update_query = ""
    temp_arr.forEach(item =>{
        if(item!=""){
            update_query += item +","
        }
    })
    update_query = update_query.slice(0,-1)
    // db업데이트
    let query = `
        update Bo_Doctor
        set 
        ${update_query}
        where (
            data_id = '${req.body.data_id}' 
        )
    `;
    db.sequelize.query(query)
    .then(result=>{
        res.status(200).send({
            state: true,
            desc: {
                name: name,
                img_name: img_name
            }
        });
        res.end();
    })
    .catch(err=>{
        console.log("update error", err);
        res.status(400).send({
            state: false,
            desc: err
        });
        res.end();
    });
});

// delete doctor
router.post('/api/delete/doctor', function (req, res) {
    // update updatecheck
    let updatecheck_id = uuidv1()
    let query_updatecheck = `update Bo_UdateCheck set update_id = "${updatecheck_id}"`;
    db.sequelize.query(query_updatecheck)

    let data_id = req.body.data_id
    let department_id = req.body.department_id

    let query = `
    select * from Bo_Doctor
    where (
        data_id = '${data_id}'
    );
    `;
    db.sequelize.query(query)
    .then(result=>{

        if(result[0].length!=0){
            // 지우는 작업
            let query_doctor = `
            delete from Bo_Doctor
            where (
                data_id = '${data_id}'
            );
            `;
            let target_doctor = result[0][0]
            db.sequelize.query(query_doctor)
            .then(result=>{
                // 순서 변경하는 작업
                let query_order_change = `
                update Bo_Doctor
                set
                    ord = ord - 1
                where (
                    ord > '${target_doctor.ord}'
                );
                `;
                db.sequelize.query(query_order_change)
                

                let query_department = `
                select * from Bo_Department
                where (
                    data_id = '${department_id}'
                );
                `;
                db.sequelize.query(query_department)
                .then(result=>{
                    if(result[0]!= 0){
                        let doctors = result[0][0].doctors
                        if(doctors!=""){
                            doctors = doctors.split("!")
                            let idx = doctors.indexOf(data_id) 
                            if (idx > -1) doctors.splice(idx, 1)
                            let update_data = doctors.join("!")

                            let department_update = `
                            update Bo_Department
                            set
                                doctors = '${update_data}'
                            where (
                                data_id = '${department_id}'
                            );
                            `;
                            db.sequelize.query(department_update)
                            .then(result=>{
                                res.status(200).send({
                                    state: true,
                                    desc: result
                                });
                                res.end();
                                
                            })
                            .catch(err=>{
                                console.log("update error", err);
                                res.status(400).send({
                                    state: false,
                                    desc: err
                                });
                                res.end();
                            });
                        }
                    }
                })
                .catch(err=>{
                    console.log("update error", err);
                    res.status(400).send({
                        state: false,
                        desc: err
                    });
                    res.end();
                });
            })
            .catch(err=>{
                console.log("update error", err);
                res.status(400).send({
                    state: false,
                    desc: err
                });
                res.end();
            });
        }
    })
    .catch(err=>{
        console.log("update error", err);
        res.status(400).send({
            status:false,
            result : err
        });
        res.end();
    });
});

/*
    list update api
*/
// change department order
router.post('/api/update/department/order', function (req, res) {
    // update updatecheck
    let updatecheck_id = uuidv1()
    let query_updatecheck = `update Bo_UdateCheck set update_id = "${updatecheck_id}"`;
    db.sequelize.query(query_updatecheck)
    if(req.body.direction =="up"){
        // up
        let query = `
        update Bo_Department
        set 
        ord = ord+1
        where (
            ord = '${Number(req.body.crt_order)-1}' 
        )`;
        db.sequelize.query(query)
        .then(result=>{
            let query_target = `
            update Bo_Department
            set 
            ord = ord-1
            where (
                data_id = '${req.body.data_id}' 
            )`;
            db.sequelize.query(query_target)
            .then(result=>{
                res.status(200).send({
                    state: true,
                    desc: result
                });
                res.end();
            })
            .catch(err=>{
                console.log("update error", err);
                res.status(400).send({
                    state: false,
                    desc: err
                });
                res.end();
            });
        })
        .catch(err=>{
            console.log("update error", err);
            res.status(400).send({
                state: false,
                desc: err
            });
            res.end();
        });

        

    }else{
        //down
        let query = `
        update Bo_Department
        set 
        ord = ord-1
        where (
            ord = '${Number(req.body.crt_order)+1}' 
        )`;
        db.sequelize.query(query)
        .then(result=>{
            let query_target = `
            update Bo_Department
            set 
            ord = ord+1
            where (
                data_id = '${req.body.data_id}' 
            )`;
            db.sequelize.query(query_target)
            .then(result=>{
                res.status(200).send({
                    state: true,
                    desc: result
                });
                res.end();
            })
            .catch(err=>{
                console.log("update error", err);
                res.status(400).send({
                    state: false,
                    desc: err
                });
                res.end();
            });
        })
        .catch(err=>{
            console.log("update error", err);
            res.status(400).send({
                state: false,
                desc: err
            });
            res.end();
        });
    }
});
// change doctor order
router.post('/api/update/doctor/order', function (req, res) {
    // update updatecheck
    let updatecheck_id = uuidv1()
    let query_updatecheck = `update Bo_UdateCheck set update_id = "${updatecheck_id}"`;
    db.sequelize.query(query_updatecheck)

    let department_id = req.body.department_id
    let data_id = req.body.data_id
    let crt_order = Number(req.body.crt_order)

    if(req.body.direction=="up"){
        // up
        let query = `
        update Bo_Doctor
        set 
        ord = ord+1
        where (
            ord = ${crt_order-1} and
            department_id = '${department_id}'
        )`;
        db.sequelize.query(query)
        .then(result=>{
            let query_target = `
            update Bo_Doctor
            set 
            ord = ord-1
            where (
                data_id = '${data_id}' 
            )`;
            db.sequelize.query(query_target)
            .then(result=>{
                res.status(200).send({
                    state: true,
                    desc: result
                });
                res.end();
            })
            .catch(err=>{
                console.log("update error", err);
                res.status(400).send({
                    state: false,
                    desc: err
                });
                res.end();
            });
        })
        .catch(err=>{
            console.log("update error", err);
            res.status(400).send({
                state: false,
                desc: err
            });
            res.end();
        });
        
    }else if(req.body.direction=="down"){
        //down
        let query = `
        update Bo_Doctor
        set 
        ord = ord-1
        where (
            ord = ${crt_order+1} and
            department_id = '${department_id}'
        )`;
        db.sequelize.query(query)
        .then(result=>{
            let query_target = `
            update Bo_Doctor
            set 
            ord = ord+1
            where (
                data_id = '${data_id}' 
            )`;
            db.sequelize.query(query_target)
            .then(result=>{
                res.status(200).send({
                    state: true,
                    desc: result
                });
                res.end();
            })
            .catch(err=>{
                console.log("update error", err);
                res.status(400).send({
                    state: false,
                    desc: err
                });
                res.end();
            });
        })
        .catch(err=>{
            console.log("update error", err);
            res.status(400).send({
                state: false,
                desc: err
            });
            res.end();
        });

    }
    
});


/*
    img api
*/
// get department img
function getFileExtension(txt){
    let fileLen = txt.length;
    let lastDot = txt.lastIndexOf(".");
    let fileExtension = txt.substring(lastDot+1, fileLen)
    return fileExtension
}
router.get('/api/img', function (req, res) {
    let id = req.query.id
    let type = req.query.type
    let table_name = undefined
    if(type=="department"){
        table_name="Bo_Department"
    }else if(type=="doctor"){
        table_name="Bo_Doctor"
    }
    let query = `
        select * from ${table_name}
        where (
            data_id = '${id}'
        );
        `;
    db.sequelize.query(query)
    .then(result=>{
        if(result[0].length!=0){
            if(result[0][0].img_flag==1){
                let file_path = undefined
                let content_type = undefined
                if(type=="department"){
                    file_path= `${__dirname}/../resource/uploads/department/${result[0][0].img}`
                    content_type = getFileExtension(result[0][0].img)
                }else{
                    file_path= `${__dirname}/../resource/uploads/doctor/${result[0][0].picture}`
                    content_type = getFileExtension(result[0][0].picture)
                }
                // console.log(result[0])
                // console.log(file_path)
                switch(content_type){
                    default:
                        content_type = 'image/jpeg'
                        break;
                    case "svg":
                        content_type = 'image/svg+xml'
                        break;
                    case "gif":
                        content_type = 'image/gif'
                        break;
                    case "png":
                        content_type = 'image/png'
                        break;
                }

                fs.readFile(file_path, function(err,data){
                    let img = data;
                    // console.log(data)
                    res.writeHead(200, {'Content-Type':content_type});
                    res.end(img);
                })
            }else{
                res.status(400).send({
                    status:false,
                    result : result[0]
                });
                res.end();    
            }
        }else{
            res.status(400).send({
                status:false,
                result : result[0]
            });
            res.end();
        }
    })
    .catch(err=>{
        console.log("update error", err);
        res.status(400).send({
            status:false,
            result : err
        });
        res.end();
    });
});


// make json file
router.get('/api/make/json', 
    async function (req, res) {
        let allData = {
            department:[]
        }
        let query = `
        select * from Bo_Department
        order by ord asc
        `;
        db.sequelize.query(query)
        .then(async (result) => {
            if(result[0].length!=0){
                let department_list = result[0]
                let json = await makeDoctorArray(department_list)
                allData.department = await doctorStrToArr(json)
                let query = `
                select * from Bo_UdateCheck
                `;
                db.sequelize.query(query)
                .then((update_id_result) => {
                    if(update_id_result[0].length!=0){
                        allData['update_id'] = update_id_result[0][0].update_id
                        res.status(200).send({
                            state: true,
                            desc: allData
                        });
                        res.end();
                    }else{
                        res.status(400).send({
                            state: false,
                            desc: err
                        });
                        res.end();
                    }
                })
                .catch(err=>{
                    res.status(400).send({
                        state: false,
                        desc: err
                    });
                    res.end();
                })
                
                
            }else{
                res.status(200).send({
                    state: true,
                    desc: allData
                });
                res.end();
            }
        })
        .catch(err=>{
            res.status(400).send({
                state: false,
                desc: err
            });
            res.end();
        })
});

// get check update
router.get('/api/checkupdate', function(req, res){
    let query = `
    select * from Bo_UdateCheck
    `;
    db.sequelize.query(query)
    .then(async (result) => {
        res.status(200).send({
            state: true,
            desc: result[0][0]
        });
        res.end();
    })
    .catch(err=>{
        res.status(400).send({
            state: false,
            desc: err
        });
        res.end();
    })
});
// get image files
router.get('/api/get/imgfile/department', function(req, res){
    fs.readdir(uploadDir+"/department", function(error, filelist){
        console.log(filelist);
        let zipList = []
        filelist.forEach(file =>{
            zipList.push({
                path: uploadDir+"/department/"+file,
                name: file
            })
        })
        res.zip(zipList);
        // res.end()
    })
});
router.get('/api/get/imgfile/doctor', function(req, res){
    fs.readdir(uploadDir+"/doctor", function(error, filelist){
        console.log(filelist);
        let zipList = []
        filelist.forEach(file =>{
            zipList.push({
                path: uploadDir+"/doctor/"+file,
                name: file
            })
        })
        res.zip(zipList);
        // res.end()
    })
});


/*
    functions
*/
function doctorStrToArr(data){
    return new Promise((resolve, reject) => {
        console.log(data)
        data.forEach(department=>{
            department['id'] = department['ord']
            department['position'] = {
                x: department['position_x'],
                y: department['position_y']
            }
            department['img'] = DEPARTMENT_IMG_FILE_PATH_CONSTANT+"/"+department['img']
            department.doctors.forEach(doctor=>{
                doctor['id'] = doctor['ord']
                doctor['picture'] = DOCTOR_IMG_FILE_PATH_CONSTANT+"/"+doctor['picture']
                if(doctor['education']==""){
                    doctor['education']=[]
                }else{
                    let temp = []
                    let edu_arr = doctor['education'].split("!")
                    edu_arr.forEach((item, index, arr)=>{
                        temp.push({
                            ord: index+1,
                            value: item
                        })
                    })
                    doctor['education'] = temp
                }
                if(doctor['career']==""){
                    doctor['career']=[]
                }else{
                    let temp = []
                    let crr_arr = doctor['career'].split("!")
                    crr_arr.forEach((item, index, arr)=>{
                        temp.push({
                            ord: index+1,
                            value: item
                        })
                    })
                    doctor['career'] = temp
                }
                if(doctor['academy']==""){
                    doctor['academy']=[]
                }else{
                    let temp = []
                    let acd_arr = doctor['academy'].split("!")
                    acd_arr.forEach((item, index, arr)=>{
                        temp.push({
                            ord: index+1,
                            value: item
                        })
                    })
                    doctor['academy'] = temp
                }
            })
        })

        resolve(data)
        
    })
}
function doctorIdToObj(doctor_list){
    return new Promise((resolve, reject) => {
        let doctor_query = ''
        doctor_list.forEach( (id, index, array) =>{
            if(index == array.length-1){
                doctor_query += `data_id = '${id}'`
            }else{
                doctor_query += `data_id = '${id}' or `
            }
        })

        let query = `
        select * from Bo_Doctor
        where (
            ${doctor_query}
        )
        order by ord asc
        `;
        db.sequelize.query(query)
        .then((result) => {
            resolve(result[0])
        })
        .catch(err=>{
            reject()
        })
    })
}
function makeDoctorArray(departmentList){   
    return new Promise((resolve, reject) => {
        let num = 1 
        departmentList.forEach(async (element) => {
            if(element.doctors==''){
                element.doctors = []
            }else{
                element.doctors = element.doctors.split("!")
                element.doctors = await doctorIdToObj(element.doctors)
            }
            if(num == departmentList.length){
                resolve(departmentList)
            }
            num += 1 
        });
    });
}
module.exports = router;




