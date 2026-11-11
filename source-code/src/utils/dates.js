const TIME_ZONE='Asia/Ho_Chi_Minh';
function todayDate(){
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:TIME_ZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  const get=(type)=>parts.find(p=>p.type===type)?.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}
function currentMonth(){return todayDate().slice(0,7);}
function validDate(value){
  const date=String(value||'');if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return null;
  const parsed=new Date(`${date}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime())||parsed.toISOString().slice(0,10)!==date?null:date;
}
function validMonth(value){const month=String(value||'');return /^\d{4}-(0[1-9]|1[0-2])$/.test(month)?`${month}-01`:null;}
function addDays(dateString,days){const [y,m,d]=dateString.split('-').map(Number);const date=new Date(Date.UTC(y,m-1,d+days));return date.toISOString().slice(0,10);}
module.exports={validDate,validMonth,currentMonth,todayDate,addDays,TIME_ZONE};
