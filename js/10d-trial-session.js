/* Tiny Track Rivals — 14.4A: pure Time Trial session and visual-only ghost.
 * Integration pending: load before legacy, create per trial, call at accepted lap
 * crossings, sample after simulation, render ghost separately from race.cars.
 * All times are simulation seconds. No DOM, physics, audio or storage side effects.
 */
(()=>{'use strict';
 const INTERVAL=0.05, MAX_FRAMES=12000, TAU=Math.PI*2;
 const finite=Number.isFinite;
 const validTime=n=>finite(n)&&n>0;
 function pose(t,car){
  if(!car||![t,car.x,car.y,car.a].every(finite)||t<0)return null;
  return {t,x:car.x,y:car.y,a:car.a,jump:finite(car.jump)?Math.max(0,car.jump):0};
 }
 function formatTime(seconds){
  if(!finite(seconds)||seconds<0)return '—';
  const ms=Math.round(seconds*1000);
  return `${String(Math.floor(ms/60000)).padStart(2,'0')}:${String(Math.floor(ms/1000)%60).padStart(2,'0')}.${String(ms%1000).padStart(3,'0')}`;
 }
 function formatGap(delta){
  if(!finite(delta))return '—';
  const ms=Math.round(Math.abs(delta)*1000);
  return `${ms===0?'':delta<0?'−':'+'}${(ms/1000).toFixed(3)} s`;
 }
 function create({trackId,carId,carName,lapCount=3}={}){
  if(!trackId||!carId||!Number.isInteger(lapCount)||lapCount<1)throw new TypeError('Invalid trial configuration');
  const laps=[],frames=[],lapGhosts=[];let lapStart=0,best=null,notice=null,finished=false,overflow=false,lapFrameStart=0;
  function sample(t,car,{discontinuity=false,force=false}={}){
   if(overflow||finished)return false;
   const p=pose(t,car);if(!p)return false;
   const prev=frames.at(-1);
   if(prev&&t<prev.t)return false;
   if(prev&&t===prev.t){p.cut=prev.cut||discontinuity||Math.hypot(p.x-prev.x,p.y-prev.y)>120;frames[frames.length-1]=p;return true;}
   if(prev&&!force&&!discontinuity&&t-prev.t<INTERVAL-1e-7)return false;
   if(frames.length>=MAX_FRAMES){overflow=true;frames.length=0;return false;}
   p.cut=!!(prev&&(discontinuity||Math.hypot(p.x-prev.x,p.y-prev.y)>120));
   frames.push(p);return true;
  }
  function completeLap(t,car){
   if(finished||!validTime(t)||t<=lapStart)return null;
   const duration=t-lapStart,previous=laps.at(-1),newBest=best===null||duration<best;
   const lap={number:laps.length+1,time:duration,gap:previous?duration-previous.time:null,newBest};
   sample(t,car,{force:true});
   const slice=frames.slice(lapFrameStart);
   const recording=!overflow&&slice.length>1&&Math.abs(slice[0].t-lapStart)<1e-6?{version:1,trackId,carId,total:duration,frames:slice.map((f,i)=>({...f,t:i===0?0:i===slice.length-1?duration:f.t-lapStart,cut:i===0?false:f.cut}))}:null;
   lapGhosts.push(recording);lapFrameStart=Math.max(0,frames.length-1);
   laps.push(lap);lapStart=t;if(newBest)best=duration;
   // First lap establishes a reference, not a personal-improvement alert.
   notice={gap:lap.gap,newBest:lap.number>1&&newBest,until:t+3};
   if(laps.length===lapCount)finished=true;
   return {...lap};
  }
  function hud(t){
   const lastNotice=notice&&finite(t)&&t<notice.until&&t>=notice.until-3?{...notice}:null;
   return {lap:Math.min(lapCount,laps.length+1),lapCount,current:finished?laps.at(-1).time:Math.max(0,t-lapStart),total:finished?lapStart:t,best,notice:lastNotice};
  }
  function result(){
   if(!finished)return null;
   return {trackId,carId,carName:carName||carId,total:lapStart,bestLap:best,bestLapGhost:bestLapRecording(),laps:laps.map(l=>({...l})),ghost:!overflow&&frames.length>1&&frames[0].t===0&&frames.at(-1).t===lapStart?{version:1,trackId,carId,total:lapStart,frames:frames.map(f=>({...f}))}:null};
  }
  function bestLapRecording(){return lapGhosts.filter(Boolean).reduce((a,b)=>!a||b.total<a.total?b:a,null);}
  function reference(mode,historical,full){
   const historicalPlay=playback(historical,trackId,carId),fullPlay=playback(full,trackId,carId);let active=null,localPlay=null;
   return t=>{if(mode==='off')return null;if(mode==='race')return fullPlay(t);if(mode==='lap'||!laps.length)return historicalPlay(t-lapStart);
    const choice=bestLapRecording();if(choice!==active){active=choice;localPlay=playback(choice,trackId,carId);}
    return localPlay?localPlay(t-lapStart):null;};
  }
  return Object.freeze({sample,completeLap,hud,result,reference,bestLapRecording});
 }
 function validateGhost(g,trackId,carId){
  if(!g||g.version!==1||g.trackId!==trackId||g.carId!==carId||!validTime(g.total)||!Array.isArray(g.frames)||g.frames.length<2||g.frames.length>MAX_FRAMES)return false;
  return g.frames.every((f,i)=>f&&[f.t,f.x,f.y,f.a,f.jump].every(finite)&&f.jump>=0&&f.t>=0&&(i===0||f.t>g.frames[i-1].t))&&g.frames[0].t===0&&Math.abs(g.frames.at(-1).t-g.total)<1e-6;
 }
 function playback(g,trackId,carId){
  if(!validateGhost(g,trackId,carId))return ()=>null;
  const fs=g.frames.map(f=>({...f})),total=g.total;
  return t=>{
   if(!finite(t)||t<0||t>total)return null;
   let lo=0,hi=fs.length-1;
   while(hi-lo>1){const mid=(lo+hi)>>1;if(fs[mid].t<=t)lo=mid;else hi=mid;}
   const a=fs[lo],b=fs[hi];
   if(t===b.t)return {...b};if(t===a.t)return {...a};
   // Never interpolate across a teleport/recovery or a missing sampling span.
   if(b.cut||b.t-a.t>0.25)return null;
   const u=(t-a.t)/(b.t-a.t),da=((b.a-a.a+Math.PI)%TAU+TAU)%TAU-Math.PI;
   return {t,x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u,a:a.a+da*u,jump:a.jump+(b.jump-a.jump)*u};
  };
 }
 window.TTRTrialSession=Object.freeze({create,playback,validateGhost,formatTime,formatGap});
})();
