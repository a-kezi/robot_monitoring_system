module.exports = function(req, res, next) {
    if (!req.isAuthenticated()){ 
        res.status(401).send(`Unauthorized`);
    }else{
        return next();
    }
};