const paramRule = /[\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"]/i;

module.exports = function(req, res, next) {
    if(Object.keys(req.query).length===0){
        // console.log("zero",Object.keys(req.query).length);
        res.status(404).send(`request without any parameter`);
    }else if(Object.keys(req.query).length!==0){
        // console.log("num",Object.keys(req.query).length);
        // console.log(req.query);
        var isWrongForm = false;
        for(var n in req.query){
            if(paramRule.test(req.query[n])){
                isWrongForm = true;
                res.status(404).send(`wrong parameter form`);
                break;
            }
        }
        if(!isWrongForm){
            return next();
        }
    }
};

