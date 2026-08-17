'use strict';

let ehsOriginWerkId='';
let ehsOriginWerkName='';

async function resolveGefahrstoffWerk(){
  const access=await waitForEhsAccess();
  const werk=access?.selectedWerk||(Array.isArray(access?.works)&&access.works.length===1?access.works[0]:null);
  if(!werk?.id)throw new Error('Bitte Gefahrstoffkataster über das EHS-Dashboard öffnen und ein Werk auswählen.');
  ehsOriginWerkId=String(werk.id);
  ehsOriginWerkName=String(werk.name||werk.code||'Werk');
  return werk;
}

loadOrganization=async function(){
  if(!session){organization=null;return null;}
  let werk;
  try{werk=await resolveGefahrstoffWerk();}
  catch(error){organization=null;notify(error.message);return null;}
  let query=sb.from('organization_members')
    .select('organization_id,role,organizations(name)')
    .eq('user_id',session.user.id)
    .eq('status','active');
  if(werk.organizationId)query=query.eq('organization_id',werk.organizationId);
  else query=query.limit(1);
  const {data,error}=await query.maybeSingle();
  if(error){console.error(error);notify(error.message);organization=null;return null;}
  organization=data||null;
  const orgName=data?.organizations?.name||'Organisation';
  $('#orgName').textContent=organization?`${ehsOriginWerkName} · ${orgName}`:'Organisation';
  return organization;
};

loadRecords=async function(){
  if(!session){records=[];render();return;}
  if(!organization||!ehsOriginWerkId)await loadOrganization();
  if(!organization||!ehsOriginWerkId){records=[];render();return;}
  const {data,error}=await sb.from('hazardous_substances')
    .select('*')
    .eq('organization_id',organization.organization_id)
    .eq('origin_werk_id',ehsOriginWerkId)
    .order('inventory_number');
  if(error){notify(error.message);records=[];render();return;}
  records=data||[];
  render();
};

const baseGefahrstoffFormPayload=formPayload;
formPayload=function(){
  return {...baseGefahrstoffFormPayload(),origin_werk_id:ehsOriginWerkId};
};

archiveRecord=async function(){
  const id=$('#recordId').value;
  if(!id)return;
  if(hasCloud){
    if(!session||!organization||!ehsOriginWerkId)return $('#formMessage').textContent='Bitte über das EHS-Dashboard ein Werk öffnen.';
    const {error}=await sb.from('hazardous_substances')
      .update({status:'archived',updated_by:session.user.id})
      .eq('id',id)
      .eq('organization_id',organization.organization_id)
      .eq('origin_werk_id',ehsOriginWerkId);
    if(error)return $('#formMessage').textContent=error.message;
    await loadRecords();
  }else{
    const r=records.find(x=>x.id===id);
    if(r){r.status='archived';saveDemo();render();}
  }
  $('#substanceDialog').close();
};
