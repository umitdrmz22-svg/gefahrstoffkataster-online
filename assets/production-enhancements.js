'use strict';
(function(){
  const cfg=window.APP_CONFIG||{};
  if(!cfg.supabaseUrl||!cfg.supabasePublishableKey||!window.supabase?.createClient)return;
  const sb=window.supabase.createClient(cfg.supabaseUrl,cfg.supabasePublishableKey);
  const BA_URL=cfg.baAppUrl||'https://umitdrmz22-svg.github.io/ba-generator/';
  const DMS_URL='https://umitdrmz22-svg.github.io/dokumentmanagement-studio/';

  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  const defaults={
    riskStatus:'offen',
    baStatus:'offen',
    substitutionStatus:'offen',
    authorizationStatus:'nicht relevant',
    recordStatus:'active',
    sdsReviewMonths:'24',
    sdsLanguage:'Deutsch'
  };

  function applyFormDefaults(){
    for(const [id,value] of Object.entries(defaults)){
      const el=document.getElementById(id);
      if(el&&!el.value)el.value=value;
    }
  }

  function installStyles(){
    if($('#productionEnhancementStyles'))return;
    const style=document.createElement('style');
    style.id='productionEnhancementStyles';
    style.textContent=`
      .prod-panel{background:#fff;border:1px solid #d8e1e4;border-radius:14px;padding:20px;margin-top:16px;box-shadow:0 4px 16px rgba(23,52,61,.04)}
      .prod-panel.hidden{display:none!important}.prod-panel h2{margin:0 0 6px;font-size:20px}.prod-panel>p{margin:0 0 18px;color:#657b82}
      .prod-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}.prod-card{border:1px solid #e0e7e9;border-radius:12px;padding:14px;background:#fbfcfc}.prod-card small{display:block;color:#657b82;margin-bottom:5px}.prod-card strong{display:block;word-break:break-word}
      .prod-table-wrap{overflow:auto;border:1px solid #e0e7e9;border-radius:12px}.prod-table{width:100%;border-collapse:collapse;min-width:900px}.prod-table th,.prod-table td{text-align:left;padding:11px 12px;border-bottom:1px solid #edf1f2;vertical-align:top}.prod-table th{font-size:12px;color:#657b82;background:#f7f9fa}.prod-table tr:last-child td{border-bottom:0}
      .prod-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px}.prod-link{display:inline-flex;align-items:center;justify-content:center;padding:9px 12px;border-radius:8px;text-decoration:none;border:1px solid #cbd7da;color:#17343d;background:#fff;font-weight:700}.prod-link.primary{background:#008562;border-color:#008562;color:#fff}
      .prod-status{display:inline-block;padding:4px 7px;border-radius:999px;font-size:12px;font-weight:700;background:#eef3f4}.prod-status.warn{background:#fff5d6;color:#795b00}.prod-status.bad{background:#fde9e7;color:#9b2c22}.prod-status.ok{background:#e5f5ef;color:#17694f}
    `;
    document.head.appendChild(style);
  }

  async function context(){
    const {data:{session}}=await sb.auth.getSession();
    if(!session)return {session:null,membership:null,records:[]};
    const {data:membership,error:mErr}=await sb.from('organization_members').select('organization_id,role,organizations(name)').eq('user_id',session.user.id).eq('status','active').limit(1).maybeSingle();
    if(mErr)throw mErr;
    if(!membership)return {session,membership:null,records:[]};
    const {data:records,error:rErr}=await sb.from('hazardous_substances').select('*').eq('organization_id',membership.organization_id).order('inventory_number');
    if(rErr)throw rErr;
    return {session,membership,records:records||[]};
  }

  function panel(){
    let el=$('#productionViewPanel');
    if(el)return el;
    el=document.createElement('section');
    el.id='productionViewPanel';
    el.className='prod-panel hidden';
    const content=$('.content');
    const pageHead=$('.page-head');
    if(content&&pageHead)pageHead.insertAdjacentElement('afterend',el);
    return el;
  }

  function setNativeVisible(visible){
    $$('.metrics,.toolbar,.table-card').forEach(el=>el.classList.toggle('hidden',!visible));
    const newBtn=$('#newSubstance');
    if(newBtn)newBtn.classList.toggle('hidden',!visible);
    panel().classList.toggle('hidden',visible);
  }

  function activateNav(view){
    $$('.nav-item[data-view]').forEach(btn=>btn.classList.toggle('active',btn.dataset.view===view));
  }

  function setHeading(title,description){
    const head=$('.page-head');
    if(!head)return;
    const h1=head.querySelector('h1');
    const p=head.querySelector('div>p:last-child');
    if(h1)h1.textContent=title;
    if(p)p.textContent=description;
  }

  function reviewClass(value,type){
    if(type==='risk')return value==='aktuell'?'ok':'warn';
    if(type==='ba')return ['freigegeben','nicht erforderlich'].includes(value)?'ok':'warn';
    if(type==='sub')return ['kein geeigneter Ersatz','nicht erforderlich','Ersatz möglich'].includes(value)?'ok':'warn';
    if(type==='auth')return ['nicht relevant'].includes(value)?'ok':value==='zu prüfen'?'warn':'bad';
    return 'warn';
  }

  function sdsDue(r){
    const base=r.sds_verified_at||r.sds_date;
    if(!base)return true;
    const due=new Date(base);
    due.setMonth(due.getMonth()+Number(r.sds_review_months||24));
    return due<new Date();
  }

  async function showReview(){
    setNativeVisible(false);activateNav('review');setHeading('Prüfstatus','Offene und fällige Prüfungen aus SDB, GBU, Betriebsanweisung, Substitution und Zulassung/Beschränkung.');
    const el=panel();
    el.innerHTML='<h2>Prüfstatus</h2><p>Daten werden geladen …</p>';
    try{
      const {session,records}=await context();
      if(!session){el.innerHTML='<h2>Prüfstatus</h2><p>Bitte zuerst anmelden.</p>';return;}
      const rows=records.map(r=>`<tr><td><strong>${esc(r.inventory_number)}</strong><br><small>${esc(r.product_name)}</small></td><td><span class="prod-status ${sdsDue(r)?'bad':'ok'}">${sdsDue(r)?'fällig':'aktuell'}</span></td><td><span class="prod-status ${reviewClass(r.risk_assessment_status,'risk')}">${esc(r.risk_assessment_status)}</span></td><td><span class="prod-status ${reviewClass(r.operating_instruction_status,'ba')}">${esc(r.operating_instruction_status)}</span></td><td><span class="prod-status ${reviewClass(r.substitution_status,'sub')}">${esc(r.substitution_status)}</span></td><td><span class="prod-status ${reviewClass(r.authorization_status,'auth')}">${esc(r.authorization_status||'zu prüfen')}</span></td><td><button class="btn ghost" type="button" data-open-record="${esc(r.inventory_number)}">Im Kataster öffnen</button></td></tr>`).join('');
      el.innerHTML=`<h2>Prüfstatus</h2><p>${records.length} Gefahrstoffeinträge werden organisationsbezogen geprüft.</p><div class="prod-table-wrap"><table class="prod-table"><thead><tr><th>Gefahrstoff</th><th>SDB</th><th>GBU</th><th>BA</th><th>Substitution</th><th>Zulassung/Beschränkung</th><th></th></tr></thead><tbody>${rows||'<tr><td colspan="7">Keine Einträge vorhanden.</td></tr>'}</tbody></table></div>`;
    }catch(err){el.innerHTML=`<h2>Prüfstatus</h2><p>${esc(err.message||err)}</p>`;}
  }

  async function showMasterData(){
    setNativeVisible(false);activateNav('settings');setHeading('Stammdaten','Organisation, Benutzerrolle, Datenhaltung und angebundene EHS-Module.');
    const el=panel();
    el.innerHTML='<h2>Stammdaten</h2><p>Daten werden geladen …</p>';
    try{
      const {session,membership,records}=await context();
      if(!session){el.innerHTML='<h2>Stammdaten</h2><p>Bitte zuerst anmelden.</p>';return;}
      el.innerHTML=`<h2>Stammdaten</h2><p>Diese Angaben werden aus dem gemeinsamen EHS-Management-Studio-Konto gelesen.</p><div class="prod-grid"><div class="prod-card"><small>Organisation</small><strong>${esc(membership?.organizations?.name||'—')}</strong></div><div class="prod-card"><small>Benutzer</small><strong>${esc(session.user.email||'—')}</strong></div><div class="prod-card"><small>Rolle</small><strong>${esc(membership?.role||'—')}</strong></div><div class="prod-card"><small>Gefahrstoffeinträge</small><strong>${records.length}</strong></div><div class="prod-card"><small>Standard SDB-Prüfintervall</small><strong>24 Monate</strong></div><div class="prod-card"><small>Datenhaltung</small><strong>Supabase · organisationsbezogen</strong></div></div><div class="prod-actions"><a class="prod-link primary" href="${esc(BA_URL)}" target="_blank" rel="noopener">BA Studio öffnen</a><a class="prod-link" href="${esc(DMS_URL)}" target="_blank" rel="noopener">Dokumentenmanagement öffnen</a></div>`;
    }catch(err){el.innerHTML=`<h2>Stammdaten</h2><p>${esc(err.message||err)}</p>`;}
  }

  function showRegister(){
    setNativeVisible(true);activateNav('register');setHeading('Gefahrstoffkataster','Stoffe und Gemische online verwalten, Prüfstände erkennen und SDB, GBU, BA sowie Substitutionsprüfung zusammenführen.');
  }

  function showView(view){
    if(view==='review')return showReview();
    if(view==='settings')return showMasterData();
    showRegister();
  }

  function injectBaLink(){
    const dialog=$('#detailDialog');
    if(!dialog?.open)return;
    const actions=dialog.querySelector('.dialog-actions');
    if(!actions||$('#baStudioRecordLink',actions))return;
    const title=$('#detailTitle')?.textContent||'';
    const [inventory,product]=title.split(' · ');
    const a=document.createElement('a');
    a.id='baStudioRecordLink';
    a.className='btn ghost';
    a.target='_blank';a.rel='noopener';
    const url=new URL(BA_URL,location.href);
    url.searchParams.set('source','gefahrstoffkataster');
    if(inventory)url.searchParams.set('kataster',inventory);
    if(product)url.searchParams.set('produkt',product);
    a.href=url.toString();
    a.textContent='BA Studio öffnen';
    actions.insertBefore(a,actions.lastElementChild||null);
  }

  document.addEventListener('click',event=>{
    const nav=event.target.closest('.nav-item[data-view]');
    if(nav){event.preventDefault();showView(nav.dataset.view);return;}
    if(event.target.closest('#newSubstance'))setTimeout(applyFormDefaults,0);
    const open=event.target.closest('[data-open-record]');
    if(open){
      showRegister();
      const input=$('#searchInput');
      if(input){input.value=open.dataset.openRecord;input.dispatchEvent(new Event('input',{bubbles:true}));}
      return;
    }
    if(event.target.closest('#substanceRows [data-id],#substanceRows [data-edit]'))setTimeout(injectBaLink,0);
  });

  document.addEventListener('submit',event=>{
    if(event.target?.id==='substanceForm')applyFormDefaults();
  },true);

  document.addEventListener('DOMContentLoaded',()=>{
    installStyles();
    applyFormDefaults();
    const first=$('.nav-item[data-view="register"]');
    if(first)first.classList.add('active');
  },{once:true});
})();
