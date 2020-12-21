'use strict'
// exports.parseMsg = function(str) {
//     return new Promise(async (resolve, reject) => {
//         resolve(JSON.parse(str));
//     });
// }

// exports.dumpMsg = function(data) {
//     return new Promise(async (resolve, reject) => {
//         resolve(JSON.stringify(data));
//     });
// }

exports.parseMsg = function(str) {
    return JSON.parse(str)
}

exports.dumpMsg = function(data) {
    return JSON.stringify(data)
}