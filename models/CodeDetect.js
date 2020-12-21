'use strict';
module.exports = function(sequelize, DataTypes){
    const CodeDetect = sequelize.define('CodeDetect',
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
            res_type :{
                type: DataTypes.STRING,
                allowNull : false
            },
            res_data :{
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
            img_store_flag :{
                type: DataTypes.BOOLEAN,
                allowNull : false
            }
        },{
            tableName: 'Code_Detect_Res',
            indexes:[
                {
                    name: 'CodeDetect_time',
                    unique: false,
                    fields:['timestamp']
                }
            ]
        }
    );

    return CodeDetect;
}