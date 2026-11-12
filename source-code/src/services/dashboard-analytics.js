/**
 * Dashboard-only reporting. All queries are scoped to the signed-in user's ID.
 * Data for the charts comes from PostgreSQL, never from hard-coded demo numbers.
 * No schema migration or new dependency is required.
 */
const { todayDate } = require('../utils/dates');

function daysInMonth(month) {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(month);
  if (!match) throw new Error('Invalid calendar month');
  return new Date(Date.UTC(Number(match[1]), Number(match[2]), 0)).getUTCDate();
}

function previousMonth(month) {
  const [year, monthNumber] = month.split('-').map(Number);
  const previous = new Date(Date.UTC(year, monthNumber - 2, 1));
  return previous.toISOString().slice(0, 7);
}

function safeColor(value, fallback) {
  return /^#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?$/.test(String(value || ''))
    ? value : fallback;
}

function percentChange(current, previous) {
  if (!previous) return null;
  return (current - previous) / Math.abs(previous) * 100;
}

function buildCumulative(rows, month, currentDay) {
  const days = daysInMonth(month);
  const daily = new Map(rows.filter(row => row.month === month).map(row => [Number(row.day), row]));
  let income = 0;
  let expense = 0;
  const cumulativeIncome = [];
  const cumulativeExpense = [];
  for (let day = 1; day <= days; day += 1) {
    const record = daily.get(day);
    income += Number(record?.income || 0);
    expense += Number(record?.expense || 0);
    cumulativeIncome.push(currentDay !== null && day > currentDay ? null : income);
    cumulativeExpense.push(currentDay !== null && day > currentDay ? null : expense);
  }
  return { income: cumulativeIncome, expense: cumulativeExpense };
}

function summarizeCategories(rows, type) {
  const palette = type === 'INCOME'
    ? ['#159c75','#3a8bd5','#7c80e6','#e0a444','#36a6ae','#936cd9']
    : ['#ed6372','#edaa55','#697be6','#24b495','#8e7ae7','#48a2d3'];
  return rows
    .filter(row => row.type === type && Number(row.amount) > 0)
    .sort((a,b) => Number(b.amount) - Number(a.amount))
    .map((row,index) => ({
      name: String(row.name),
      amount: Number(row.amount),
      color: safeColor(row.color, palette[index % palette.length])
    }));
}

async function getDashboardAnalytics(db, userId, monthKey) {
  const firstDay = `${monthKey}-01`;
  const beforeMonth = previousMonth(monthKey);
  const today = todayDate();
  const remainingDays = monthKey === today.slice(0,7) ? Number(today.slice(8,10))
    : monthKey > today.slice(0,7) ? 0 : null;
  const [monthlyResult, categoriesResult, dailyResult] = await Promise.all([
    db.query(`
        SELECT to_char(m.month_start, 'YYYY-MM') AS "month",
        COALESCE(SUM(t.amount) FILTER (WHERE t.type='INCOME'),0) income,
        COALESCE(SUM(t.amount) FILTER (WHERE t.type='EXPENSE'),0) expense
      FROM generate_series(($2::date - INTERVAL '11 months')::date, $2::date, INTERVAL '1 month') AS m(month_start)
      LEFT JOIN transactions t ON t.user_id=$1
        AND t.transaction_date >= m.month_start
        AND t.transaction_date < m.month_start + INTERVAL '1 month'
      GROUP BY m.month_start ORDER BY m.month_start`, [userId, firstDay]),
    db.query(`
      SELECT c.name,c.color,c.type,SUM(t.amount) amount
      FROM transactions t JOIN categories c ON c.id=t.category_id
      WHERE t.user_id=$1 AND c.user_id=$1
        AND t.transaction_date >= $2::date
        AND t.transaction_date < ($2::date + INTERVAL '1 month')
      GROUP BY c.id ORDER BY amount DESC`, [userId, firstDay]),
    db.query(`
      SELECT to_char(date_trunc('month', t.transaction_date), 'YYYY-MM') AS "month",
  EXTRACT(DAY FROM t.transaction_date)::int AS "day",
        COALESCE(SUM(t.amount) FILTER (WHERE t.type='INCOME'),0) income,
        COALESCE(SUM(t.amount) FILTER (WHERE t.type='EXPENSE'),0) expense
      FROM transactions t
      WHERE t.user_id=$1 AND t.transaction_date >= ($2::date - INTERVAL '1 month')
        AND t.transaction_date < ($2::date + INTERVAL '1 month')
      GROUP BY 1,2 ORDER BY 1,2`, [userId, firstDay])
  ]);

  const monthly = monthlyResult.rows.map(row => ({
    month: row.month, income: Number(row.income), expense: Number(row.expense)
  }));
  const current = monthly.at(-1) || {income:0,expense:0};
  const prior = monthly.at(-2) || {income:0,expense:0};
  const expenseCategories = summarizeCategories(categoriesResult.rows,'EXPENSE');
  const incomeCategories = summarizeCategories(categoriesResult.rows,'INCOME');
  const currentCumulative = buildCumulative(dailyResult.rows, monthKey, remainingDays);
  const previousCumulative = buildCumulative(dailyResult.rows, beforeMonth, null);
  const elapsedDays = remainingDays === null ? daysInMonth(monthKey) : remainingDays;
  const net = current.income - current.expense;

  return {
    selectedMonth: monthKey,
    monthly,
    expenseCategories,
    incomeCategories,
    cumulative: {
      expense: {current:currentCumulative.expense,previous:previousCumulative.expense},
      income: {current:currentCumulative.income,previous:previousCumulative.income}
    },
    insights: {
      incomeChange: percentChange(current.income, prior.income),
      expenseChange: percentChange(current.expense, prior.expense),
      savingRate: current.income > 0 ? net / current.income * 100 : null,
      avgExpensePerDay: elapsedDays > 0 ? current.expense / elapsedDays : 0,
      topExpense: expenseCategories[0] || null,
      previousMonth: beforeMonth,
      daysObserved: elapsedDays,
      hasTransactions: current.income > 0 || current.expense > 0
    }
  };
}

module.exports = {getDashboardAnalytics,daysInMonth,previousMonth,percentChange,buildCumulative,summarizeCategories,safeColor};
