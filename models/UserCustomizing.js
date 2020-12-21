'use strict';
module.exports = function(sequelize, DataTypes){
    const UserCustomizing = sequelize.define('UserCustomizing',
        {
            msg_id :{
                type: DataTypes.STRING,
                allowNull : false
            },
            username :{
                type: DataTypes.STRING,
                allowNull : false
            },
            checked :{
                type: DataTypes.BOOLEAN,
                allowNull : false
            },
            important :{
                type: DataTypes.BOOLEAN,
                allowNull : false
            }
        },{
            tableName: 'User_Customizing',
            indexes:[
                {
                    name: 'user_customizing_username',
                    unique: false,
                    fields:['username']
                },
                {
                    name: 'user_customizing_msg_id',
                    unique: false,
                    fields:['msg_id']
                }
            ]
        }
    );

    return UserCustomizing;
}