
/* Tiny Track Rivals v0.13.6.51 - Tuono V8 v11 + Lampo ZX v4.2; deferred asset loader. */
(function(root){'use strict';
const inlineAssets={'aero_turntable':'assets/images/aero_turntable.webp','aero_showroom':'assets/images/aero_showroom.png','aero':'assets/images/aero.png','aero_color3':'assets/images/aero_color3.png','aero_color2':'assets/images/aero_color2.png','aero_color1':'assets/images/aero_color1.png','toast':'assets/images/toast.png','tuono':'assets/images/tuono.png','scatto_showroom':'assets/images/scatto_showroom.png','scatto':'assets/images/scatto.png','polvere_showroom':'assets/images/polvere_showroom.png','tuono_showroom':'assets/images/tuono_showroom.png','scatto_turntable':'assets/images/scatto_turntable.webp','tuono_turntable':'assets/images/tuono_turntable.webp','cookie':'assets/images/cookie.png','knife':'assets/images/knife.png','polvere_turntable':'assets/images/polvere_turntable.webp','lampo_turntable':'assets/images/lampo_turntable.webp','lampo_showroom':'assets/images/lampo_showroom.png','plate_croissant':'assets/images/plate_croissant.png','pickup_sheet':'assets/images/pickup_sheet.png','polvere':'assets/images/polvere.png','cookie_alt':'assets/images/cookie_alt.png','jam_tipped':'assets/images/jam_tipped.png','jam':'assets/images/jam.png','mug':'assets/images/mug.png','cereal':'assets/images/cereal.png','orange':'assets/images/orange.png','glass':'assets/images/glass.png','lampo':'assets/images/lampo.png','ramp':'assets/images/ramp.png'};Object.assign(inlineAssets,{'scatto_color1':'assets/images/scatto_color1.png','scatto_color2':'assets/images/scatto_color2.png','scatto_color3':'assets/images/scatto_color3.png','tuono_color1':'assets/images/tuono_color1.png','tuono_color2':'assets/images/tuono_color2.png','tuono_color3':'assets/images/tuono_color3.png','polvere_color1':'assets/images/polvere_color1.png','polvere_color2':'assets/images/polvere_color2.png','polvere_color3':'assets/images/polvere_color3.png','lampo_color1':'assets/images/lampo_color1.png','lampo_color2':'assets/images/lampo_color2.png','lampo_color3':'assets/images/lampo_color3.png'}); const names=['scatto','tuono','polvere','lampo','scatto_color1','scatto_color2','scatto_color3','tuono_color1','tuono_color2','tuono_color3','polvere_color1','polvere_color2','polvere_color3','lampo_color1','lampo_color2','lampo_color3','scatto_showroom','scatto_turntable','tuono_showroom','tuono_turntable','polvere_showroom','polvere_turntable','lampo_showroom','lampo_turntable','aero','aero_color1','aero_color2','aero_color3','aero_showroom','aero_turntable','enduro','enduro_color1','enduro_color2','enduro_color3','enduro_showroom','enduro_turntable','mug','knife','jam_tipped','cookie','cookie_alt','toast','ramp','pickup_sheet','plate_croissant','cereal','orange','jam','glass'];
inlineAssets['enduro']='assets/images/enduro.png';
inlineAssets['enduro_color1']='assets/images/enduro_color1.png';
inlineAssets['enduro_color2']='assets/images/enduro_color2.png';
inlineAssets['enduro_color3']='assets/images/enduro_color3.png';
inlineAssets['enduro_showroom']='assets/images/enduro_showroom.png';
inlineAssets['enduro_turntable']='assets/images/enduro_turntable.webp';
for(const suffix of ['', '_color1','_color2','_color3','_showroom','_turntable']){for(const model of ['brezza','volt','neon','roccia','martello','turbovan','titan','hotflash','metrocab','interceptor','retrosprint','apex','tempesta','behemoth']){const key=model+suffix;names.push(key);inlineAssets[key]='assets/images/'+key+(suffix==='_turntable'?'.webp':'.png');}}
const images={}; const status={};
// One lossless atlas per model. Only transparent margins are removed.
const atlasLayouts=Object.freeze({"aero":[24,54,144,87,192,192],"apex":[34,73,188,124,256,256],"behemoth":[15,48,226,153,256,256],"brezza":[19,78,218,119,256,256],"enduro":[17,7,158,108,192,128],"hotflash":[52,88,152,99,256,256],"interceptor":[43,92,170,99,256,256],"lampo":[15,26,162,92,192,144],"martello":[16,60,224,142,256,256],"metrocab":[43,80,170,109,256,256],"neon":[6,27,244,179,256,256],"polvere":[20,27,152,98,192,144],"retrosprint":[46,95,164,92,256,256],"roccia":[21,55,214,145,256,256],"tempesta":[41,61,174,132,256,256],"titan":[48,60,160,128,256,256],"tuono":[23,45,210,103,256,192],"turbovan":[29,44,198,152,256,256],"volt":[4,35,248,172,256,256]});
const atlasNames=names.filter(name=>name.endsWith('_turntable'));
for(const id of Object.keys(atlasLayouts))inlineAssets[id+'_turntable']='assets/images/'+id+'_turntable_compact.webp';
// .153: bounded loading, retryable failures, and explicit readiness by asset group.
const pending=new Map(),queue=[];let active=0;
const MAX_PARALLEL=4, TIMEOUT=15000;
const assetUrl=name=>(inlineAssets[name]||'assets/'+name+((name.includes('_concept_')||name.includes('_menu_clean'))?'.jpg':'.png'))+'?v=0.13.6.120';
function pump(){while(active<MAX_PARALLEL&&queue.length){const job=queue.shift();active++;run(job).finally(()=>{active--;pending.delete(job.name);job.resolve(status[job.name]==='ready');pump();});}}
async function run(job){const {name}=job;for(let attempt=0;attempt<2;attempt++){
 status[name]='loading';const ok=await new Promise(resolve=>{const img=new Image();let settled=false;const finish=ok=>{if(settled)return;settled=true;clearTimeout(timer);img.onload=img.onerror=null;if(ok&&img.naturalWidth>0&&img.naturalHeight>0){images[name]=img;resolve(true);}else resolve(false);};
 const timer=setTimeout(()=>{finish(false);try{img.src='';}catch(_){}},TIMEOUT);
 img.onload=()=>{if(!name.endsWith('_turntable')||typeof img.decode!=='function'){finish(true);return;}Promise.resolve().then(()=>img.decode()).then(()=>finish(true),()=>finish(false));};img.onerror=()=>finish(false);img.src=assetUrl(name);});
 if(ok){status[name]='ready';return;}if(attempt===0)await new Promise(r=>setTimeout(r,300));
 }status[name]='failed';}
function loadAsset(name,priority=false){if(status[name]==='ready')return Promise.resolve(true);const existing=pending.get(name);if(existing){if(priority){const i=queue.indexOf(existing);if(i>=0){queue.splice(i,1);queue.unshift(existing);}}return existing.promise;}
 let resolve;const promise=new Promise(r=>resolve=r),job={name,promise,resolve};pending.set(name,job);status[name]='queued';if(priority)queue.unshift(job);else queue.push(job);pump();return promise;}
const modelNames=atlasNames.map(n=>n.replace(/_turntable$/,''));
const raceNames=modelNames.flatMap(id=>[id,id+'_color1',id+'_color2',id+'_color3']);
function groupReady(keys){return keys.every(k=>status[k]==='ready');}
async function ensureGroup(keys,limit=45000){let timer;try{return await Promise.race([Promise.all([...keys].reverse().map(k=>loadAsset(k,true))).then(v=>v.every(Boolean)),new Promise(r=>{timer=setTimeout(()=>r(false),limit);})]);}finally{clearTimeout(timer);}}
const ready=Promise.all([...modelNames,...raceNames.filter(n=>!modelNames.includes(n)),...names.filter(n=>!atlasNames.includes(n)&&!raceNames.includes(n))].map(n=>loadAsset(n)));
// Full atlas prefetch is opt-in; only the selected model is prioritized by the showroom.
const garageReady=()=>ensureGroup(atlasNames);
function ensureTurntable(id){const key=id+'_turntable';return status[key]==='ready'?images[key]:null;}
function isGarageReady(){return groupReady(atlasNames);}
const retryAt=new Map();
function requestTurntable(id){const key=id+'_turntable';if(!atlasNames.includes(key)||status[key]==='ready'||pending.has(key))return;if(Date.now()<(retryAt.get(key)||0))return;retryAt.set(key,Date.now()+5000);loadAsset(key,true).then(ok=>{if(!ok)retryAt.set(key,Date.now()+5000);});}
function ensureRaceReady(){return ensureGroup(raceNames);}
function ensureGarageReady(id){return ensureGaragePack([id]);}
// Only the requested set is mandatory; neighbouring sets are warmed one atlas at a time.
function ensureGaragePack(ids){const valid=[...new Set(ids)].filter(id=>modelNames.includes(id));return valid.length===ids.length&&valid.length>0?ensureGroup(valid.flatMap(id=>[id+'_turntable',id,id+'_showroom'])):Promise.resolve(false);}
function trimGarageAtlases(keep){const allowed=new Set(keep.map(id=>id+'_turntable'));for(const key of atlasNames){if(!allowed.has(key)&&status[key]==='ready'&&!pending.has(key)){delete images[key];delete status[key];retryAt.delete(key);}}}
function ensureShowroom(id){const key=id+'_turntable';return atlasNames.includes(key)?ensureGroup([key]):Promise.resolve(false);}
function missingRace(){return raceNames.filter(k=>status[k]!=='ready');}
// v0.13.6.34: visual-only race scale, measured from the opaque footprint of each top-down sprite.
// No modifications to physics widths/lengths, track, or GLB meshes.
window.TTRArtRevision='TTRToyScaleV1-Scatto92-Tuono125-Brezza93-Volt-Neon-v100';
const spriteVisualScale=Object.freeze({"scatto":0.6443128,"polvere":0.85129411,"enduro":0.86291893,"brezza":0.80727716,"lampo":0.83974417,"aero":0.79993688,"tuono":0.90990739,"volt":0.7892473051224944,"neon":0.7874934222222222,"roccia":0.8884409112709831,"martello":0.9270687769784174,"turbovan":0.89057659,"titan":0.78215857,"hotflash":0.71246127,"metrocab":0.84411172,"interceptor":0.85185587,"retrosprint":0.82862343,"apex":0.88283244,"tempesta":0.85185587,"behemoth":1.00673875});
const raceAspect=Object.freeze({"tuono":[1.0518499073663916,1],"titan":[1.1310891050175118,0.9564356402721607]});
const vehicleLengthRatios=Object.freeze({"scatto":0.92,"polvere":1.02,"enduro":1.05,"brezza":1.07,"lampo":1.1,"aero":1.1,"tuono":1.11,"volt":1.1,"neon":1.1,"roccia":1.15,"martello":1.2,"turbovan":1.15,"titan":1.01,"hotflash":0.92,"metrocab":1.09,"interceptor":1.1,"retrosprint":1.07,"apex":1.14,"tempesta":1.1,"behemoth":1.3});
const has=name=>status[name]==='ready';
const draw=(ctx,name,x,y,w,h)=>{if(!has(name))return false;ctx.drawImage(images[name],x,y,w,h);return true;};
function drawVehicle(ctx,car,clock){
  if(!car||!car.profile||!has(car.profile.id))return false;
  const art=has(car.variantSprite)?images[car.variantSprite]:images[car.profile.id];
  ctx.save();ctx.translate(car.x,car.y);
  const mini=car.mini;
  const size=(mini?77:70)*(spriteVisualScale[car.profile.id]??1);
  const [aspectW,aspectL]=raceAspect[car.profile.id]??[1,1];
  const total=car.jumpTotal||.72;
  const t=car.jump>0?Math.max(0,Math.min(1,1-car.jump/total)):0;
  const lift=car.jump>0?Math.sin(Math.PI*t):0;
  const flip=car.elimCelebration>0&&!mini?Math.max(0,Math.min(1,1-car.elimCelebration/1.56)):0;
  const jump=lift*44+(car.elimCelebration>0?Math.sin(Math.PI*flip)*46:0);
  const slipAmt=Math.max(0,Math.min(1,(car.slip||0)/1.9));
  const wobble=slipAmt>0&&!mini?Math.sin(clock*26+car.id*1.7)*0.17*slipAmt:0;
  const rolling=!mini&&!(car.tableFalling>0)&&car.jump<=0;
  const rollSpeed=Math.min(1,Math.abs(car.speed||0)/190);
  const wheelPhase=car.wheelPhase||0;
  ctx.save();ctx.rotate(car.a+Math.PI/2);ctx.scale(aspectW,aspectL);
  // Two faint, moving tyre traces stay below the body; no fake circle under the car.
  if(rolling&&rollSpeed>.18){
    const trail=9+16*rollSpeed;
    ctx.lineWidth=1.4;ctx.strokeStyle='rgba(41,36,33,'+(0.08+rollSpeed*.13)+')';
    for(const side of [-1,1]){
      const x=side*size*.29;
      ctx.beginPath();ctx.moveTo(x,size*.28);ctx.lineTo(x+Math.sin(wheelPhase*.38+side)*.4,size*.29+trail);ctx.stroke();
    }
  }
  ctx.fillStyle='rgba(23,16,15,.28)';ctx.beginPath();ctx.ellipse(4,9,20*(1-lift*.30),32*(1-lift*.30),0,0,Math.PI*2);ctx.fill();
  if(slipAmt>.12&&!mini){
    ctx.globalAlpha=.55*slipAmt;
    ctx.strokeStyle='rgba(245,245,245,.88)';ctx.lineWidth=5;
    for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(side*11,22);ctx.quadraticCurveTo(side*18,28+Math.sin(clock*18+side)*4,side*22,37);ctx.stroke();}
    ctx.globalAlpha=1;
  }
  ctx.restore();
  ctx.translate(0,-jump);ctx.rotate(car.a+Math.PI/2+wobble);
  if(car.elimCelebration>0&&!mini)ctx.rotate(flip*2*Math.PI);if(car.tableFalling>0){ctx.scale(car.tableFallImpact?.89:1,car.tableFallImpact?.89:1);}
  ctx.scale(aspectW,aspectL);
  if(lift>0.1)ctx.scale(1+lift*.13,1+lift*.13);
  if(rolling&&rollSpeed>.3){
    const bob=Math.sin(wheelPhase*2)*.32*rollSpeed;
    ctx.translate(0,bob);
  }
  ctx.drawImage(art,-size/2,-size/2,size,size);
  // The separate tyres in a 2D sprite cannot rotate in 3D. Short glints run along
  // their visible outside edges, synchronised with speed, so stationary cars remain still.
  if(rolling&&rollSpeed>.07){
    ctx.fillStyle='rgba(171,209,216,'+(.13+.47*rollSpeed)+')';
    for(const side of [-1,1])for(const axle of [-1,1]){
      const x=side*size*.34,y=axle*size*.28;
      const phase=wheelPhase+(axle>0?1.3:0)+side*.45;
      ctx.save();ctx.translate(x,y);
      if(axle<0)ctx.rotate((car.steer||0)*.19);
      const tick=Math.max(1.0,size*.028),slide=Math.sin(phase)*Math.max(.8,size*.04);
      ctx.fillRect(-tick/2,slide-1.0,tick,2.1);
      ctx.restore();
    }
  }
  if(car.boost>0&&!mini){ctx.fillStyle='#72e7ffce';for(const k of [-8,8]){ctx.beginPath();ctx.moveTo(k,28);ctx.lineTo(k-4,39+Math.sin(clock*27)*4);ctx.lineTo(k+4,38);ctx.fill();}}
  ctx.restore();return true;
}
root.TTRAssets={images,status,ready,get garageReady(){return garageReady();},isGarageReady,atlasLayouts,ensureTurntable,requestTurntable,ensureRaceReady,ensureGarageReady,ensureGaragePack,trimGarageAtlases,ensureShowroom,missingRace,has,draw,drawVehicle,raceVisualScale:spriteVisualScale,raceAspect,vehicleLengthRatios};
})(typeof window==='undefined'?globalThis:window);

