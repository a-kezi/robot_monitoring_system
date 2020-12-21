'use strict';
module.exports = function(sequelize, DataTypes){
    const pushMsg = sequelize.define('pushMsg',
        {
            msg_id :{
                type: DataTypes.STRING,
                primaryKey: true,
                allowNull : false/////////////
            },
            username :{
                type: DataTypes.STRING,//////////////
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
            error :{
                type: DataTypes.BOOLEAN,
                allowNull : false
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
            },
            res_data :{
                type: DataTypes.STRING,//////////////
                allowNull : false
            },
            checked :{
                type: DataTypes.BOOLEAN,////////////////////
                allowNull : false
            },
            
        },{
            tableName: 'push_msg',            
            indexes:[
                {
                    name: 'push_user',
                    unique: false,
                    fields:['username']
                },
                {
                    name: 'push_msg_id',
                    unique: false,
                    fields:['msg_id']
                },
            ],
        }
    );
    return pushMsg;
}