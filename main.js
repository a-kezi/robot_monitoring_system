'use strict'
const express = require('express');
const cors = require('cors');
const path = require('path');
const logger = require('morgan'); // 노드 서버 가동 시키고 http 오가는 로그 남기는것
const flash = require('connect-flash'); //flash  메시지 관련 패키지 import
const bodyParser = require('body-parser'); // bodyparser가 없으니까 post에서 id, password 값을 못 읽어 온다.
const cookieParser = require('cookie-parser'); // req에서 쿠키 추출을 쉽게 해주는 패키지 -> 일단 없어도 post에서 id, password값은 가져온다.
const yaml = require('js-yaml');
const fs   = require('fs');
const dotenv = require('dotenv');
dotenv.config(); //LOAD CONFIG

let serverConfig;
let resource;

// 설정파일 내용 저장
try {
    serverConfig = yaml.safeLoad(fs.readFileSync(__dirname+'/config/serverConfig.yaml', 'utf8'));
    resource = yaml.safeLoad(fs.readFileSync(__dirname+'/config/resource.yaml', 'utf8'));
    
} catch (e) {
    console.log(e);
}

// express app 인스턴스
let app = express();

// express app setting
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.set('serverConfig',serverConfig)


// 미들웨어 셋팅
// app.use(helmet.frameguard());
app.use(logger('dev')); // 노드 서버 가동 시키고 http 오가는 로그 남기는것app.use(bodyParser.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser()); // req에서 쿠키 추출을 쉽게 해주는 패키지
app.use(express.json()) // body-parser 대용
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


// path 설정
app.use('/resource', express.static(path.join(__dirname, 'resource')));
app.use('/static', express.static(path.join(__dirname, 'www')));
app.use('/db', express.static(path.join(__dirname, 'db')));

// db 관련
const db = require(__dirname+'/models');
db.sequelize.authenticate()
.then(() => {
    console.log('Connection has been established successfully.');
    return db.sequelize.sync();
})
.then(() => {
    console.log('DB Sync complete.');
    let query = 'delete from Service_List;'
    db.sequelize.query(query)
    .then(()=>{
        resource.service.forEach(item=>{
            let data = {
                type: item.type,
                display_name: item.display_name,
                table: item.table
            }
            db.ServiceList.create(data).then( () => {
                
            });
        })
        
    })
    .catch(err=>{
        console.log("service list update error");
    });

})
.catch(err => {
    console.error('Unable to connect to the database:', err);
});

//session 셋팅, passport 로그인 관련 패키지 import
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const passportAuth = require(__dirname+'/libs/account/passportAuth_local');

//session 관련 셋팅
let sessionMiddleWare = session({
    name:'wonikrobotics_session',
    secret: 'wonik',
    resave: false,
    saveUninitialized: true,
    cookie: {
        // maxAge: 2*(1000 * 60 * 60) //지속시간 2시간
        maxAge: 2147483647
        // maxAge: 500 * 60 * 60 //지속시간 30분
        // maxAge: 1000 * 10 //지속시간 10초
    },
    store: new MySQLStore({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DATABASE
    })
})
app.use(sessionMiddleWare);

//passport 적용 - 반드시 session 셋팅 뒤에 자리해야함
app.use(passportAuth.initialize());
app.use(passportAuth.session());


//플래시 메시지 사용 설정 - 플래시 메세지도 session을 사용하기 때문에 session 세팅 위에 자리해야함.
app.use(flash());
//로그인 정보 뷰에서만 변수로 셋팅, 전체 미들웨어는 router위에 두어야 에러가 안난다
app.use(function(req, res, next) {
    // console.log(req.isAuthenticated(),req.user);
    app.locals.isLogin = req.isAuthenticated();
    //app.locals.urlparameter = req.url; //현재 url 정보를 보내고 싶으면 이와같이 셋팅
    app.locals.userData = req.user; //사용 정보를 보내고 싶으면 이와같이 셋팅
    next();
});


// Routing
const loginRequired = require(__dirname+'/libs/account/loginRequired');
const accounts = require(__dirname+'/routes/accounts_local');
const restApi = require(__dirname+'/routes/restApi');
const monitoring = require(__dirname+'/routes/monitoring');
const controller = require(__dirname+'/routes/controller');
const report = require(__dirname+'/routes/report');
const backoffice = require(__dirname+'/routes/backoffice');

app.use('/accounts', accounts);
app.use('/rest', restApi);
app.use('/monitoring', monitoring);
app.use('/controller', controller);
app.use('/report', report);
app.use('/backoffice', backoffice);

let server = app.listen( serverConfig.server.port, function(){
    console.log('## web server listening on port', serverConfig.server.port);
});

app.get('/', loginRequired, function (req, res) {
    res.redirect('/monitoring/service');
});

// state monitor
const StateMonitor = require(__dirname+'/routes/stateMonitor/stateMonitor');
let state_monitor = new StateMonitor({
    ip:process.env.NATS_IP,
    port:process.env.NATS_PORT
}, app, db);
