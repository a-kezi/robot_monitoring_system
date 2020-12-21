'use strict';
module.exports = function(sequelize, DataTypes){
    const BoDoctor = sequelize.define('BoDoctor',
        {
            data_id :{
                type: DataTypes.STRING,
                primaryKey: true,
                allowNull : false
            },
            department_id :{
                type: DataTypes.STRING,
                allowNull : false
            },
            ord :{
                type: DataTypes.INTEGER,
                allowNull : true
            },
            img_flag :{
                type: DataTypes.BOOLEAN,
                allowNull : false
            },
            check_flag :{
                type: DataTypes.BOOLEAN,
                allowNull : false
            },
            picture :{
                type: DataTypes.STRING,
                allowNull : true
            },
            name :{
                type: DataTypes.STRING,
                allowNull : true
            },
            title :{
                type: DataTypes.STRING,
                allowNull : true
            },
            major :{
                type: DataTypes.STRING,
                allowNull : true
            },
            education :{
                type: DataTypes.TEXT,
                allowNull : true
            },
            career :{
                type: DataTypes.TEXT,
                allowNull : true
            },
            academy :{
                type: DataTypes.TEXT,
                allowNull : true
            }
        },{
            tableName: 'Bo_Doctor',
        }
    );

    BoDoctor.beforeCreate((input, _) => {
        
    });

    return BoDoctor;
}