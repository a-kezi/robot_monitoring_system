var CryptoJS = require("crypto-js");
var hashedPassword = CryptoJS.SHA256("wonik").toString() ; 

var hashedPassword = "wonik"; 

module.exports = function(user_pw){
    return CryptoJS.HmacSHA1(user_pw, hashedPassword).toString();
};