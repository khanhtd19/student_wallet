/* Student Wallet · dashboard charts
 * Dependency-free SVG charts rendered from server-provided, user-scoped data.
 * No third-party chart library, CDN, or extra network request.
 */
(() => {
  'use strict';
  const payload = document.getElementById('dashboard-data');
  if (!payload) return;
  let data;
  try { data = JSON.parse(payload.textContent); }
  catch (error) { console.error('[dashboard] Invalid chart data', error); return; }

  const NS = 'http://www.w3.org/2000/svg';
  const colors = { income:'#15a77c', expense:'#ed6070', balance:'#6877e8', previous:'#bbc4d2', grid:'#eef1f6', axis:'#9ca7b8' };
  const amount = n => Number(n) || 0;
  const money = n => new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND',maximumFractionDigits:0}).format(amount(n));
  const compact = value => {
    const n = amount(value), abs = Math.abs(n);
    if(abs >= 1e9) return `${Number((n / 1e9).toFixed(1)).toLocaleString('vi-VN')} tỷ`;
    if(abs >= 1e6) return `${Number((n / 1e6).toFixed(1)).toLocaleString('vi-VN')} tr`;
    if(abs >= 1e3) return `${Number((n / 1e3).toFixed(0)).toLocaleString('vi-VN')}k`;
    return `${Math.round(n)}`;
  };
  const point = (n) => Number(n).toFixed(2);

  function svgElement(tag, attributes={}, content=null) {
    const el = document.createElementNS(NS, tag);
    for(const [key,value] of Object.entries(attributes)) {
      if(value !== undefined && value !== null) el.setAttribute(key, String(value));
    }
    if(content !== null) el.textContent = String(content);
    return el;
  }
  function add(parent, tag, attributes={}, content=null) {
    const child=svgElement(tag,attributes,content);
    parent.appendChild(child);
    return child;
  }
  function createSvg(label,w=820,h=288) {
    const svg=svgElement('svg',{viewBox:`0 0 ${w} ${h}`,role:'img','aria-label':label,preserveAspectRatio:'xMidYMid meet',class:'analytics-svg'});
    add(svg,'title',{},label);
    return svg;
  }
  function setEmpty(targetId,icon,message,linkText='Thêm giao dịch') {
    const host=document.getElementById(targetId);
    if(!host)return;
    host.replaceChildren();
    const div=document.createElement('div');div.className='analytics-empty';
    const i=document.createElement('i');i.className=`bi ${icon}`;i.setAttribute('aria-hidden','true');
    const p=document.createElement('p');p.textContent=message;
    const a=document.createElement('a');a.href='/transactions/new';a.textContent=linkText;
    div.append(i,p,a);host.append(div);
  }
  function grid(svg,rect,min,max,rows=4){
    for(let i=0;i<=rows;i++){
      const y=rect.top + i*rect.height/rows;
      add(svg,'line',{x1:rect.left,y1:y,x2:rect.left+rect.width,y2:y,stroke:colors.grid,'stroke-width':1});
      const value=max-(max-min)*i/rows;
      add(svg,'text',{x:rect.left-11,y:y+4,'text-anchor':'end',class:'axis-text'},compact(value));
    }
  }
  function chartDef(svg,name,color){
    const defs=add(svg,'defs');
    const gradient=add(defs,'linearGradient',{id:name,x1:'0',x2:'0',y1:'0',y2:'1'});
    add(gradient,'stop',{offset:'0%','stop-color':color,'stop-opacity':'0.20'});
    add(gradient,'stop',{offset:'100%','stop-color':color,'stop-opacity':'0'});
    return `url(#${name})`;
  }
  function visibleMonthly(monthCount){return (data.monthly||[]).slice(-monthCount);}

  function monthlyBars(period){
    const host=document.getElementById('chart-monthly');if(!host)return;
    const months=visibleMonthly(period);
    if(!months.some(m=>amount(m.income)>0||amount(m.expense)>0)){
      setEmpty('chart-monthly','bi-bar-chart-line','Chưa có khoản thu hoặc chi trong giai đoạn này.');return;
    }
    const w=Math.max(310,Math.round(host.clientWidth||820)),h=290,box={left:56,top:18,width:w-71,height:220};
    const svg=createSvg('Thu và chi từng tháng, giá trị theo đồng Việt Nam',w,h);
    const maxValue=Math.max(1,...months.flatMap(m=>[amount(m.income),amount(m.expense)]));
    const max=Math.ceil(maxValue/4/Math.pow(10,Math.max(0,Math.floor(Math.log10(maxValue/4)))))*Math.pow(10,Math.max(0,Math.floor(Math.log10(maxValue/4))))*4 || 1;
    grid(svg,box,0,max);
    const space=box.width/months.length;
    const barWidth=Math.min(23,Math.max(8,space*.22));
    months.forEach((month,index)=>{
      const x=box.left+space*(index+.5);
      const g=add(svg,'g',{class:'chart-bar-group',tabindex:'0',role:'group','aria-label':`Tháng ${month.month.slice(5)}/${month.month.slice(0,4)}: thu ${money(month.income)}, chi ${money(month.expense)}`,
        'data-chart-tip':`Tháng ${month.month.slice(5)}/${month.month.slice(0,4)}\nThu: ${money(month.income)}\nChi: ${money(month.expense)}`});
      const values=[{value:amount(month.income),color:colors.income,shift:-barWidth-3},{value:amount(month.expense),color:colors.expense,shift:3}];
      values.forEach(v=>{
        const bh=v.value>0?Math.max(2,v.value/max*box.height):0;
        add(g,'rect',{x:x+v.shift,y:box.top+box.height-bh,width:barWidth,height:bh,rx:4,fill:v.color,class:'chart-bar'});
      });
      add(svg,'text',{x,y:h-23,'text-anchor':'middle',class:'axis-text'},`T${Number(month.month.slice(5))}`);
      if(index===0 || Number(month.month.slice(5))===1) add(svg,'text',{x,y:h-9,'text-anchor':'middle',class:'axis-subtext'},month.month.slice(0,4));
    });
    host.replaceChildren(svg);
  }

  function donut(targetId,legendId,source,type){
    const host=document.getElementById(targetId),legend=document.getElementById(legendId);
    if(!host||!legend)return;
    host.replaceChildren();legend.replaceChildren();
    const groups=(source||[]).filter(x=>amount(x.amount)>0),total=groups.reduce((sum,x)=>sum+amount(x.amount),0);
    if(!groups.length){
      setEmpty(targetId,'bi-pie-chart','Chưa có dữ liệu trong tháng.');return;
    }
    const svg=createSvg(`Cơ cấu ${type==='income'?'thu nhập':'chi tiêu'} theo danh mục`,220,220);
    add(svg,'circle',{cx:110,cy:110,r:75,fill:'none',stroke:'#f0f2f6','stroke-width':22});
    const circumference=2*Math.PI*75;
    let offset=0;
    // Display the largest 5 categories separately. Preserve the rest as "Khác".
    const top=groups.slice(0,5);
    if(groups.length>5) top.push({name:'Danh mục khác',amount:groups.slice(5).reduce((s,c)=>s+amount(c.amount),0),color:'#bec6d8'});
    top.forEach(item=>{
      const ratio=amount(item.amount)/total;
      const arc=add(svg,'circle',{cx:110,cy:110,r:75,fill:'none',stroke:item.color,'stroke-width':22,
        'stroke-dasharray':`${Math.max(0,ratio*circumference)} ${circumference}`,'stroke-dashoffset':-offset,
        transform:'rotate(-90 110 110)',class:'donut-segment',tabindex:'0',role:'group',
        'aria-label':`${item.name}: ${money(item.amount)} (${(ratio*100).toFixed(1)}%)`,
        'data-chart-tip':`${item.name}\n${money(item.amount)} · ${(ratio*100).toFixed(1)}%`});
      offset+=ratio*circumference;
    });
    add(svg,'text',{x:110,y:101,'text-anchor':'middle',class:'donut-center-label'},type==='income'?'Tổng thu':'Tổng chi');
    add(svg,'text',{x:110,y:126,'text-anchor':'middle',class:'donut-center-value'},compact(total));
    host.append(svg);
    top.forEach(item=>{
      const row=document.createElement('div');row.className='donut-legend-row';
      const marker=document.createElement('span');marker.className='donut-legend-color';marker.style.backgroundColor=item.color;
      const label=document.createElement('span');label.className='donut-legend-label';label.textContent=item.name;label.title=item.name;
      const pct=document.createElement('strong');pct.textContent=`${(100*amount(item.amount)/total).toFixed(1)}%`;
      row.append(marker,label,pct);legend.append(row);
    });
  }

  function lineCoordinates(values,rect,min,max){
    const total=Math.max(1,values.length-1);
    return values.map((v,index)=>{
      if(v===null||v===undefined)return null;
      return {x:rect.left+rect.width*index/total,y:rect.top+(max-amount(v))/(max-min)*rect.height,
        value:amount(v),index};
    }).filter(Boolean);
  }
  function linePath(points){return points.map((p,i)=>`${i?'L':'M'}${point(p.x)} ${point(p.y)}`).join(' ');}
  function paintLine(svg,points,color,options={}){
    if(!points.length)return;
    if(options.fill){
      const d=`${linePath(points)} L ${point(points.at(-1).x)} ${point(options.zeroY)} L ${point(points[0].x)} ${point(options.zeroY)} Z`;
      add(svg,'path',{d,fill:options.fill,stroke:'none'});
    }
    add(svg,'path',{d:linePath(points),stroke:color,'stroke-width':options.dashed?2:3,fill:'none',
      'stroke-dasharray':options.dashed?'7 7':null,'stroke-linejoin':'round','stroke-linecap':'round',class:options.dashed?'previous-line':'current-line'});
  }
  function lineDots(svg,points,color,label,step){
    const chosen=points.filter(p=>p.index%step===0 || p.index===points.at(-1).index);
    chosen.forEach(p=>{
      const dot=add(svg,'circle',{cx:p.x,cy:p.y,r:4,fill:color,stroke:'#fff','stroke-width':2,
        tabindex:'0','aria-label':`${label} ${p.index+1}: ${money(p.value)}`,class:'line-point',
        'data-chart-tip':`${label} ${p.index+1}\n${money(p.value)}`});
    });
  }
  function monthlyNet(period){
    const months=visibleMonthly(period),host=document.getElementById('chart-net');if(!host)return;
    if(!months.some(m=>amount(m.income)||amount(m.expense))){setEmpty('chart-net','bi-graph-up','Chưa có giao dịch để hiển thị xu hướng.');return;}
    let total=0;
    const values=months.map(month=>(total+=amount(month.income)-amount(month.expense)));
    const w=Math.max(310,Math.round(host.clientWidth||820));
    const rect={left:56,top:16,width:w-72,height:206};
    let min=Math.min(0,...values),max=Math.max(0,...values);
    if(max===min)max=min+1;
    else {const padding=(max-min)*.08;min-=padding;max+=padding;}
    const svg=createSvg('Dòng tiền ròng cộng dồn trong các tháng đã chọn',w,270);
    const fill=chartDef(svg,'net-gradient',colors.balance);
    grid(svg,rect,min,max,4);
    const zeroY=rect.top+(max)/(max-min)*rect.height;
    add(svg,'line',{x1:rect.left,y1:zeroY,x2:rect.left+rect.width,y2:zeroY,stroke:'#c8cfdf','stroke-dasharray':'3 4'});
    const coords=lineCoordinates(values,rect,min,max);
    paintLine(svg,coords,colors.balance,{fill,zeroY});
    lineDots(svg,coords,colors.balance,'Tháng',1);
    months.forEach((m,i)=>{
      const x=rect.left+i*rect.width/Math.max(1,months.length-1);
      add(svg,'text',{x,y:250,'text-anchor':'middle',class:'axis-text'},`T${Number(m.month.slice(5))}`);
    });
    host.replaceChildren(svg);
  }
  function cumulativeChart(targetId,kind){
    const host=document.getElementById(targetId);if(!host)return;
    const source=data.cumulative?.[kind]||{current:[],previous:[]};
    const current=source.current||[],previous=source.previous||[];
    if(!current.some(v=>amount(v)>0) && !previous.some(v=>amount(v)>0)){
      setEmpty(targetId,kind==='income'?'bi-cash':'bi-graph-down','Chưa có dữ liệu để so sánh.');return;
    }
    const dayCount=current.length;
    const prevPad=Array.from({length:dayCount},(_,i)=>previous[Math.min(i,previous.length-1)]??0);
    const max=Math.max(1,...current.map(amount),...prevPad.map(amount));
    const maxAxis=max*1.10;
    const w=Math.max(310,Math.round(host.clientWidth||820));
    const rect={left:56,top:16,width:w-72,height:206};
    const svg=createSvg(`Biểu đồ ${kind==='income'?'thu nhập':'chi tiêu'} lũy kế theo ngày, so với tháng trước`,w,270);
    const accent=colors[kind];const fill=chartDef(svg,`${kind}-trend-gradient`,accent);
    grid(svg,rect,0,maxAxis);
    const oldPoints=lineCoordinates(prevPad,rect,0,maxAxis),newPoints=lineCoordinates(current,rect,0,maxAxis);
    paintLine(svg,oldPoints,colors.previous,{dashed:true});
    paintLine(svg,newPoints,accent,{fill,zeroY:rect.top+rect.height});
    lineDots(svg,newPoints,accent,'Ngày',Math.max(1,Math.ceil(dayCount/7)));
    const ticks=[1,8,15,22,dayCount].filter((day,index,arr)=>arr.indexOf(day)===index && day<=dayCount);
    ticks.forEach(day=>add(svg,'text',{x:rect.left+(day-1)*rect.width/Math.max(1,dayCount-1),y:250,'text-anchor':'middle',class:'axis-text'},day));
    host.replaceChildren(svg);
  }
  function updatePeriod(period){
    const valid=[3,6,12].includes(period)?period:6;
    document.querySelectorAll('[data-period]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.period)===valid)));
    monthlyBars(valid);
    monthlyNet(valid);
  }
  document.querySelectorAll('[data-period]').forEach(button=>button.addEventListener('click',()=>updatePeriod(Number(button.dataset.period))));
  updatePeriod(6);
  donut('chart-expense-donut','legend-expense',data.expenseCategories,'expense');
  donut('chart-income-donut','legend-income',data.incomeCategories,'income');
  cumulativeChart('chart-expense-trend','expense');
  cumulativeChart('chart-income-trend','income');
  // Accessible, instant hover and keyboard-focus tooltips for every SVG chart.
  const tip=document.createElement('div');
  tip.className='analytics-floating-tip';
  tip.setAttribute('role','tooltip');
  document.body.append(tip);
  const findTip=target=>target instanceof Element ? target.closest('[data-chart-tip]') : null;
  function positionTip(x,y){
    const width=tip.offsetWidth||160, height=tip.offsetHeight||70;
    tip.style.left=`${Math.max(8,Math.min(window.innerWidth-width-8,x+13))}px`;
    tip.style.top=`${Math.max(8,Math.min(window.innerHeight-height-8,y-13-height))}px`;
  }
  function showTip(node,x,y){
    if(!node)return;
    tip.textContent=node.getAttribute('data-chart-tip');
    tip.classList.add('visible');
    positionTip(x,y);
  }
  document.addEventListener('pointerover',e=>{
    const target=findTip(e.target);
    if(target)showTip(target,e.clientX,e.clientY);
  });
  document.addEventListener('pointermove',e=>{
    if(tip.classList.contains('visible'))positionTip(e.clientX,e.clientY);
  });
  document.addEventListener('pointerout',e=>{
    if(!findTip(e.relatedTarget))tip.classList.remove('visible');
  });
  document.addEventListener('focusin',e=>{
    const target=findTip(e.target);
    if(target){const box=target.getBoundingClientRect();showTip(target,box.left+box.width/2,box.top);}
  });
  document.addEventListener('focusout',e=>{if(findTip(e.target))tip.classList.remove('visible');});
  document.addEventListener('pointerdown',e=>{
    const target=findTip(e.target);
    if(target)showTip(target,e.clientX,e.clientY);
    else tip.classList.remove('visible');
  });
  // Recompute SVG chart coordinates if the dashboard is resized.
  if(typeof ResizeObserver !== 'undefined') {
    let oldWidths = new Map();
    const targetIds=['chart-monthly','chart-net','chart-expense-trend','chart-income-trend'];
    const observer = new ResizeObserver(entries => {
      let changed=false;
      for(const entry of entries){
        const id=entry.target.id;
        const width=Math.round(entry.contentRect.width);
        if(width>0 && oldWidths.get(id)!==width){oldWidths.set(id,width);changed=true;}
      }
      if(changed) {
        const selected=Number(document.querySelector('[data-period][aria-pressed="true"]')?.dataset.period||6);
        updatePeriod(selected);
        cumulativeChart('chart-expense-trend','expense');
        cumulativeChart('chart-income-trend','income');
      }
    });
    targetIds.forEach(id=>{const target=document.getElementById(id);if(target)observer.observe(target);});
  }
})();
