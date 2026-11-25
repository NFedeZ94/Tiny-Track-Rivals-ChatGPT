
/* Career screen, iPhone-friendly and save-local. Multiplayer server unchanged. */
(()=>{'use strict';
 const C=window.TTRCareerCore,roster=window.TTRVehicleRoster||[], $=id=>document.getElementById(id);
 if(!C||!roster.length||!$('careerScreen'))return;
 let state;let storageOK=true;
 try{state=C.normalize(JSON.parse(localStorage.getItem(C.STORAGE_KEY)||'null'));}catch(e){state=C.fresh();storageOK=false;}
 const byId=Object.fromEntries(roster.map(v=>[v.id,v]));
 const available=()=>roster.filter(v=>v.status==='playable'&&(v.availability==='initial'||C.earned(state).includes(v.id)));
 const label=(it,en,es)=>({it,en,es})[window.TTRI18N?.getLang?.()||'it']||it;
 const escapeHTML=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function status(q){
   const v=byId[q.car],done=C.complete(state,q);
   if(!done)return label('DA SBLOCCARE','TO UNLOCK','POR DESBLOQUEAR');
   return v?.status==='playable'?label('SBLOCCATA · GIOCABILE','UNLOCKED · PLAYABLE','DESBLOQUEADO · JUGABLE'):label('MISSIONE COMPLETATA · MODELLO IN SVILUPPO','MISSION DONE · MODEL IN DEVELOPMENT','MISIÓN HECHA · MODELO EN DESARROLLO');
 }
 function render(){
   const unlocked=C.earned(state).length;
   $('careerOwned').textContent=`${4+unlocked} / 20`;
   $('careerWins').textContent=String(state.wins);
   $('careerFinishes').textContent=String(state.finishes);
   $('careerSaveNote').textContent=storageOK?label('Progressi salvati su questo dispositivo. Non sincronizzati online.','Saved on this device only. Not synced online.','Guardado en este dispositivo. No sincronizado en línea.'):
     label('Memoria locale non disponibile: i progressi si perderanno chiudendo la pagina.','Local storage unavailable: progress will not persist.','Almacenamiento local no disponible: el progreso no se conservará.');
   const select=$('careerVehicle'),old=select.value;
   select.replaceChildren();available().forEach(v=>{const op=document.createElement('option');op.value=v.id;op.textContent=v.name;select.appendChild(op);});
   if([...select.options].some(o=>o.value===old))select.value=old;
   else {let selectedIndex=0;try{selectedIndex=Number(localStorage.getItem('ttr_selected_car'))||0}catch(e){}const saved=window.TTRCore?.profiles[selectedIndex]?.id;select.value=[...select.options].some(o=>o.value===saved)?saved:'scatto';}
   const items=C.quests(state),byProgress=(x,y)=>((y.progress/y.target)-(x.progress/x.target));
   const grid=$('careerMissionList'),upcoming=$('careerNextList');grid.replaceChildren();upcoming.replaceChildren();
   function makeCard(q){const done=q.progress>=q.target,v=q.car?byId[q.car]:null,article=document.createElement('article');article.className='career-mission'+(done?' is-done':'');const icon=document.createElement('div');icon.className='career-mission-icon';if(done){icon.textContent='🏅';}else{icon.classList.add('ttr-v69-upcoming');icon.setAttribute('aria-hidden','true');}article.appendChild(icon);const body=document.createElement('div');body.className='career-mission-body';const top=document.createElement('div');top.className='career-mission-top';const title=document.createElement('b');title.textContent=q.title;const progress=document.createElement('strong');progress.textContent=q.progress+'/'+q.target;top.append(title,progress);const desc=document.createElement('div');desc.className='career-mission-desc';desc.textContent=q.desc+(v?' · Premio: '+v.name:'');const meter=document.createElement('div');meter.className='career-meter';meter.setAttribute('role','progressbar');meter.setAttribute('aria-valuenow',q.progress);meter.setAttribute('aria-valuemax',q.target);const fill=document.createElement('span');fill.style.width=(100*q.progress/q.target)+'%';meter.append(fill);const status=document.createElement('div');status.className='career-state';status.textContent=done?'✓ COMPLETATA':q.available?'IN CORSO':'IN ATTESA DEL CIRCUITO';body.append(top,desc,meter,status);article.append(body);return article;}
   items.forEach(q=>grid.append(makeCard(q)));
   items.filter(q=>q.available&&q.progress<q.target).sort(byProgress).slice(0,3).forEach(q=>upcoming.append(makeCard(q)));
   if(!upcoming.children.length){const msg=document.createElement('div');msg.className='career-mission';msg.textContent='Hai completato tutti gli obiettivi attualmente disponibili.';upcoming.append(msg);}
   const m=C.medalCount(state);$('careerWins').textContent=m+' / 36';$('careerWins').nextElementSibling.textContent='MEDAGLIE';

 }
 function open(){
   $('screen').hidden=true;$('screen').style.display='none';$('garageScreen').hidden=true;$('languageScreen').hidden=true;
   $('careerMissionsScreen').hidden=true;$('careerScreen').hidden=false;render();
 }
 function close(){ $('careerScreen').hidden=true;$('careerMissionsScreen').hidden=true;window.dispatchEvent(new CustomEvent('ttr:career-close')); }
 function start(){
   const v=byId[$('careerVehicle').value];if(!v||v.status!=='playable')return;
   if(v.availability!=='initial'&&!C.earned(state).includes(v.id))return;
   window.dispatchEvent(new CustomEvent('ttr:career-start',{detail:{carId:v.id,vehicleIndex:window.TTRCore.profiles.findIndex(p=>p.id===v.id)}}));
 }
 function recordResult(rec){
   const out=C.applyResult(state,rec);if(!out.accepted)return {accepted:false,newUnlocks:[]};
   state=out.state;
   try{localStorage.setItem(C.STORAGE_KEY,JSON.stringify(state));storageOK=true;}catch(e){storageOK=false;}
   return out;
 }
 $('careerAllMissions').addEventListener('click',()=>{$('careerScreen').hidden=true;$('careerMissionsScreen').hidden=false;});$('careerMissionsBack').addEventListener('click',()=>{$('careerMissionsScreen').hidden=true;$('careerScreen').hidden=false;});
 $('careerPlay').addEventListener('click',start);
 $('careerBack').addEventListener('click',close);
 window.addEventListener('ttr:race-finished',e=>recordResult(e.detail));
 window.TTRCareer={open,close,render,recordResult,getState:()=>C.normalize(state),isUnlocked:id=>['scatto','tuono','polvere','lampo'].includes(id)||C.earned(state).includes(id)};
})();

