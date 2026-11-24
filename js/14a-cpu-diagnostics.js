/* Tiny Track Rivals - Fase 14.1C. Solo diagnostica, nessuna modifica gameplay. */
(()=>{'use strict';
let current=null, baseline=new Map(), lastStamp=0, panel=null, toggle=null, visible=false, lastRows=[];
const fmt=n=>Number.isFinite(Number(n))?Number(n).toFixed(1):'—';
function create(){
 if(panel)return;
 panel=document.createElement('div');panel.id='ttrCpuDiag';
 Object.assign(panel.style,{position:'fixed',top:'54px',left:'8px',zIndex:'99999',background:'rgba(8,18,30,.93)',color:'#fff',font:'12px system-ui',padding:'9px',border:'1px solid #78b6d4',borderRadius:'8px',maxWidth:'min(94vw,480px)',maxHeight:'65vh',overflow:'auto',display:'none',pointerEvents:'auto'});
 panel.innerHTML='<strong>CPU DIAGNOSTICA 14.1C</strong><div id="ttrCpuDiagRows"></div><button type="button" id="ttrCpuDiagCopy" style="margin-top:6px;padding:6px">COPIA REPORT</button>';
 document.body.appendChild(panel);
 panel.querySelector('#ttrCpuDiagCopy').onclick=()=>{
  const report='TTR 14.1C - CPU\n'+lastRows.join('\n');
  if(navigator.clipboard?.writeText)navigator.clipboard.writeText(report).then(()=>{panel.querySelector('#ttrCpuDiagCopy').textContent='COPIATO';}).catch(()=>window.prompt('Copia questo report:',report));
  else window.prompt('Copia questo report:',report);
 };
 toggle=document.createElement('button');toggle.type='button';toggle.textContent='CPU TEST';
 Object.assign(toggle.style,{position:'fixed',top:'8px',left:'8px',zIndex:'99999',padding:'5px 8px',background:'#123449',color:'#fff',border:'1px solid #78b6d4',borderRadius:'6px',font:'bold 11px system-ui'});
 toggle.onclick=()=>{visible=!visible;panel.style.display=visible?'block':'none';};
 document.body.appendChild(toggle);
}
function sample(race){
 if(!race||race.mode!=='career'){if(panel){panel.style.display='none';toggle.style.display='none';}return;}
 create();toggle.style.display='block';panel.style.display=visible?'block':'none';
 if(current!==race){current=race;baseline=new Map();lastStamp=0;lastRows=[];}
 const now=performance.now();if(now-lastStamp<450&&!race.finished)return;lastStamp=now;
 const cars=race.cars.filter(c=>c!==race.player);
 lastRows=cars.map(c=>{
  if(!baseline.has(c.id))baseline.set(c.id,c.shortcutRespawns||0);
  const resp=(c.shortcutRespawns||0)-baseline.get(c.id);
  const lap=Math.max(0,c.lapsCompleted||0);
  const phase=((Number(c.p)||0)%1+1)%1;
  return `${c.profile?.name||'CPU'} #${c.id} | giro ${c.done?'FINITO':Math.min(3,lap+1)+'/3'} | pista ${(phase*100).toFixed(0)}% | velocità ${fmt(c.speed)} | recuperi ${resp} | blocco ${fmt(c.stuckTime)}s | ${c.done?'ARRIVATA':'IN GARA'}`;
 });
 const rows=panel.querySelector('#ttrCpuDiagRows');
 rows.replaceChildren(...lastRows.map(line=>{const div=document.createElement('div');div.textContent=line;div.style.marginTop='7px';return div;}));
}
window.TTRCPUDiagnostics=Object.freeze({sample});
})();
