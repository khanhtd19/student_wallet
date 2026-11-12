
const express = require('express');
const bcrypt = require('bcryptjs');
const { body } = require('express-validator');
const db = require('../config/database');
const asyncHandler = require('../utils/async-handler');
const { requireAuth, flash } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const { badRequest } = require('../utils/errors');
const audit = require('../services/audit-service');
const backupService = require('../services/backup-service');

const router = express.Router();
router.use(requireAuth);

router.get('/',asyncHandler(async(req,res)=>{const r=await db.query('SELECT full_name,email,created_at,last_login_at FROM users WHERE id=$1',[req.session.user.id]);res.render('settings/index',{title:'Tài khoản cá nhân',active:'settings',profile:r.rows[0]});}));
router.post('/profile',body('full_name').trim().isLength({min:2,max:120}).withMessage('Họ tên cần từ 2 đến 120 ký tự.'),validateRequest,asyncHandler(async(req,res)=>{const r=await db.query('UPDATE users SET full_name=$1,updated_at=NOW() WHERE id=$2 RETURNING full_name',[req.body.full_name.trim(),req.session.user.id]);req.session.user.fullName=r.rows[0].full_name;await audit.record({userId:req.session.user.id,action:'UPDATE_PROFILE',entityType:'users',entityId:req.session.user.id,ip:req.ip});flash(req,'success','Đã cập nhật thông tin cá nhân.');res.redirect('/settings');}));
router.post('/password',body('current_password').isLength({min:1}),body('new_password').isLength({min:8,max:72}).withMessage('Mật khẩu mới cần ít nhất 8 ký tự.'),body('confirm_password').custom((v,{req})=>v===req.body.new_password).withMessage('Mật khẩu xác nhận không khớp.'),validateRequest,asyncHandler(async(req,res)=>{const r=await db.query('SELECT password_hash FROM users WHERE id=$1',[req.session.user.id]);if(!await bcrypt.compare(req.body.current_password,r.rows[0].password_hash))throw badRequest('Mật khẩu hiện tại không đúng.');const hash=await bcrypt.hash(req.body.new_password,12);await db.query('UPDATE users SET password_hash=$1,updated_at=NOW() WHERE id=$2',[hash,req.session.user.id]);await audit.record({userId:req.session.user.id,action:'CHANGE_PASSWORD',entityType:'users',entityId:req.session.user.id,ip:req.ip});flash(req,'success','Đã đổi mật khẩu.');res.redirect('/settings');}));

// Xuat du lieu tai khoan dang dang nhap ra file JSON
router.get('/backup/export', asyncHandler(async (req, res) => {
  const userId = req.session.user.id;

  const [categories, transactions, budgets, savingsGoals] =
    await Promise.all([
      db.query(
        `SELECT id, name, type, icon, color, is_active, is_default, created_at
         FROM categories
         WHERE user_id = $1
         ORDER BY id`,
        [userId]
      ),

      db.query(
        `SELECT id, category_id, type, title, amount,
                transaction_date, payment_method, merchant, note,
                created_at, updated_at
         FROM transactions
         WHERE user_id = $1
         ORDER BY id`,
        [userId]
      ),

      db.query(
        `SELECT id, category_id, month, amount, created_at, updated_at
         FROM budgets
         WHERE user_id = $1
         ORDER BY id`,
        [userId]
      ),

      db.query(
        `SELECT id, title, target_amount, current_amount,
                target_date, note, status, created_at, updated_at
         FROM savings_goals
         WHERE user_id = $1
         ORDER BY id`,
        [userId]
      )
    ]);

  const backup = {
    app: 'Student Wallet',
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {
      categories: categories.rows,
      transactions: transactions.rows,
      budgets: budgets.rows,
      savingsGoals: savingsGoals.rows
    }
  };

  await audit.record({
    userId,
    action: 'EXPORT_BACKUP',
    entityType: 'backup',
    ip: req.ip
  });

  const date = new Date().toISOString().slice(0, 10);
  const filename = `student_wallet_backup_${date}.json`;

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${filename}"`
  );

  res.json(backup);
}));

// Khoi phuc du lieu tu file JSON
router.post('/backup/restore', asyncHandler(async (req, res) => {
  const userId = req.session.user.id;
  const { backup, currentPassword, confirmation } = req.body || {};

  if (!backup || typeof backup !== 'object') {
    throw badRequest('File sao luu khong hop le.');
  }

  if (typeof currentPassword !== 'string' || !currentPassword) {
    throw badRequest('Vui long nhap mat khau hien tai.');
  }

  if (confirmation !== 'RESTORE') {
    throw badRequest('Vui long nhap chinh xac RESTORE.');
  }

  const userResult = await db.query(
    'SELECT password_hash FROM users WHERE id = $1',
    [userId]
  );

  if (
    !userResult.rows.length ||
    !await bcrypt.compare(currentPassword, userResult.rows[0].password_hash)
  ) {
    throw badRequest('Mat khau hien tai khong dung.');
  }

  let result;

  try {
    result = await backupService.restore(userId, backup);
  } catch (error) {
    console.error('[backup] restore failed:', error.message);
    throw badRequest(error.message);
  }

  await audit.record({
    userId,
    action: 'RESTORE_BACKUP',
    entityType: 'backup',
    details: {
      categories: result.categories,
      transactions: result.transactions,
      budgets: result.budgets,
      savingsGoals: result.savingsGoals
    },
    ip: req.ip
  });

  res.json({
    success: true,
    message: 'Khoi phuc du lieu thanh cong.',
    counts: {
      categories: result.categories,
      transactions: result.transactions,
      budgets: result.budgets,
      savingsGoals: result.savingsGoals
    },
    safetyBackup: result.safetyBackup
  });
}));

module.exports = router;

