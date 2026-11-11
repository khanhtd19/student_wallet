const test = require('node:test');
const assert = require('node:assert/strict');
const {
  getDashboardAnalytics, daysInMonth, previousMonth, percentChange,
  buildCumulative, summarizeCategories, safeColor
} = require('../src/services/dashboard-analytics');
const fs = require('node:fs');
const path = require('node:path');

const root=path.join(__dirname,'..');

test('analytics calendar handles leap years and December/January boundary',()=>{
  assert.equal(daysInMonth('2024-02'),29);
  assert.equal(daysInMonth('2026-02'),28);
  assert.equal(daysInMonth('2026-11'),30);
  assert.equal(previousMonth('2026-01'),'2025-12');
  assert.equal(previousMonth('2026-11'),'2026-10');
});

test('comparison percentage avoids dividing by zero',()=>{
  assert.equal(percentChange(100,0),null);
  assert.equal(percentChange(0,0),null);
  assert.equal(percentChange(120,100),20);
  assert.equal(percentChange(50,100),-50);
});

test('daily accumulation works and hides future days of active month',()=>{
  const rows=[
    {month:'2026-11',day:1,income:'200000',expense:'50000'},
    {month:'2026-11',day:3,income:'100000',expense:'30000'}
  ];
  const result=buildCumulative(rows,'2026-11',4);
  assert.equal(result.income[0],200000);
  assert.equal(result.income[1],200000);
  assert.equal(result.income[2],300000);
  assert.equal(result.expense[2],80000);
  assert.equal(result.income[4],null);
  assert.equal(result.expense.length,30);
});

test('category breakdown is sorted and rejects unsafe colors',()=>{
  const result=summarizeCategories([
    {name:'Ăn uống',type:'EXPENSE',amount:'70000',color:'#e96576'},
    {name:'Lương',type:'INCOME',amount:'2000000',color:'#0c9'},
    {name:'Đi lại',type:'EXPENSE',amount:'80000',color:'red; position:fixed'},
    {name:'Không phát sinh',type:'EXPENSE',amount:'0',color:'#000'}
  ],'EXPENSE');
  assert.deepEqual(result.map(r=>r.name),['Đi lại','Ăn uống']);
  assert.equal(result[0].amount,80000);
  assert.notEqual(result[0].color,'red; position:fixed');
  assert.equal(safeColor('#ffffff','#000'),'#ffffff');
});

test('analytics queries respect selected month and signed-in user; results are numeric',async()=>{
  const queries=[];
  const mock={query:async(sql,values)=>{
    queries.push({sql,values});
    if(sql.includes('generate_series'))return {rows:[
      {month:'2026-09',income:'1000000',expense:'300000'},
      {month:'2026-10',income:'1500000',expense:'400000'}
    ]};
    if(sql.includes('FROM transactions t JOIN categories c'))return {rows:[
      {name:'Lương',type:'INCOME',amount:'1500000',color:'#16ab88'},
      {name:'Ăn uống',type:'EXPENSE',amount:'400000',color:'#ef6372'}
    ]};
    return {rows:[
      {month:'2026-09',day:10,income:'1000000',expense:'300000'},
      {month:'2026-10',day:10,income:'1500000',expense:'400000'}
    ]};
  }};
  const result=await getDashboardAnalytics(mock,77,'2026-10');
  assert.equal(queries.length,3);
  for(const {sql,values} of queries){
    assert.match(sql,/user_id=\$1/);
    assert.deepEqual(values,[77,'2026-10-01']);
  }
  assert.equal(result.monthly.at(-1).income,1500000);
  assert.equal(result.monthly.at(-1).expense,400000);
  assert.equal(result.insights.savingRate,(1500000-400000)/1500000*100);
  assert.ok(Math.abs(result.insights.expenseChange - 100/3) < 1e-9);
  assert.equal(result.insights.topExpense.name,'Ăn uống');
  assert.equal(result.cumulative.expense.current[9],400000);
  assert.equal(result.cumulative.income.previous[9],1000000);
  assert.equal(result.cumulative.income.current.length,31);
});

test('premium dashboard is additive and needs no external chart library or new tables',()=>{
  const page=fs.readFileSync(path.join(root,'src/views/dashboard.ejs'),'utf8');
  const client=fs.readFileSync(path.join(root,'src/public/js/dashboard.js'),'utf8');
  assert.match(page,/chart-monthly/);
  assert.match(page,/chart-expense-donut/);
  assert.match(page,/chart-income-donut/);
  assert.match(page,/chart-net/);
  assert.match(page,/chart-expense-trend/);
  assert.match(page,/chart-income-trend/);
  assert.match(page,/budgetUsage/);
  assert.match(page,/methodLabel\(t.payment_method\)/);
  assert.match(page,/JSON.stringify\(analytics\).replace\(\/<\/g/);
  assert.doesNotMatch(client,/Chart\.js|chartjs|fetch\(|XMLHttpRequest|https:\/\/cdn\./);
  const schema=fs.readFileSync(path.join(root,'database/schema.sql'),'utf8');
  assert.match(schema,/CREATE TABLE IF NOT EXISTS transactions/);
});
