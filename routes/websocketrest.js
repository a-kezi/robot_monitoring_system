'use strict'
const yaml = require('js-yaml')
const fs   = require('fs')
const pushDataConverter = require(__dirname+'/../libs/pushDataConverter');
/*
    node.js 에서 rest로 push요청 예시
    // target
    const options = {
        uri:'http://127.0.0.1:8080/websocket/send/target', 
        method: 'POST',
        form: {
            site_id:robot_status_data.site,
            robot_id: robot_status_data.robot_id,
            push_type:'fault',
            msg:JSON.stringify(parsedData.message)
        }
    }
    console.log(options)
    request.post(options, function(err,httpResponse,body){
        console.log("push requested");
    })

    // site
    const options = {
        uri:'http://127.0.0.1:8080/websocket/send/site', 
        method: 'POST',
        form: {
            site_id:robot_status_data.site,
            robot_id: robot_status_data.robot_id,
            push_type:'fault',
            msg:JSON.stringify(parsedData.message)
        }
    }
    console.log(options)
    request.post(options, function(err,httpResponse,body){
        console.log("push requested");
    })
*/
let resource
try {
    resource = yaml.safeLoad(fs.readFileSync(__dirname+'/../config/resource.yaml', 'utf8'))
} catch (e) {
    console.log(e);
}

module.exports = function(app, io, db) {
    // init
    let default_namespace = io.of('/default');


    io.set('authorization',function(data, accept){
        console.log('-------------------------');
        console.log(data.session.passport);
        console.log(data.session);
        console.log('-------------------------');
        /*
            에러 메세지
            세션 시간이 지난 후에 db의 세션 정보가 자동 삭제가 됨. 
            이후 커넥션이 문제가 있는데 try catch 말고 
            세션 만료시간이 다됐을때 어떤식으로 처리하는 부분이 업데이트되야함.
            
            passport가 undefined되서 다시 확인해야하는 상황이 있음.
            -------------------------
            undefined
            Session {
            cookie: {
                path: '/',
                _expires: 2020-06-02T07:13:01.241Z,
                originalMaxAge: 7200000,
                httpOnly: true
            }
            }
            -------------------------
            /home/h/robot_control_temp/libs/socketConnection.js:15
                            ("user" in data.session.passport) &&
                                    ^

            TypeError: Cannot use 'in' operator to search for 'user' in undefined
                at /home/h/robot_control_temp/libs/socketConnection.js:15:25
            
        */
        

        if(data.session.passport !== undefined){
            if(
                ("user" in data.session.passport) &&
                (data.session.passport !== undefined) // 세션 시간이 지난 후에 passport가 undefined되서 다시 확인해야하는 상황이 있음.
            ){
                // 로그인된 경우
                console.log("socket auth success");
                accept(null, true)
            }else if(
                !("user" in data.session.passport) &&
                (typeof data.session.passport !== undefined)
            ){
                // 로그인 안된경우 
                console.log("socket auth fail");
                accept(null, false)
            }
        }else{
            console.log("passport auth system has error");
            accept(null, false) 
        }
    })


    // client connection event 등록
    default_namespace.on('connection',function(socket){
        
        // user info table에 socket 정보 업데이트 하기
        let username = socket.request.session.passport.user.username;
        let usergroup = socket.request.session.passport.user.usergroup;
        let socket_id = socket.id;
        let query = `
        delete from UserWebsocketInfo
        where
            username = "${username}"
        ;`
        db.sequelize.query(query)
        .then(()=>{
            let insert_data = []
            resource.robot.forEach(item=>{
                if(item.group==usergroup){
                    insert_data.push({
                        username: username,
                        socket_id:socket_id,
                        robot_id: item.id,
                        robot_site_id: item.siteID,
                    })
                }
            })
            db.UserWebsocketInfo.bulkCreate(insert_data)
            .then(() => { // 결과가 전달되지 않으므로, 직접 가져와야 함
                // console.log("TEST insert");
                // return User.findAll();
            }).then(data => {
                // console.log(data) // 그래야 user 인스턴스들의 배열을 얻을 수 있음
            })
        })
        .catch(err=>{
            console.log("error", err);
        });
        
        socket.on('joinSite', (roomName) => {
            socket.join(roomName, () => {
                console.log("## join site")
                console.log(socket.rooms);
            });
        });
        
        socket.on('leaveSite', (roomName) => {
            socket.leave(roomName, () => {
                console.log('leave room ' + roomName);
                console.log(socket.rooms);
            });
        });
    })
    
    function getGroupListBySiteId(list, id){
        return new Promise(async (resolve, reject) => {
            let resultList = []
            list.forEach(item=>{
                if(item.resource.site.includes(id))
                resultList.push(item.name)
            })
            resolve(resultList);
        });
    }

    // routes
    app.post('/websocket/send/site', async function(req, res) {
        let msg = JSON.parse(req.body.msg)
        let data = await pushDataConverter.convertMsg(msg)
        let site_id = req.body.site_id
        let groupList = await getGroupListBySiteId(resource.group, site_id);

        let query = `
        select username from User
        where
            usergroup IN('${groupList.join("','")}');`

        db.sequelize.query(query)
        .then((result)=>{
            result[0].forEach(user=>{
                console.log(user);
                let insertData = data
                insertData['username'] = user.username
                db.pushMsg.create(insertData)
            })
            default_namespace.to(site_id).emit('siteMsg',data)
            res.status(200).json({
                status:true,
                description:"successfully requested",
            });
            res.end()
        })
        
    });

    app.post('/websocket/send/target', async function(req, res) {
        let msg = JSON.parse(req.body.msg)
        console.log("################################################")
        console.log(msg)
        let data = await pushDataConverter.convertMsg(msg)
        let site_id = req.body.site_id
        let robot_id = req.body.robot_id
        
        let query = `
        select * from UserWebsocketInfo
        where
            robot_id = "${robot_id}" &&
            robot_site_id = "${site_id}"
        ;`
        db.sequelize.query(query)
        .then((result)=>{
            // console.log(result);
            result[0].forEach(socketinfo=>{
                let insertData = data
                insertData['username'] = socketinfo.username
                db.pushMsg.create(insertData)
                
                default_namespace.to(socketinfo.socket_id).emit('targetMsg', data)
            })
            res.status(200).json({
                status:true,
                description:"successfully requested",
            });
            res.end()
        })

    });

}


