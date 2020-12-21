const express = require('express');
const router = express.Router();
const passportAuth = require(__dirname+'/../libs/account/passportAuth_local');
const models = require(__dirname+'/../models');

// 가입 페이지
router.get('/join', function(req, res){
    res.render('accounts/join');
});

// 가입 요청
router.post('/join', async(req, res) => {
    try{
        req.body['alarm_on'] = true
        await models.User.create(req.body);
        res.send('<script>alert("회원가입 성공");location.href="/accounts/login";</script>');
    }catch(e){
    }
});

// 로그인 페이지
router.get('/login', function(req, res){
    res.render('accounts/login', 
    { 
        messages: req.flash('info'),
        flashMessage : req.flash().error 
    });
});

// 로그인 요청
router.post('/login' , 
    passportAuth.authenticate('local', { 
        failureRedirect: '/accounts/login', 
        failureFlash: true 
    }), 
    function(req, res){
        res.send('<script>alert("로그인 성공");location.href="/";</script>');
    }
);

// 로그아웃 요청
router.get('/logout', function(req, res){
    req.logout();
    res.redirect('/accounts/login');
});

module.exports = router;