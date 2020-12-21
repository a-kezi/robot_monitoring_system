const yaml = require('js-yaml');
const fs   = require('fs');
const resource = yaml.safeLoad(fs.readFileSync(`${__dirname}/../config/resource.yaml`, 'utf8'));

exports.make = function(option) {
    return new Promise(async (resolve, reject) => {
        let result;
        let error_query = '';
        let time_query = '';
        let zone_query = '';
        console.log(resource.service,option.service)
        let table_name = getTableName(resource.service,option.service);
        time_query = `(timestamp < '${getDateFormat(option.lt)}' && timestamp > '${getDateFormat(option.gt)}')`;
        zone_query = `zone = '${option.zone}' &&`;
        if(option.onlyError=="true")error_query = 'error = true &&';
        result = `
                select * from ${table_name}
                where(
                    ${error_query}
                    ${zone_query}
                    ${time_query}
                )
                order by timestamp desc
                limit ${option.limit}
                OFFSET ${option.offset};
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

function getDateFormat(input_date) {

    let date = new Date(Number(input_date));
    let yyyy = date.getFullYear();
    let gg = date.getDate();
    let mm = (date.getMonth() + 1);

    if (gg < 10)
        gg = "0" + gg;

    if (mm < 10)
        mm = "0" + mm;

    let cur_day = yyyy + "-" + mm + "-" + gg;

    let hours = date.getHours()
    let minutes = date.getMinutes()
    let seconds = date.getSeconds();

    if (hours < 10)
        hours = "0" + hours;

    if (minutes < 10)
        minutes = "0" + minutes;

    if (seconds < 10)
        seconds = "0" + seconds;

    return cur_day + " " + hours + ":" + minutes + ":" + seconds;

}











