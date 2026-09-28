'use strict';
(function(){
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  function ready(){
    const badge=$('#connectionBadge');
    if(badge){badge.textContent='BGN Demo · lokal';badge.className='badge demo';}
    const org=$('#orgName');if(org)org.textContent='Musterwerk Lebensmittel GmbH';
    const user=$('#userLabel');if(user)user.textContent='Präsentationsdaten · nur dieses Gerät';
    const auth=$('#authButton');if(auth)auth.classList.add('hidden');
    const logout=$('#logoutButton');if(logout)logout.classList.add('hidden');
    const note=document.createElement('div');
    note.className='demo-notice';
    note.setAttribute('role','status');
    note.innerHTML='<strong>Präsentationsmodus</strong><span>Alle Einträge sind fiktive lokale Beispieldaten. Es werden keine Unternehmens- oder Personendaten an ein Backend übertragen.</span><button type="button" id="resetDemoData" class="btn ghost">Demo zurücksetzen</button>';
    const content=$('.content');if(content)content.prepend(note);
    $('#resetDemoData')?.addEventListener('click',()=>{
      localStorage.removeItem('gefahrstoffkataster-demo-v1');
      location.reload();
    });
    $$('.nav-item[data-view="review"],.nav-item[data-view="settings"]').forEach(btn=>{
      btn.addEventListener('click',e=>{
        e.preventDefault();
        const review=btn.dataset.view==='review';
        const input=$('#filterReview');
        const search=$('#searchInput');
        if(search)search.value='';
        if(input)input.value=review?'gbu_open':'';
        input?.dispatchEvent(new Event('change',{bubbles:true}));
        $$('.nav-item[data-view]').forEach(x=>x.classList.toggle('active',x===btn));
      });
    });
    const style=document.createElement('style');
    style.textContent='.demo-notice{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:0 0 18px;padding:12px 14px;border:1px solid #efd27b;border-radius:10px;background:#fff8df;color:#5d4a00}.demo-notice strong{font-size:12px;text-transform:uppercase;letter-spacing:.08em}.demo-notice span{flex:1;min-width:240px}.demo-notice .btn{padding:7px 10px}@media(max-width:620px){.demo-notice{align-items:flex-start}.demo-notice .btn{width:100%}}';
    document.head.appendChild(style);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
})();