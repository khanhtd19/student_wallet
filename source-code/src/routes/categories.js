const express=require('express');
const {body}=require('express-validator');
const db=require('../config/database');
const asyncHandler=require('../utils/async-handler');
const {requireAuth,flash}=require('../middleware/auth');
const {validateRequest}=require('../middleware/validation');
const {notFound}=require('../utils/errors');
const audit=require('../services/audit-service');
const router=express.Router();router.use(requireAuth);
router.get('/',asyncHandler(async(req,res)=>{
 const rows=await db.query(`SELECT c.*,COUNT(t.id)::int AS transaction_count FROM categories c LEFT JOIN transactions t ON t.category_id=c.id AND t.user_id=c.user_id WHERE c.user_id=$1 GROUP BY c.id ORDER BY c.type,c.is_active DESC,c.name`,[req.session.user.id]);
 res.render('categories/list',{title:'Danh mục',active:'categories',categories:rows.rows});
}));
router.post('/',body('name').trim().isLength({min:2,max:100}).withMessage('Tên danh mục cần từ 2 đến 100 ký tự.'),body('type').isIn(['EXPENSE','INCOME']).withMessage('Loại danh mục không hợp lệ.'),validateRequest,asyncHandler(async(req,res)=>{
 const icon=/^bi-[a-z0-9-]{2,35}$/.test(req.body.icon||'')?req.body.icon:'bi-tag';const color=/^#[0-9a-fA-F]{6}$/.test(req.body.color||'')?req.body.color:'#64748b';
 try{await db.query('INSERT INTO categories(user_id,name,type,icon,color) VALUES($1,$2,$3,$4,$5)',[req.session.user.id,req.body.name.trim(),req.body.type,icon,color]);flash(req,'success','Đã thêm danh mục.');}catch(e){if(e.code==='23505')flash(req,'error','Tên danh mục này đã tồn tại.');else throw e;}res.redirect('/categories');
}));
router.post('/:id(\\d+)/toggle',asyncHandler(async(req,res)=>{const result=await db.query('UPDATE categories SET is_active=NOT is_active WHERE id=$1 AND user_id=$2 AND is_default=FALSE RETURNING id,is_active',[req.params.id,req.session.user.id]);if(!result.rowCount)throw notFound('Không tìm thấy danh mục tùy chỉnh.');await audit.record({userId:req.session.user.id,action:result.rows[0].is_active?'ENABLE_CATEGORY':'DISABLE_CATEGORY',entityType:'categories',entityId:req.params.id,ip:req.ip});flash(req,'success',result.rows[0].is_active?'Đã bật danh mục.':'Đã ẩn danh mục.');res.redirect('/categories');}));
module.exports=router;
