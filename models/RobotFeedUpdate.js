'use strict';
module.exports = function(sequelize, DataTypes){
    const RobotFeedUpdate = sequelize.define('RobotFeedUpdate',
        {
            msg_id :{
                type: DataTypes.STRING,
                primaryKey: true,
                allowNull : false
            },
            timestamp :{
                type: DataTypes.DATE,
                allowNull : false
            },
            type :{
                type: DataTypes.STRING,
                allowNull : false
            },
            res_subtype :{
                type: DataTypes.STRING,
                allowNull : false
            },
            res_data :{
                type: DataTypes.STRING,
                allowNull : false
            },
            res_desc :{
                type: DataTypes.STRING,
                allowNull : true
            },
            site :{
                type: DataTypes.STRING,
                allowNull : false
            },
            zone :{
                type: DataTypes.STRING,
                allowNull : false
            },
            location :{
                type: DataTypes.STRING,
                allowNull : false
            },
            robot_id :{
                type: DataTypes.STRING,
                allowNull : false
            }
        },{
            tableName: 'RobotFeedUpdate',
            indexes:[
                {
                    name: 'robotFeedUpdate_time',
                    unique: false,
                    fields:['timestamp']
                }
            ]
        },{

        }
    );

    RobotFeedUpdate.beforeCreate((input, _) => {

        // console.log("----input----");
        // console.log(input.msg_id);
        // input.msg_id = "msg-id-002";
        // console.log(input.msg_id);
        // console.log("----test----");
        // console.log(test);
    });

    return RobotFeedUpdate;
}