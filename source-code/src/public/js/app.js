document.addEventListener('DOMContentLoaded',()=>{
  const sidebar=document.querySelector('#sidebar');
  document.querySelector('[data-sidebar-toggle]')?.addEventListener('click',()=>sidebar?.classList.toggle('open'));
  document.querySelectorAll('[data-dismiss-alert]').forEach(button=>button.addEventListener('click',()=>button.closest('.alert')?.remove()));
  document.querySelectorAll('form[data-confirm]').forEach(form=>form.addEventListener('submit',event=>{if(!window.confirm(form.dataset.confirm||'Bạn có chắc chắn?'))event.preventDefault();}));
  const amount=document.querySelector('#amount');amount?.addEventListener('blur',()=>{if(Number(amount.value)<0)amount.value='';});
  const typeInputs=document.querySelectorAll('input[name="type"]');const category=document.querySelector('#category_id');
  function filterCategories(){if(!category)return;const type=document.querySelector('input[name="type"]:checked')?.value;let selectedVisible=false;for(const option of category.options){if(!option.value){option.hidden=false;continue;}const visible=option.dataset.type===type;option.hidden=!visible;if(option.selected&&visible)selectedVisible=true;}if(!selectedVisible)category.value='';}
  typeInputs.forEach(input=>input.addEventListener('change',filterCategories));filterCategories();
});
