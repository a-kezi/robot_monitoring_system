'use strict';
const models = require(__dirname+'/../../models');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const passwordHash = require(__dirname+'/passwordHash');

passport.serializeUser(  (user, done) => {
    console.log('serializeUser');
    done(null, user);
});

passport.deserializeUser(  (user, done) => {
    const result = user;
    result.password = "";
    console.log('deserializeUser');
    done(null, result);
});

passport.use(new LocalStrategy({
        usernameField: 'username',
        passwordField : 'password',
        passReqToCallback : true
    },
    async ( req , username , password, done) => {

        // 조회
        const user = await models.User.findOne({
            where: {
                username,
                password : passwordHash(password),
            },
            // attributes: { exclude: ['password'] }
        });
    
        // 유저에서 조회되지 않을시
        if(!user){
            return done(null, false, { message: '아이디나 비밀번호를 다시 확인해 주세요.' });
    
        // 유저에서 조회 되면 세션등록쪽으로 데이터를 넘김
        }else{
            return done(null, user.dataValues );
        }
        
    } 
));

module.exports = passport;
