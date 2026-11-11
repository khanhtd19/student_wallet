const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const format=require('../src/utils/format');
const dates=require('../src/utils/dates');
const pagination=require('../src/utils/pagination');
const root=path.join(__dirname,'..');

test('VND formatter handles valid and invalid amounts',()=>{
 assert.match(format.money(125000),/125\.000/);
 assert.doesNotThrow(()=>format.money('not a number'));
});
test('Vietnamese date helper supports PostgreSQL date-only values',()=>{
 assert.equal(format.date('2026-11-10'),'10/11/2026');
 assert.equal(format.date(null),'—');
});
test('month parser rejects malformed month values',()=>{
 assert.equal(dates.validMonth('2026-11'),'2026-11-01');
 assert.equal(dates.validMonth('2026-13'),null);
 assert.equal(dates.validDate('2026-02-30'),null);
});
test('pagination clamps invalid and out-of-range page numbers',()=>{
 assert.equal(pagination.parsePage('-2'),1);
 assert.deepEqual(pagination.createPagination('99',25,10),{page:3,pageSize:10,pageCount:3,total:25,offset:20,from:21,to:25});
});
test('schema has personal finance tables and user ownership',()=>{
 const schema=fs.readFileSync(path.join(root,'database/schema.sql'),'utf8');
 for(const table of ['users','categories','transactions','budgets','savings_goals','audit_logs'])assert.match(schema,new RegExp(`CREATE TABLE IF NOT EXISTS ${table}\\s*\\(`));
 assert.match(schema,/user_id BIGINT NOT NULL REFERENCES users\(id\) ON DELETE CASCADE/);
 assert.match(schema,/type VARCHAR\(10\) NOT NULL CHECK \(type IN \('EXPENSE','INCOME'\)\)/);
 assert.match(schema,/amount NUMERIC\(14,2\) NOT NULL CHECK \(amount > 0\)/);
 assert.doesNotMatch(schema,/products|product_batches|orders|customers|stock_movements/i);
});
test('monthly budget supports total and category limits without duplicates',()=>{
 const schema=fs.readFileSync(path.join(root,'database/schema.sql'),'utf8');
 assert.match(schema,/uq_budgets_general/);
 assert.match(schema,/uq_budgets_category/);
 assert.match(schema,/category_id BIGINT REFERENCES categories\(id\) ON DELETE CASCADE/);
});
test('all authenticated data routes scope queries by user id',()=>{
 const files=['src/routes/transactions.js','src/routes/categories.js','src/routes/budgets.js','src/routes/goals.js','src/routes/reports.js','src/routes/settings.js'];
 for(const file of files){const source=fs.readFileSync(path.join(root,file),'utf8');assert.match(source,/requireAuth/);}
 const tx=fs.readFileSync(path.join(root,'src/routes/transactions.js'),'utf8');
 assert.match(tx,/t\.user_id=\$1/);
 assert.match(tx,/WHERE id=\$1 AND user_id=\$2/);
});
test('transaction validation requires positive amount, valid type and matching category',()=>{
 const source=fs.readFileSync(path.join(root,'src/routes/transactions.js'),'utf8');
 assert.match(source,/isFloat\(\{gt:0/);
 assert.match(source,/TYPES=\['EXPENSE','INCOME'\]/);
 assert.match(source,/category\.rows\[0\]\.type!==req\.body\.type/);
});
test('budget and savings goal workflows are implemented',()=>{
 const budgets=fs.readFileSync(path.join(root,'src/routes/budgets.js'),'utf8');
 const goals=fs.readFileSync(path.join(root,'src/routes/goals.js'),'utf8');
 assert.match(budgets,/ON CONFLICT/);
 assert.match(budgets,/INTERVAL '1 month'/);
 assert.match(goals,/current_amount/);
 assert.match(goals,/COMPLETED/);
});
test('CSV exports neutralize spreadsheet formula prefixes',()=>{
 const tx=fs.readFileSync(path.join(root,'src/routes/transactions.js'),'utf8');
 const report=fs.readFileSync(path.join(root,'src/routes/reports.js'),'utf8');
 assert.match(tx,/replace\(\/\^\[=\+@-\]/);
 assert.match(report,/replace\(\/\^\[=\+@-\]/);
});
test('new visual and identity copy is used in UI',()=>{
 const shell=fs.readFileSync(path.join(root,'src/views/partials/header.ejs'),'utf8');
 const css=fs.readFileSync(path.join(root,'src/public/css/app.css'),'utf8');
 assert.match(shell,/Student Wallet/);
 assert.match(shell,/Ngân sách/);
 assert.match(shell,/Mục tiêu tiết kiệm/);
 assert.match(fs.readFileSync(path.join(root,'src/views/dashboard.ejs'),'utf8'),/Bạn đã vượt ngân sách/);
 assert.match(css,/@media\(max-width:600px\)/);
});
test('no cosmetic retail terminology remains in active source and docs',()=>{
 const files=[];const walk=dir=>{for(const item of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,item.name);if(item.isDirectory())walk(full);else if(/\.(js|ejs|css|md|sql|yaml|json)$/.test(item.name))files.push(full);}};
 for(const folder of ['src','database','docs','postman'])walk(path.join(root,folder));
 for(const file of files){const value=fs.readFileSync(file,'utf8');assert.doesNotMatch(value,/Lumière Cosmetic|cosmetic-mini|quản lý cửa hàng mỹ phẩm|product_batches|stock_movements/i,`Old project phrase in ${path.relative(root,file)}`);}
});
test('docker compose defines application and PostgreSQL only',()=>{
 const compose=fs.readFileSync(path.join(root,'compose.yaml'),'utf8');
 assert.match(compose,/application:/);assert.match(compose,/database:/);assert.match(compose,/database-data:/);assert.doesNotMatch(compose,/minio/i);
});
test('example env contains demo student account but no real secret',()=>{
 const env=fs.readFileSync(path.join(root,'.env.example'),'utf8');
 assert.match(env,/STUDENT_EMAIL/);assert.match(env,/STUDENT_PASSWORD/);assert.match(env,/DB_PASSWORD=change_me/);assert.doesNotMatch(env,/BANK_ACCOUNT|API_KEY_REAL/i);
});

test('all EJS templates pass the static template checker',()=>{
 const {spawnSync}=require('node:child_process');const result=spawnSync(process.execPath,[path.join(root,'scripts/check-templates.js')],{encoding:'utf8'});assert.equal(result.status,0,result.stderr||result.stdout);assert.match(result.stdout,/failures: 0/);
});

test('transaction payment-method labels do not override the shared methodLabel formatter',()=>{
 const route=fs.readFileSync(path.join(root,'src/routes/transactions.js'),'utf8');
 const form=fs.readFileSync(path.join(root,'src/views/transactions/form.ejs'),'utf8');
 const server=fs.readFileSync(path.join(root,'src/server.js'),'utf8');
 assert.match(server,/app\.locals\.methodLabel=\(method\)=>/);
 assert.doesNotMatch(route,/transactions\/list'[\s\S]*?methodLabel:labels/);
 assert.match(route,/transactions\/form'[\s\S]*?paymentMethods:labels/);
 assert.match(form,/Object\.entries\(paymentMethods\)/);
 assert.doesNotMatch(form,/Object\.entries\(methodLabel\)/);
});
