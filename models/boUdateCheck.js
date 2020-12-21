'use strict';
module.exports = function(sequelize, DataTypes){
    const boUdateCheck = sequelize.define('boUdateCheck',
        {
            update_id :{
                type: DataTypes.STRING,
                allowNull : false
            }
        },{
            tableName: 'Bo_UdateCheck',
        }
    );

    boUdateCheck.beforeCreate((input, _) => {
        
    });

    return boUdateCheck;
}