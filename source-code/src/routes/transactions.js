const express=require('express');
const {body}=require('express-validator');
const db=require('../config/database');
const asyncHandler=require('../utils/async-handler');
const {requireAuth,flash}=require('../middleware/auth');
const {validateRequest}=require('../middleware/validation');
const {notFound,badRequest}=require('../utils/errors');
const {createPagination}=require('../utils/pagination');
const {validDate,todayDate}=require('../utils/dates');
const audit=require('../services/audit-service');
const router=express.Router();
router.use(requireAuth);
const METHODS=['CASH','BANK_TRANSFER','E_WALLET','CARD','OTHER'];
const TYPES=['EXPENSE','INCOME'];
const labels={CASH:'Tiền mặt',BANK_TRANSFER:'Chuyển khoản',E_WALLET:'Ví điện tử',CARD:'Thẻ ngân hàng',OTHER:'Khác'};
async function getCategories(userId){const r=await db.query('SELECT * FROM categories WHERE user_id=$1 AND is_active=TRUE ORDER BY type,name',[userId]);return r.rows;}
function filtersFromQuery(query){
  const q=String(query.q||'').trim().slice(0,80);
  const type=TYPES.includes(query.type)?query.type:'';
  const categoryId=/^\d+$/.test(String(query.category_id||''))?Number(query.category_id):null;
  let from=validDate(query.from),to=validDate(query.to);if(from&&to&&from>to)[from,to]=[to,from];
  return {q,type,categoryId,from,to};
}
function whereFor(userId,f){
  const values=[userId],parts=['t.user_id=$1'];
  const bind=(value)=>{values.push(value);return `$${values.length}`;};
  if(f.q){const p=bind(`%${f.q}%`);parts.push(`(t.title ILIKE ${p} OR COALESCE(t.merchant,'') ILIKE ${p} OR COALESCE(t.note,'') ILIKE ${p})`);}
  if(f.type)parts.push(`t.type=${bind(f.type)}`);
  if(f.categoryId)parts.push(`t.category_id=${bind(f.categoryId)}`);
  if(f.from)parts.push(`t.transaction_date>=${bind(f.from)}::date`);
  if(f.to)parts.push(`t.transaction_date<=${bind(f.to)}::date`);
  return {where:`WHERE ${parts.join(' AND ')}`,values};
}
router.get('/',asyncHandler(async(req,res)=>{
  const f=filtersFromQuery(req.query);const {where,values}=whereFor(req.session.user.id,f);
  const [count,rows,categories,totals]=await Promise.all([
    db.query(`SELECT COUNT(*)::int AS count FROM transactions t ${where}`,values),
    db.query(`SELECT t.*,c.name AS category_name,c.icon AS category_icon,c.color AS category_color FROM transactions t JOIN categories c ON c.id=t.category_id ${where} ORDER BY t.transaction_date DESC,t.created_at DESC LIMIT $${values.length+1} OFFSET $${values.length+2}`,[...values,12,Math.max(0,(Number(req.query.page)||1)-1)*12]),
    getCategories(req.session.user.id),
    db.query(`SELECT COALESCE(SUM(amount) FILTER(WHERE type='EXPENSE'),0) AS expense,COALESCE(SUM(amount) FILTER(WHERE type='INCOME'),0) AS income FROM transactions t ${where}`,values)
  ]);
  const pagination=createPagination(req.query.page,count.rows[0].count,12);
  // Re-run when page is beyond the valid range so offset and metadata stay synchronized.
  const transactions=pagination.page===Number(req.query.page||1)?rows.rows:(await db.query(`SELECT t.*,c.name AS category_name,c.icon AS category_icon,c.color AS category_color FROM transactions t JOIN categories c ON c.id=t.category_id ${where} ORDER BY t.transaction_date DESC,t.created_at DESC LIMIT $${values.length+1} OFFSET $${values.length+2}`,[...values,12,pagination.offset])).rows;
  res.render('transactions/list',{title:'Giao dịch',active:'transactions',transactions,categories,pagination,filters:f,totals:totals.rows[0],queryParams:{...(f.q?{q:f.q}:{}),...(f.type?{type:f.type}:{}),...(f.categoryId?{category_id:f.categoryId}:{}),...(f.from?{from:f.from}:{}),...(f.to?{to:f.to}:{})}});
}));
router.get('/new',asyncHandler(async(req,res)=>res.render('transactions/form',{title:'Thêm giao dịch',active:'transactions',transaction:null,categories:await getCategories(req.session.user.id),paymentMethods:labels,today:todayDate()})));
router.post('/',
  body('type').isIn(TYPES).withMessage('Vui lòng chọn khoản thu hoặc khoản chi.'),
  body('title').trim().isLength({min:2,max:180}).withMessage('Tên giao dịch cần từ 2 đến 180 ký tự.'),
  body('amount').isFloat({gt:0,max:999999999999}).withMessage('Số tiền phải lớn hơn 0.'),
  body('category_id').isInt({min:1}).withMessage('Vui lòng chọn danh mục.'),
  body('transaction_date').custom(v=>!!validDate(v)).withMessage('Ngày giao dịch không hợp lệ.'),
  body('payment_method').isIn(METHODS).withMessage('Phương thức thanh toán không hợp lệ.'),
  validateRequest,
  asyncHandler(async(req,res)=>{
    const userId=req.session.user.id;
    const category=await db.query('SELECT id,type FROM categories WHERE id=$1 AND user_id=$2 AND is_active=TRUE',[req.body.category_id,userId]);
    if(!category.rowCount||category.rows[0].type!==req.body.type)throw badRequest('Danh mục không phù hợp với loại giao dịch.');
    const result=await db.query(`INSERT INTO transactions(user_id,category_id,type,title,amount,transaction_date,payment_method,merchant,note) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,[userId,req.body.category_id,req.body.type,req.body.title.trim(),req.body.amount,req.body.transaction_date,req.body.payment_method,String(req.body.merchant||'').trim()||null,String(req.body.note||'').trim()||null]);
    await audit.record({userId,action:'CREATE_TRANSACTION',entityType:'transactions',entityId:result.rows[0].id,details:{type:req.body.type,amount:req.body.amount},ip:req.ip});
    flash(req,'success',req.body.type==='EXPENSE'?'Đã lưu khoản chi.':'Đã lưu khoản thu.');res.redirect('/transactions');
  })
);
router.get('/:id(\\d+)/edit',asyncHandler(async(req,res)=>{
  const item=await db.query('SELECT * FROM transactions WHERE id=$1 AND user_id=$2',[req.params.id,req.session.user.id]);if(!item.rowCount)throw notFound('Không tìm thấy giao dịch.');
  res.render('transactions/form',{title:'Sửa giao dịch',active:'transactions',transaction:item.rows[0],categories:await getCategories(req.session.user.id),paymentMethods:labels,today:todayDate()});
}));
router.post('/:id(\\d+)/update',
  body('type').isIn(TYPES),body('title').trim().isLength({min:2,max:180}),body('amount').isFloat({gt:0,max:999999999999}),body('category_id').isInt({min:1}),body('transaction_date').custom(v=>!!validDate(v)),body('payment_method').isIn(METHODS),validateRequest,
  asyncHandler(async(req,res)=>{
    const userId=req.session.user.id;const category=await db.query('SELECT type FROM categories WHERE id=$1 AND user_id=$2 AND is_active=TRUE',[req.body.category_id,userId]);if(!category.rowCount||category.rows[0].type!==req.body.type)throw badRequest('Danh mục không phù hợp với loại giao dịch.');
    const result=await db.query(`UPDATE transactions SET category_id=$1,type=$2,title=$3,amount=$4,transaction_date=$5,payment_method=$6,merchant=$7,note=$8,updated_at=NOW() WHERE id=$9 AND user_id=$10 RETURNING id`,[req.body.category_id,req.body.type,req.body.title.trim(),req.body.amount,req.body.transaction_date,req.body.payment_method,String(req.body.merchant||'').trim()||null,String(req.body.note||'').trim()||null,req.params.id,userId]);if(!result.rowCount)throw notFound('Không tìm thấy giao dịch.');
    await audit.record({userId,action:'UPDATE_TRANSACTION',entityType:'transactions',entityId:req.params.id,ip:req.ip});flash(req,'success','Đã cập nhật giao dịch.');res.redirect('/transactions');
  })
);
router.post('/:id(\\d+)/delete',asyncHandler(async(req,res)=>{const result=await db.query('DELETE FROM transactions WHERE id=$1 AND user_id=$2 RETURNING id',[req.params.id,req.session.user.id]);if(!result.rowCount)throw notFound('Không tìm thấy giao dịch.');await audit.record({userId:req.session.user.id,action:'DELETE_TRANSACTION',entityType:'transactions',entityId:req.params.id,ip:req.ip});flash(req,'success','Đã xóa giao dịch.');res.redirect('/transactions');}));
router.get('/export.csv',asyncHandler(async(req,res)=>{
  const f=filtersFromQuery(req.query);const {where,values}=whereFor(req.session.user.id,f);const rows=await db.query(`SELECT t.transaction_date,t.type,t.title,c.name category,t.amount,t.payment_method,t.merchant,t.note FROM transactions t JOIN categories c ON c.id=t.category_id ${where} ORDER BY t.transaction_date DESC`,values);
  const quote=v=>`"${String(v??'').replace(/^[=+@-]/,'\'$&').replaceAll('"','""')}"`;
  const csv=['Ngày,Loại,Tên giao dịch,Danh mục,Số tiền,Phương thức,Nơi giao dịch,Ghi chú',...rows.rows.map(r=>[r.transaction_date,r.type==='EXPENSE'?'Chi':'Thu',r.title,r.category,r.amount,labels[r.payment_method],r.merchant,r.note].map(quote).join(','))].join('\r\n');
  res.setHeader('Content-Type','text/csv; charset=utf-8');res.setHeader('Content-Disposition','attachment; filename="giao-dich-chi-tieu.csv"');res.send('\ufeff'+csv);
}));
module.exports=router;
