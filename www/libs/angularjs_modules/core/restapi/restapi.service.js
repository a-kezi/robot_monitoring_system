angular.
module('core.restapi').
factory('$restApiReq', [
    function() {
        return {
            get:async function(reqInfo, callback){
                /*
                    reqInfo = {
                        url: STRING,
                        type: STRING,
                        param: OBJECT 
                    }
                */
                var type = reqInfo.type;
                var params = reqInfo.param;
                var isParamIncluded = (reqInfo.param===undefined);
                $.ajax({
                    type: type,
                    url: (isParamIncluded ? reqInfo.url : reqInfo.url +'?'+jQuery.param(params)),
                }).done((data, textStatus, jqXHR) => {
                    // console.log(data);
                    // console.log(textStatus);
                    // console.log(jqXHR);
                    callback(data);
                    
                }).fail((jqXHR, textStatus, errorThrown) => {
                    // console.log(jqXHR);
                    // console.log(textStatus);
                    // console.log(errorThrown);
                    return errorThrown;
                });
            }
        }
    }
]);

