function money(value) {
  const number = Number(value || 0);
  return new Intl.NumberFormat('vi-VN', { style:'currency', currency:'VND', maximumFractionDigits:0 }).format(Number.isFinite(number) ? number : 0);
}
function date(value) {
  if (!value) return '—';
  const raw = String(value).slice(0,10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (match) return `${match[3]}/${match[2]}/${match[1]}`;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '—' : new Intl.DateTimeFormat('vi-VN').format(parsed);
}
function dateTime(value) {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '—' : new Intl.DateTimeFormat('vi-VN',{dateStyle:'short',timeStyle:'short',timeZone:'Asia/Ho_Chi_Minh'}).format(parsed);
}
function initials(value='') { return String(value).trim().split(/\s+/).slice(-2).map(p=>p[0]||'').join('').toUpperCase(); }
function monthLabel(value) {
  const [year,month] = String(value || '').split('-');
  return year && month ? `Tháng ${Number(month)}/${year}` : '';
}
function percent(value) { return `${Math.max(0,Math.min(100,Number(value)||0)).toFixed(0)}%`; }
module.exports = { money,date,dateTime,initials,monthLabel,percent };
