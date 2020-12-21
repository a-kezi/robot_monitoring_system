'use strict';
module.exports = function(sequelize, DataTypes){
    const ServiceList = sequelize.define('ServiceList',
        {
            type :{
                type: DataTypes.STRING,
                allowNull : false
            },
            display_name :{
                type: DataTypes.STRING,
                allowNull : false
            },
            table :{
                type: DataTypes.STRING,
                allowNull : false
            }
        },{
            tableName: 'Service_List'
        }
    );

    ServiceList.beforeCreate((input, _) => {

        // console.log("----input----");
        // console.log(input.msg_id);
        // input.msg_id = "msg-id-002";
        // console.log(input.msg_id);
        // console.log("----test----");
        // console.log(test);
    });

    return ServiceList;
}