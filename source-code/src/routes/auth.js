const express = require('express');
const { body } = require('express-validator');
const asyncHandler = require('../utils/async-handler');
const { authenticate, createUser } = require('../services/auth-service');
const { validateRequest } = require('../middleware/validation');
const { flash } = require('../middleware/auth');
const audit = require('../services/audit-service');
const router = express.Router();

router.get('/login',(req,res)=> req.session.user ? res.redirect('/') : res.render('auth/login',{title:'Đăng nhập'}));
router.get('/register',(req,res)=> req.session.user ? res.redirect('/') : res.render('auth/register',{title:'Tạo tài khoản'}));
router.post('/register',
  body('full_name').trim().isLength({min:2,max:120}).withMessage('Họ tên cần từ 2 đến 120 ký tự.'),
  body('email').isEmail().withMessage('Email không hợp lệ.'),
  body('password').isLength({min:8,max:72}).withMessage('Mật khẩu cần ít nhất 8 ký tự.'),
  body('confirm_password').custom((value,{req})=>value===req.body.password).withMessage('Mật khẩu xác nhận không khớp.'),
  validateRequest,
  asyncHandler(async(req,res)=>{
    try {
      const user=await createUser({fullName:req.body.full_name,email:req.body.email,password:req.body.password});
      await new Promise((resolve,reject)=>req.session.regenerate(err=>err?reject(err):resolve()));
      req.session.user=user;
      await audit.record({userId:user.id,action:'REGISTER',ip:req.ip});
      res.redirect('/');
    } catch(error) {
      if(error.code==='23505') { flash(req,'error','Email này đã được sử dụng.'); return res.redirect('/register'); }
      throw error;
    }
  })
);
router.post('/login',
  body('email').isEmail().withMessage('Email không hợp lệ.'),
  body('password').isLength({min:1}).withMessage('Vui lòng nhập mật khẩu.'),
  validateRequest,
  asyncHandler(async(req,res)=>{
    const user=await authenticate(req.body.email,req.body.password);
    if(!user){flash(req,'error','Email hoặc mật khẩu không đúng, hoặc tài khoản đã bị khóa.');return res.redirect('/login');}
    const returnTo=req.session.returnTo||'/';
    await new Promise((resolve,reject)=>req.session.regenerate(err=>err?reject(err):resolve()));
    req.session.user=user;
    await audit.record({userId:user.id,action:'LOGIN',ip:req.ip});
    res.redirect(returnTo.startsWith('/')&&!returnTo.startsWith('//')?returnTo:'/');
  })
);
router.post('/logout',(req,res,next)=>{
  const user=req.session.user;
  if(user) audit.record({userId:user.id,action:'LOGOUT',ip:req.ip});
  req.session.destroy(error=>{if(error)return next(error);res.clearCookie('dailybudget.sid');res.redirect('/login');});
});
module.exports=router;
