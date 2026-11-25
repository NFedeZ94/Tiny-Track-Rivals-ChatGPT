
/* Career medals v2: 12 circuits x Race / Challenge / Mastery. */
(function(root){'use strict';
const VERSION=2,STORAGE_KEY='ttr_career_medals_v2';
const trackNames=['Colazione Turbo','Box di Biliardo',...Array.from({length:10},(_,i)=>'Circuito '+String(i+3).padStart(2,'0'))];
const wins=['aero','enduro','brezza','volt','roccia','martello','turbovan','titan','hotflash','metrocab','interceptor','retrosprint'];
const thresholds=[{medals:9,car:'apex'},{medals:21,car:'tempesta'},{medals:30,car:'behemoth'}];
const fresh=()=>({version:VERSION,medals:{},finishes:0,podiums:0,wins:0,finalWon:false,lastEarned:[]});
function normalize(raw){const s=fresh();if(!raw||raw.version!==VERSION)return s;for(const k of ['finishes','podiums','wins'])s[k]=Number.isSafeInteger(raw[k])?Math.max(0,raw[k]):0;s.finalWon=raw.finalWon===true;for(let i=0;i<12;i++)for(const type of ['race','challenge','mastery']){const key=i+':'+type;if(raw.medals?.[key]===true)s.medals[key]=true;}return s;}
const medalCount=s=>Object.values(normalize(s).medals).filter(Boolean).length;
function earned(input){const s=normalize(input),m=medalCount(s);return [...wins.filter((car,i)=>s.medals[i+':race']),...thresholds.filter(t=>m>=t.medals).map(t=>t.car),...(s.finalWon?['neon']:[])];}
function quests(input){const s=normalize(input),m=medalCount(s),items=[];trackNames.forEach((name,i)=>{for(const [type,title] of [['race','Vinci la gara'],['challenge','Concludi sul podio senza respawn'],['mastery','Vinci senza respawn']])items.push({id:i+':'+type,title:name+' · '+title,desc:i<2?name+' disponibile':'Circuito non ancora implementato',target:1,progress:s.medals[i+':'+type]?1:0,car:type==='race'?wins[i]:null,available:i<2});});thresholds.forEach(t=>items.push({id:'threshold:'+t.medals,title:'Raggiungi '+t.medals+' medaglie',desc:'Soglia di progressione',target:t.medals,progress:Math.min(m,t.medals),car:t.car,available:true}));items.push({id:'final',title:'Vinci The Tiny Grand Prix',desc:'Finale della Carriera · richiede 30 medaglie',target:1,progress:s.finalWon?1:0,car:'neon',available:m>=30});return items;}
function applyResult(input,rec){const s=normalize(input);if(!rec||rec.mode!=='career'||rec.finished!==true||rec.laps<3||!Number.isInteger(rec.place)||!Number.isInteger(rec.racerCount)||rec.racerCount<2||rec.place<1||rec.place>rec.racerCount)return {state:s,newUnlocks:[],accepted:false};const before=new Set(earned(s));s.finishes++;if(rec.place<=3)s.podiums++;if(rec.place===1)s.wins++;const track=Number.isInteger(rec.trackIndex)?rec.trackIndex:0;if(track===0||track===1){if(rec.place===1)s.medals[track+':race']=true;if(rec.place<=3&&Number(rec.respawns)===0)s.medals[track+':challenge']=true;if(rec.place===1&&Number(rec.respawns)===0)s.medals[track+':mastery']=true;}s.lastEarned=earned(s).filter(id=>!before.has(id));return {state:s,newUnlocks:s.lastEarned,accepted:true};}
root.TTRCareerCore=Object.freeze({VERSION,STORAGE_KEY,trackNames,wins,thresholds,fresh,normalize,medalCount,earned,quests,applyResult});
})(globalThis);

