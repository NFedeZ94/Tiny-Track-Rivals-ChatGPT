
(()=>{'use strict';
const vehicles=[{"index":1,"id":"scatto","name":"Scatto GT","availability":"initial","status":"playable","identity":"Hot hatch europea anni Novanta, rossa e squadrata; auto bilanciata","sound":"Quattro cilindri compatto, brillante e pulito"},{"index":2,"id":"tuono","name":"Tuono V8","availability":"initial","status":"playable","identity":"Muscle car dal carattere muscoloso e motore profondo","sound":"V8 basso, profondo e corposo"},{"index":3,"id":"polvere","name":"Polvere X","availability":"initial","status":"playable","identity":"Buggy ruvido, ruote maggiorate e sospensioni visibili","sound":"Buggy ruvido e irregolare"},{"index":4,"id":"lampo","name":"Lampo ZX","availability":"initial","status":"playable","identity":"Sportiva giapponese anni Novanta vivace, verde lime, fari pop-up e alettone","sound":"Sportivo ad alto regime"},{"index":5,"id":"aero","name":"Aero R","availability":"unlockable","status":"playable","identity":"Supercar europea moderna arancione, linee pulite, prese laterali e alettone","sound":"Supercar dal tono crescente e pulito"},{"index":6,"id":"enduro","name":"Enduro SP","availability":"unlockable","status":"playable","identity":"Prototipo racing endurance; rispettare il concept revisionato già approvato","sound":"Racing metallico ad alto regime"},{"index":7,"id":"brezza","name":"Brezza RS","availability":"unlockable","status":"playable","identity":"Roadster leggera; sterzo preciso e risposta pronta","sound":"Leggero, risposta rapida ai giri"},{"index":8,"id":"volt","name":"Volt GX","availability":"unlockable","status":"playable","identity":"Hypercar elettrica raffinata, visivamente distinta da Neon EV","sound":"Elettrico raffinato e lineare"},{"index":9,"id":"roccia","name":"Roccia SUV","availability":"unlockable","status":"playable","identity":"SUV grande, stabile e riconoscibile per volume","sound":"Basso e ovattato"},{"index":10,"id":"martello","name":"Martello PX","availability":"unlockable","status":"playable","identity":"Pickup aggressivo; cassone evidente e massa pronunciata","sound":"Pickup profondo e aggressivo"},{"index":11,"id":"turbovan","name":"Turbo Van","availability":"unlockable","status":"playable","identity":"Van commerciale elaborato, silhouette a scatola","sound":"Commerciale elaborato"},{"index":12,"id":"titan","name":"Titan 4X","availability":"unlockable","status":"playable","identity":"Fuoristrada safari squadrato, tetto in tela e ruota di scorta posteriore","sound":"Fuoristrada grave e meccanico"},{"index":13,"id":"hotflash","name":"Hot Flash","availability":"unlockable","status":"playable","identity":"Hot rod, recuperare la versione originale del concept preferito","sound":"Hot rod V8 irregolare e forte"},{"index":14,"id":"metrocab","name":"Metro Cab","availability":"unlockable","status":"playable","identity":"Taxi retrò, tetto e abitacolo caratteristici","sound":"Retrò e tranquillo"},{"index":15,"id":"interceptor","name":"Interceptor","availability":"unlockable","status":"playable","identity":"Berlina sportiva potente, esplicitamente senza alettone posteriore","sound":"Berlina sportiva, V8"},{"index":16,"id":"retrosprint","name":"Retro Sprint","availability":"unlockable","status":"playable","identity":"Sportiva d’epoca, proporzioni classiche","sound":"Timbro classico e caldo"},{"index":17,"id":"apex","name":"Apex 1","availability":"unlockable","status":"playable","identity":"Monoposto da corsa ad altissimo regime","sound":"Racing ad altissimo regime"},{"index":18,"id":"tempesta","name":"Tempesta RX","availability":"unlockable","status":"playable","identity":"Rally turbo estremo, nervoso e compatto","sound":"Rally turbo con sfoghi di pressione"},{"index":19,"id":"neon","name":"Neon EV","availability":"unlockable","status":"playable","identity":"Elettrica sperimentale; identità viola e luci, nettamente diversa da Volt GX","sound":"Elettrico sperimentale e aggressivo"},{"index":20,"id":"behemoth","name":"Mini Behemoth","availability":"unlockable","status":"playable","identity":"Mini monster truck massiccio, ma competitivo senza vantaggi pay-to-win","sound":"Enorme, basso e ricco di coppia"}];
window.TTRVehicleRoster=Object.freeze(vehicles.map(x=>Object.freeze({...x})));
const $=id=>document.getElementById(id);
const garage=$('garageScreen');if(!garage)return;
const hdr=garage.querySelector('.garage-header');if(!hdr)return;
const open=document.createElement('button');open.id='ttrRosterOpen';open.type='button';open.textContent='▦ COLLEZIONE 5/20';open.setAttribute('aria-label','Apri il catalogo di tutti e venti i veicoli');
hdr.insertBefore(open,hdr.lastElementChild);
function updateGarageCollectionCount(){
 const roster=window.TTRVehicleRoster||[];
 const unlocked=roster.length?roster.filter(v=>v.availability==='initial'||window.TTRCareer?.isUnlocked(v.id)).length:4;
 open.textContent=`▦ COLLEZIONE ${unlocked}/20`;
 open.setAttribute('aria-label',`${unlocked} veicoli sbloccati su 20; apri collezione`);
}
window.TTRUpdateGarageCollectionCount=updateGarageCollectionCount;
updateGarageCollectionCount();
window.addEventListener('ttr:career-progress',updateGarageCollectionCount);

const modal=document.createElement('div');modal.id='ttrRosterModal';modal.hidden=true;modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-label','Collezione dei 20 veicoli');
modal.innerHTML=`<div class="ttr-roster-panel"><div class="ttr-roster-head"><div><strong>COLLEZIONE · 20 VEICOLI</strong><div class="ttr-roster-count">4 INIZIALI · 16 SBLOCCABILI · 20 MODELLI GIOCABILI</div></div><button class="ttr-roster-close" id="ttrRosterClose" aria-label="Chiudi collezione">×</button></div><div class="ttr-roster-tabs" id="ttrRosterTabs"><button class="ttr-roster-tab" data-filter="all" aria-pressed="true">TUTTI 20</button><button class="ttr-roster-tab" data-filter="initial" aria-pressed="false">INIZIALI 4</button><button class="ttr-roster-tab" data-filter="unlockable" aria-pressed="false">SBLOCCABILI 16</button><button class="ttr-roster-tab" data-filter="playable" aria-pressed="false">IN PROVA 8</button></div><div class="ttr-roster-body"><div class="ttr-roster-list" id="ttrRosterList"></div><div class="ttr-roster-detail" id="ttrRosterDetail"></div></div><div class="ttr-roster-footer">I prototipi visivi non sono ancora giocabili. Le ricompense della Carriera restano collegate alle medaglie.</div></div>`;
document.body.appendChild(modal);
let selected='scatto',filter='all';
const rosterImageCache=new Map();
function imageFor(id){
 const assets=window.TTRAssets?.images||{},heavy=['roccia','martello','turbovan','titan','hotflash','metrocab','interceptor','retrosprint','apex','tempesta','behemoth'].includes(id),atlas=heavy?assets[id+'_showroom']:assets[id+'_turntable'];
 if(atlas?.complete&&atlas.naturalWidth>=12&&atlas.naturalHeight>=16){
   if(rosterImageCache.has(id))return rosterImageCache.get(id);
   try{
     // Use the same first orientation as the garage (Tuono V8 included).
     const columns=heavy?1:id==='aero'?24:12,rows=heavy?1:16;
     const fw=Math.floor(atlas.naturalWidth/columns),fh=Math.floor(atlas.naturalHeight/rows);
     const start=window.TTRVehicleVisuals?.TTRShowroomStarts?.[id]??0;
     const sample=document.createElement('canvas');sample.width=fw;sample.height=fh;
     const s=sample.getContext('2d',{willReadFrequently:true});
     s.drawImage(atlas,(start%columns)*fw,Math.floor(start/columns)*fh,fw,fh,0,0,fw,fh);
     const raw=s.getImageData(0,0,fw,fh).data;
     let minX=fw,minY=fh,maxX=-1,maxY=-1;
     for(let y=0;y<fh;y++)for(let x=0;x<fw;x++){
       if(raw[(y*fw+x)*4+3]<16)continue;
       if(x<minX)minX=x;if(x>maxX)maxX=x;
       if(y<minY)minY=y;if(y>maxY)maxY=y;
     }
     if(maxX<minX||maxY<minY)throw new Error('Turntable frame is transparent');
     const pad=Math.max(2,Math.round(Math.min(fw,fh)*.012));
     minX=Math.max(0,minX-pad);minY=Math.max(0,minY-pad);
     maxX=Math.min(fw-1,maxX+pad);maxY=Math.min(fh-1,maxY+pad);
     const bw=maxX-minX+1,bh=maxY-minY+1;
     const out=document.createElement('canvas');out.width=480;out.height=260;
     const g=out.getContext('2d');g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
     const relative=window.TTRVehiclePresentationSize?.(id)??1;
     const size=window.TTRVehiclePreviewScale?.(id,out.width,out.height,'collection')??Math.min(out.width*.73*relative/bw,out.height*.80*relative/bh,out.width*.88/bw,out.height*.89/bh);
     const dw=bw*size,dh=bh*size;
     // Preserve the source proportions; centre the opaque 3D model on a uniform canvas.
     g.drawImage(sample,minX,minY,bw,bh,(out.width-dw)/2,(out.height-dh)/2,dw,dh);
     const url=out.toDataURL('image/png');rosterImageCache.set(id,url);return url;
   }catch(err){console.warn('Roster preview fallback:',id,err);}
 }
 const poster=assets[id+'_showroom']||assets[id];return poster?.src||'';
}
window.TTRVehicleThumbnail=imageFor;
function status(v){if(v.status==='preview')return 'PROTOTIPO VISIVO · NON GIOCABILE';if(v.index<=4)return 'INIZIALE · GIOCABILE';const won=window.TTRCareer?.isUnlocked(v.id);return v.status==='playable'?(won?'SBLOCCATO · GIOCABILE':'SBLOCCABILE · DISPONIBILE IN PROVA'):(won?'MISSIONE COMPLETATA · MODELLO IN SVILUPPO':'SBLOCCABILE · MODELLO IN SVILUPPO');}
function filtered(){return vehicles.filter(v=>filter==='all'||(filter==='initial'&&v.availability==='initial')||(filter==='unlockable'&&v.availability==='unlockable')||(filter==='playable'&&v.status==='playable'));}
function paint(){
 const listing=$('ttrRosterList');listing.replaceChildren();
 for(const v of filtered()){
   const btn=document.createElement('button');btn.type='button';btn.className='ttr-roster-card'+(v.id===selected?' active':'');btn.dataset.vehicle=v.id;btn.setAttribute('aria-label',v.name+', '+status(v));
   const src=['playable','preview'].includes(v.status)?imageFor(v.id):'';
   if(src){const img=document.createElement('img');img.src=src;img.alt='';btn.appendChild(img);}else{const icon=document.createElement('span');icon.className='ttr-roster-placeholder';icon.classList.add('ttr-v69-upcoming');icon.setAttribute('aria-hidden','true');btn.appendChild(icon);}
   const label=document.createElement('span');label.className='nameblock';
   const nm=document.createElement('b');nm.textContent=String(v.index).padStart(2,'0')+' · '+v.name;
   const sub=document.createElement('small');sub.textContent=v.index<=4?'GIOCABILE':v.status==='playable'?'IN PROVA':v.status==='preview'?'PROTOTIPO':'DA MODELLARE';
   label.appendChild(nm);label.appendChild(sub);btn.appendChild(label);
   btn.onclick=()=>{selected=v.id;paint();};listing.appendChild(btn);
 }
 const v=vehicles.find(x=>x.id===selected)||filtered()[0];if(!v)return;
 const det=$('ttrRosterDetail');det.replaceChildren();
 const title=document.createElement('h3');title.textContent=v.name;det.appendChild(title);
 const st=document.createElement('div');st.className='ttr-roster-status';st.textContent=status(v);det.appendChild(st);
 const src=['playable','preview'].includes(v.status)?imageFor(v.id):'';
 if(src){const img=document.createElement('img');img.className='ttr-roster-img';img.src=src;img.alt='Modello 3D di '+v.name;if(v.id!=='neon')det.appendChild(img);if(v.id==='neon'){const c=document.createElement('canvas');c.width=480;c.height=260;c.setAttribute('aria-label','Rotazione Neon EV');c.style.cssText='width:100%;max-height:160px;object-fit:contain';det.appendChild(c);const start=performance.now();const tick=()=>{if(!c.isConnected||modal.hidden)return;window.TTRVehicleVisuals?.drawShowroom(c,0,'garage',(performance.now()-start)/1000,0,[{id:v.id}]);requestAnimationFrame(tick);};requestAnimationFrame(tick);}}
 const desc=document.createElement('p');desc.textContent=v.identity;det.appendChild(desc);
 const engine=document.createElement('p');engine.className='ttr-roster-muted';engine.textContent='Motore: '+v.sound;det.appendChild(engine);
 const vals=window.TTRVehicleDesignStats?.[v.id];
 if(vals){
  const provenance=document.createElement('p');provenance.className='ttr-roster-muted';provenance.textContent=['scatto','tuono','polvere','apex','tempesta','neon','behemoth'].includes(v.id)?'STATISTICHE · SCHEDA STORICA RECUPERATA':'STATISTICHE · VALORI DA VERIFICARE (NON DEFINITIVI)';det.appendChild(provenance);
  const statBox=document.createElement('div');statBox.className='ttr-roster-design-stats';
  ['Velocità','Accelerazione','Sterzo','Grip','Impatto','Stabilità'].forEach((label,i)=>{
   const line=document.createElement('div');line.className='ttr-roster-design-row';
   const lab=document.createElement('span');lab.textContent=label;
   const rail=document.createElement('span');rail.className='ttr-roster-design-rail';rail.setAttribute('role','meter');rail.setAttribute('aria-label',label);rail.setAttribute('aria-valuemin','0');rail.setAttribute('aria-valuemax','10');rail.setAttribute('aria-valuenow',String(vals[i]));
   for(let n=0;n<10;n++){const seg=document.createElement('i');if(n<vals[i])seg.className='filled';rail.appendChild(seg);}
   const value=document.createElement('b');value.textContent=vals[i]+'/10';line.append(lab,rail,value);statBox.appendChild(line);
  });det.appendChild(statBox);
 }

 const progress=document.createElement('p');progress.className='ttr-roster-plan';progress.textContent='Skin: base + 3 slot previsti · Missioni attive in Carriera';det.appendChild(progress);
 if(v.status!=='playable'){const warn=document.createElement('p');warn.className='ttr-roster-muted';warn.textContent='Il modello, le prestazioni e lo sblocco saranno verificati prima di rendere il veicolo giocabile.';det.appendChild(warn);}
}
function setCollectionVisible(visible){modal.hidden=!visible;document.body.classList.toggle('ttr-roster-open',visible);}
open.onclick=()=>{filter='all';selected='scatto';setCollectionVisible(true);document.querySelectorAll('.ttr-roster-tab').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===filter)));paint();};
$('ttrRosterClose').onclick=()=>setCollectionVisible(false);
modal.addEventListener('click',e=>{if(e.target===modal)setCollectionVisible(false);});
modal.querySelectorAll('.ttr-roster-tab').forEach(b=>b.onclick=()=>{filter=b.dataset.filter;const first=filtered()[0];if(!filtered().some(x=>x.id===selected))selected=first.id;modal.querySelectorAll('.ttr-roster-tab').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));paint();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden)setCollectionVisible(false);});
window.TTRAssets?.ready?.then(()=>{rosterImageCache.clear();if(!modal.hidden)paint();});
})();
