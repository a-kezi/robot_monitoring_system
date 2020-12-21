'use strict';
module.exports = function(sequelize, DataTypes){
    const UserWebsocketInfo = sequelize.define('UserWebsocketInfo',
        {
            username :{
                type: DataTypes.STRING,
                allowNull : false
            },
            socket_id :{
                type: DataTypes.STRING,
                allowNull : false
            },
            robot_id :{
                type: DataTypes.STRING,
                allowNull : false
            },
            robot_site_id :{
                type: DataTypes.STRING,
                allowNull : false
            },
        },{
            tableName: 'UserWebsocketInfo',
            indexes:[
                
            ]
        },{

        }
    );
    return UserWebsocketInfo;
}