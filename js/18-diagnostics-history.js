/* TTR diagnostic history: local only, bounded and independent of simulation. */
(()=>{'use strict';
const KEY='ttr_diagnostic_history_v1',LIMIT=20,BUDGET=1800000;
function create(storage){
 let entries=[],persistent=true,trimmed=0;
 try{const saved=JSON.parse(storage?.getItem(KEY)||'null');if(Array.isArray(saved?.entries))entries=saved.entries.filter(e=>e?.report?.wholeRace?.frames>0).slice(0,LIMIT);trimmed=Math.max(0,Number(saved?.trimmed)||0);if(!storage)persistent=false;}catch(_){persistent=false;}
 const serialize=()=>JSON.stringify({entries,trimmed});
 function persist(){if(!storage){persistent=false;return;}try{storage.setItem(KEY,serialize());persistent=true;}catch(_){persistent=false;}}
 function add(report){if(!report?.wholeRace?.frames)return false;
  const entry={savedAt:new Date().toISOString(),report:JSON.parse(JSON.stringify(report))};entries.unshift(entry);
  while(entries.length>LIMIT){entries.pop();trimmed++;}
  // Keep the newest report intact even if it alone exceeds the storage budget.
  while(entries.length>1&&serialize().length>BUDGET){entries.pop();trimmed++;}
  persist();return true;
 }
 function summary(){const groups=new Map();for(const {report:r} of entries){const k=JSON.stringify([r.trackId,r.raceMode,r.difficulty,r.build,r.diagnosticCoverage]);let g=groups.get(k);if(!g){g={trackId:r.trackId,raceMode:r.raceMode,difficulty:r.difficulty,build:r.build,diagnosticCoverage:r.diagnosticCoverage,completedRaces:0,recoveryReasons:{},bestPlayerLap:null,bestCpuLap:null};groups.set(k,g);}g.completedRaces++;for(const e of r.recoveries||[]){const reason=e.reason||'unknown';g.recoveryReasons[reason]=(g.recoveryReasons[reason]||0)+1;}for(const c of r.cars||[]){const field=c.id===(r.playerId??0)?'bestPlayerLap':'bestCpuLap';for(const t of c.lapTimes||[])if(Number.isFinite(t)&&t>0)g[field]=g[field]==null?t:Math.min(t,g[field]);}}return [...groups.values()];}
 function snapshot(){return JSON.parse(JSON.stringify({schema:'ttr-diagnostic-history-v1',limit:LIMIT,trimmed,persistent,summary:summary(),races:entries}));}
 function clear(){entries=[];trimmed=0;try{storage?.removeItem(KEY);persistent=!!storage;}catch(_){persistent=false;}return status();}
 function status(){return {count:entries.length,limit:LIMIT,trimmed,persistent};}
 return Object.freeze({add,snapshot,clear,status});
}
window.TTRDiagnosticHistory=Object.freeze({create});
})();
