const yaml = require('js-yaml');
const fs   = require('fs');
const resource = yaml.safeLoad(fs.readFileSync(`${__dirname}/../config/resource.yaml`, 'utf8'));

exports.make = function(option) {
    return new Promise(async (resolve, reject) => {
        let query = '';
        query = await getQuery(option);
        resolve(query);
    });
}

async function getQuery(option){
    return new Promise(async (resolve, reject) => {
        let result;
        let time_query = '';
        let robot_list='';
        let robot_query = '';
        let zone_query = '';
        let type_query = '';
        let table_name = "RobotFeedUpdate"

        if('lt' in option){
            time_query = `
            timestamp < '${option.lt}'
            `;
        }else if('gt' in option){
            time_query = `
            timestamp > '${option.gt}'
            `;
        }

        if('zone' in option){
            zone_query = `
            zone = '${option.zone}' &&
            `;
        }

        if('robot' in option){
            for(let i =0 ; i<option.robot.length ; i++){
                if(i<option.robot.length-1){
                    robot_list += `      
                    robot_id = '${option.robot[i]}' ||
                    `;
                }else{
                    robot_list += `      
                    robot_id = '${option.robot[i]}'
                    `;
                }
            }
            robot_query = `(${robot_list}) &&`;
        }
        if('feedtype' in option){
            for(let i = 0 ; i<option.feedtype.length ; i++){
                type_query += `res_subtype = "${option.feedtype[i]}" or `
            }
            type_query = type_query.slice(0,-3)
        }
        result = `
            select * from ${table_name}
            where(
                (${type_query}) and
                ${zone_query}
                ${robot_query}
                ${time_query}
            )
            order by timestamp desc
            limit ${option.limit};
            `
        resolve(result);
    });
}

