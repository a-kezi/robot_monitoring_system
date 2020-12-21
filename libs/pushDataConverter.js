'use strict'
exports.convertMsg = function(data, type) {
    return new Promise(async (resolve, reject) => {
        console.log("##################################")
        let converted_data ={
            timestamp: data.timestamp,
            msg_id: data.msg_id,
            robot_id: data.robot_id,
            checked: false,
            push_type: await getType(data),
            result: JSON.stringify(data.result),
            site: (data.location)?data.location.site:undefined,
            zone: (data.location)?data.location.zone:undefined,
            location: JSON.stringify(data.location),
        }
        console.log(converted_data)
        resolve(converted_data);
    });
}

function getType(data){
    return new Promise((resolve, reject) => {
        switch(data.type){
            default:
                resolve(data.type);
                break;
            case "fault":
                resolve(data.result.subtype);
                break;
        }
    }); 
}