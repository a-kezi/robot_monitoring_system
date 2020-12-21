'use strict';
const passwordHash = require('../libs/account/passwordHash');

module.exports = function(sequelize, DataTypes){
    const User = sequelize.define('User',
        {
            username : { 
                type: DataTypes.STRING,
                primaryKey: true, 
                validate : {
                    len : [0, 50]
                },
                allowNull : false
            },
            password : { 
                type: DataTypes.STRING,
                validate : {
                    len : [3, 100]
                } ,
                allowNull : false
            },
            displayname : { 
                type: DataTypes.STRING,
                allowNull : false
            },
            alarm_on : { 
                type: DataTypes.BOOLEAN,
                allowNull : true
            },
            usergroup : { 
                type: DataTypes.STRING,
                allowNull : false
            }
        },{
            tableName: 'User'
        }
    );

    User.beforeCreate((user, _) => {
        user.password = passwordHash(user.password);
    });

    return User;
}