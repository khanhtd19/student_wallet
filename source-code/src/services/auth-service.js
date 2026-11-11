const bcrypt = require('bcryptjs');
const db = require('../config/database');

const DEFAULT_CATEGORIES = [
  ['Ăn uống','EXPENSE','bi-cup-hot','#f59e0b'],
  ['Đi lại','EXPENSE','bi-bicycle','#0ea5e9'],
  ['Học tập','EXPENSE','bi-book','#8b5cf6'],
  ['Nhà ở','EXPENSE','bi-house','#64748b'],
  ['Mua sắm','EXPENSE','bi-bag','#ec4899'],
  ['Giải trí','EXPENSE','bi-controller','#14b8a6'],
  ['Sức khỏe','EXPENSE','bi-heart-pulse','#ef4444'],
  ['Điện nước & Internet','EXPENSE','bi-lightning','#eab308'],
  ['Chi phí khác','EXPENSE','bi-three-dots','#94a3b8'],
  ['Gia đình hỗ trợ','INCOME','bi-house-heart','#16a34a'],
  ['Lương làm thêm','INCOME','bi-briefcase','#0d9488'],
  ['Học bổng','INCOME','bi-award','#7c3aed'],
  ['Trợ cấp','INCOME','bi-wallet2','#2563eb'],
  ['Thu nhập khác','INCOME','bi-plus-circle','#64748b']
];

async function ensureDefaultCategories(userId) {
  for (const [name, type, icon, color] of DEFAULT_CATEGORIES) {
    await db.query(
      `INSERT INTO categories(user_id,name,type,icon,color,is_default)
       VALUES($1,$2,$3,$4,$5,TRUE) ON CONFLICT(user_id,name,type) DO NOTHING`,
      [userId, name, type, icon, color]
    );
  }
}

async function createUser({ fullName, email, password }) {
  const passwordHash = await bcrypt.hash(password, 12);
  const result = await db.query(
    'INSERT INTO users(full_name,email,password_hash) VALUES($1,$2,$3) RETURNING id,full_name,email',
    [fullName.trim(), email.trim().toLowerCase(), passwordHash]
  );
  await ensureDefaultCategories(result.rows[0].id);
  return { id: result.rows[0].id, fullName: result.rows[0].full_name, email: result.rows[0].email, role: 'STUDENT' };
}

async function ensureDemoUsers() {
  if (String(process.env.CREATE_DEMO_DATA ?? 'true').toLowerCase() !== 'true') return;
  const email = (process.env.STUDENT_EMAIL || 'student@dailybudget.local').trim().toLowerCase();
  let result = await db.query('SELECT id,full_name,email FROM users WHERE email=$1', [email]);
  let userId;
  if (!result.rowCount) {
    const passwordHash = await bcrypt.hash(process.env.STUDENT_PASSWORD || 'Student@12345', 12);
    result = await db.query(
      'INSERT INTO users(full_name,email,password_hash) VALUES($1,$2,$3) RETURNING id,full_name,email',
      [process.env.STUDENT_NAME || 'Sinh viên Demo', email, passwordHash]
    );
    console.log(`[auth] created demo student ${email}`);
  }
  userId = result.rows[0].id;
  await ensureDefaultCategories(userId);
  const count = await db.query('SELECT COUNT(*)::int AS count FROM transactions WHERE user_id=$1', [userId]);
  if (count.rows[0].count === 0) await createDemoTransactions(userId);
}

async function createDemoTransactions(userId) {
  const byName = await db.query('SELECT id,name,type FROM categories WHERE user_id=$1', [userId]);
  const categories = new Map(byName.rows.map((row) => [`${row.name}:${row.type}`, row.id]));
  const nowParts = new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  const part = (name) => Number(nowParts.find(x=>x.type===name).value);
  const today = new Date(part('year'),part('month')-1,part('day'));
  const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const samples = [
    ['EXPENSE','Ăn sáng',28000,'Ăn uống','CASH',-0],
    ['EXPENSE','Gửi xe và xăng',45000,'Đi lại','E_WALLET',-1],
    ['EXPENSE','In tài liệu môn học',32000,'Học tập','CASH',-2],
    ['INCOME','Tiền gia đình gửi',2000000,'Gia đình hỗ trợ','BANK_TRANSFER',-3],
    ['EXPENSE','Ăn trưa',42000,'Ăn uống','E_WALLET',-3],
    ['EXPENSE','Mua bút và vở',65000,'Học tập','CASH',-4],
    ['EXPENSE','Cà phê học nhóm',55000,'Giải trí','E_WALLET',-5],
    ['EXPENSE','Tiền điện thoại',100000,'Điện nước & Internet','BANK_TRANSFER',-6]
  ];
  for (const [type,title,amount,category,method,offset] of samples) {
    const date = new Date(today); date.setDate(date.getDate()+offset);
    await db.query(
      `INSERT INTO transactions(user_id,category_id,type,title,amount,transaction_date,payment_method)
       VALUES($1,$2,$3,$4,$5,$6,$7)`,
      [userId,categories.get(`${category}:${type}`),type,title,amount,fmt(date),method]
    );
  }
  const month = new Date(today.getFullYear(),today.getMonth(),1);
  await db.query('INSERT INTO budgets(user_id,category_id,month,amount) VALUES($1,NULL,$2,3500000) ON CONFLICT DO NOTHING', [userId,fmt(month)]);
  await db.query('INSERT INTO budgets(user_id,category_id,month,amount) SELECT $1,id,$2,1200000 FROM categories WHERE user_id=$1 AND name=\'Ăn uống\' AND type=\'EXPENSE\' ON CONFLICT DO NOTHING', [userId,fmt(month)]);
  await db.query('INSERT INTO savings_goals(user_id,title,target_amount,current_amount,target_date,note) VALUES($1,$2,5000000,1250000,$3,$4)', [userId,'Quỹ mua laptop',fmt(new Date(today.getFullYear(),today.getMonth()+3,1)),'Tiết kiệm từ tiền làm thêm và trợ cấp.']);
}

async function authenticate(email, password) {
  const result = await db.query(
    'SELECT id,full_name,email,password_hash,is_active FROM users WHERE lower(email)=lower($1)',
    [String(email || '').trim()]
  );
  const user = result.rows[0];
  if (!user || !user.is_active) return null;
  if (!await bcrypt.compare(String(password || ''), user.password_hash)) return null;
  await db.query('UPDATE users SET last_login_at=NOW() WHERE id=$1', [user.id]);
  return { id:user.id, fullName:user.full_name, email:user.email, role:'STUDENT' };
}

module.exports = { authenticate, createUser, ensureDemoUsers, ensureDefaultCategories, DEFAULT_CATEGORIES };
