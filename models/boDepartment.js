'use strict';
module.exports = function(sequelize, DataTypes){
    const BoDepartment = sequelize.define('BoDepartment',
        {
            data_id :{
                type: DataTypes.STRING,
                primaryKey: true,
                allowNull : false
            },
            ord :{
                type: DataTypes.INTEGER,
                allowNull : true
            },
            default_opt :{
                type: DataTypes.BOOLEAN,
                allowNull : false
            },
            img_flag :{
                type: DataTypes.BOOLEAN,
                allowNull : false
            },
            check_flag :{
                type: DataTypes.BOOLEAN,
                allowNull : false
            },
            type :{
                type: DataTypes.STRING,
                allowNull : true
            },
            title_korean :{
                type: DataTypes.STRING,
                allowNull : true
            },
            description :{
                type: DataTypes.TEXT,
                allowNull : true
            },
            location :{
                type: DataTypes.STRING,
                allowNull : true
            },
            img :{
                type: DataTypes.STRING,
                allowNull : true
            },
            position_x :{
                type: DataTypes.INTEGER,
                allowNull : true
            },
            position_y :{
                type: DataTypes.INTEGER,
                allowNull : true
            },
            doctors :{
                type: DataTypes.TEXT,
                allowNull : true
            },
        },{
            tableName: 'Bo_Department',
        }
    );

    BoDepartment.beforeCreate((input, _) => {
        
    });

    return BoDepartment;
}