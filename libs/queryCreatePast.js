const yaml = require('js-yaml');
const fs   = require('fs');
const resource = yaml.safeLoad(fs.readFileSync(`${__dirname}/../config/resource.yaml`, 'utf8'));

const FILTER_STATE_ISSUE = 0
const FILTER_STATE_UNCHECKED_ISSUE = 1
const FILTER_STATE_IMPORTANT = 2
const FILTER_STATE_ALL = 3


exports.make = function(option) {
    return new Promise(async (resolve, reject) => {

        let query = '';
        switch(option.state){
            default:
                break;
            case FILTER_STATE_IMPORTANT:
                query = await getImportantFeed(option);
                break;
            case FILTER_STATE_ISSUE:
                query = await getIssueFeed(option);
                break;
            case FILTER_STATE_UNCHECKED_ISSUE:
                query = await getUncheckedIssueFeed(option);
                break;
            case FILTER_STATE_ALL:
                query = await getAllFeed(option);
                break;
        }
        resolve(query);
    });
}

async function getImportantFeed(option){
    return new Promise(async (resolve, reject) => {
        let result;
        let time_query = '';
        let robot_list='';
        let robot_query = '';
        let zone_query = '';

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

        if('service' in option){
            for(let i =0 ; i<option.service.length ; i++){
                if(i==0){
                    let table_name = getTableName(resource.service,option.service[i]);
                    result = `
                    select
                    ${table_name}.msg_id,
                    ${table_name}.timestamp,
                    ${table_name}.type,
                    ${table_name}.res_type,
                    ${table_name}.res_data,
                    ${table_name}.error,
                    ${table_name}.site,
                    ${table_name}.zone,
                    ${table_name}.location,
                    ${table_name}.robot_id, 
                    uc.checked, 
                    uc.important 
                    from (
                        select *  
                        from ${table_name}
                        where(
                            ${zone_query}
                            ${robot_query}
                            ${time_query}
                            
                        )
                        
                    ) as ${table_name}
                    join User_Customizing as uc
                    on (${table_name}.msg_id = uc.msg_id and uc.important=1 and uc.username='${option.username}')
                    `
                }else{
                    let table_name = getTableName(resource.service,option.service[i]);
                    result += `
                    union all
                    select
                    ${table_name}.msg_id, 
                    ${table_name}.timestamp,
                    ${table_name}.type,
                    ${table_name}.res_type,
                    ${table_name}.res_data,
                    ${table_name}.error,
                    ${table_name}.site,
                    ${table_name}.zone,
                    ${table_name}.location,
                    ${table_name}.robot_id, 
                    uc.checked, 
                    uc.important
                    from (
                        select * 
                        from ${table_name}
                        where(
                            ${zone_query}
                            ${robot_query}
                            ${time_query}
                        )
                    ) as ${table_name}
                    join User_Customizing as uc
                    on (${table_name}.msg_id = uc.msg_id and uc.important=1 and uc.username='${option.username}')
                    `
                }
            }
            robot_query = `(${robot_list}) &&`;
        }

        result += `

        order by timestamp desc
        limit ${option.limit};
        `
        resolve(result);
    });
}

async function getIssueFeed(option){
    return new Promise(async (resolve, reject) => {
        let result;
        let time_query = '';
        let robot_list='';
        let robot_query = '';
        let zone_query = '';

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
        
        if('service' in option){
            for(let i =0 ; i<option.service.length ; i++){
                if(i==0){
                    console.log(getTableName(resource.service,option.service[i]));
                    let table_name = getTableName(resource.service,option.service[i]);
                    result = `
                    select
                    ${table_name}.msg_id,
                    ${table_name}.timestamp,
                    ${table_name}.type,
                    ${table_name}.res_type,
                    ${table_name}.res_data,
                    ${table_name}.error,
                    ${table_name}.site,
                    ${table_name}.zone,
                    ${table_name}.location,
                    ${table_name}.robot_id, 
                    uc.checked, 
                    uc.important 
                    from (
                        select *  
                        from ${table_name}
                        where(
                            error = true &&
                            ${zone_query}
                            ${robot_query}
                            ${time_query}
                            
                        )
                        
                    ) as ${table_name}
                    left join User_Customizing as uc
                    on (${table_name}.msg_id = uc.msg_id and uc.username='${option.username}')
                    `
                }else{
                    let table_name = getTableName(resource.service,option.service[i]);
                    result += `
                    union all
                    select
                    ${table_name}.msg_id, 
                    ${table_name}.timestamp,
                    ${table_name}.type,
                    ${table_name}.res_type,
                    ${table_name}.res_data,
                    ${table_name}.error,
                    ${table_name}.site,
                    ${table_name}.zone,
                    ${table_name}.location,
                    ${table_name}.robot_id, 
                    uc.checked, 
                    uc.important
                    from (
                        select * 
                        from ${table_name}
                        where(
                            error = true &&
                            ${zone_query}
                            ${robot_query}
                            ${time_query}
                        )
                    ) as ${table_name}
                    left join User_Customizing as uc
                    on (${table_name}.msg_id = uc.msg_id and uc.username='${option.username}')
                    `
                }
            }
            robot_query = `(${robot_list}) &&`;
        }

        result += `

        order by timestamp desc
        limit ${option.limit};
        `
        resolve(result);
        });
}


async function getUncheckedIssueFeed(option){
    return new Promise(async (resolve, reject) => {
        let result;
        let time_query = '';
        let robot_list='';
        let robot_query = '';
        let zone_query = '';

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

        if('service' in option){
            for(let i =0 ; i<option.service.length ; i++){
                if(i==0){
                    let table_name = getTableName(resource.service,option.service[i]);
                    result = `
                    select
                    ${table_name}.msg_id,
                    ${table_name}.timestamp,
                    ${table_name}.type,
                    ${table_name}.res_type,
                    ${table_name}.res_data,
                    ${table_name}.error,
                    ${table_name}.site,
                    ${table_name}.zone,
                    ${table_name}.location,
                    ${table_name}.robot_id, 
                    uc.checked, 
                    uc.important 
                    from (
                        select *  
                        from ${table_name}
                        where(
                            error = true &&
                            ${zone_query}
                            ${robot_query}
                            ${time_query}
                            
                        )
                        
                    ) as ${table_name}
                    join User_Customizing as uc
                    on (${table_name}.msg_id = uc.msg_id and uc.checked!=1 and uc.username='${option.username}')
                    `
                }else{
                    let table_name = getTableName(resource.service,option.service[i]);
                    result += `
                    union all
                    select
                    ${table_name}.msg_id, 
                    ${table_name}.timestamp,
                    ${table_name}.type,
                    ${table_name}.res_type,
                    ${table_name}.res_data,
                    ${table_name}.error,
                    ${table_name}.site,
                    ${table_name}.zone,
                    ${table_name}.location,
                    ${table_name}.robot_id, 
                    uc.checked, 
                    uc.important
                    from (
                        select * 
                        from ${table_name}
                        where(
                            error = true &&
                            ${zone_query}
                            ${robot_query}
                            ${time_query}
                        )
                    ) as ${table_name}
                    join User_Customizing as uc
                    on (${table_name}.msg_id = uc.msg_id and uc.checked!=1 and uc.username='${option.username}')
                    `
                }
            }
            robot_query = `(${robot_list}) &&`;
        }

        result += `

        order by timestamp desc
        limit ${option.limit};
        `
        
        resolve(result);
    });
}

async function getAllFeed(option){
    return new Promise(async (resolve, reject) => {
        let result;
        let time_query = '';
        let robot_list='';
        let robot_query = '';
        let zone_query = '';

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

        if('service' in option){
            for(let i =0 ; i<option.service.length ; i++){
                if(i==0){
                    let table_name = getTableName(resource.service,option.service[i]);
                    result = `
                    select
                    ${table_name}.msg_id,
                    ${table_name}.timestamp,
                    ${table_name}.type,
                    ${table_name}.res_type,
                    ${table_name}.res_data,
                    ${table_name}.error,
                    ${table_name}.site,
                    ${table_name}.zone,
                    ${table_name}.location,
                    ${table_name}.robot_id, 
                    uc.checked, 
                    uc.important 
                    from (
                        select *  
                        from ${table_name}
                        where(
                            ${zone_query}
                            ${robot_query}
                            ${time_query}
                            
                        )
                        
                    ) as ${table_name}
                    left join User_Customizing as uc
                    on (${table_name}.msg_id = uc.msg_id and uc.username='${option.username}')
                    `
                }else{
                    let table_name = getTableName(resource.service,option.service[i]);
                    result += `
                    union all
                    select
                    ${table_name}.msg_id, 
                    ${table_name}.timestamp,
                    ${table_name}.type,
                    ${table_name}.res_type,
                    ${table_name}.res_data,
                    ${table_name}.error,
                    ${table_name}.site,
                    ${table_name}.zone,
                    ${table_name}.location,
                    ${table_name}.robot_id, 
                    uc.checked, 
                    uc.important
                    from (
                        select * 
                        from ${table_name}
                        where(
                            ${zone_query}
                            ${robot_query}
                            ${time_query}
                        )
                    ) as ${table_name}
                    left join User_Customizing as uc
                    on (${table_name}.msg_id = uc.msg_id and uc.username='${option.username}')
                    `
                }
            }
            robot_query = `(${robot_list}) &&`;
        }

        result += `

        order by timestamp desc
        limit ${option.limit};
        `
        
        resolve(result);
    });
}

function getTableName(list, service){
    let table_name;
    let isGetName =false;

    list.some(item=>{
        if(service == item.type){
            table_name = item.table
            isGetName = true;
        } 
        return isGetName
    })

    return table_name
}